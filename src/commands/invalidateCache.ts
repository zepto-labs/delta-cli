import { Logger } from '../utils/LoggerWrapper'
import { ApiManager } from '../api/ApiManager'
import { ArgsHelper } from '../utils/ArgsHelper'

export async function invalidateCache() {
    const { cacheType } = ArgsHelper.getCliArgs()

    if (!cacheType) {
        Logger.error('Cache type not specified')
        process.exit(1)
    }

    const success = await ApiManager.shared.invalidateCache(cacheType)

    if (!success) {
        Logger.error('Failed to invalidate cache')
        process.exit(1)
    }

    Logger.success('Cache invalidation success')
}
