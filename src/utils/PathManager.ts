import { join } from 'path'
import { FILE_CONSTANTS, S3_CONSTANTS } from './constants'
import { ReleaseManager } from './ReleaseManager'
import os from 'node:os'
import { Logger } from './LoggerWrapper'
import { ArgsHelper } from './ArgsHelper'

export class PathManager {
    static shared = new PathManager()

    private constructor() {}

    static get deltaBuildDirectory(): string {
        return PathManager.joinPath(process.cwd(), FILE_CONSTANTS.BUILD_DIRECTORY)
    }

    static get currentBundleVersionBuildDir(): string {
        return PathManager.joinPath(
            process.cwd(),
            FILE_CONSTANTS.BUILD_DIRECTORY,
            this.jsVersionPath,
            ReleaseManager.current.version,
        )
    }

    static get jsVersionPath(): string {
        return String(ReleaseManager.current.jsVersion)
    }

    static get currentJsVersionDirectory(): string {
        return PathManager.joinPath(process.cwd(), FILE_CONSTANTS.BUILD_DIRECTORY, this.jsVersionPath)
    }

    static get mainBundleDir(): string {
        return PathManager.joinPath(this.currentBundleVersionBuildDir, FILE_CONSTANTS.MAIN_BUNDLE_DIRECTORY)
    }

    static get mainBundleZipPath(): string {
        return PathManager.joinPath(this.currentBundleVersionBuildDir, FILE_CONSTANTS.MAIN_BUNDLE_ZIP)
    }

    static get mainBundlePath(): string {
        return PathManager.joinPath(this.mainBundleDir, FILE_CONSTANTS.BUNDLE())
    }

    static get tempHermesBundlePath(): string {
        return PathManager.joinPath(this.mainBundleDir, FILE_CONSTANTS.TEMP_HERMES_BUNDLE())
    }

    static get hermesCommandPath(): string {
        return PathManager.joinPath(process.cwd(), FILE_CONSTANTS.HERMES_COMMAND_PATH(this.getHermesOSBin()))
    }

    private static getHermesOSBin(): string {
        const osType = os.type().toLowerCase()
        Logger.info('Detected OS path', osType)
        switch (osType) {
            case 'darwin':
                return 'osx-bin'
            case 'linux':
                return 'linux64-bin'
            default:
                return 'osx-bin'
        }
    }

    static get s3BasePath(): string {
        return PathManager.joinPath(
            S3_CONSTANTS.ROOT_PATH,
            ReleaseManager.current.appId,
            this.jsVersionPath,
            ReleaseManager.current.version,
        )
    }

    //SourceMap paths

    static get bundleSourceMapPath(): string {
        return PathManager.joinPath(this.mainBundleDir, FILE_CONSTANTS.BUNDLE_SOURCEMAPS())
    }

    static get packagerBundleSourceMaps(): string {
        return PathManager.joinPath(this.mainBundleDir, FILE_CONSTANTS.PACKAGER_BUNDLE_SOURCEMAPS())
    }

    static get hermesSourceMaps(): string {
        return PathManager.joinPath(this.mainBundleDir, FILE_CONSTANTS.HERMES_BUNDLE_SOURCEMAPS())
    }

    static get sourceMapDir(): string {
        return PathManager.joinPath(this.currentBundleVersionBuildDir, FILE_CONSTANTS.SOURCE_MAP_DIR)
    }

    static get sourceMapFinalFile(): string {
        return PathManager.joinPath(this.sourceMapDir, FILE_CONSTANTS.BUNDLE_SOURCEMAPS())
    }

    //Patch util path
    static patchZipFileName(oldBundleVersion: number): string {
        return `${this.patchDirName(oldBundleVersion)}.zip`
    }

    static patchZipFilePath(oldBundleVersion: number): string {
        return PathManager.joinPath(this.currentBundleVersionBuildDir, this.patchZipFileName(oldBundleVersion))
    }

    static patchDirName(oldBundleVersion: number): string {
        return FILE_CONSTANTS.PATCH_DIRECTORY_PREFIX(
            `${this.numberWithStartPadding(ReleaseManager.current.bundleVersion, 2)}-${this.numberWithStartPadding(oldBundleVersion, 2)}`,
        )
    }

    static patchDir(oldBundleVersion: number): string {
        return PathManager.joinPath(this.currentBundleVersionBuildDir, this.patchDirName(oldBundleVersion))
    }

    static patchFilePath(oldBundleVersion: number): string {
        return PathManager.joinPath(this.patchDir(oldBundleVersion), FILE_CONSTANTS.PATCH_BUNDLE)
    }

    static joinPath(...paths: string[]): string {
        return join(...paths)
    }

    static numberWithStartPadding(number: number, startPadding: number): string {
        return String(number).padStart(startPadding, '0')
    }

    //Native release
    static get generatedAndroidBundleFileDir(): string {
        return PathManager.joinPath(
            process.cwd(),
            FILE_CONSTANTS.ANDROID_BUNDLE_DIR,
            `createBundle${ReleaseManager.current.appTargetAndroid}JsAndAssets`,
        )
    }

    // Native release ios
    static get generatedIosBundleDir(): string {
        const { projectName, targetName } = ArgsHelper.getCliArgs()

        if (!!targetName) {
            return PathManager.joinPath(
                process.cwd(),
                FILE_CONSTANTS.IOS_BUNDLE_DIRECTORY,
                `/${projectName}.xcarchive/Products/Applications/${targetName}.app`,
            )
        }

        return PathManager.joinPath(
            process.cwd(),
            FILE_CONSTANTS.IOS_BUNDLE_DIRECTORY,
            `/${projectName}.xcarchive/Products/Applications/${projectName}.app`,
        )
    }

    static get generatedAndroidImageAssetsDir(): string {
        let appTargetCamelCase = ReleaseManager.current.appTargetAndroid
        appTargetCamelCase = appTargetCamelCase!.substring(0, 1).toLowerCase() + appTargetCamelCase!.substring(1)

        return PathManager.joinPath(
            process.cwd(),
            FILE_CONSTANTS.ANDROID_IMG_ASSETS_DIR,
            `createBundle${ReleaseManager.current.appTargetAndroid}JsAndAssets`,
        )
    }
}
