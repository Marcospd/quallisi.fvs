import { NextResponse } from 'next/server'
import { sql } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { createServerClient } from '@supabase/ssr'
import net from 'node:net'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

export async function GET() {
    const results: Record<string, unknown> = {
        status: 'testing',
        time: new Date().toISOString(),
        runtime: process.env.NEXT_RUNTIME || 'nodejs',
        region: process.env.VERCEL_REGION || 'local',
        nodeVersion: process.version,
    }

    const dbUrl = process.env.DATABASE_URL || ''

    // 1. ENVs
    const host = extractHost(dbUrl)
    const port = extractPort(dbUrl)
    results.envs = {
        hasDbUrl: !!dbUrl,
        dbUrlLength: dbUrl.length,
        dbUrlHost: host,
        dbUrlPort: port,
        dbUrlUser: extractUser(dbUrl),
        dbUrlDatabase: extractDatabase(dbUrl),
        hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasSupabaseKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    }

    // 2. Teste TCP bruto — verifica se a porta é alcançável
    results.tcp = await testTcpConnection(host, parseInt(port))

    // 3. Teste postgres.js — captura erro completo
    results.postgresjs = await testPostgresJs(dbUrl)

    // 4. Teste via Supabase REST (PostgREST) — bypassa TCP/postgres protocol
    results.postgrest = await testPostgREST()

    // 5. Supabase Auth
    try {
        const authStart = Date.now()
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            { cookies: { getAll: () => [], setAll: () => {} } }
        )
        const { data, error } = await supabase.auth.getSession()
        results.supabase = {
            success: !error,
            ms: Date.now() - authStart,
            error: error?.message,
            hasSession: !!data?.session,
        }
    } catch (err) {
        results.supabase = { success: false, message: String((err as Error)?.message) }
    }

    // 6. Resultado
    const pgOk = (results.postgresjs as Record<string, unknown>)?.success === true
    const supabaseOk = (results.supabase as Record<string, unknown>)?.success === true
    results.status = pgOk && supabaseOk ? 'OK' : 'FAILING'

    return NextResponse.json(results, {
        status: results.status === 'OK' ? 200 : 500,
        headers: { 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'no-store' },
    })
}

/** Teste de conectividade TCP pura */
function testTcpConnection(host: string, port: number): Promise<Record<string, unknown>> {
    return new Promise((resolve) => {
        const start = Date.now()
        const socket = new net.Socket()
        socket.setTimeout(8000)

        socket.on('connect', () => {
            const ms = Date.now() - start
            socket.destroy()
            resolve({ success: true, ms, message: `TCP conectou em ${ms}ms` })
        })

        socket.on('timeout', () => {
            socket.destroy()
            resolve({ success: false, ms: Date.now() - start, message: 'TCP timeout (8s)' })
        })

        socket.on('error', (err) => {
            resolve({
                success: false,
                ms: Date.now() - start,
                message: err.message,
                code: (err as NodeJS.ErrnoException).code,
            })
        })

        socket.connect(port, host)
    })
}

/** Teste postgres.js com captura completa de erro */
async function testPostgresJs(url: string): Promise<Record<string, unknown>> {
    let conn: postgres.Sql | null = null
    try {
        const start = Date.now()
        conn = postgres(url, {
            prepare: false,
            ssl: 'require',
            max: 1,
            connect_timeout: 10,
            idle_timeout: 5,
        })
        const testDb = drizzle(conn)
        const result = await Promise.race([
            testDb.execute(sql`SELECT 1 as test`),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Query timeout (10s)')), 10_000)),
        ])
        const ms = Date.now() - start
        await conn.end({ timeout: 3 })
        return { success: true, ms, data: result }
    } catch (err) {
        if (conn) {
            try { await conn.end({ timeout: 2 }) } catch { /* ignore */ }
        }
        return extractFullError(err)
    }
}

/** Teste via Supabase REST API (PostgREST) — usa HTTP, não TCP */
async function testPostgREST(): Promise<Record<string, unknown>> {
    try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
        const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
        if (!supabaseUrl || !serviceKey) {
            return { success: false, message: 'Variáveis SUPABASE_URL ou SERVICE_ROLE_KEY ausentes' }
        }

        const start = Date.now()
        const res = await fetch(`${supabaseUrl}/rest/v1/tenants?select=id&limit=1`, {
            headers: {
                'apikey': serviceKey,
                'Authorization': `Bearer ${serviceKey}`,
            },
        })
        const ms = Date.now() - start
        const status = res.status
        const body = await res.text()

        return {
            success: status >= 200 && status < 300,
            ms,
            httpStatus: status,
            bodyPreview: body.substring(0, 200),
        }
    } catch (err) {
        return { success: false, message: String((err as Error)?.message) }
    }
}

/** Extrai TODAS as propriedades do erro incluindo cause e stack */
function extractFullError(err: unknown): Record<string, unknown> {
    const e = err as Record<string, unknown>
    const result: Record<string, unknown> = {
        success: false,
        name: e?.name,
        message: String(e?.message || ''),
        code: e?.code,
        severity: e?.severity,
        detail: e?.detail,
        hint: e?.hint,
        errno: e?.errno,
        syscall: e?.syscall,
    }

    // Captura stack (primeiras 5 linhas)
    if (typeof e?.stack === 'string') {
        result.stack = e.stack.split('\n').slice(0, 5).join('\n')
    }

    // Captura cause (erro encadeado)
    if (e?.cause) {
        const cause = e.cause as Record<string, unknown>
        result.cause = {
            name: cause?.name,
            message: String(cause?.message || ''),
            code: cause?.code,
            errno: cause?.errno,
            syscall: cause?.syscall,
        }
        if (typeof cause?.stack === 'string') {
            (result.cause as Record<string, unknown>).stack = cause.stack.split('\n').slice(0, 3).join('\n')
        }
    }

    // Captura todas as propriedades enumeráveis não capturadas
    const knownKeys = new Set(Object.keys(result))
    for (const key of Object.getOwnPropertyNames(e)) {
        if (!knownKeys.has(key) && key !== 'stack') {
            result[`extra_${key}`] = String(e[key]).substring(0, 200)
        }
    }

    return result
}

function extractHost(url: string): string {
    try { return new URL(url).hostname } catch { return 'parse_error' }
}
function extractPort(url: string): string {
    try { return new URL(url).port || '5432' } catch { return 'parse_error' }
}
function extractUser(url: string): string {
    try { return new URL(url).username } catch { return 'parse_error' }
}
function extractDatabase(url: string): string {
    try { return new URL(url).pathname.replace('/', '') } catch { return 'parse_error' }
}
