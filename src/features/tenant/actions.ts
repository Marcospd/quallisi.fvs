'use server'

import { eq } from 'drizzle-orm'
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
export async function listTenants() {
    try {
        const result = await db
            .select()
            .from(tenants)
            .orderBy(tenants.name)

        return { data: result }
    } catch (err) {
        logger.error({ err }, 'Erro ao listar tenants')
        return { error: 'Erro ao carregar construtoras' }
    }
}
