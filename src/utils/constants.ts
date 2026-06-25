import { ArgsHelper } from './ArgsHelper'
import { DeltaManager } from './DeltaManager'
import { SUPPORTED_PLATFORMS } from './ReleaseManager'

const clientArgs = ArgsHelper.getCliArgs()

export const FILE_CONSTANTS = {
    BUILD_DIRECTORY: '.delta/build',
    MAIN_BUNDLE_DIRECTORY: 'bundle',
    MAIN_BUNDLE_ZIP: 'bundle.zip',
    BUNDLE: () => (clientArgs.platform === SUPPORTED_PLATFORMS.IOS ? 'main.jsbundle' : 'index.android.bundle'),
    TEMP_HERMES_BUNDLE: () =>
        clientArgs.platform === SUPPORTED_PLATFORMS.IOS ? 'main.jsbundle.hbc' : 'index.android.bundle.hbc',
    BUNDLE_SOURCEMAPS: () =>
        clientArgs.platform === SUPPORTED_PLATFORMS.IOS ? 'main.jsbundle.map' : 'index.android.bundle.map',
    HERMES_BUNDLE_SOURCEMAPS: () =>
        clientArgs.platform === SUPPORTED_PLATFORMS.IOS ? 'main.jsbundle.hbc.map' : 'index.android.bundle.hbc.map',
    PACKAGER_BUNDLE_SOURCEMAPS: () =>
        clientArgs.platform === SUPPORTED_PLATFORMS.IOS
            ? 'main.jsbundle.packager.map'
            : 'index.android.bundle.packager.map',
    HERMES_COMMAND_PATH: (osBin: string) => `node_modules/react-native/sdks/hermesc/${osBin}/hermesc`,
    PATCH_BUNDLE: 'index.patch',
    PATCH_DIRECTORY_PREFIX: (patchVersion: string) => `patch-${patchVersion}`,
    ANDROID_BUNDLE_DIR: 'android/app/build/generated/assets',
    ANDROID_IMG_ASSETS_DIR: 'android/app/build/generated/res',
    SOURCE_MAP_DIR: 'source-map',
    IOS_BUNDLE_DIRECTORY: 'ios/build',
    ASSETS: 'assets',
}

export const S3_CONSTANTS = {
    ROOT_PATH: 'releases',
    BUCKET_NAME: () => DeltaManager.getS3Bucket(),
    REGION: () => DeltaManager.getS3Region(),
}

export const LAMBDA_CONSTANTS = {
    REGION: () => DeltaManager.getLambdaRegion(),
    GET_LATEST_PATCH_FUNCTION: () => DeltaManager.getLambdaGetLatestPatch(),
    GET_RELEASE_LIST_FUNCTION: () => DeltaManager.getLambdaGetReleaseList(),
    CREATE_RELEASE_FUNCTION: () => DeltaManager.getLambdaCreateRelease(),
    UPDATE_RELEASE_FUNCTION: () => DeltaManager.getLambdaUpdateRelease(),
    GET_REGISTRY_LIST_FUNCTION: () => DeltaManager.getLambdaGetRegistryList(),
    CREATE_REGISTRY_FUNCTION: () => DeltaManager.getLambdaCreateRegistry(),
    INVALIDATE_CACHE_FUNCTION: () => DeltaManager.getLambdaInvalidateCache(),
}
