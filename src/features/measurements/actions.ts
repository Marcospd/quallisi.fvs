'use server'

import { eq, and, asc, desc, count, lt, sql } from 'drizzle-orm'
import type { AnyColumn } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'
import {
    measurementBulletins,
    measurementItems,
    measurementAdditives,
    measurementApprovals,
    contracts,
    contractItems,
    projects,
    contractors,
} from '@/lib/db/schema'
import { getAuthContext } from '@/features/auth/actions'
import { logger } from '@/lib/logger'
import { createBulletinSchema, updateBulletinSchema, approvalSchema } from './schemas'

/**
 * Lista boletins de medição com paginação.
 */
export async function listBulletins(options?: {
    q?: string
    page?: number
    limit?: number
    sort?: string
    order?: 'asc' | 'desc'
    contractId?: string
    status?: string
}) {
    const { tenant } = await getAuthContext()
    const page = options?.page && options.page > 0 ? options.page : 1
    const limit = options?.limit && options.limit > 0 ? options.limit : 10
    const offset = (page - 1) * limit

    const sortMap: Record<string, AnyColumn> = {
        bm: measurementBulletins.bmNumber,
        period: measurementBulletins.periodStart,
        status: measurementBulletins.status,
    }

    try {
        const filters = [eq(contracts.tenantId, tenant.id)]
        if (options?.contractId) {
            filters.push(eq(measurementBulletins.contractId, options.contractId))
        }
        if (options?.status) {
            filters.push(eq(measurementBulletins.status, options.status))
        }

        const sortColumn = sortMap[options?.sort ?? '']
        const orderFn = options?.order === 'asc' ? asc : desc

        const [queryCount, result] = await Promise.all([
            db.select({ count: count() })
                .from(measurementBulletins)
                .innerJoin(contracts, eq(contracts.id, measurementBulletins.contractId))
                .where(and(...filters)),
            db.select({
                    id: measurementBulletins.id,
                    contractId: measurementBulletins.contractId,
                    contractNumber: contracts.contractNumber,
                    contractorName: contractors.name,
                    projectName: projects.name,
                    bmNumber: measurementBulletins.bmNumber,
                    periodStart: measurementBulletins.periodStart,
                    periodEnd: measurementBulletins.periodEnd,
                    dueDate: measurementBulletins.dueDate,
                    status: measurementBulletins.status,
                    createdAt: measurementBulletins.createdAt,
                })
                .from(measurementBulletins)
                .innerJoin(contracts, eq(contracts.id, measurementBulletins.contractId))
                .innerJoin(contractors, eq(contractors.id, contracts.contractorId))
                .innerJoin(projects, eq(projects.id, contracts.projectId))
                .where(and(...filters))
                .orderBy(sortColumn ? orderFn(sortColumn) : desc(measurementBulletins.createdAt))
                .limit(limit)
                .offset(offset),
        ])

        const totalItems = queryCount[0]?.count || 0

        return {
            data: result,
            meta: { totalItems, page, limit },
        }
    } catch (err) {
        logger.error({ err, tenantId: tenant.id }, 'Erro ao listar boletins')
        return { error: 'Erro ao carregar boletins de medição' }
    }
}

/**
 * Busca um boletim com itens, aditivos, aprovações e acumulados.
 */
