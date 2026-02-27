import { NextResponse } from 'next/server'
import { getSystemAuthContext } from '@/features/auth/actions'

export const dynamic = 'force-dynamic'

/**
 * Endpoint de diagnóstico protegido — somente system users autenticados.
 * Retorna apenas status de conectividade sem detalhes de infraestrutura.
 */
export async function GET() {
    try {
        await getSystemAuthContext()
    } catch {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    return NextResponse.json({
        status: 'OK',
        time: new Date().toISOString(),
    }, {
        headers: { 'Cache-Control': 'no-store' },
    })
}
