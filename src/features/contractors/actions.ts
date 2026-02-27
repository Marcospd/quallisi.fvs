'use server'

import { eq, and, asc, desc, count, ilike, or } from 'drizzle-orm'
import type { AnyColumn } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'
import { contractors } from '@/lib/db/schema'
import { getAuthContext } from '@/features/auth/actions'
import { logger } from '@/lib/logger'
import { createContractorSchema, updateContractorSchema } from './schemas'

/**
 * Lista empreiteiras do tenant com paginação e busca.
 */
export async function listContractors(options?: {
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
        name: contractors.name,
        cnpj: contractors.cnpj,
        status: contractors.active,
    }

    try {
        const filters = [eq(contractors.tenantId, tenant.id)]
        if (search) {
            filters.push(
                or(
                    ilike(contractors.name, search),
                    ilike(contractors.cnpj, search),
                )!
            )
        }

        const sortColumn = sortMap[options?.sort ?? '']
        const orderFn = options?.order === 'desc' ? desc : asc

        const [queryCount, result] = await Promise.all([
            db.select({ count: count() })
                .from(contractors)
                .where(and(...filters)),
            db.select()
                .from(contractors)
                .where(and(...filters))
                .orderBy(sortColumn ? orderFn(sortColumn) : asc(contractors.name))
                .limit(limit)
                .offset(offset),
        ])

        const totalItems = queryCount[0]?.count || 0

        return {
            data: result,
            meta: { totalItems, page, limit }
        }
    } catch (err) {
        logger.error({ err, tenantId: tenant.id }, 'Erro ao listar empreiteiras')
        return { error: 'Erro ao carregar empreiteiras' }
    }
}

/**
 * Lista todas as empreiteiras ativas (para selects/dropdowns).
 */
export async function listActiveContractors() {
    const { tenant } = await getAuthContext()

    try {
        const result = await db
            .select({ id: contractors.id, name: contractors.name })
            .from(contractors)
            .where(and(eq(contractors.tenantId, tenant.id), eq(contractors.active, true)))
            .orderBy(asc(contractors.name))

        return { data: result }
    } catch (err) {
        logger.error({ err, tenantId: tenant.id }, 'Erro ao listar empreiteiras ativas')
        return { error: 'Erro ao carregar empreiteiras' }
    }
}

/**
 * Cria uma nova empreiteira no tenant.
 */
export async function createContractor(input: unknown) {
    const { user, tenant } = await getAuthContext()

    if (user.role !== 'admin') return { error: 'Sem permissão' }

    const parsed = createContractorSchema.safeParse(input)
    if (!parsed.success) return { error: parsed.error.flatten() }

    try {
        const [contractor] = await db
            .insert(contractors)
            .values({
                tenantId: tenant.id,
                name: parsed.data.name,
                cnpj: parsed.data.cnpj || null,
                contactName: parsed.data.contactName || null,
                contactEmail: parsed.data.contactEmail || null,
                contactPhone: parsed.data.contactPhone || null,
                bankInfo: parsed.data.bankInfo || null,
                nfAddress: parsed.data.nfAddress || null,
                ceiMatricula: parsed.data.ceiMatricula || null,
            })
            .returning()

        logger.info({ userId: user.id, contractorId: contractor.id, action: 'contractor.created' }, 'Empreiteira criada')
        revalidatePath(`/${tenant.slug}/contractors`)
        return { data: contractor }
    } catch (err) {
        logger.error({ err }, 'Erro ao criar empreiteira')
        return { error: 'Erro ao criar empreiteira' }
    }
}

/**
 * Atualiza uma empreiteira do tenant.
 */
export async function updateContractor(contractorId: string, input: unknown) {
    const { user, tenant } = await getAuthContext()

    if (user.role !== 'admin') return { error: 'Sem permissão para editar empreiteiras' }

    const parsed = updateContractorSchema.safeParse(input)
    if (!parsed.success) return { error: parsed.error.flatten() }

    const updateData: Record<string, unknown> = { updatedAt: new Date() }
    if (parsed.data.name !== undefined) updateData.name = parsed.data.name
    if (parsed.data.cnpj !== undefined) updateData.cnpj = parsed.data.cnpj || null
    if (parsed.data.contactName !== undefined) updateData.contactName = parsed.data.contactName || null
    if (parsed.data.contactEmail !== undefined) updateData.contactEmail = parsed.data.contactEmail || null
    if (parsed.data.contactPhone !== undefined) updateData.contactPhone = parsed.data.contactPhone || null
    if (parsed.data.bankInfo !== undefined) updateData.bankInfo = parsed.data.bankInfo || null
    if (parsed.data.nfAddress !== undefined) updateData.nfAddress = parsed.data.nfAddress || null
    if (parsed.data.ceiMatricula !== undefined) updateData.ceiMatricula = parsed.data.ceiMatricula || null

    try {
        const [contractor] = await db
            .update(contractors)
            .set(updateData)
            .where(and(eq(contractors.id, contractorId), eq(contractors.tenantId, tenant.id)))
            .returning()

        if (!contractor) return { error: 'Empreiteira não encontrada' }

        logger.info({ userId: user.id, tenantId: tenant.id, contractorId, action: 'contractor.updated' }, 'Empreiteira atualizada')
        revalidatePath(`/${tenant.slug}/contractors`)
        return { data: contractor }
    } catch (err) {
        logger.error({ err, tenantId: tenant.id, contractorId }, 'Erro ao atualizar empreiteira')
        return { error: 'Erro ao atualizar empreiteira' }
    }
}

/**
 * Alterna o status ativo/inativo de uma empreiteira.
 */
export async function toggleContractorActive(contractorId: string) {
    const { user, tenant } = await getAuthContext()

    if (user.role !== 'admin') return { error: 'Sem permissão' }

    try {
        const [contractor] = await db
            .select()
            .from(contractors)
            .where(and(eq(contractors.id, contractorId), eq(contractors.tenantId, tenant.id)))
            .limit(1)

        if (!contractor) return { error: 'Empreiteira não encontrada' }

        const [updated] = await db
            .update(contractors)
            .set({ active: !contractor.active, updatedAt: new Date() })
            .where(and(eq(contractors.id, contractorId), eq(contractors.tenantId, tenant.id)))
            .returning()

        logger.info({ userId: user.id, contractorId, active: updated.active, action: 'contractor.toggled' }, 'Status da empreiteira alterado')
        revalidatePath(`/${tenant.slug}/contractors`)
        return { data: updated }
    } catch (err) {
        logger.error({ err, contractorId }, 'Erro ao alterar status da empreiteira')
        return { error: 'Erro ao alterar status da empreiteira' }
    }
}
