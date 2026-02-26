'use server'

import { eq, and, count, sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { inspections, inspectionItems, issues, projects, planningItems } from '@/lib/db/schema'
import { getAuthContext } from '@/features/auth/actions'
import { logger } from '@/lib/logger'

/**
 * Calcula KPIs do tenant para o dashboard.
 */
export async function getTenantStats() {
    const { tenant } = await getAuthContext()

    try {
        const currentMonth = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`

        // Todas as 8 queries em paralelo — de ~8 round-trips sequenciais para 1
        const [
            [inspectionsCount],
            [approvedCount],
            [rejectedCount],
            [pendingInspections],
            [openIssues],
            [resolvedIssues],
            [activeProjects],
            [plannedThisMonth],
        ] = await Promise.all([
            // Total de inspeções
            db.select({ total: count() })
                .from(inspections)
                .innerJoin(projects, eq(inspections.projectId, projects.id))
                .where(eq(projects.tenantId, tenant.id)),
            // Inspeções aprovadas
            db.select({ total: count() })
                .from(inspections)
                .innerJoin(projects, eq(inspections.projectId, projects.id))
                .where(and(eq(projects.tenantId, tenant.id), eq(inspections.result, 'APPROVED'))),
            // Inspeções com pendências
            db.select({ total: count() })
                .from(inspections)
                .innerJoin(projects, eq(inspections.projectId, projects.id))
                .where(and(
                    eq(projects.tenantId, tenant.id),
                    sql`${inspections.result} IN ('REJECTED', 'APPROVED_WITH_RESTRICTIONS')`
                )),
            // Inspeções em aberto
            db.select({ total: count() })
                .from(inspections)
                .innerJoin(projects, eq(inspections.projectId, projects.id))
                .where(and(
                    eq(projects.tenantId, tenant.id),
                    sql`${inspections.status} IN ('DRAFT', 'IN_PROGRESS')`
                )),
            // Pendências abertas
            db.select({ total: count() })
                .from(issues)
                .innerJoin(inspections, eq(issues.inspectionId, inspections.id))
                .innerJoin(projects, eq(inspections.projectId, projects.id))
                .where(and(eq(projects.tenantId, tenant.id), eq(issues.status, 'OPEN'))),
            // Pendências resolvidas
            db.select({ total: count() })
                .from(issues)
                .innerJoin(inspections, eq(issues.inspectionId, inspections.id))
                .innerJoin(projects, eq(inspections.projectId, projects.id))
                .where(and(eq(projects.tenantId, tenant.id), eq(issues.status, 'RESOLVED'))),
            // Obras ativas
            db.select({ total: count() })
                .from(projects)
                .where(and(eq(projects.tenantId, tenant.id), eq(projects.active, true))),
            // Planejados mês atual
            db.select({ total: count() })
                .from(planningItems)
                .innerJoin(projects, eq(planningItems.projectId, projects.id))
                .where(and(eq(projects.tenantId, tenant.id), eq(planningItems.referenceMonth, currentMonth))),
        ])

        // Taxa de conformidade
        const totalCompleted = (approvedCount?.total ?? 0) + (rejectedCount?.total ?? 0)
        const conformityRate = totalCompleted > 0
            ? Math.round(((approvedCount?.total ?? 0) / totalCompleted) * 100)
            : 0

        return {
            data: {
                totalInspections: inspectionsCount?.total ?? 0,
                approvedInspections: approvedCount?.total ?? 0,
                rejectedInspections: rejectedCount?.total ?? 0,
                pendingInspections: pendingInspections?.total ?? 0,
                openIssues: openIssues?.total ?? 0,
                resolvedIssues: resolvedIssues?.total ?? 0,
                activeProjects: activeProjects?.total ?? 0,
                plannedThisMonth: plannedThisMonth?.total ?? 0,
                conformityRate,
            },
        }
    } catch (err) {
        logger.error({ err, tenantId: tenant.id }, 'Erro ao calcular estatísticas')
        return { error: 'Erro ao carregar estatísticas' }
    }
}
