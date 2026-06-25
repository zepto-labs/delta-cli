import { Logger } from '../utils/LoggerWrapper'
import { ApiManager } from '../api/ApiManager'
import { ArgsHelper } from '../utils/ArgsHelper'
import { isNull } from '../utils/helper'

export async function createRegistry() {
    const { appId, appName, platform } = ArgsHelper.getCliArgs()

    if (isNull(appId)) {
        Logger.error('App Id not specified')
        process.exit(1)
    }

    if (isNull(appName)) {
        Logger.error('App name not specified')
        process.exit(1)
    }

    if (isNull(platform)) {
        Logger.error('Platform not specified')
        process.exit(1)
    }

    const isSuccess = await ApiManager.shared.createRegistry(appId!, appName!, platform!)

    if (!isSuccess) {
        Logger.error('Failed to create registry')
        process.exit(1)
    }

    Logger.success('Registry created')
}
