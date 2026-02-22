'use server'

import { redirect } from 'next/navigation'
import { getAuthContext } from '@/features/auth/actions'
import type { TenantRole } from '@/features/auth/types'

/**
 * Verificação de permissão por role em server actions.
 * Retorna o contexto auth se o role for autorizado,
 * caso contrário retorna erro.
 *
 * Uso em server actions:
 *   const ctx = await requireRole(['admin', 'supervisor'])
 *   if ('error' in ctx) return ctx
 *   // ctx.user e ctx.tenant disponíveis
 */
export async function requireRole(allowed: TenantRole[]) {
    const ctx = await getAuthContext()

    if (!allowed.includes(ctx.user.role as TenantRole)) {
        return { error: 'Sem permissão para realizar esta ação' }
    }

    return ctx
}

/**
 * Verifica se o usuário tem role de admin.
 * Redireciona para o dashboard se não for admin.
 * Uso em Server Components de admin.
 */
export async function requireAdmin() {
    const ctx = await getAuthContext()

    if (ctx.user.role !== 'admin') {
        redirect(`/${ctx.tenant.slug}`)
    }

    return ctx
}
