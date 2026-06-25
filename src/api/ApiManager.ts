import { ReleaseManager } from '../utils/ReleaseManager'
import { Logger } from '../utils/LoggerWrapper'
import { PathManager } from '../utils/PathManager'
import { S3FileType, S3FileUpload } from '../utils/S3Manager'
import { LambdaManager } from './LambdaManager'
import { BundleReleaseState, BundleResponse, RegistryApp, ReleaseUpdateData } from './models'
import { ArgsHelper } from '../utils/ArgsHelper'
import { INVALIDATE_CACHE_TYPE } from '../models/InvalidateCacheType'

export class ApiManager {
    static shared = new ApiManager()

    private constructor() {}

    async fetchLatestPatchVersion(appId: string, jsVersion: number): Promise<number | null> {
        const { statusCode, body } = await LambdaManager.shared.fetchLatestPatchVersion({ appId, jsVersion })

        Logger.log(`Fetching latest patch version ${statusCode}`, body)

        if (statusCode == 200 && body != null) {
            return body.data?.bundleVersion
        } else if (statusCode == 404 && body?.error == 'No Release Found') {
            return -1
        }

        return null
    }

    async fetchReleaseList(appId: string, jsVersion?: number): Promise<[BundleResponse] | null> {
        const { statusCode, body } = await LambdaManager.shared.fetchReleaseList({ appId, jsVersion })

        if (statusCode == 200 && body != null) {
            return body.data?.releases
        }

        return null
    }

    async createNewRelease(filesUploaded: S3FileUpload[]) {
        const { pushToStaging, description } = ArgsHelper.getCliArgs()
        const bundleFile = filesUploaded.filter((file) => file.type === S3FileType.BUNDLE)[0]
        const patches = filesUploaded
            .filter((file) => file.type === S3FileType.PATCH)
            .map((patch) => {
                return {
                    id: PathManager.patchDirName(patch.bundleVersion!),
                    url: patch.s3FileUrl,
                    size: patch.size,
                }
            })
        const requestBody = {
            appId: ReleaseManager.current.appId,
            jsVersion: ReleaseManager.current.jsVersion,
            bundleVersion: ReleaseManager.current.bundleVersion,
            appVersion: ReleaseManager.current.appVersion,
            bundle: {
                url: bundleFile?.s3FileUrl,
                size: bundleFile?.size,
            },
            patchList: patches,
            hash: bundleFile?.hash,
            releaseState: pushToStaging ? BundleReleaseState.STAGING : BundleReleaseState.CREATED,
            nativeRelease: ReleaseManager.current.isNative,
            description: description,
        }

        const { statusCode, body } = await LambdaManager.shared.createRelease(requestBody)

        if (statusCode == 200 && body != null) {
            return body.data
        }

        return null
    }

    async updateRelease(updatePayload: ReleaseUpdateData) {
        const requestBody = {
            appId: ReleaseManager.current.appId,
            jsVersion: ReleaseManager.current.jsVersion,
            bundleVersion: ReleaseManager.current.bundleVersion,
            ...updatePayload,
        }

        const { statusCode, body } = await LambdaManager.shared.updateRelease(requestBody)

        if (statusCode == 200 && body != null) {
            return body.data
        }

        return null
    }

    async fetchRegistryList(): Promise<[RegistryApp] | null> {
        const { statusCode, body } = await LambdaManager.shared.fetchRegistryList()

        if (statusCode == 200 && body != null) {
            return body.data?.apps
        }

        return null
    }

    async createRegistry(appId: string, appName: string, platform: string): Promise<boolean | null> {
        const { statusCode, body } = await LambdaManager.shared.createRegistry({ appId, appName, platform })

        if (statusCode == 200 && body != null) {
            return body.data?.success
        }

        return null
    }

    async invalidateCache(type: INVALIDATE_CACHE_TYPE): Promise<[boolean] | null> {
        const requestBody = {
            type: type,
        }
        const { statusCode, body } = await LambdaManager.shared.invalidateCache(requestBody)

        if (statusCode == 200 && body != null) {
            return body.data?.success
        }

        return null
    }
}
