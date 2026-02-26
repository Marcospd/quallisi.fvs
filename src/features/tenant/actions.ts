'use server'

import { eq, asc, desc } from 'drizzle-orm'
import type { AnyColumn } from 'drizzle-orm'
import { db } from '@/lib/db'
import { tenants } from '@/lib/db/schema'
import { logger } from '@/lib/logger'

/**
 * Busca tenant pelo slug.
 * Retorna null se não encontrar ou se o tenant não estiver ativo.
 */
export async function getTenantBySlug(slug: string) {
    try {
        const [tenant] = await db
            .select()
            .from(tenants)
            .where(eq(tenants.slug, slug))
            .limit(1)

        if (!tenant) return null
        if (tenant.status !== 'ACTIVE') return null

        return tenant
    } catch (err) {
        logger.error({ err, slug }, 'Erro ao buscar tenant por slug')
        return null
    }
}

/**
 * Lista todos os tenants ativos.
 * Uso exclusivo do Painel SISTEMA — sem filtro de tenantId.
 */
export async function listTenants(options?: {
    sort?: string
    order?: 'asc' | 'desc'
}) {
    const sortMap: Record<string, AnyColumn> = {
        name: tenants.name,
        slug: tenants.slug,
        status: tenants.status,
        date: tenants.createdAt,
    }

    try {
        const sortColumn = sortMap[options?.sort ?? '']
        const orderFn = options?.order === 'desc' ? desc : asc

        const result = await db
            .select()
            .from(tenants)
            .orderBy(sortColumn ? orderFn(sortColumn) : asc(tenants.name))

        return { data: result }
    } catch (err) {
        logger.error({ err }, 'Erro ao listar tenants')
        return { error: 'Erro ao carregar construtoras' }
    }
}
