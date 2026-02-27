'use server'

import { eq, and, asc, desc, count, ilike } from 'drizzle-orm'
import type { AnyColumn } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'
import {
    contracts,
    contractItems,
    projects,
    contractors,
} from '@/lib/db/schema'
import { getAuthContext } from '@/features/auth/actions'
import { logger } from '@/lib/logger'
import { createContractSchema, updateContractSchema } from './schemas'

/**
 * Lista contratos com paginação e filtros.
 */
export async function listContracts(options?: {
    q?: string
    page?: number
    limit?: number
    sort?: string
    order?: 'asc' | 'desc'
    projectId?: string
}) {
    const { tenant } = await getAuthContext()
    const page = options?.page && options.page > 0 ? options.page : 1
    const limit = options?.limit && options.limit > 0 ? options.limit : 10
    const offset = (page - 1) * limit
    const search = options?.q ? `%${options.q}%` : null

    const sortMap: Record<string, AnyColumn> = {
        number: contracts.contractNumber,
        project: projects.name,
        contractor: contractors.name,
        start: contracts.startDate,
    }

    try {
        const filters = [eq(contracts.tenantId, tenant.id)]
        if (search) {
            filters.push(ilike(contracts.contractNumber, search))
        }
        if (options?.projectId) {
            filters.push(eq(contracts.projectId, options.projectId))
        }

        const sortColumn = sortMap[options?.sort ?? '']
        const orderFn = options?.order === 'asc' ? asc : desc

        const [queryCount, result] = await Promise.all([
            db.select({ count: count() })
                .from(contracts)
                .innerJoin(projects, eq(projects.id, contracts.projectId))
                .innerJoin(contractors, eq(contractors.id, contracts.contractorId))
                .where(and(...filters)),
            db.select({
                    id: contracts.id,
                    contractNumber: contracts.contractNumber,
                    projectId: contracts.projectId,
                    projectName: projects.name,
                    contractorId: contracts.contractorId,
                    contractorName: contractors.name,
                    startDate: contracts.startDate,
                    endDate: contracts.endDate,
                    technicalRetentionPct: contracts.technicalRetentionPct,
                    active: contracts.active,
                    createdAt: contracts.createdAt,
                })
                .from(contracts)
                .innerJoin(projects, eq(projects.id, contracts.projectId))
                .innerJoin(contractors, eq(contractors.id, contracts.contractorId))
                .where(and(...filters))
                .orderBy(sortColumn ? orderFn(sortColumn) : desc(contracts.createdAt))
                .limit(limit)
                .offset(offset),
        ])

        const totalItems = queryCount[0]?.count || 0

        return {
            data: result,
            meta: { totalItems, page, limit },
        }
    } catch (err) {
        logger.error({ err, tenantId: tenant.id }, 'Erro ao listar contratos')
        return { error: 'Erro ao carregar contratos' }
    }
}

/**
 * Busca um contrato com todos os itens.
 */
export async function getContract(contractId: string) {
    const { tenant } = await getAuthContext()

    try {
        const [contract] = await db
            .select({
                id: contracts.id,
                tenantId: contracts.tenantId,
                projectId: contracts.projectId,
                projectName: projects.name,
                contractorId: contracts.contractorId,
                contractorName: contractors.name,
                contractNumber: contracts.contractNumber,
                startDate: contracts.startDate,
                endDate: contracts.endDate,
                technicalRetentionPct: contracts.technicalRetentionPct,
                notes: contracts.notes,
                active: contracts.active,
                createdAt: contracts.createdAt,
            })
            .from(contracts)
            .innerJoin(projects, eq(projects.id, contracts.projectId))
            .innerJoin(contractors, eq(contractors.id, contracts.contractorId))
            .where(and(eq(contracts.id, contractId), eq(contracts.tenantId, tenant.id)))
            .limit(1)

        if (!contract) return { error: 'Contrato não encontrado' }

        const items = await db
            .select()
            .from(contractItems)
            .where(eq(contractItems.contractId, contractId))
            .orderBy(asc(contractItems.sortOrder))

        return {
            data: {
                ...contract,
                items,
            },
        }
    } catch (err) {
        logger.error({ err, contractId }, 'Erro ao buscar contrato')
        return { error: 'Erro ao carregar contrato' }
    }
}

