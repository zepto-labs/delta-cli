#!/usr/bin/env node

import { createRegistry } from '../src/commands/createRegistry'
import { setNativeBundleVersion, createRelease } from '../src/commands/createRelease'
import { invalidateCache } from '../src/commands/invalidateCache'
import { listRegistries } from '../src/commands/listRegistries'
import { listReleases } from '../src/commands/listReleases'
import { updateRelease } from '../src/commands/updateRelease'
import { ArgsHelper } from '../src/utils/ArgsHelper'
import { OutputFileType } from '../src/utils/BundleManager'
import { Logger } from '../src/utils/LoggerWrapper'

import { SUPPORTED_PLATFORMS } from '../src/utils/ReleaseManager'
import { applyAndroidNativeEnvFromNativeProject } from '../src/utils/androidNativeEnvSync'
import { applyIosNativeEnvFromNativeProject } from '../src/utils/iosNativeEnvSync'



enum DELTA_COMMANDS {
    CREATE_BUNDLE_RELEASE = 'createBundleRelease',
    UPDATE_RELEASE = 'updateRelease',
    LIST_RELEASES = 'listReleases',
    LIST_REGISTRIES = 'listRegistries',
    CREATE_REGISTRY = 'createRegistry',
    INVALIDATE_CACHE = 'invalidateCache',
    SET_NATIVE_BUNDLE_VERSION = 'setNativeBundleVersion',
    CREATE_ANDROID_NATIVE_BUNDLE = 'createAndroidNativeBundle',
    CREATE_IOS_NATIVE_BUNDLE = 'createIosNativeBundle'
}

function checkCommands() {
    const { command, appTarget, platform } = ArgsHelper.getCliArgs()

    switch (command) {
        case DELTA_COMMANDS.CREATE_BUNDLE_RELEASE:
            if (platform === SUPPORTED_PLATFORMS.ANDROID) {
                applyAndroidNativeEnvFromNativeProject(process.cwd())
            } else if (platform === SUPPORTED_PLATFORMS.IOS) {
                applyIosNativeEnvFromNativeProject(process.cwd())
            }
            createRelease(OutputFileType.HERMES_BUNDLE)
            break

        case DELTA_COMMANDS.UPDATE_RELEASE:
            updateRelease()
            break

        case DELTA_COMMANDS.LIST_RELEASES:
            listReleases()
            break

        case DELTA_COMMANDS.LIST_REGISTRIES:
            listRegistries()
            break

        case DELTA_COMMANDS.CREATE_REGISTRY:
            createRegistry()
            break

        case DELTA_COMMANDS.INVALIDATE_CACHE:
            invalidateCache()
            break
        
        case DELTA_COMMANDS.SET_NATIVE_BUNDLE_VERSION:
            setNativeBundleVersion()
            break
            
        case DELTA_COMMANDS.CREATE_ANDROID_NATIVE_BUNDLE:
            createRelease(OutputFileType.CREATE_ANDROID_NATIVE_BUNDLE, appTarget)
            break;

        case DELTA_COMMANDS.CREATE_IOS_NATIVE_BUNDLE:
            createRelease(OutputFileType.IOS_NATIVE_BUNDLE)
            break;

        default:
            Logger.error('Not a valid command')
    }
}

checkCommands()
