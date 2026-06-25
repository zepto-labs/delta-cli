import { Logger } from '../utils/LoggerWrapper'
import { ReleaseManager } from '../utils/ReleaseManager'
import { ApiManager } from '../api/ApiManager'
import { getAppDetailsFromEnv, isNull } from '../utils/helper'
import { ArgsHelper } from '../utils/ArgsHelper'
import { ReleaseUpdateData } from '../api/models'

function checkAndSetReleaseManager(): ReleaseUpdateData {
    const { platform } = ArgsHelper.getCliArgs()

    if (isNull(platform)) {
        Logger.error('Platform not specified')
        process.exit(1)
    }
    const { appId: fallBackAppId } = getAppDetailsFromEnv(platform as string)
    const {
        jsVersion,
        bundleVersion,
        rollout,
        releaseState,
        appId = fallBackAppId,
        defaultRelease,
    } = ArgsHelper.getCliArgs()

    if (isNull(jsVersion)) {
        Logger.error('JS version not specified')
        process.exit(1)
    }

    if (isNull(appId)) {
        Logger.error('App Id not specified')
        process.exit(1)
    }

    if (isNull(bundleVersion)) {
        Logger.error('Bundle version is not specified')
        process.exit(1)
    }

    if (isNull(rollout) && isNull(releaseState) && isNull(defaultRelease)) {
        Logger.error('Atleast one of rollout or releaseState or defaultRelease should be specified')
        process.exit(1)
    }

    ReleaseManager.current.setReleaseVersion('', jsVersion!, bundleVersion!, appId!)

    Logger.info('Release versions', ReleaseManager.current.toString())

    return { rollout, releaseState, defaultRelease }
}

export async function updateRelease() {
    const payload = checkAndSetReleaseManager()

    const updateRelease = await ApiManager.shared.updateRelease(payload)

    if (isNull(updateRelease)) {
        Logger.error('Failed to update release')
        process.exit(1)
    }

    Logger.success('Release updated')
}
