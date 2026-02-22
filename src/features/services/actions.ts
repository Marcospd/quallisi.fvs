'use server'

import { eq, and, asc, count } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'
import { services, criteria } from '@/lib/db/schema'
import { getAuthContext } from '@/features/auth/actions'
import { logger } from '@/lib/logger'
import { createServiceSchema, addCriterionSchema } from './schemas'

/**
 * Lista serviços do tenant com contagem de critérios.
 */
export async function listServices() {
    const { tenant } = await getAuthContext()

    try {
        const result = await db
            .select({
                id: services.id,
                tenantId: services.tenantId,
                name: services.name,
                description: services.description,
                active: services.active,
                createdAt: services.createdAt,
                updatedAt: services.updatedAt,
                criteriaCount: count(criteria.id),
            })
            .from(services)
            .leftJoin(criteria, eq(criteria.serviceId, services.id))
            .where(eq(services.tenantId, tenant.id))
            .groupBy(services.id)
            .orderBy(services.name)

        return { data: result }
    } catch (err) {
        logger.error({ err, tenantId: tenant.id }, 'Erro ao listar serviços')
        return { error: 'Erro ao carregar serviços' }
    }
}

/**
 * Lista critérios de um serviço (verificando que pertence ao tenant).
 */
export async function listCriteria(serviceId: string) {
    const { tenant } = await getAuthContext()

    try {
        const [service] = await db
            .select()
            .from(services)
            .where(and(eq(services.id, serviceId), eq(services.tenantId, tenant.id)))
            .limit(1)

        if (!service) return { error: 'Serviço não encontrado' }

        const result = await db
            .select()
            .from(criteria)
            .where(eq(criteria.serviceId, serviceId))
            .orderBy(asc(criteria.sortOrder))

        return { data: result, service }
    } catch (err) {
        logger.error({ err, serviceId }, 'Erro ao listar critérios')
        return { error: 'Erro ao carregar critérios' }
    }
}

/**
 * Cria um novo serviço no tenant.
 */
export async function createService(input: unknown) {
    const { user, tenant } = await getAuthContext()

    if (user.role !== 'admin') return { error: 'Sem permissão' }

    const parsed = createServiceSchema.safeParse(input)
    if (!parsed.success) return { error: parsed.error.flatten() }

    try {
        const [service] = await db
            .insert(services)
            .values({
                tenantId: tenant.id,
                name: parsed.data.name,
                description: parsed.data.description || null,
            })
            .returning()

        logger.info({ userId: user.id, serviceId: service.id, action: 'service.created' }, 'Serviço criado')
        revalidatePath(`/${tenant.slug}/services`)
        return { data: service }
    } catch (err) {
        logger.error({ err }, 'Erro ao criar serviço')
        return { error: 'Erro ao criar serviço' }
    }
}

/**
 * Alterna o status ativo/inativo de um serviço.
 */
export async function toggleServiceActive(serviceId: string) {
    const { user, tenant } = await getAuthContext()

    if (user.role !== 'admin') return { error: 'Sem permissão' }

    try {
        const [service] = await db
            .select()
            .from(services)
            .where(and(eq(services.id, serviceId), eq(services.tenantId, tenant.id)))
            .limit(1)

        if (!service) return { error: 'Serviço não encontrado' }

        const [updated] = await db
            .update(services)
            .set({ active: !service.active, updatedAt: new Date() })
            .where(eq(services.id, serviceId))
            .returning()

        logger.info({ userId: user.id, serviceId, active: updated.active, action: 'service.toggled' }, 'Status do serviço alterado')
        revalidatePath(`/${tenant.slug}/services`)
        return { data: updated }
    } catch (err) {
        logger.error({ err, serviceId }, 'Erro ao alterar status do serviço')
        return { error: 'Erro ao alterar status do serviço' }
    }
}

/**
 * Adiciona um critério a um serviço.
 */
export async function addCriterion(input: unknown) {
    const { user, tenant } = await getAuthContext()

    if (user.role !== 'admin') return { error: 'Sem permissão' }

    const parsed = addCriterionSchema.safeParse(input)
    if (!parsed.success) return { error: parsed.error.flatten() }

    try {
        const [service] = await db
            .select()
            .from(services)
            .where(and(eq(services.id, parsed.data.serviceId), eq(services.tenantId, tenant.id)))
            .limit(1)

        if (!service) return { error: 'Serviço não encontrado' }

        // Calcular próximo sortOrder automaticamente
        const existingCriteria = await db
            .select({ sortOrder: criteria.sortOrder })
            .from(criteria)
            .where(eq(criteria.serviceId, parsed.data.serviceId))
            .orderBy(asc(criteria.sortOrder))

        const nextOrder = parsed.data.sortOrder ?? (existingCriteria.length > 0
            ? Math.max(...existingCriteria.map(c => c.sortOrder)) + 1
            : 0)

        const [criterion] = await db
            .insert(criteria)
            .values({
                serviceId: parsed.data.serviceId,
                description: parsed.data.description,
                sortOrder: nextOrder,
            })
            .returning()

        logger.info({ userId: user.id, criterionId: criterion.id, action: 'criterion.created' }, 'Critério criado')
        revalidatePath(`/${tenant.slug}/services`)
        return { data: criterion }
    } catch (err) {
        logger.error({ err }, 'Erro ao criar critério')
        return { error: 'Erro ao criar critério' }
    }
}

/**
 * Remove um critério de um serviço.
 */
export async function deleteCriterion(criterionId: string) {
    const { user, tenant } = await getAuthContext()

    if (user.role !== 'admin') return { error: 'Sem permissão' }

    try {
        // Buscar critério e verificar que pertence ao tenant
        const [criterion] = await db
            .select({ id: criteria.id, serviceId: criteria.serviceId })
            .from(criteria)
            .where(eq(criteria.id, criterionId))
            .limit(1)

        if (!criterion) return { error: 'Critério não encontrado' }

        const [service] = await db
            .select()
            .from(services)
            .where(and(eq(services.id, criterion.serviceId), eq(services.tenantId, tenant.id)))
            .limit(1)

        if (!service) return { error: 'Serviço não encontrado' }

        await db.delete(criteria).where(eq(criteria.id, criterionId))

        logger.info({ userId: user.id, criterionId, action: 'criterion.deleted' }, 'Critério removido')
        revalidatePath(`/${tenant.slug}/services`)
        return { data: { deleted: true } }
    } catch (err) {
        logger.error({ err, criterionId }, 'Erro ao remover critério')
        return { error: 'Erro ao remover critério' }
    }
}
