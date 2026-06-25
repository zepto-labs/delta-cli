import { InvokeCommand, LambdaClient } from '@aws-sdk/client-lambda'
import { LAMBDA_CONSTANTS } from '../utils/constants'
import { Logger } from '../utils/LoggerWrapper'
import { INVALIDATE_CACHE_TYPE } from '../models/InvalidateCacheType'

interface ResponseBody {
    body: { data: any; error: any } | null
    statusCode?: number
}

export class LambdaManager {
    static shared = new LambdaManager()

    private lambdaClient: LambdaClient

    private constructor() {
        this.lambdaClient = new LambdaClient({
            region: LAMBDA_CONSTANTS.REGION(),
        })
    }

    async invoke(invokeCommand: InvokeCommand): Promise<ResponseBody> {
        const { Payload } = await this.lambdaClient.send(invokeCommand)
        let body
        let statusCode

        try {
            const response = JSON.parse(Buffer.from(Payload!).toString())
            statusCode = response.statusCode
            body = JSON.parse(response.body)
        } catch (err) {
            const e = err instanceof Error ? `${err.name}: ${err.message}` : String(err)
            Logger.log('Error parsing response:', e)
            return { body: null }
        }

        return { statusCode, body }
    }

    async fetchLatestPatchVersion(queryParams: { appId: string; jsVersion: number }): Promise<ResponseBody> {
        const payload = {
            queryStringParameters: queryParams,
        }

        Logger.log('Fetching latest patch version', payload)

        const invokeCommand = new InvokeCommand({
            FunctionName: LAMBDA_CONSTANTS.GET_LATEST_PATCH_FUNCTION(),
            Payload: JSON.stringify(payload),
        })

        const { statusCode, body } = await this.invoke(invokeCommand)

        return { statusCode, body }
    }

    async fetchReleaseList(queryParams: { appId: string; jsVersion?: number }) {
        const payload = {
            queryStringParameters: queryParams,
        }

        Logger.log('Fetching release list', payload)

        const invokeCommand = new InvokeCommand({
            FunctionName: LAMBDA_CONSTANTS.GET_RELEASE_LIST_FUNCTION(),
            Payload: JSON.stringify(payload),
        })

        const { statusCode, body } = await this.invoke(invokeCommand)

        return { statusCode, body }
    }

    async createRelease(requestBody: any) {
        const payload = {
            body: JSON.stringify(requestBody),
        }

        Logger.log('Creating Release', payload)

        const invokeCommand = new InvokeCommand({
            FunctionName: LAMBDA_CONSTANTS.CREATE_RELEASE_FUNCTION(),
            Payload: JSON.stringify(payload),
        })

        const { statusCode, body } = await this.invoke(invokeCommand)

        return { statusCode, body }
    }

    async updateRelease(requestBody: any) {
        const payload = {
            body: JSON.stringify(requestBody),
        }

        Logger.log('Updating Release', payload)

        const invokeCommand = new InvokeCommand({
            FunctionName: LAMBDA_CONSTANTS.UPDATE_RELEASE_FUNCTION(),
            Payload: JSON.stringify(payload),
        })

        const { statusCode, body } = await this.invoke(invokeCommand)

        return { statusCode, body }
    }

    async fetchRegistryList() {
        Logger.log('Fetching registry list')

        const invokeCommand = new InvokeCommand({
            FunctionName: LAMBDA_CONSTANTS.GET_REGISTRY_LIST_FUNCTION(),
        })

        const { statusCode, body } = await this.invoke(invokeCommand)

        return { statusCode, body }
    }

    async createRegistry(requestBody: { appId: string; appName: string; platform: string }) {
        const payload = {
            body: JSON.stringify(requestBody),
        }

        Logger.log('Creating registry', payload)

        const invokeCommand = new InvokeCommand({
            FunctionName: LAMBDA_CONSTANTS.CREATE_REGISTRY_FUNCTION(),
            Payload: JSON.stringify(payload),
        })

        const { statusCode, body } = await this.invoke(invokeCommand)

        return { statusCode, body }
    }

    async invalidateCache(requestBody: { type: INVALIDATE_CACHE_TYPE }) {
        const payload = {
            body: JSON.stringify(requestBody),
        }

        Logger.log('Invalidating cache')

        const invokeCommand = new InvokeCommand({
            FunctionName: LAMBDA_CONSTANTS.INVALIDATE_CACHE_FUNCTION(),
            Payload: JSON.stringify(payload),
        })

        const { statusCode, body } = await this.invoke(invokeCommand)

        return { statusCode, body }
    }
}
