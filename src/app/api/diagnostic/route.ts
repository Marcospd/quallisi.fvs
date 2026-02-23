import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { sql } from 'drizzle-orm'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

export async function GET() {
    const results: any = { status: 'testing', time: new Date().toISOString() }

    // 1. Check ENVs
    results.envs = {
        hasDbUrl: !!process.env.DATABASE_URL,
        dbUrlLength: process.env.DATABASE_URL?.length || 0,
        hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasSupabaseKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    }

    // 2. Check Postgres directly (Drizzle)
    try {
        const queryStart = Date.now()
        const dbResult = await db.execute(sql`SELECT 1 as test`)
        results.drizzle = {
            success: true,
            ms: Date.now() - queryStart,
            data: dbResult,
        }
    } catch (err) {
        const e = err as any
        results.drizzle = {
            success: false,
            message: e?.message,
            code: e?.code,
            stack: e?.stack,
        }
    }

    // 3. Check Supabase Client Auth
    try {
        const authStart = Date.now()
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            { cookies: { getAll: () => [], setAll: () => { } } }
        )
        const { data, error } = await supabase.auth.getSession()

        results.supabase = {
            success: !error,
            ms: Date.now() - authStart,
            error: error?.message,
            hasSession: !!data?.session
        }
    } catch (err) {
        const e = err as any
        results.supabase = {
            success: false,
            message: e?.message
        }
    }

    // 4. Final Result
    results.status = (results.drizzle.success && results.supabase.success) ? 'OK' : 'FAILING'

    return NextResponse.json(results, {
        status: results.status === 'OK' ? 200 : 500,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Cache-Control': 'no-store'
        }
    })
}
