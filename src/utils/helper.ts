import { ArgsHelper } from './ArgsHelper'
import { Logger } from './LoggerWrapper'
import { SUPPORTED_PLATFORMS, SupportedPlatformKeys } from './ReleaseManager'

export function isNotNull(value: any): boolean {
    return value !== null && value != undefined
}

export function isNull(value: any): boolean {
    return value == null || value == undefined
}

export function convertToBytes(bytes: number) {
    if (bytes === 0) {
        return '0.00 B'
    }

    let e = Math.floor(Math.log(bytes) / Math.log(1024))
    return (bytes / Math.pow(1024, e)).toFixed(2) + ' ' + ' KMGTP'.charAt(e) + 'B'
}

export function getAppDetailsFromEnv(platform: SupportedPlatformKeys) {
    const { envFileName = '.env' } = ArgsHelper.getCliArgs()

    if (!!envFileName) {
        require('dotenv').config({ path: envFileName })
    } else {
        require('dotenv').config({ path: '.env' })
    }

    let appVersion, jsVersion, appId
    if (platform === SUPPORTED_PLATFORMS.ANDROID) {
        appVersion = process.env.ANDROID_VERSION
        jsVersion = Number(process.env.ANDROID_JS_VERSION)
        appId = process.env.ANDROID_DELTA_ID
        Logger.info('Android app version: ', appId ?? 'Not found')
    } else {
        appVersion = process.env.IOS_VERSION
        jsVersion = Number(process.env.IOS_JS_VERSION)
        appId = process.env.IOS_DELTA_ID
    }
    return {
        appVersion,
        jsVersion,
        appId,
    }
}
