import { execFileSync } from 'node:child_process'
import { Logger } from './LoggerWrapper'
import { FileUtils } from './FileUtils'
import { FILE_CONSTANTS } from './constants'
import { Profiler } from './Profiler'
//@ts-ignore As types for this package is not available
import bsdiff from 'bsdiff-node'
import { S3FileType, S3Manager } from './S3Manager'
import { PathManager } from './PathManager'
import { Bundle } from '../models/Bundle'
import { ReleaseManager, SupportedPlatformKeys } from './ReleaseManager'
import { ArgsHelper } from './ArgsHelper'
import { existsSync } from 'node:fs'
import { mergeEnvKeysIntoFile } from './envMerge'

export enum OutputFileType {
    HERMES_BUNDLE = 'HERMES_BUNDLE',
    CREATE_ANDROID_NATIVE_BUNDLE = 'CREATE_ANDROID_NATIVE_BUNDLE',
    IOS_NATIVE_BUNDLE = 'IOS_NATIVE_BUNDLE',
}

export class BundleManager {
    static shared = new BundleManager()

    private _bundleHash: string = ''

    private constructor() {}

    setBundleHash(hash: string) {
        this._bundleHash = hash
        Logger.info('Bundle Hash:', hash)
    }

    get bundleHash(): string {
        return this._bundleHash
    }

    getReactBundleArgs(
        jsPath: string,
        assetsDir: string,
        sourceMapPath: string,
        entryFile: string,
        platform: SupportedPlatformKeys,
        configPath?: string,
    ): { cmd: string; args: string[] } {
        const args = [
            'react-native',
            'bundle',
            '--platform',
            platform,
            '--dev',
            'false',
            '--entry-file',
            entryFile,
            '--bundle-output',
            jsPath,
            '--assets-dest',
            assetsDir,
            '--minify',
            'false',
            '--sourcemap-output',
            sourceMapPath,
        ]
        if (configPath) {
            args.push(`--config=${configPath}`)
        }
        return { cmd: 'npx', args }
    }

    getHermesBundleArgs(
        hermesCommand: string,
        outputBinaryFile: string,
        inputBinaryFile: string,
        baseByteCodeFile?: string,
    ): { cmd: string; args: string[] } {
        const args = ['-emit-binary', '-max-diagnostic-width=80', '-out', outputBinaryFile, inputBinaryFile, '-O', '-output-source-map']
        if (baseByteCodeFile) {
            args.push('-base-bytecode', baseByteCodeFile)
        }
        return { cmd: hermesCommand, args }
    }

    getComposeSourceMapsArgs(
        packagerSourceMaps: string,
        hermesSourceMaps: string,
        outputSourceMaps: string,
    ): { cmd: string; args: string[] } {
        return {
            cmd: 'node',
            args: ['node_modules/react-native/scripts/compose-source-maps.js', packagerSourceMaps, hermesSourceMaps, '-o', outputSourceMaps],
        }
    }

    createStandaloneBundle(baseByteCodeFile?: string) {
        Logger.info('Creating bundle')

        Profiler.shared.getProfile('makeBundle').start()

        const { platform, entryFile, configPath } = ArgsHelper.getCliArgs()

        if (!platform) {
            Logger.error('Platform not specified')
            process.exit(1)
        }

        if (!entryFile) {
            Logger.error('Entry File not specified')
            process.exit(1)
        }

        //Create temp js Bundle binary as input to hermes command
        const reactBundle = this.getReactBundleArgs(
            PathManager.mainBundlePath,
            PathManager.mainBundleDir,
            PathManager.packagerBundleSourceMaps,
            entryFile,
            platform,
            configPath,
        )
        Logger.log('reactBundle command:', reactBundle.cmd, reactBundle.args.join(' '))
        execFileSync(reactBundle.cmd, reactBundle.args, { stdio: 'inherit' })

        //Create hermes binary using past binary bytecode
        const hermesBundle = this.getHermesBundleArgs(
            PathManager.hermesCommandPath,
            PathManager.tempHermesBundlePath,
            PathManager.mainBundlePath,
            baseByteCodeFile,
        )
        Logger.log('hermesBundleCommand command:', hermesBundle.cmd, hermesBundle.args.join(' '))
        execFileSync(hermesBundle.cmd, hermesBundle.args, { stdio: 'inherit' })

        //Delete temp js bundle binary
        FileUtils.deleteFileIfExists(PathManager.mainBundlePath)
        FileUtils.moveFile(PathManager.tempHermesBundlePath, PathManager.mainBundlePath)

        //Compose sourcemaps
        const composeMaps = this.getComposeSourceMapsArgs(
            PathManager.packagerBundleSourceMaps,
            PathManager.hermesSourceMaps,
            PathManager.bundleSourceMapPath,
        )
        execFileSync(composeMaps.cmd, composeMaps.args, { stdio: 'inherit' })
        FileUtils.deleteFileIfExists(PathManager.packagerBundleSourceMaps)
        FileUtils.deleteFileIfExists(PathManager.hermesSourceMaps)

        //Cleanup build
        //Move source map from 2-03/build/index.android.bundle.map to 2-03/source-map/index.android.bundle.map
        FileUtils.createDirectoryIfNotExists(PathManager.sourceMapDir)
        FileUtils.moveFile(PathManager.bundleSourceMapPath, PathManager.sourceMapFinalFile)

        Logger.info(`Bundle created successfully. Took: ${Profiler.shared.getProfile('makeBundle').end()}ms`)
    }

