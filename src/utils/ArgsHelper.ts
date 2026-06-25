import { parseArgs } from 'node:util'
import { INVALIDATE_CACHE_TYPE } from '../models/InvalidateCacheType'

interface ArgsData {
    command: string
    appId: string | undefined
    appTarget: string | undefined
    jsVersion: number | undefined
    bundleVersion: number | undefined
    rollout: number | undefined
    releaseState: number | undefined
    pushToStaging: boolean
    appName: string | undefined
    platform: string | undefined
    cacheType: INVALIDATE_CACHE_TYPE | undefined
    entryFile: string | undefined
    projectName: string | undefined
    targetName: string | undefined
    defaultRelease: boolean | undefined
    configPath: string | undefined
    envFileName: string | undefined
    description: string | undefined
}

export class ArgsHelper {
    static getCliArgs(): ArgsData {
        const { positionals, values } = parseArgs({
            allowPositionals: true,
            tokens: true,
            strict: true,
            options: {
                appId: {
                    type: 'string',
                    short: 'a',
                },
                appTarget: {
                    type: 'string',
                    short: 't',
                },
                jsVersion: {
                    type: 'string',
                    short: 'j',
                },
                bundleVersion: {
                    type: 'string',
                    short: 'b',
                },
                rollout: {
                    type: 'string',
                    short: 'r',
                },
                releaseState: {
                    type: 'string',
                    short: 's',
                },
                pushToStaging: {
                    type: 'boolean',
                    short: 'P',
                },
                appName: {
                    type: 'string',
                },
                platform: {
                    type: 'string',
                },
                cacheType: {
                    type: 'string',
                },
                entryFile: {
                    type: 'string',
                },
                projectName: {
                    type: 'string',
                },
                targetName: {
                    type: 'string',
                },
                defaultRelease: {
                    type: 'string',
                    short: 'd',
                },
                configPath: {
                    type: 'string',
                },
                envFileName: {
                    type: 'string',
                },
                description: {
                    type: 'string',
                    short: 'm',
                },
            },
        })

        return {
            command: positionals[0] as string,
            appId: values.appId as string | undefined,
            appTarget: values.appTarget as string | undefined,
            jsVersion: values.jsVersion ? parseInt(values.jsVersion) : undefined,
            bundleVersion: values.bundleVersion ? parseInt(values.bundleVersion) : undefined,
            rollout: values.rollout ? parseInt(values.rollout) : undefined,
            releaseState: values.releaseState ? parseInt(values.releaseState) : undefined,
            pushToStaging: values.pushToStaging ?? false,
            appName: values.appName,
            platform: values.platform,
            cacheType: values.cacheType,
            entryFile: values.entryFile,
            projectName: values.projectName,
            defaultRelease: values.defaultRelease ? values.defaultRelease == 'true' : undefined,
            configPath: values.configPath,
            envFileName: values.envFileName,
            targetName: values.targetName,
            description: values.description,
        }
    }
}
