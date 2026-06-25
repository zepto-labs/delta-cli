export interface Bundle {
    url: string
    bundleVersion: number
    releaseVersion: string
    jsVersion: number
    localPath?: string
    downloadState?: BundleDownloadStates
}

export enum BundleDownloadStates {
    IN_PROGRESS = 'IN_PROGRESS',
    COMPLETED = 'COMPLETED',
    FAILED = 'FAILED',
}
