'use server'

import { eq, and } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'
import { planningItems, projects, services, locations } from '@/lib/db/schema'
import { getAuthContext } from '@/features/auth/actions'
import { logger } from '@/lib/logger'
import { createPlanningItemSchema } from './schemas'

/**
 * Lista itens do planejamento por mês e obra.
 */
export async function listPlanningItems(projectId: string, referenceMonth: string) {
    const { tenant } = await getAuthContext()

    try {
        // Verificar que a obra pertence ao tenant
        const [project] = await db
            .select()
            .from(projects)
            .where(and(eq(projects.id, projectId), eq(projects.tenantId, tenant.id)))
            .limit(1)

        if (!project) return { error: 'Obra não encontrada' }

        const result = await db
            .select({
                planning: planningItems,
                service: services,
                location: locations,
            })
            .from(planningItems)
            .innerJoin(services, eq(planningItems.serviceId, services.id))
            .innerJoin(locations, eq(planningItems.locationId, locations.id))
            .where(
                and(
                    eq(planningItems.projectId, projectId),
                    eq(planningItems.referenceMonth, referenceMonth),
                )
            )
            .orderBy(services.name, locations.name)

        return { data: result }
    } catch (err) {
        logger.error({ err, projectId, referenceMonth }, 'Erro ao listar planejamento')
        return { error: 'Erro ao carregar planejamento' }
    }
}

/**
 * Adiciona item ao planejamento mensal.
 * Apenas admin e supervisor podem planejar.
 */
export async function createPlanningItem(input: unknown) {
    const { user, tenant } = await getAuthContext()

    if (user.role === 'inspetor') return { error: 'Sem permissão para planejar' }

    const parsed = createPlanningItemSchema.safeParse(input)
    if (!parsed.success) return { error: parsed.error.flatten() }

    try {
        // Verificar que obra pertence ao tenant
        const [project] = await db
            .select()
            .from(projects)
            .where(and(eq(projects.id, parsed.data.projectId), eq(projects.tenantId, tenant.id)))
            .limit(1)

        if (!project) return { error: 'Obra não encontrada' }

        // Verificar duplicata
        const [existing] = await db
            .select()
            .from(planningItems)
            .where(
                and(
                    eq(planningItems.projectId, parsed.data.projectId),
                    eq(planningItems.serviceId, parsed.data.serviceId),
                    eq(planningItems.locationId, parsed.data.locationId),
                    eq(planningItems.referenceMonth, parsed.data.referenceMonth),
                )
            )
            .limit(1)

        if (existing) return { error: 'Este item já está planejado para este mês' }

        const [item] = await db
            .insert(planningItems)
            .values({
                projectId: parsed.data.projectId,
                serviceId: parsed.data.serviceId,
                locationId: parsed.data.locationId,
                referenceMonth: parsed.data.referenceMonth,
            })
            .returning()

        logger.info(
            { userId: user.id, planningId: item.id, action: 'planning.created' },
            'Item de planejamento criado'
        )

        revalidatePath(`/${tenant.slug}/planning`)
        return { data: item }
    } catch (err) {
        logger.error({ err }, 'Erro ao criar planejamento')
        return { error: 'Erro ao criar planejamento' }
    }
}

/**
 * Remove um item do planejamento.
 * Apenas admin e supervisor podem remover.
 */
export async function deletePlanningItem(planningItemId: string) {
    const { user, tenant } = await getAuthContext()

    if (user.role === 'inspetor') return { error: 'Sem permissão' }

    try {
        const [item] = await db
            .select({ id: planningItems.id, projectId: planningItems.projectId, status: planningItems.status })
            .from(planningItems)
            .where(eq(planningItems.id, planningItemId))
            .limit(1)

        if (!item) return { error: 'Item não encontrado' }

        if (item.status === 'INSPECTED') return { error: 'Não é possível remover item já inspecionado' }

        // Verificar que a obra pertence ao tenant
        const [project] = await db
            .select()
            .from(projects)
            .where(and(eq(projects.id, item.projectId), eq(projects.tenantId, tenant.id)))
            .limit(1)

        if (!project) return { error: 'Obra não encontrada' }

        await db.delete(planningItems).where(eq(planningItems.id, planningItemId))

        logger.info(
            { userId: user.id, planningId: planningItemId, action: 'planning.deleted' },
            'Item de planejamento removido'
        )

        revalidatePath(`/${tenant.slug}/planning`)
        return { data: { deleted: true } }
    } catch (err) {
        logger.error({ err, planningItemId }, 'Erro ao remover planejamento')
        return { error: 'Erro ao remover planejamento' }
    }
}
