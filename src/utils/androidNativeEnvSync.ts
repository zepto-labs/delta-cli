import { existsSync, readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { ArgsHelper } from './ArgsHelper'
import { mergeEnvKeysIntoFile } from './envMerge'
import { Logger } from './LoggerWrapper'

/** Same patterns as react-native-delta android/delta.gradle */
type GradleField = 'ANDROID_DELTA_ID' | 'DELTA_JS_VERSION' | 'versionName'

const GRADLE_PATTERNS: Record<GradleField, RegExp> = {
    ANDROID_DELTA_ID: /ANDROID_DELTA_ID\s*=\s*["']([^"']+)["']/,
    DELTA_JS_VERSION: /DELTA_JS_VERSION\s*=\s*["']([^"']+)["']/,
    versionName: /versionName\s+["']([^"']+)["']/,
}

export function readGradleField(buildGradleText: string, field: GradleField): string | null {
    const m = buildGradleText.match(GRADLE_PATTERNS[field])
    return m?.[1] ?? null
}

/**
 * Sets process.env ANDROID_DELTA_ID, ANDROID_JS_VERSION, ANDROID_VERSION from AndroidManifest.xml
 * and the app module's build.gradle (same sources as the Gradle Delta integration).
 * Call after dotenv.config() so these values override .env.
 *
 * @param projectRoot React Native project root (typically process.cwd())
 * @returns true if all values were read and applied
 */
export function applyAndroidNativeEnvFromNativeProject(projectRoot: string = process.cwd()): boolean {
    const { envFileName = '.env' } = ArgsHelper.getCliArgs()
    const envPath = resolve(projectRoot, envFileName)
    const androidAppDir = join(projectRoot, 'android', 'app')
    Logger.log('androidAppDir', androidAppDir)

    const buildGradlePath = join(androidAppDir, 'build.gradle')
    Logger.log('buildGradlePath', buildGradlePath)

    if (!existsSync(buildGradlePath)) {
        return false
    }

    const buildGradleText = readFileSync(buildGradlePath, 'utf8')

    Logger.log('buildGradleText', buildGradleText)

    const androidDeltaId = readGradleField(buildGradleText, 'ANDROID_DELTA_ID')
    Logger.log('androidDeltaId', androidDeltaId)
    const jsVersion = readGradleField(buildGradleText, 'DELTA_JS_VERSION')
    Logger.log('jsVersion', jsVersion)
    const versionName = readGradleField(buildGradleText, 'versionName')
    Logger.log('versionName', versionName)

    if (!androidDeltaId || !jsVersion || !versionName) {
        return false
    }

    process.env.ANDROID_DELTA_ID = androidDeltaId
    process.env.ANDROID_JS_VERSION = jsVersion
    process.env.ANDROID_VERSION = versionName

    mergeEnvKeysIntoFile(envPath, {
        ANDROID_DELTA_ID: androidDeltaId,
        ANDROID_JS_VERSION: jsVersion,
        ANDROID_VERSION: versionName,
    })

    return true
}
