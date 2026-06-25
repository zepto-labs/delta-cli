import { existsSync, readFileSync, readdirSync, Dirent } from 'node:fs'
import { join, resolve, relative, sep } from 'node:path'
import { execFileSync } from 'node:child_process'
import { ArgsHelper } from './ArgsHelper'
import { mergeEnvKeysIntoFile } from './envMerge'
import { Logger } from './LoggerWrapper'

/** Keys from react-native-DELTA Info.plist / scripts/ios/update_info_plist.rb */
const DELTA_APP_ID_KEY = 'DeltaAppId'
const DELTA_JS_VERSION_KEY = 'DeltaJsVersion'
const DELTA_IOS_VERSION_KEY = 'DeltaIosVersion'
const CF_BUNDLE_SHORT_VERSION = 'CFBundleShortVersionString'

export function readPlistStringValue(xml: string, key: string): string | null {
    const re = new RegExp(`<key>${escapeRegExp(key)}</key>\\s*<string>([^<]*)</string>`)
    const m = xml.match(re)
    return m?.[1] != null ? m[1] : null
}

export function readPlistDELTAJsVersion(xml: string): string | null {
    const re = new RegExp(
        `<key>${escapeRegExp(DELTA_JS_VERSION_KEY)}</key>\\s*<(integer|string)>([^<]+)</\\1>`,
    )
    const m = xml.match(re)
    return m?.[2] != null ? String(m[2]).trim() : null
}

function escapeRegExp(s: string): string {
    return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function extractPlaceholderKey(raw: string): string | null {
    const s = raw.trim()
    const m1 = /^\$\{([^}]+)\}$/.exec(s)
    const m2 = /^\$\(([^)]+)\)$/.exec(s)
    const k = m1?.[1]?.trim() ?? m2?.[1]?.trim()
    return k && k.length > 0 ? k : null
}

function readDotenvValue(envPath: string, key: string): string | null {
    if (!existsSync(envPath)) {
        return null
    }
    const text = readFileSync(envPath, 'utf8')
    const prefix = `${key}=`
    for (const line of text.split(/\r?\n/)) {
        const trimmed = line.trim()
        if (trimmed === '' || trimmed.startsWith('#')) {
            continue
        }
        if (trimmed.startsWith(prefix)) {
            let value = trimmed.slice(prefix.length).trim()
            if (
                (value.startsWith('"') && value.endsWith('"')) ||
                (value.startsWith("'") && value.endsWith("'"))
            ) {
                value = value.slice(1, -1)
            }
            return value
        }
    }
    return null
}

