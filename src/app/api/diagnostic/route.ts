import { NextResponse } from 'next/server'
import { sql } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { createServerClient } from '@supabase/ssr'

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

    // 1. Check ENVs
    results.envs = {
        hasDbUrl: !!dbUrl,
        dbUrlLength: dbUrl.length,
        dbUrlHost: dbUrl ? extractHost(dbUrl) : 'N/A',
        dbUrlPort: dbUrl ? extractPort(dbUrl) : 'N/A',
        dbUrlUser: dbUrl ? extractUser(dbUrl) : 'N/A',
        dbUrlDatabase: dbUrl ? extractDatabase(dbUrl) : 'N/A',
        hasSSLInUrl: dbUrl.includes('sslmode='),
        hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasSupabaseKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    }

    // 2. Teste A — postgres.js com ssl: 'require'
    results.testA_ssl_require = await testConnection(dbUrl, {
        prepare: false,
        ssl: 'require',
        max: 1,
        connect_timeout: 10,
        idle_timeout: 5,
    })

    // 3. Teste B — postgres.js com ssl: rejectUnauthorized false
    results.testB_ssl_no_verify = await testConnection(dbUrl, {
        prepare: false,
        ssl: { rejectUnauthorized: false },
        max: 1,
        connect_timeout: 10,
        idle_timeout: 5,
    })

    // 4. Teste C — postgres.js sem SSL
    results.testC_no_ssl = await testConnection(dbUrl, {
        prepare: false,
        ssl: false,
        max: 1,
        connect_timeout: 10,
        idle_timeout: 5,
    })

    // 5. Check Supabase Client Auth
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
        const e = err as Record<string, unknown>
        results.supabase = {
            success: false,
            message: e?.message,
        }
    }

    // 6. Resultado final
    const anyDbOk =
        (results.testA_ssl_require as Record<string, unknown>)?.success === true ||
        (results.testB_ssl_no_verify as Record<string, unknown>)?.success === true ||
        (results.testC_no_ssl as Record<string, unknown>)?.success === true
    const supabaseOk = (results.supabase as Record<string, unknown>)?.success === true
    results.status = anyDbOk && supabaseOk ? 'OK' : 'FAILING'

    return NextResponse.json(results, {
        status: results.status === 'OK' ? 200 : 500,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Cache-Control': 'no-store',
        },
    })
}

/** Testa conexão com postgres.js diretamente (não usa instância compartilhada) */
async function testConnection(
    url: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    opts: Record<string, any>
): Promise<Record<string, unknown>> {
    let conn: postgres.Sql | null = null
    try {
        const start = Date.now()
        conn = postgres(url, opts)
        const testDb = drizzle(conn)
        const result = await Promise.race([
            testDb.execute(sql`SELECT 1 as test`),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Query timeout (10s)')), 10_000)),
        ])
        const ms = Date.now() - start
        await conn.end({ timeout: 3 })
        return { success: true, ms, data: result }
    } catch (err) {
        const e = err as Record<string, unknown>
        if (conn) {
            try { await conn.end({ timeout: 2 }) } catch { /* ignore */ }
        }
        return {
            success: false,
            message: String(e?.message || ''),
            code: e?.code,
            severity: e?.severity,
            detail: e?.detail,
            hint: e?.hint,
            errno: e?.errno,
            name: e?.name,
        }
    }
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
