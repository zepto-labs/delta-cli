import * as fs from 'node:fs'
import * as path from 'node:path'

type LambdaNames = {
    getLatestPatch: string
    getReleaseList: string
    createRelease: string
    updateRelease: string
    getRegistryList: string
    createRegistry: string
    invalidateCache: string
}

type DeltaAwsConfig = {
    s3: { bucket: string; region: string }
    lambda: { region: string } & LambdaNames
}



function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function requireString(obj: Record<string, unknown>, key: string, ctx: string): string {
    const v = obj[key]
    if (typeof v !== 'string' || !v.trim()) {
        throw new Error(`${ctx}: expected non-empty string "${key}"`)
    }
    return v.trim()
}

function parseFlatDeltaConfig(raw: unknown): DeltaAwsConfig {
    const ctx = 'delta.config.json'
    if (!isRecord(raw)) {
        throw new Error(`${ctx}: root must be a JSON object with "s3" and "lambda"`)
    }
    const s3Raw = raw.s3
    if (!isRecord(s3Raw)) {
        throw new Error(`${ctx}: "s3" must be an object`)
    }
    const s3 = {
        bucket: requireString(s3Raw, 'bucket', `${ctx}.s3`),
        region: requireString(s3Raw, 'region', `${ctx}.s3`),
    }
    const lambdaRaw = raw.lambda
    if (!isRecord(lambdaRaw)) {
        throw new Error(`${ctx}: "lambda" must be an object`)
    }
    const lambda: DeltaAwsConfig['lambda'] = {
        region: requireString(lambdaRaw, 'region', `${ctx}.lambda`),
        getLatestPatch: requireString(lambdaRaw, 'getLatestPatch', `${ctx}.lambda`),
        getReleaseList: requireString(lambdaRaw, 'getReleaseList', `${ctx}.lambda`),
        createRelease: requireString(lambdaRaw, 'createRelease', `${ctx}.lambda`),
        updateRelease: requireString(lambdaRaw, 'updateRelease', `${ctx}.lambda`),
        getRegistryList: requireString(lambdaRaw, 'getRegistryList', `${ctx}.lambda`),
        createRegistry: requireString(lambdaRaw, 'createRegistry', `${ctx}.lambda`),
        invalidateCache: requireString(lambdaRaw, 'invalidateCache', `${ctx}.lambda`),
    }
    return { s3, lambda }
}

let resolvedConfig: DeltaAwsConfig | null | undefined

function resolveQaConfig(cwd: string): DeltaAwsConfig | null {
    if (resolvedConfig === undefined) {
        const configPath = path.join(cwd, 'delta.config.json')
        if (fs.existsSync(configPath)) {
            let parsed: unknown
            try {
                parsed = JSON.parse(fs.readFileSync(configPath, 'utf-8')) as unknown
            } catch {
                throw new Error(`delta.config.json at ${configPath} is not valid JSON`)
            }
            resolvedConfig = parseFlatDeltaConfig(parsed)
        } else {
            resolvedConfig = null
        }
    }
    return resolvedConfig
}

function active(): DeltaAwsConfig | null {
    return resolveQaConfig(process.cwd())
}

export class DeltaManager {
    private static require(): DeltaAwsConfig {
        const config = active()
        if (config === null) {
            throw new Error('delta.config.json not found. Please add a delta.config.json to your project root.')
        }
        return config
    }

    static getS3Bucket(): string {
        return DeltaManager.require().s3.bucket
    }

    static getS3Region(): string {
        return DeltaManager.require().s3.region
    }

    static getLambdaRegion(): string {
        return DeltaManager.require().lambda.region
    }

    static getLambdaGetLatestPatch(): string {
        return DeltaManager.require().lambda.getLatestPatch
    }

    static getLambdaGetReleaseList(): string {
        return DeltaManager.require().lambda.getReleaseList
    }

    static getLambdaCreateRelease(): string {
        return DeltaManager.require().lambda.createRelease
    }

    static getLambdaUpdateRelease(): string {
        return DeltaManager.require().lambda.updateRelease
    }

    static getLambdaGetRegistryList(): string {
        return DeltaManager.require().lambda.getRegistryList
    }

    static getLambdaCreateRegistry(): string {
        return DeltaManager.require().lambda.createRegistry
    }

    static getLambdaInvalidateCache(): string {
        return DeltaManager.require().lambda.invalidateCache
    }
}
