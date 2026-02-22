'use server'

import { eq, and, desc } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'
import { inspections, inspectionItems, projects, services, locations, users, criteria } from '@/lib/db/schema'
import { getAuthContext } from '@/features/auth/actions'
import { logger } from '@/lib/logger'
import { notifyInspectionCompleted } from '@/features/notifications/create-notification'

/**
 * Lista inspeções do tenant atual com dados de serviço, local e inspetor.
 */
export async function listInspections(projectId?: string) {
    const { tenant } = await getAuthContext()

    try {
        const baseQuery = db
            .select({
                inspection: inspections,
                service: services,
                location: locations,
                inspector: users,
            })
            .from(inspections)
            .innerJoin(services, eq(inspections.serviceId, services.id))
            .innerJoin(locations, eq(inspections.locationId, locations.id))
            .innerJoin(users, eq(inspections.inspectorId, users.id))
            .innerJoin(projects, eq(inspections.projectId, projects.id))
            .where(
                projectId
                    ? and(eq(projects.tenantId, tenant.id), eq(inspections.projectId, projectId))
                    : eq(projects.tenantId, tenant.id)
            )
            .orderBy(desc(inspections.createdAt))

        const result = await baseQuery
        return { data: result }
    } catch (err) {
        logger.error({ err, tenantId: tenant.id }, 'Erro ao listar inspeções')
        return { error: 'Erro ao carregar inspeções' }
    }
}

/**
 * Cria uma nova inspeção FVS.
 * Gera os inspection_items automaticamente a partir dos critérios do serviço.
 */
export async function createInspection(input: {
    projectId: string
    serviceId: string
    locationId: string
    referenceMonth: string
}) {
    const { user, tenant } = await getAuthContext()

    try {
        // Verificar que a obra pertence ao tenant
        const [project] = await db
            .select()
            .from(projects)
            .where(and(eq(projects.id, input.projectId), eq(projects.tenantId, tenant.id)))
            .limit(1)

        if (!project) return { error: 'Obra não encontrada' }

        // Buscar critérios do serviço
        const serviceCriteria = await db
            .select()
            .from(criteria)
            .where(eq(criteria.serviceId, input.serviceId))
            .orderBy(criteria.sortOrder)

        // Criar inspeção
        const [inspection] = await db
            .insert(inspections)
            .values({
                projectId: input.projectId,
                serviceId: input.serviceId,
                locationId: input.locationId,
                inspectorId: user.id,
                referenceMonth: input.referenceMonth,
                status: 'DRAFT',
            })
            .returning()

        // Gerar items a partir dos critérios
        if (serviceCriteria.length > 0) {
            await db.insert(inspectionItems).values(
                serviceCriteria.map((c) => ({
                    inspectionId: inspection.id,
                    criterionId: c.id,
                }))
            )
        }

        logger.info(
            { userId: user.id, inspectionId: inspection.id, action: 'inspection.created' },
            'Inspeção criada'
        )

        revalidatePath(`/${tenant.slug}/inspections`)
        return { data: inspection }
    } catch (err) {
        logger.error({ err }, 'Erro ao criar inspeção')
        return { error: 'Erro ao criar inspeção' }
    }
}

/**
 * Busca detalhes de uma inspeção com seus items e critérios.
 */
export async function getInspection(inspectionId: string) {
    const { tenant } = await getAuthContext()

    try {
        // Buscar inspeção com dados relacionados
        const [inspectionResult] = await db
            .select({
                inspection: inspections,
                service: services,
                location: locations,
                inspector: users,
            })
            .from(inspections)
            .innerJoin(services, eq(inspections.serviceId, services.id))
            .innerJoin(locations, eq(inspections.locationId, locations.id))
            .innerJoin(users, eq(inspections.inspectorId, users.id))
            .innerJoin(projects, eq(inspections.projectId, projects.id))
            .where(
                and(eq(inspections.id, inspectionId), eq(projects.tenantId, tenant.id))
            )
            .limit(1)

        if (!inspectionResult) return { error: 'Inspeção não encontrada' }

        // Buscar items com critérios
        const items = await db
            .select({
                item: inspectionItems,
                criterion: criteria,
            })
            .from(inspectionItems)
            .innerJoin(criteria, eq(inspectionItems.criterionId, criteria.id))
            .where(eq(inspectionItems.inspectionId, inspectionId))
            .orderBy(criteria.sortOrder)

        return {
            data: {
                ...inspectionResult,
                items,
            },
        }
    } catch (err) {
        logger.error({ err, inspectionId }, 'Erro ao buscar inspeção')
        return { error: 'Erro ao carregar inspeção' }
    }
}

/**
 * Submete avaliação de um item da inspeção (C, NC, NA).
 */
export async function evaluateItem(itemId: string, evaluation: 'C' | 'NC' | 'NA', notes?: string) {
    const { user, tenant } = await getAuthContext()

    try {
        const [updated] = await db
            .update(inspectionItems)
            .set({ evaluation, notes: notes || null })
            .where(eq(inspectionItems.id, itemId))
            .returning()

        if (!updated) return { error: 'Item não encontrado' }

        return { data: updated }
    } catch (err) {
        logger.error({ err, itemId }, 'Erro ao avaliar item')
        return { error: 'Erro ao registrar avaliação' }
    }
}

/**
 * Salva a URL da foto de um item da inspeção.
 */
export async function updateItemPhoto(itemId: string, photoUrl: string | null) {
    await getAuthContext()

    try {
        const [updated] = await db
            .update(inspectionItems)
            .set({ photoUrl })
            .where(eq(inspectionItems.id, itemId))
            .returning()

        if (!updated) return { error: 'Item não encontrado' }
        return { data: updated }
    } catch (err) {
        logger.error({ err, itemId }, 'Erro ao salvar foto')
        return { error: 'Erro ao salvar foto' }
    }
}

/**
 * Finaliza uma inspeção e define o resultado.
 * Calcula automaticamente: todos C → APPROVED, algum NC → REJECTED.
 */
export async function completeInspection(inspectionId: string) {
    const { user, tenant } = await getAuthContext()

    try {
        // Buscar todos os items desta inspeção
        const items = await db
            .select()
            .from(inspectionItems)
            .where(eq(inspectionItems.inspectionId, inspectionId))

        if (items.length === 0) return { error: 'Inspeção sem itens' }

        // Verificar se todos foram avaliados
        const unevaluated = items.filter((i) => !i.evaluation)
        if (unevaluated.length > 0) {
            return { error: `${unevaluated.length} critério(s) ainda não foram avaliados` }
        }

        // Calcular resultado
        const hasNC = items.some((i) => i.evaluation === 'NC')
        const result = hasNC ? 'REJECTED' : 'APPROVED'

        const [updated] = await db
            .update(inspections)
            .set({
                status: 'COMPLETED',
                result,
                completedAt: new Date(),
                updatedAt: new Date(),
            })
            .where(eq(inspections.id, inspectionId))
            .returning()

        if (!updated) return { error: 'Inspeção não encontrada' }

        logger.info(
            { userId: user.id, inspectionId, result, action: 'inspection.completed' },
            'Inspeção finalizada'
        )

        revalidatePath(`/${tenant.slug}/inspections`)

        // Notificar supervisores e admins (fire-and-forget)
        notifyInspectionCompleted(inspectionId, tenant.slug).catch(() => {})

        return { data: updated }
    } catch (err) {
        logger.error({ err, inspectionId }, 'Erro ao finalizar inspeção')
        return { error: 'Erro ao finalizar inspeção' }
    }
}