export async function getBulletin(bulletinId: string) {
    const { tenant } = await getAuthContext()

    try {
        const [bulletin] = await db
            .select({
                id: measurementBulletins.id,
                contractId: measurementBulletins.contractId,
                contractNumber: contracts.contractNumber,
                contractorName: contractors.name,
                projectName: projects.name,
                technicalRetentionPct: contracts.technicalRetentionPct,
                bmNumber: measurementBulletins.bmNumber,
                sheetNumber: measurementBulletins.sheetNumber,
                periodStart: measurementBulletins.periodStart,
                periodEnd: measurementBulletins.periodEnd,
                dueDate: measurementBulletins.dueDate,
                discountValue: measurementBulletins.discountValue,
                observations: measurementBulletins.observations,
                status: measurementBulletins.status,
                createdBy: measurementBulletins.createdBy,
                createdAt: measurementBulletins.createdAt,
            })
            .from(measurementBulletins)
            .innerJoin(contracts, eq(contracts.id, measurementBulletins.contractId))
            .innerJoin(contractors, eq(contractors.id, contracts.contractorId))
            .innerJoin(projects, eq(projects.id, contracts.projectId))
            .where(and(eq(measurementBulletins.id, bulletinId), eq(contracts.tenantId, tenant.id)))
            .limit(1)

        if (!bulletin) return { error: 'Boletim não encontrado' }

        // Buscar itens com dados do contrato, aditivos, aprovações e acumulados em paralelo
        const [items, additives, approvals, accumulated] = await Promise.all([
            db.select({
                    id: measurementItems.id,
                    contractItemId: measurementItems.contractItemId,
                    quantityThisPeriod: measurementItems.quantityThisPeriod,
                    itemNumber: contractItems.itemNumber,
                    serviceName: contractItems.serviceName,
                    unit: contractItems.unit,
                    unitPrice: contractItems.unitPrice,
                    contractedQuantity: contractItems.contractedQuantity,
                })
                .from(measurementItems)
                .innerJoin(contractItems, eq(contractItems.id, measurementItems.contractItemId))
                .where(eq(measurementItems.bulletinId, bulletinId))
                .orderBy(asc(contractItems.sortOrder)),
            db.select()
                .from(measurementAdditives)
                .where(eq(measurementAdditives.bulletinId, bulletinId))
                .orderBy(asc(measurementAdditives.sortOrder)),
            db.select()
                .from(measurementApprovals)
                .where(eq(measurementApprovals.bulletinId, bulletinId))
                .orderBy(asc(measurementApprovals.createdAt)),
            getAccumulatedQuantities(bulletin.contractId, bulletin.bmNumber),
        ])

        return {
            data: {
                ...bulletin,
                items,
                additives,
                approvals,
                accumulated: accumulated.data ?? {},
            },
        }
    } catch (err) {
        logger.error({ err, bulletinId }, 'Erro ao buscar boletim')
        return { error: 'Erro ao carregar boletim de medição' }
    }
}

/**
 * Calcula as quantidades acumuladas de BMs anteriores por item de contrato.
 * Retorna um mapa: { contractItemId: totalAccumulated }
 * Usada pelo bulletin-form para calcular acumulados.
 */
export async function getAccumulatedQuantities(contractId: string, beforeBmNumber: number) {
    const { tenant } = await getAuthContext()

    try {
        // Verificar que o contrato pertence ao tenant
        const [contract] = await db
            .select({ id: contracts.id })
            .from(contracts)
            .where(and(eq(contracts.id, contractId), eq(contracts.tenantId, tenant.id)))
            .limit(1)

        if (!contract) return { data: {} }

        const result = await db
            .select({
                contractItemId: measurementItems.contractItemId,
                totalAccumulated: sql<string>`COALESCE(SUM(${measurementItems.quantityThisPeriod}), 0)`,
            })
            .from(measurementItems)
            .innerJoin(measurementBulletins, eq(measurementBulletins.id, measurementItems.bulletinId))
            .where(
                and(
                    eq(measurementBulletins.contractId, contractId),
                    lt(measurementBulletins.bmNumber, beforeBmNumber),
                )
            )
            .groupBy(measurementItems.contractItemId)

        const map: Record<string, string> = {}
        for (const row of result) {
            map[row.contractItemId] = row.totalAccumulated
        }

        return { data: map }
    } catch (err) {
        logger.error({ err, contractId }, 'Erro ao calcular acumulados')
        return { data: {} }
    }
}

/**
 * Cria um novo boletim de medição.
 */
