import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

/**
 * Cliente Supabase para uso no lado do servidor (Server Components, Server Actions, Route Handlers).
 * Gerencia cookies automaticamente para manter a sessão do usuário.
 */
export async function createClient() {
    const cookieStore = await cookies()

    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll()
                },
                setAll(cookiesToSet) {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            cookieStore.set(name, value, options)
                        )
                    } catch {
                        // Pode ser chamado de Server Component — cookies são read-only nesse contexto.
                        // O middleware vai atualizar os cookies na próxima request.
                    }
                },
            },
        }
    )
}
