import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { sql } from 'drizzle-orm'
import { createServerClient } from '@supabase/ssr'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

export async function GET() {
    const results: Record<string, unknown> = {
        status: 'testing',
        time: new Date().toISOString(),
        runtime: process.env.NEXT_RUNTIME || 'nodejs',
        region: process.env.VERCEL_REGION || 'local',
    }

    // 1. Check ENVs (sem expor valores sensíveis)
    const dbUrl = process.env.DATABASE_URL || ''
    results.envs = {
        hasDbUrl: !!dbUrl,
        dbUrlLength: dbUrl.length,
        dbUrlHost: dbUrl ? extractHost(dbUrl) : 'N/A',
        dbUrlPort: dbUrl ? extractPort(dbUrl) : 'N/A',
        hasSSLInUrl: dbUrl.includes('sslmode='),
        hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasSupabaseKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    }

    // 2. Check Postgres via Drizzle (com timeout)
    try {
        const queryStart = Date.now()
        const dbResult = await Promise.race([
            db.execute(sql`SELECT 1 as test, current_database() as db, version() as pg_version`),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Query timeout (10s)')), 10_000)),
        ])
        results.drizzle = {
            success: true,
            ms: Date.now() - queryStart,
            data: dbResult,
        }
    } catch (err) {
        const e = err as Record<string, unknown>
        results.drizzle = {
            success: false,
            message: e?.message,
            code: e?.code,
        }
    }

    // 3. Check Supabase Client Auth
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

    // 4. Final Result
    const drizzleOk = (results.drizzle as Record<string, unknown>)?.success === true
    const supabaseOk = (results.supabase as Record<string, unknown>)?.success === true
    results.status = drizzleOk && supabaseOk ? 'OK' : 'FAILING'

    return NextResponse.json(results, {
        status: results.status === 'OK' ? 200 : 500,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Cache-Control': 'no-store',
        },
    })
}

/** Extrai host da DATABASE_URL sem expor senha */
function extractHost(url: string): string {
    try {
        const parsed = new URL(url)
        return parsed.hostname
    } catch {
        return 'parse_error'
    }
}

/** Extrai porta da DATABASE_URL */
function extractPort(url: string): string {
    try {
        const parsed = new URL(url)
        return parsed.port || '5432'
    } catch {
        return 'parse_error'
    }
}
