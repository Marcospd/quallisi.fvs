'use server'

import { eq, and, asc, desc, count, ilike, sql } from 'drizzle-orm'
import type { AnyColumn } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'
import { services, criteria } from '@/lib/db/schema'
import { getAuthContext } from '@/features/auth/actions'
import { logger } from '@/lib/logger'
import { createServiceSchema, updateServiceSchema, addCriterionSchema } from './schemas'

/**
 * Lista serviços do tenant com contagem de critérios.
 */
export async function listServices(options?: {
    q?: string
    page?: number
    limit?: number
    sort?: string
    order?: 'asc' | 'desc'
}) {
    const { tenant } = await getAuthContext()
    const page = options?.page && options.page > 0 ? options.page : 1
    const limit = options?.limit && options.limit > 0 ? options.limit : 10
    const offset = (page - 1) * limit
    const search = options?.q ? `%${options.q}%` : null

    const sortMap: Record<string, AnyColumn> = {
        name: services.name,
        description: services.description,
        status: services.active,
    }

    try {
        const filters = [eq(services.tenantId, tenant.id)]
        if (search) {
            filters.push(ilike(services.name, search))
        }

        const sortColumn = sortMap[options?.sort ?? '']
        const orderFn = options?.order === 'desc' ? desc : asc

        // Count + data em paralelo
        const [queryCount, result] = await Promise.all([
            db.select({ count: count() })
                .from(services)
                .where(and(...filters)),
            db.select({
                    id: services.id,
                    tenantId: services.tenantId,
                    name: services.name,
                    unit: services.unit,
                    description: services.description,
                    active: services.active,
                    createdAt: services.createdAt,
                    updatedAt: services.updatedAt,
                    criteriaCount: count(criteria.id),
                })
                .from(services)
                .leftJoin(criteria, eq(criteria.serviceId, services.id))
                .where(and(...filters))
                .groupBy(services.id)
                .orderBy(sortColumn ? orderFn(sortColumn) : asc(services.name))
                .limit(limit)
                .offset(offset),
        ])

        const totalItems = queryCount[0]?.count || 0

        return {
            data: result,
            meta: { totalItems, page, limit }
        }
    } catch (err) {
        logger.error({ err, tenantId: tenant.id }, 'Erro ao listar serviços')
        return { error: 'Erro ao carregar serviços' }
    }
}

/**
 * Busca um único serviço com seus critérios.
 */
export async function getService(serviceId: string) {
    const { tenant } = await getAuthContext()

    try {
        const [service] = await db
            .select()
            .from(services)
            .where(and(eq(services.id, serviceId), eq(services.tenantId, tenant.id)))
            .limit(1)

        if (!service) return { error: 'Serviço não encontrado' }

        const criteriaList = await db
            .select()
            .from(criteria)
            .where(eq(criteria.serviceId, serviceId))
            .orderBy(asc(criteria.sortOrder))

        return { data: { ...service, criteria: criteriaList } }
    } catch (err) {
        logger.error({ err, serviceId }, 'Erro ao buscar serviço')
        return { error: 'Erro ao carregar serviço' }
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
                unit: parsed.data.unit || null,
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
 * Atualiza um serviço no tenant.
 */
export async function updateService(serviceId: string, input: unknown) {
    const { user, tenant } = await getAuthContext()

    if (user.role !== 'admin') return { error: 'Sem permissão para editar serviços' }

    const parsed = updateServiceSchema.safeParse(input)
    if (!parsed.success) return { error: parsed.error.flatten() }

    const updateData: Record<string, any> = { updatedAt: new Date() }
    if (parsed.data.name !== undefined) updateData.name = parsed.data.name
    if (parsed.data.unit !== undefined) updateData.unit = parsed.data.unit || null
    if (parsed.data.description !== undefined) updateData.description = parsed.data.description

    try {
        const [service] = await db
            .update(services)
            .set(updateData)
            .where(and(eq(services.id, serviceId), eq(services.tenantId, tenant.id)))
            .returning()

        if (!service) return { error: 'Serviço não encontrado' }

        logger.info({ userId: user.id, tenantId: tenant.id, serviceId, action: 'service.updated' }, 'Serviço atualizado')
        revalidatePath(`/${tenant.slug}/services`)
        return { data: service }
    } catch (err) {
        logger.error({ err, tenantId: tenant.id, serviceId }, 'Erro ao atualizar serviço')
        return { error: 'Erro ao atualizar serviço' }
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