function readXcconfigLine(filePath: string, key: string): string | null {
    const text = readFileSync(filePath, 'utf8')
    for (const line of text.split(/\r?\n/)) {
        const trimmed = line.trim()
        if (trimmed === '' || trimmed.startsWith('#') || trimmed.startsWith('#include')) {
            continue
        }
        const m = trimmed.match(new RegExp(`^${escapeRegExp(key)}\\s*=\\s*(.+)$`))
        if (m?.[1]) {
            let v = m[1].trim().replace(/^["']|["']$/g, '')
            if (v.includes('$(') || v.includes('${')) {
                return null
            }
            return v
        }
    }
    return null
}

function readXcconfigValueInIosTree(iosDir: string, key: string): string | null {
    const candidates: string[] = []
    function walk(dir: string): void {
        let entries: Dirent[]
        try {
            entries = readdirSync(dir, { withFileTypes: true })
        } catch {
            return
        }
        for (const ent of entries) {
            const p = join(dir, ent.name)
            if (ent.isDirectory()) {
                if (ent.name === 'Pods' || ent.name === 'build' || ent.name === 'Build') {
                    continue
                }
                walk(p)
            } else if (ent.name.endsWith('.xcconfig')) {
                candidates.push(p)
            }
        }
    }
    walk(iosDir)
    for (const path of candidates) {
        const v = readXcconfigLine(path, key)
        if (v && v.length > 0) {
            return v
        }
    }
    return null
}

function firstSharedSchemeName(workspacePath: string): string | null {
    const shared = join(workspacePath, 'xcshareddata', 'xcschemes')
    if (!existsSync(shared)) {
        return null
    }
    try {
        const files = readdirSync(shared).filter((f) => f.endsWith('.xcscheme'))
        return files.length > 0 ? files[0]!.replace(/\.xcscheme$/, '') : null
    } catch {
        return null
    }
}

function xcodebuildShowBuildSetting(iosDir: string, key: string): string | null {
    if (process.platform !== 'darwin') {
        return null
    }
    let entries: string[]
    try {
        entries = readdirSync(iosDir)
    } catch {
        return null
    }

    const cfg = process.env.DELTA_XCODE_CONFIGURATION?.trim() || 'Release'
    let scheme = process.env.DELTA_XCODE_SCHEME?.trim()
    const ws = entries.find((f) => f.endsWith('.xcworkspace'))
    const proj = entries.find((f) => f.endsWith('.xcodeproj'))

    const args: string[] = []
    try {
        if (ws) {
            const wsPath = join(iosDir, ws)
            if (!scheme) {
                scheme = firstSharedSchemeName(wsPath) || ws.replace(/\.xcworkspace$/, '')
            }
            args.push('-workspace', wsPath, '-scheme', scheme!, '-showBuildSettings', '-configuration', cfg)
        } else if (proj) {
            if (!scheme) {
                scheme = proj.replace(/\.xcodeproj$/, '')
            }
            args.push('-project', join(iosDir, proj), '-scheme', scheme!, '-showBuildSettings', '-configuration', cfg)
        } else {
            return null
        }

        const out = execFileSync('xcodebuild', args, {
            cwd: iosDir,
            encoding: 'utf8',
            maxBuffer: 20 * 1024 * 1024,
            stdio: ['ignore', 'pipe', 'pipe'],
        })
        for (const line of out.split(/\r?\n/)) {
            const m = line.match(new RegExp(`^\\s*${escapeRegExp(key)}\\s*=\\s*(.+)$`))
            if (m?.[1]) {
                return m[1].trim()
            }
        }
    } catch {
        return null
    }
    return null
}

function resolveBuildSettingKey(
    key: string,
    iosDir: string,
    envPath: string,
): string | null {
    const fromEnv = process.env[key]
    if (fromEnv && fromEnv.trim()) {
        return fromEnv.trim()
    }

    const fromDotenv = readDotenvValue(envPath, key)
    if (fromDotenv && fromDotenv.trim()) {
        return fromDotenv.trim()
    }

    const fromXc = readXcconfigValueInIosTree(iosDir, key)
    if (fromXc) {
        return fromXc
    }

    return xcodebuildShowBuildSetting(iosDir, key)
}

function resolveIosMarketingVersion(
    raw: string | null,
    iosDir: string,
    envPath: string,
): string | null {
    if (raw == null || raw === '') {
        return null
    }
    const trimmed = raw.trim()
    const ph = extractPlaceholderKey(trimmed)
    if (!ph) {
        return trimmed
    }
    return resolveBuildSettingKey(ph, iosDir, envPath)
}

function shouldSkipDir(dirName: string): boolean {
    return (
        dirName === 'Pods' ||
        dirName === 'build' ||
        dirName === 'Build' ||
        dirName === 'DerivedData' ||
        dirName === 'node_modules' ||
        dirName === '.git'
    )
}

function isTestPlistPath(path: string): boolean {
    const parts = path.split(sep)
    return parts.some((p) => p.endsWith('Tests') || p.endsWith('UITests'))
}

export function findShallowestAppInfoPlist(projectRoot: string): string | null {
    const iosDir = join(projectRoot, 'ios')
    if (!existsSync(iosDir)) {
        return null
    }

    const candidates: string[] = []
    function walk(dir: string): void {
        let entries: Dirent[]
        try {
            entries = readdirSync(dir, { withFileTypes: true })
        } catch {
            return
        }
        for (const ent of entries) {
            if (ent.isDirectory()) {
                if (shouldSkipDir(ent.name)) {
                    continue
                }
                walk(join(dir, ent.name))
            } else if (ent.name === 'Info.plist' || ent.name === 'info.plist') {
                const full = join(dir, ent.name)
                if (!isTestPlistPath(full)) {
                    candidates.push(full)
                }
            }
        }
    }
    walk(iosDir)
    if (candidates.length === 0) {
        return null
    }
    candidates.sort((a, b) => {
        const da = relative(iosDir, a).split(sep).length
        const db = relative(iosDir, b).split(sep).length
        if (da !== db) {
            return da - db
        }
        return a.localeCompare(b)
    })
    return candidates[0]!
}

/**
 * Sets IOS_DELTA_ID, IOS_JS_VERSION, IOS_VERSION from the app Info.plist (DELTAAppId, DELTAJsVersion,
 * CFBundleShortVersionString or DELTAIosVersion), with Xcode placeholder resolution matching
 * scripts/ios/update_info_plist.rb. Call after dotenv.config() so these override .env.
 */
export function applyIosNativeEnvFromNativeProject(projectRoot: string = process.cwd()): boolean {
    const { envFileName = '.env' } = ArgsHelper.getCliArgs()
    const envPath = resolve(projectRoot, envFileName)

    const plistPath = findShallowestAppInfoPlist(projectRoot)

    if (!plistPath || !existsSync(plistPath)) {
        return false
    }

    const iosDir = join(projectRoot, 'ios')
    const xml = readFileSync(plistPath, 'utf8')

    const appId = readPlistStringValue(xml, DELTA_APP_ID_KEY)
    const jsVersion = readPlistDELTAJsVersion(xml)

    if (!appId || !jsVersion) {
        return false
    }

    const explicitIosVersion = readPlistStringValue(xml, DELTA_IOS_VERSION_KEY)
    const shortVersionRaw = readPlistStringValue(xml, CF_BUNDLE_SHORT_VERSION)

    let appVersion: string | null =
        explicitIosVersion && explicitIosVersion.trim() ? explicitIosVersion.trim() : null

    if (!appVersion) {
        appVersion = resolveIosMarketingVersion(shortVersionRaw, iosDir, envPath)
    }

    if (!appVersion) {
        return false
    }

    Logger.log('appVersion', appVersion)
    process.env.IOS_DELTA_ID = appId
    process.env.IOS_JS_VERSION = jsVersion
    process.env.IOS_VERSION = appVersion

    mergeEnvKeysIntoFile(envPath, {
        IOS_DELTA_ID: appId,
        IOS_JS_VERSION: jsVersion,
        IOS_VERSION: appVersion,
    })

    return true
}
