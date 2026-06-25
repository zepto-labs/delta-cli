export const SUPPORTED_PLATFORMS = {
    ANDROID: 'android',
    IOS: 'ios',
}

// Convert object key in a type
export type SupportedPlatformKeys = (typeof SUPPORTED_PLATFORMS)[keyof typeof SUPPORTED_PLATFORMS]

export class ReleaseManager {
    static current = new ReleaseManager()

    appVersion!: string
    jsVersion!: number
    bundleVersion!: number
    appId!: string
    isNative: boolean
    appTargetAndroid?: string
    platform: SupportedPlatformKeys

    private constructor() {
        this.platform = SUPPORTED_PLATFORMS.ANDROID
        this.isNative = false
    }

    setPlatform(platform: SupportedPlatformKeys) {
        this.platform = platform
    }

    setReleaseVersion(appVersion: string, jsVersion: number, bundleVersion: number, appId: string) {
        this.appVersion = appVersion
        this.jsVersion = jsVersion
        this.bundleVersion = bundleVersion
        this.appId = appId
    }

    //Add support for iOS later
    setAndroidAppTarget(appTarget: string) {
        this.appTargetAndroid = appTarget
    }

    setNativeRelease(isNative: boolean) {
        this.isNative = isNative
    }

    toString() {
        return JSON.stringify({
            appVersion: this.appVersion,
            jsVersion: this.jsVersion,
            bundleVersion: this.bundleVersion,
            appId: this.appId,
        })
    }

    get version() {
        return this.jsVersion + '-' + String(this.bundleVersion).padStart(2, '0')
    }
}