/**
 * Cria um novo contrato com itens.
 */
export async function createContract(input: unknown) {
    const { user, tenant } = await getAuthContext()

    if (user.role !== 'admin') return { error: 'Sem permissão' }

    const parsed = createContractSchema.safeParse(input)
    if (!parsed.success) return { error: parsed.error.flatten() }

    // Verificar que projeto e empreiteira pertencem ao tenant
    const [project] = await db
        .select({ id: projects.id })
        .from(projects)
        .where(and(eq(projects.id, parsed.data.projectId), eq(projects.tenantId, tenant.id)))
        .limit(1)

    if (!project) return { error: 'Obra não encontrada' }

    const [contractor] = await db
        .select({ id: contractors.id })
        .from(contractors)
        .where(and(eq(contractors.id, parsed.data.contractorId), eq(contractors.tenantId, tenant.id)))
        .limit(1)

    if (!contractor) return { error: 'Empreiteira não encontrada' }

    try {
        const result = await db.transaction(async (tx) => {
            const [contract] = await tx
                .insert(contracts)
                .values({
                    tenantId: tenant.id,
                    projectId: parsed.data.projectId,
                    contractorId: parsed.data.contractorId,
                    contractNumber: parsed.data.contractNumber,
                    startDate: parsed.data.startDate,
                    endDate: parsed.data.endDate || null,
                    technicalRetentionPct: parsed.data.technicalRetentionPct?.toString() ?? '5',
                    notes: parsed.data.notes || null,
                })
                .returning()

            if (parsed.data.items.length > 0) {
                await tx.insert(contractItems).values(
                    parsed.data.items.map((item, i) => ({
                        contractId: contract.id,
                        itemNumber: item.itemNumber,
                        serviceName: item.serviceName,
                        unit: item.unit,
                        unitPrice: item.unitPrice.toString(),
                        contractedQuantity: item.contractedQuantity.toString(),
                        sortOrder: item.sortOrder ?? i,
                    }))
                )
            }

            return contract
        })

        logger.info({ userId: user.id, contractId: result.id, action: 'contract.created' }, 'Contrato criado')
        revalidatePath(`/${tenant.slug}/contracts`)
        return { data: result }
    } catch (err) {
        logger.error({ err }, 'Erro ao criar contrato')
        return { error: 'Erro ao criar contrato' }
    }
}

/**
 * Atualiza um contrato e seus itens.
 */