export async function createBulletin(input: unknown) {
    const { user, tenant } = await getAuthContext()

    if (user.role === 'inspetor') return { error: 'Sem permissão' }

    const parsed = createBulletinSchema.safeParse(input)
    if (!parsed.success) return { error: parsed.error.flatten() }

    // Verificar que o contrato pertence ao tenant
    const [contract] = await db
        .select({ id: contracts.id })
        .from(contracts)
        .where(and(eq(contracts.id, parsed.data.contractId), eq(contracts.tenantId, tenant.id)))
        .limit(1)

    if (!contract) return { error: 'Contrato não encontrado' }

    try {
        const result = await db.transaction(async (tx) => {
            const [bulletin] = await tx
                .insert(measurementBulletins)
                .values({
                    contractId: parsed.data.contractId,
                    bmNumber: parsed.data.bmNumber,
                    sheetNumber: parsed.data.sheetNumber ?? 1,
                    periodStart: parsed.data.periodStart,
                    periodEnd: parsed.data.periodEnd,
                    dueDate: parsed.data.dueDate || null,
                    discountValue: parsed.data.discountValue.toString(),
                    observations: parsed.data.observations || null,
                    createdBy: user.id,
                })
                .returning()

            // Inserir itens de medição
            if (parsed.data.items.length > 0) {
                await tx.insert(measurementItems).values(
                    parsed.data.items.map((item) => ({
                        bulletinId: bulletin.id,
                        contractItemId: item.contractItemId,
                        quantityThisPeriod: item.quantityThisPeriod.toString(),
                    }))
                )
            }

            // Inserir aditivos
            if (parsed.data.additives?.length) {
                await tx.insert(measurementAdditives).values(
                    parsed.data.additives.map((add, i) => ({
                        bulletinId: bulletin.id,
                        itemNumber: add.itemNumber,
                        serviceName: add.serviceName,
                        unit: add.unit,
                        unitPrice: add.unitPrice.toString(),
                        contractedQuantity: add.contractedQuantity.toString(),
                        quantityThisPeriod: add.quantityThisPeriod.toString(),
                        sortOrder: add.sortOrder ?? i,
                    }))
                )
            }

            return bulletin
        })

        logger.info({ userId: user.id, bulletinId: result.id, action: 'bulletin.created' }, 'Boletim criado')
        revalidatePath(`/${tenant.slug}/measurements`)
        return { data: result }
    } catch (err) {
        logger.error({ err }, 'Erro ao criar boletim')
        return { error: 'Erro ao criar boletim de medição' }
    }
}

/**
 * Atualiza um boletim (apenas DRAFT).
 */
