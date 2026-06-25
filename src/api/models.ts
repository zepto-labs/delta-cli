export enum BundleReleaseState {
    CREATED = 0,
    STAGING = 10, //Only Available to internal users
    LIVE = 20, //Available to users
    DISABLED = 30, //Disabled for updates, can be moved to live again
    DELETED = 40, //Invalid or Corrupted build, cannot be moved to live again
}

export interface BundleURLData {
    url: string
    size: number
}

export interface BundleResponse {
    releaseState: BundleReleaseState
    appId: string
    bundle: BundleURLData
    bundleVersion: number
    releaseVersion: string
    appVersion: string
    jsVersion: number
    rollout: number
    hash: string
    patchList: {
        id: string
        url: string
        size: number
    }[]
    defaultRelease: boolean
    nativeRelease: boolean
}

export interface ReleaseUpdateData {
    rollout?: number
    releaseState?: number
    defaultRelease?: boolean
}

export interface RegistryApp {
    appId: string
    appName: string
    platform: string
}
