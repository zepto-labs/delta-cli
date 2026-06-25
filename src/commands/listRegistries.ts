import { Logger } from '../utils/LoggerWrapper'
import { ApiManager } from '../api/ApiManager'

export async function listRegistries() {
    const registryList = await ApiManager.shared.fetchRegistryList()

    if (!registryList) {
        Logger.error('Failed to fetch release list')
        process.exit(1)
    }

    const formattedRegistryList = registryList!.map((registry) => {
        return {
            'App Id': registry.appId,
            'App Version': registry.appName,
            Platform: registry.platform,
        }
    })

    Logger.info('App registries')
    console.table(formattedRegistryList)
}