export async function updateBulletin(bulletinId: string, input: unknown) {
    const { user, tenant } = await getAuthContext()

    if (user.role === 'inspetor') return { error: 'Sem permissão' }

    const parsed = updateBulletinSchema.safeParse(input)
    if (!parsed.success) return { error: parsed.error.flatten() }

    try {
        const [existing] = await db
            .select({ id: measurementBulletins.id, status: measurementBulletins.status })
            .from(measurementBulletins)
            .innerJoin(contracts, eq(contracts.id, measurementBulletins.contractId))
            .where(and(eq(measurementBulletins.id, bulletinId), eq(contracts.tenantId, tenant.id)))
            .limit(1)

        if (!existing) return { error: 'Boletim não encontrado' }
        if (existing.status !== 'DRAFT' && existing.status !== 'REJECTED') {
            return { error: 'Apenas boletins em rascunho ou rejeitados podem ser editados' }
        }

        await db.transaction(async (tx) => {
            const updateData: Record<string, unknown> = { updatedAt: new Date() }
            if (parsed.data.bmNumber !== undefined) updateData.bmNumber = parsed.data.bmNumber
            if (parsed.data.sheetNumber !== undefined) updateData.sheetNumber = parsed.data.sheetNumber
            if (parsed.data.periodStart !== undefined) updateData.periodStart = parsed.data.periodStart
            if (parsed.data.periodEnd !== undefined) updateData.periodEnd = parsed.data.periodEnd
            if (parsed.data.dueDate !== undefined) updateData.dueDate = parsed.data.dueDate || null
            if (parsed.data.discountValue !== undefined) updateData.discountValue = parsed.data.discountValue.toString()
            if (parsed.data.observations !== undefined) updateData.observations = parsed.data.observations || null
            if (existing.status === 'REJECTED') updateData.status = 'DRAFT'

            await tx.update(measurementBulletins).set(updateData).where(eq(measurementBulletins.id, bulletinId))

            if (parsed.data.items !== undefined) {
                await tx.delete(measurementItems).where(eq(measurementItems.bulletinId, bulletinId))
                if (parsed.data.items.length > 0) {
                    await tx.insert(measurementItems).values(
                        parsed.data.items.map((item) => ({
                            bulletinId,
                            contractItemId: item.contractItemId,
                            quantityThisPeriod: item.quantityThisPeriod.toString(),
                        }))
                    )
                }
            }

            if (parsed.data.additives !== undefined) {
                await tx.delete(measurementAdditives).where(eq(measurementAdditives.bulletinId, bulletinId))
                if (parsed.data.additives.length > 0) {
                    await tx.insert(measurementAdditives).values(
                        parsed.data.additives.map((add, i) => ({
                            bulletinId,
                            itemNumber: add.itemNumber,
                            serviceName: add.serviceName,
                            unit: add.unit,
                            unitPrice: add.unitPrice.toString(),
                            contractedQuantity: add.contractedQuantity.toString(),
                            quantityThisPeriod: add.quantityThisPeriod.toString(),
                            sortOrder: add.sortOrder ?? i,
                        }))
                    )
                }
            }
        })

        logger.info({ userId: user.id, bulletinId, action: 'bulletin.updated' }, 'Boletim atualizado')
        revalidatePath(`/${tenant.slug}/measurements`)
        return { data: { id: bulletinId } }
    } catch (err) {
        logger.error({ err, bulletinId }, 'Erro ao atualizar boletim')
        return { error: 'Erro ao atualizar boletim' }
    }
}

/**
 * Submete o boletim (DRAFT → SUBMITTED).
 */
export async function submitBulletin(bulletinId: string) {
    const { user, tenant } = await getAuthContext()

    try {
        const [bulletin] = await db
            .select({ id: measurementBulletins.id, status: measurementBulletins.status })
            .from(measurementBulletins)
            .innerJoin(contracts, eq(contracts.id, measurementBulletins.contractId))
            .where(and(eq(measurementBulletins.id, bulletinId), eq(contracts.tenantId, tenant.id)))
            .limit(1)

        if (!bulletin) return { error: 'Boletim não encontrado' }
        if (bulletin.status !== 'DRAFT') return { error: 'Boletim já foi submetido' }

        await db.update(measurementBulletins)
            .set({ status: 'SUBMITTED', updatedAt: new Date() })
            .where(eq(measurementBulletins.id, bulletinId))

        logger.info({ userId: user.id, bulletinId, action: 'bulletin.submitted' }, 'Boletim submetido')
        revalidatePath(`/${tenant.slug}/measurements`)
        return { data: { id: bulletinId } }
    } catch (err) {
        logger.error({ err, bulletinId }, 'Erro ao submeter boletim')
        return { error: 'Erro ao submeter boletim' }
    }
}

/**
 * Aprova ou rejeita o boletim em uma etapa.
 */
