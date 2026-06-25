import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname } from 'node:path'

function escapeEnvValue(value: string): string {
    if (/[\s#"']/.test(value)) {
        return `"${String(value).replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`
    }
    return String(value)
}

/**
 * Updates or appends keys in a dotenv file without duplicating keys.
 */
export function mergeEnvKeysIntoFile(envPath: string, updates: Record<string, string>): void {
    const keysToSet = new Set(Object.keys(updates))
    let body = ''
    if (existsSync(envPath)) {
        body = readFileSync(envPath, 'utf8')
    }

    const lines = body.split(/\r?\n/)
    const kept: string[] = []
    for (const line of lines) {
        const trimmed = line.trim()
        const m = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)=/)
        const key = m?.[1]
        if (key !== undefined && keysToSet.has(key)) {
            continue
        }
        kept.push(line)
    }
    while (kept.length && kept[kept.length - 1] === '') {
        kept.pop()
    }

    const block = Object.entries(updates)
        .map(([k, v]) => `${k}=${escapeEnvValue(v)}`)
        .join('\n')
    const prefix = kept.length ? `${kept.join('\n')}\n\n` : ''
    const out = `${prefix}${block}\n`

    const dir = dirname(envPath)
    if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true })
    }
    writeFileSync(envPath, out, 'utf8')
}