export async function updateContract(contractId: string, input: unknown) {
    const { user, tenant } = await getAuthContext()

    if (user.role !== 'admin') return { error: 'Sem permissão' }

    const parsed = updateContractSchema.safeParse(input)
    if (!parsed.success) return { error: parsed.error.flatten() }

    try {
        const [existing] = await db
            .select({ id: contracts.id })
            .from(contracts)
            .where(and(eq(contracts.id, contractId), eq(contracts.tenantId, tenant.id)))
            .limit(1)

        if (!existing) return { error: 'Contrato não encontrado' }

        // Validar que novo projectId pertence ao tenant
        if (parsed.data.projectId !== undefined) {
            const [project] = await db
                .select({ id: projects.id })
                .from(projects)
                .where(and(eq(projects.id, parsed.data.projectId), eq(projects.tenantId, tenant.id)))
                .limit(1)
            if (!project) return { error: 'Obra não encontrada' }
        }

        // Validar que novo contractorId pertence ao tenant
        if (parsed.data.contractorId !== undefined) {
            const [contractor] = await db
                .select({ id: contractors.id })
                .from(contractors)
                .where(and(eq(contractors.id, parsed.data.contractorId), eq(contractors.tenantId, tenant.id)))
                .limit(1)
            if (!contractor) return { error: 'Empreiteira não encontrada' }
        }

        await db.transaction(async (tx) => {
            const updateData: Record<string, unknown> = { updatedAt: new Date() }
            if (parsed.data.projectId !== undefined) updateData.projectId = parsed.data.projectId
            if (parsed.data.contractorId !== undefined) updateData.contractorId = parsed.data.contractorId
            if (parsed.data.contractNumber !== undefined) updateData.contractNumber = parsed.data.contractNumber
            if (parsed.data.startDate !== undefined) updateData.startDate = parsed.data.startDate
            if (parsed.data.endDate !== undefined) updateData.endDate = parsed.data.endDate || null
            if (parsed.data.technicalRetentionPct !== undefined) updateData.technicalRetentionPct = parsed.data.technicalRetentionPct.toString()
            if (parsed.data.notes !== undefined) updateData.notes = parsed.data.notes || null

            await tx.update(contracts).set(updateData).where(eq(contracts.id, contractId))

            if (parsed.data.items !== undefined) {
                await tx.delete(contractItems).where(eq(contractItems.contractId, contractId))
                if (parsed.data.items.length > 0) {
                    await tx.insert(contractItems).values(
                        parsed.data.items.map((item, i) => ({
                            contractId,
                            itemNumber: item.itemNumber,
                            serviceName: item.serviceName,
                            unit: item.unit,
                            unitPrice: item.unitPrice.toString(),
                            contractedQuantity: item.contractedQuantity.toString(),
                            sortOrder: item.sortOrder ?? i,
                        }))
                    )
                }
            }
        })

        logger.info({ userId: user.id, contractId, action: 'contract.updated' }, 'Contrato atualizado')
        revalidatePath(`/${tenant.slug}/contracts`)
        return { data: { id: contractId } }
    } catch (err) {
        logger.error({ err, contractId }, 'Erro ao atualizar contrato')
        return { error: 'Erro ao atualizar contrato' }
    }
}

/**
 * Ativa/desativa um contrato.
 */
export async function toggleContractActive(contractId: string) {
    const { user, tenant } = await getAuthContext()

    if (user.role !== 'admin') return { error: 'Sem permissão' }

    try {
        const [contract] = await db
            .select({ id: contracts.id, active: contracts.active })
            .from(contracts)
            .where(and(eq(contracts.id, contractId), eq(contracts.tenantId, tenant.id)))
            .limit(1)

        if (!contract) return { error: 'Contrato não encontrado' }

        await db.update(contracts)
            .set({ active: !contract.active, updatedAt: new Date() })
            .where(eq(contracts.id, contractId))

        logger.info({ userId: user.id, contractId, action: 'contract.toggled' }, 'Contrato alterado')
        revalidatePath(`/${tenant.slug}/contracts`)
        return { data: { active: !contract.active } }
    } catch (err) {
        logger.error({ err, contractId }, 'Erro ao alterar contrato')
        return { error: 'Erro ao alterar status do contrato' }
    }
}

/**
 * Lista itens ativos de um contrato (usado pelo Boletim de Medição).
 */
export async function listContractItemsForBulletin(contractId: string) {
    const { tenant } = await getAuthContext()

    try {
        const [contract] = await db
            .select({ id: contracts.id })
            .from(contracts)
            .where(and(eq(contracts.id, contractId), eq(contracts.tenantId, tenant.id)))
            .limit(1)

        if (!contract) return { error: 'Contrato não encontrado' }

        const items = await db
            .select()
            .from(contractItems)
            .where(and(eq(contractItems.contractId, contractId), eq(contractItems.active, true)))
            .orderBy(asc(contractItems.sortOrder))

        return { data: items }
    } catch (err) {
        logger.error({ err, contractId }, 'Erro ao listar itens do contrato')
        return { error: 'Erro ao carregar itens' }
    }
}
