import { Logger } from '../utils/LoggerWrapper'
import { ApiManager } from '../api/ApiManager'
import { convertToBytes, isNull } from '../utils/helper'
import { ArgsHelper } from '../utils/ArgsHelper'
import { BundleReleaseState } from '../api/models'

export async function listReleases() {
    let { appId, jsVersion } = ArgsHelper.getCliArgs()

    appId = appId ?? process.env.DELTA_ID

    if (isNull(appId)) {
        Logger.error('App Id not specified')
        process.exit(1)
    }

    const releaseList = await ApiManager.shared.fetchReleaseList(appId!, jsVersion)

    if (!releaseList) {
        Logger.error('Failed to fetch release list')
        process.exit(1)
    }

    const formattedReleaseList = releaseList!.map((bundle) => {
        return {
            'App Id': bundle.appId,
            'Release Version': bundle.releaseVersion,
            'App Version': bundle.appVersion,
            'Js Version': bundle.jsVersion,
            'Bundle Version': bundle.bundleVersion,
            'Native Release': bundle.nativeRelease,
            'Default Release': bundle.defaultRelease,
            'Release State': BundleReleaseState[bundle.releaseState],
            'Rollout Percentage': bundle.rollout,
            'Bundle Size': convertToBytes(bundle.bundle.size),
        }
    })

    const formattedPatchList: {
        id: string
        url: string
        size: string
        jsVersion: number
        releaseVersion: string
    }[] = []

    releaseList!.forEach((bundle) => {
        const patchList = bundle.patchList.map((patch) => {
            return {
                ...patch,
                size: convertToBytes(patch.size),
                jsVersion: bundle.jsVersion,
                releaseVersion: bundle.releaseVersion,
            }
        })
        formattedPatchList.push(...patchList)
    })

    Logger.info('Releases')
    console.table(formattedReleaseList)
    Logger.info('Patches')
    console.table(formattedPatchList)
}