export async function approveBulletin(bulletinId: string, input: unknown) {
    const { user, tenant } = await getAuthContext()

    const parsed = approvalSchema.safeParse(input)
    if (!parsed.success) return { error: parsed.error.flatten() }

    try {
        const [bulletin] = await db
            .select({ id: measurementBulletins.id, status: measurementBulletins.status })
            .from(measurementBulletins)
            .innerJoin(contracts, eq(contracts.id, measurementBulletins.contractId))
            .where(and(eq(measurementBulletins.id, bulletinId), eq(contracts.tenantId, tenant.id)))
            .limit(1)

        if (!bulletin) return { error: 'Boletim não encontrado' }

        // Validar transição de status
        const validTransitions: Record<string, Record<string, string>> = {
            SUBMITTED: { PLANNING: parsed.data.action === 'APPROVED' ? 'PLANNING_APPROVED' : 'REJECTED' },
            PLANNING_APPROVED: { MANAGEMENT: parsed.data.action === 'APPROVED' ? 'MANAGEMENT_APPROVED' : 'REJECTED' },
            MANAGEMENT_APPROVED: { CONTRACTOR: parsed.data.action === 'APPROVED' ? 'CONTRACTOR_AGREED' : 'REJECTED' },
        }

        const nextStatus = validTransitions[bulletin.status]?.[parsed.data.stage]
        if (!nextStatus) {
            return { error: 'Transição de status inválida' }
        }

        // Transaction para garantir atomicidade entre approval + status update
        await db.transaction(async (tx) => {
            await tx.insert(measurementApprovals).values({
                bulletinId,
                stage: parsed.data.stage,
                action: parsed.data.action,
                userId: user.id,
                notes: parsed.data.notes || null,
            })

            await tx.update(measurementBulletins)
                .set({ status: nextStatus, updatedAt: new Date() })
                .where(eq(measurementBulletins.id, bulletinId))
        })

        const actionLabel = parsed.data.action === 'APPROVED' ? 'aprovado' : 'rejeitado'
        logger.info({ userId: user.id, bulletinId, stage: parsed.data.stage, action: `bulletin.${actionLabel}` }, `Boletim ${actionLabel}`)
        revalidatePath(`/${tenant.slug}/measurements`)
        return { data: { id: bulletinId } }
    } catch (err) {
        logger.error({ err, bulletinId }, 'Erro ao aprovar/rejeitar boletim')
        return { error: 'Erro ao processar aprovação' }
    }
}

/**
 * Exclui um boletim (apenas DRAFT, admin only).
 */
export async function deleteBulletin(bulletinId: string) {
    const { user, tenant } = await getAuthContext()

    if (user.role !== 'admin') return { error: 'Sem permissão' }

    try {
        const [bulletin] = await db
            .select({ id: measurementBulletins.id, status: measurementBulletins.status })
            .from(measurementBulletins)
            .innerJoin(contracts, eq(contracts.id, measurementBulletins.contractId))
            .where(and(eq(measurementBulletins.id, bulletinId), eq(contracts.tenantId, tenant.id)))
            .limit(1)

        if (!bulletin) return { error: 'Boletim não encontrado' }
        if (bulletin.status !== 'DRAFT') return { error: 'Apenas boletins em rascunho podem ser excluídos' }

        await db.delete(measurementBulletins).where(eq(measurementBulletins.id, bulletinId))

        logger.info({ userId: user.id, bulletinId, action: 'bulletin.deleted' }, 'Boletim excluído')
        revalidatePath(`/${tenant.slug}/measurements`)
        return { data: { deleted: true } }
    } catch (err) {
        logger.error({ err, bulletinId }, 'Erro ao excluir boletim')
        return { error: 'Erro ao excluir boletim' }
    }
}

/**
 * Lista contratos ativos do tenant (para dropdown ao criar BM).
 */
export async function listContractsForBulletin() {
    const { tenant } = await getAuthContext()

    try {
        const result = await db
            .select({
                id: contracts.id,
                contractNumber: contracts.contractNumber,
                projectName: projects.name,
                contractorName: contractors.name,
            })
            .from(contracts)
            .innerJoin(projects, eq(projects.id, contracts.projectId))
            .innerJoin(contractors, eq(contractors.id, contracts.contractorId))
            .where(and(eq(contracts.tenantId, tenant.id), eq(contracts.active, true)))
            .orderBy(desc(contracts.createdAt))

        return { data: result }
    } catch (err) {
        logger.error({ err }, 'Erro ao listar contratos para BM')
        return { error: 'Erro ao carregar contratos' }
    }
}
