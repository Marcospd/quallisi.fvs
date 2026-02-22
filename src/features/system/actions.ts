'use server'

import { sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { tenants, users } from '@/lib/db/schema'
import { getSystemAuthContext } from '@/features/auth/actions'
import { logger } from '@/lib/logger'

/**
 * Dados do dashboard global do Painel SISTEMA.
 * Sem filtro de tenantId — é a única query permitida sem isolamento.
 */
export async function getSystemDashboardData() {
    const ctx = await getSystemAuthContext()

    try {
        // Total de tenants por status
        const tenantStats = await db
            .select({
                status: tenants.status,
                count: sql<number>`count(*)::int`,
            })
            .from(tenants)
            .groupBy(tenants.status)

        // Total de usuários ativos
        const [userCount] = await db
            .select({
                count: sql<number>`count(*)::int`,
            })
            .from(users)

        const stats = {
            totalTenants: tenantStats.reduce((sum, s) => sum + s.count, 0),
            activeTenants: tenantStats.find(s => s.status === 'ACTIVE')?.count ?? 0,
            suspendedTenants: tenantStats.find(s => s.status === 'SUSPENDED')?.count ?? 0,
            cancelledTenants: tenantStats.find(s => s.status === 'CANCELLED')?.count ?? 0,
            totalUsers: userCount?.count ?? 0,
        }

        logger.info({ userId: ctx.user.id, action: 'system.dashboard.viewed' }, 'Dashboard sistema visualizado')

        return { data: stats }
    } catch (err) {
        logger.error({ err }, 'Erro ao carregar dashboard sistema')
        return { error: 'Erro ao carregar dados do dashboard' }
    }
}
