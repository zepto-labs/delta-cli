import { Logger } from '../utils/LoggerWrapper'
import { ReleaseManager, SUPPORTED_PLATFORMS } from '../utils/ReleaseManager'
import { BundleManager, OutputFileType } from '../utils/BundleManager'
import { Bundle, BundleDownloadStates } from '../models/Bundle'
import { ApiManager } from '../api/ApiManager'
import { BundleReleaseState } from '../api/models'
import { S3Manager } from '../utils/S3Manager'
import { FileUtils } from '../utils/FileUtils'
import { getAppDetailsFromEnv, isNull } from '../utils/helper'
import { PathManager } from '../utils/PathManager'
import { ArgsHelper } from '../utils/ArgsHelper'
import { mergeEnvKeysIntoFile } from '../utils/envMerge'

async function checkAndSetReleaseVersion() {
    const { platform, entryFile, envFileName = '.env' } = ArgsHelper.getCliArgs()

    if (!platform) {
        Logger.error('Platform not given as input')
        process.exit(1)
    }

    if (platform && !Object.values(SUPPORTED_PLATFORMS).includes(platform)) {
        Logger.error('Platform not supported')
        process.exit(1)
    }

    const { appVersion, jsVersion, appId } = getAppDetailsFromEnv(platform)

    if (!entryFile) {
        Logger.error('Entry File not specified')
        process.exit(1)
    }

    if (!appVersion) {
        Logger.error('App version not specified')
        process.exit(1)
    }

    if (!jsVersion) {
        Logger.error('JS version not specified')
        process.exit(1)
    }

    if (!appId) {
        Logger.error('App Id not specified')
        process.exit(1)
    }

    //Fetch latest patch version from api
    const latestBundleVersion = await ApiManager.shared.fetchLatestPatchVersion(appId, jsVersion)
    if (latestBundleVersion == null || latestBundleVersion == undefined) {
        Logger.error('Fetching latest patch version failed')
        process.exit(1)
    }

    const currentBundleVersion = latestBundleVersion + 1

    const bundleVersionValue = String(currentBundleVersion).padStart(2, '0')
    mergeEnvKeysIntoFile(envFileName, { BUNDLE_VERSION: bundleVersionValue })

    ReleaseManager.current.setReleaseVersion(appVersion, jsVersion, currentBundleVersion, appId)

    Logger.info('Release versions', ReleaseManager.current.toString())
}

async function getPastReleaseBundles(): Promise<Bundle[]> {
    const pastBundleList = await ApiManager.shared.fetchReleaseList(
        ReleaseManager.current.appId,
        ReleaseManager.current.jsVersion,
    )

    if (!pastBundleList) {
        Logger.error('Fetching past releases failed')
        process.exit(1)
    }

    const releaseList = pastBundleList.filter((pastBundle) => {
        return pastBundle.releaseState == BundleReleaseState.LIVE || pastBundle.nativeRelease
    })

    Logger.log('Release list', releaseList)

    return releaseList.map((bundle) => {
        return {
            url: bundle.bundle.url,
            bundleVersion: bundle.bundleVersion,
            releaseVersion: bundle.releaseVersion,
            jsVersion: bundle.jsVersion,
        }
    })
}

export async function setNativeBundleVersion() {
    await checkAndSetReleaseVersion()
    Logger.success('New Bundle Set Successfully')
}


export async function createRelease(outputFileType: OutputFileType, appTarget: string = '') {
    //Delete build directory if exists
    FileUtils.deleteDirectoryIfExists(PathManager.deltaBuildDirectory)

    //Gets app version, jsVersion, bundleVersion to be used
    await checkAndSetReleaseVersion()

    if (appTarget) {
        ReleaseManager.current.setAndroidAppTarget(appTarget)
    }

    //Fetch past patches from api
    let oldBundles = await getPastReleaseBundles()
    oldBundles = await downloadOldBundles(oldBundles)

    let baseByteCodeFile

    if (oldBundles.length > 0) {
        Logger.log('Old bundles: ', oldBundles)
        //Get latest bundle as base bytecode for new bundle
        baseByteCodeFile = oldBundles[0]?.localPath
    }

    //Create new bundle
    //withNative: Build native apk as well, Default false
    await BundleManager.shared.makeBundle(outputFileType, baseByteCodeFile)

    //Create patches from prevBundles
    await BundleManager.shared.createPatches(oldBundles)

    //Upload to S3
    const filesUploaded = await S3Manager.shared.uploadQueuedFiles()
    if (!filesUploaded) {
        Logger.error('Uploading files to S3 failed')
        process.exit(1)
    }

    //Create release on Dynamo DB by calling create api`
    const createNewResponse = await ApiManager.shared.createNewRelease(filesUploaded)
    if (!createNewResponse) {
        Logger.error('Creating new release failed')
        process.exit(1)
    }

    Logger.success('New release created successfully')
}

async function downloadOldBundles(oldBundles: Bundle[]) {
    oldBundles = oldBundles.map((bundle) => {
        return {
            ...bundle,
            downloadState: BundleDownloadStates.IN_PROGRESS,
        }
    })
    oldBundles = await FileUtils.downloadMultipleBundles(oldBundles)

    if (isNull(oldBundles)) {
        Logger.error('Downloading old bundles failed')
        process.exit(1)
    }

    Logger.log('All previous bundles downloaded', oldBundles)

    return oldBundles
}
