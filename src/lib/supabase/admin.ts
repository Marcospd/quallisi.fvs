import { createClient } from '@supabase/supabase-js'

/**
 * Cliente Supabase com service_role para operações administrativas.
 * Usar SOMENTE em server actions para criar/gerenciar usuários auth.
 * NUNCA expor para o client-side.
 */
export function createAdminClient() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!url || !key) {
        throw new Error('SUPABASE_SERVICE_ROLE_KEY não configurada')
    }

    return createClient(url, key, {
        auth: { autoRefreshToken: false, persistSession: false },
    })
}
