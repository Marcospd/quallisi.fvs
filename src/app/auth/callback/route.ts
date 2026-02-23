import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * Auth callback — troca code por sessão.
 * Usado pelo Supabase para recuperação de senha e confirmação de email.
 * Rota: GET /auth/callback?code=xxx&type=recovery
 */
export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get('code')
    const type = searchParams.get('type')

    if (code) {
        const supabase = await createClient()
        const { error } = await supabase.auth.exchangeCodeForSession(code)

        if (!error) {
            if (type === 'recovery') {
                return NextResponse.redirect(`${origin}/reset-password`)
            }
            // Para outros tipos (signup confirmation, etc), redireciona para login
            return NextResponse.redirect(`${origin}/login`)
        }
    }

    // Erro ou sem code — redireciona para login
    return NextResponse.redirect(`${origin}/login`)
}