    createAndroidNativeBundle(baseByteCodeFile?: string) {
        Logger.info('Creating android native release', baseByteCodeFile ? baseByteCodeFile : 'No base bytecode file provided')

        Profiler.shared.getProfile('createAndroidNativeBundle').start()

        const bundleFileDir = PathManager.generatedAndroidBundleFileDir
        const assetsDir = PathManager.generatedAndroidImageAssetsDir

        //Copy bundle and assets from android folder to current build folder
        FileUtils.copyContentsToFolder(bundleFileDir, PathManager.mainBundleDir, (src, _) => {
            //Copy only main bundle
            return src.includes(FILE_CONSTANTS.BUNDLE()) || src === bundleFileDir
        })

        FileUtils.copyContentsToFolder(assetsDir, PathManager.mainBundleDir)


        Logger.info(`Android native release created successfully. Took: ${Profiler.shared.getProfile('createAndroidNativeBundle').end()}ms`)
    }

    async makeBundle(outputFileType: OutputFileType, baseByteCodeFile?: string) {
        //Create Build Directory
        FileUtils.createDirectoryIfNotExists(PathManager.mainBundleDir)

        //Create main output file
        switch (outputFileType) {
            case OutputFileType.HERMES_BUNDLE:
                this.createStandaloneBundle(baseByteCodeFile)
                break
            case OutputFileType.CREATE_ANDROID_NATIVE_BUNDLE:
                ReleaseManager.current.setNativeRelease(true)
                this.createAndroidNativeBundle(baseByteCodeFile)
                break
            case OutputFileType.IOS_NATIVE_BUNDLE:
                ReleaseManager.current.setNativeRelease(true)
                this.createIosNativeBundle(baseByteCodeFile)
                break
        }

        //Create zip of the bundle
        FileUtils.createZipFile(PathManager.currentBundleVersionBuildDir, PathManager.mainBundleDir, (fileName) => {
            //Zip all files except source map
            return !fileName.endsWith('.map')
        })
        const size = FileUtils.getFileSize(PathManager.mainBundleZipPath)

        //Create md5 hash of the bundle
        const hash = await FileUtils.createMd5Hash(PathManager.mainBundlePath)
        this.setBundleHash(hash)

        S3Manager.shared.queueFileToUpload({
            s3FileName: FILE_CONSTANTS.MAIN_BUNDLE_ZIP,
            localPath: PathManager.mainBundleZipPath,
            size,
            type: S3FileType.BUNDLE,
            hash: hash,
        })
    }

    private async createPatch(bundle: Bundle) {
        Profiler.shared.getProfile(`createPatch${bundle.bundleVersion}`).start()
        FileUtils.createDirectoryIfNotExists(PathManager.patchDir(bundle.bundleVersion))

        const patchFilePath = PathManager.patchFilePath(bundle.bundleVersion)
        const patchDir = PathManager.patchDir(bundle.bundleVersion)

        bsdiff.diffSync(bundle.localPath, PathManager.mainBundlePath, patchFilePath)

        const hash = await FileUtils.createMd5Hash(patchFilePath)

        Logger.info('Patch created hash:', hash)

        //Move assets to patch folder from main build folder except for main bundle file

        FileUtils.copyContentsToFolder(PathManager.mainBundleDir, patchDir, (src, _) => {
            //Copy all files except main bundle
            return !src.endsWith(FILE_CONSTANTS.BUNDLE())
        })
        Logger.info('Assets moved to patch folder')

        FileUtils.createZipFile(PathManager.currentBundleVersionBuildDir, PathManager.patchDir(bundle.bundleVersion))
        const size = FileUtils.getFileSize(PathManager.patchZipFilePath(bundle.bundleVersion))

        S3Manager.shared.queueFileToUpload({
            s3FileName: PathManager.patchZipFileName(bundle.bundleVersion),
            localPath: PathManager.patchZipFilePath(bundle.bundleVersion),
            size: size,
            type: S3FileType.PATCH,
            bundleVersion: bundle.bundleVersion,
        })

        Logger.info(
            `Patch created successfully. Took: ${Profiler.shared.getProfile(`createPatch${bundle.bundleVersion}`).end()}ms`,
        )
    }

    async createPatches(bundles: Bundle[]) {
        for (const bundle of bundles) {
            await this.createPatch(bundle)
        }
    }

    createIosNativeBundle(baseByteCodeFile?: string) {
        Logger.info('Creating ios native bundle')

        if (baseByteCodeFile) {
            mergeEnvKeysIntoFile('.env', { HERMES_CLI_ARGS: `-base-bytecode ${baseByteCodeFile}` })
        }
        Profiler.shared.getProfile('iosNativeBundle').start()

        const bundleFileDir = PathManager.generatedIosBundleDir
        Logger.log('bundleFileDir', bundleFileDir)

        // Copy bundle and assets from ios folder to current build folder
        if (existsSync(bundleFileDir)) {
            FileUtils.copyContentsToFolder(bundleFileDir, PathManager.mainBundleDir, (src, _) => {
                Logger.log('the source is', src)

                //Copy only main bundle
                return (
                    src.includes(FILE_CONSTANTS.ASSETS) ||
                    src.includes(FILE_CONSTANTS.BUNDLE()) ||
                    src === bundleFileDir
                )
            })
        } else {
            Logger.log('Bundle file directory not found', bundleFileDir)
        }

        Logger.info(`Successfully copied ios contents for native bundle. Took: ${Profiler.shared.getProfile('iosNativeBundle').end()}ms`)
    }
}
