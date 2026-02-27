'use server'

import { eq, and, asc, desc, count, ilike, gte, lte, sql } from 'drizzle-orm'
import type { AnyColumn } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'
import {
    siteDiaries,
    diaryLaborEntries,
    diaryEquipmentEntries,
    diaryServicesExecuted,
    diaryObservations,
    diaryServiceReleases,
    projects,
} from '@/lib/db/schema'
import { getAuthContext } from '@/features/auth/actions'
import { logger } from '@/lib/logger'
import { createSiteDiarySchema, updateSiteDiarySchema } from './schemas'

/**
 * Lista diários de obra com paginação e filtros.
 */
export async function listSiteDiaries(options?: {
    q?: string
    page?: number
    limit?: number
    sort?: string
    order?: 'asc' | 'desc'
    projectId?: string
    status?: string
}) {
    const { tenant } = await getAuthContext()
    const page = options?.page && options.page > 0 ? options.page : 1
    const limit = options?.limit && options.limit > 0 ? options.limit : 10
    const offset = (page - 1) * limit
    const search = options?.q ? `%${options.q}%` : null

    const sortMap: Record<string, AnyColumn> = {
        date: siteDiaries.entryDate,
        project: projects.name,
        status: siteDiaries.status,
        contractor: siteDiaries.contractorName,
    }

    try {
        const filters = [eq(projects.tenantId, tenant.id)]
        if (search) {
            filters.push(ilike(siteDiaries.contractorName, search))
        }
        if (options?.projectId) {
            filters.push(eq(siteDiaries.projectId, options.projectId))
        }
        if (options?.status) {
            filters.push(eq(siteDiaries.status, options.status))
        }

        const sortColumn = sortMap[options?.sort ?? '']
        const orderFn = options?.order === 'asc' ? asc : desc

        const [queryCount, result] = await Promise.all([
            db.select({ count: count() })
                .from(siteDiaries)
                .innerJoin(projects, eq(projects.id, siteDiaries.projectId))
                .where(and(...filters)),
            db.select({
                    id: siteDiaries.id,
                    projectId: siteDiaries.projectId,
                    projectName: projects.name,
                    entryDate: siteDiaries.entryDate,
                    contractorName: siteDiaries.contractorName,
                    engineerName: siteDiaries.engineerName,
                    weatherCondition: siteDiaries.weatherCondition,
                    workSuspended: siteDiaries.workSuspended,
                    status: siteDiaries.status,
                    createdAt: siteDiaries.createdAt,
                })
                .from(siteDiaries)
                .innerJoin(projects, eq(projects.id, siteDiaries.projectId))
                .where(and(...filters))
                .orderBy(sortColumn ? orderFn(sortColumn) : desc(siteDiaries.entryDate))
                .limit(limit)
                .offset(offset),
        ])

        const totalItems = queryCount[0]?.count || 0

        return {
            data: result,
            meta: { totalItems, page, limit }
        }
    } catch (err) {
        logger.error({ err, tenantId: tenant.id }, 'Erro ao listar diários de obra')
        return { error: 'Erro ao carregar diários de obra' }
    }
}

/**
 * Busca um diário com todas as sub-tabelas.
 */
export async function getSiteDiary(diaryId: string) {
    const { tenant } = await getAuthContext()

    try {
        const [diary] = await db
            .select({
                id: siteDiaries.id,
                projectId: siteDiaries.projectId,
                projectName: projects.name,
                entryDate: siteDiaries.entryDate,
                orderNumber: siteDiaries.orderNumber,
                contractorName: siteDiaries.contractorName,
                networkDiagramRef: siteDiaries.networkDiagramRef,
                engineerName: siteDiaries.engineerName,
                foremanName: siteDiaries.foremanName,
                weatherCondition: siteDiaries.weatherCondition,
                workSuspended: siteDiaries.workSuspended,
                totalHours: siteDiaries.totalHours,
                status: siteDiaries.status,
                createdBy: siteDiaries.createdBy,
                createdAt: siteDiaries.createdAt,
            })
            .from(siteDiaries)
            .innerJoin(projects, eq(projects.id, siteDiaries.projectId))
            .where(and(eq(siteDiaries.id, diaryId), eq(projects.tenantId, tenant.id)))
            .limit(1)

        if (!diary) return { error: 'Diário não encontrado' }

        const [labor, equipment, services, observations, releases] = await Promise.all([
            db.select().from(diaryLaborEntries)
                .where(eq(diaryLaborEntries.diaryId, diaryId))
                .orderBy(asc(diaryLaborEntries.sortOrder)),
            db.select().from(diaryEquipmentEntries)
                .where(eq(diaryEquipmentEntries.diaryId, diaryId))
                .orderBy(asc(diaryEquipmentEntries.sortOrder)),
            db.select().from(diaryServicesExecuted)
                .where(eq(diaryServicesExecuted.diaryId, diaryId))
                .orderBy(asc(diaryServicesExecuted.sortOrder)),
            db.select().from(diaryObservations)
                .where(eq(diaryObservations.diaryId, diaryId))
                .orderBy(asc(diaryObservations.createdAt)),
            db.select().from(diaryServiceReleases)
                .where(eq(diaryServiceReleases.diaryId, diaryId)),
        ])

        return {
            data: {
                ...diary,
                laborEntries: labor,
                equipmentEntries: equipment,
                servicesExecuted: services,
                observations,
                releases,
            }
        }
    } catch (err) {
        logger.error({ err, diaryId }, 'Erro ao buscar diário de obra')
        return { error: 'Erro ao carregar diário de obra' }
    }
}

/**
 * Cria um novo diário de obra com todas as sub-entradas.
 */
export async function createSiteDiary(input: unknown) {
    const { user, tenant } = await getAuthContext()

    if (user.role === 'inspetor') return { error: 'Sem permissão' }

    const parsed = createSiteDiarySchema.safeParse(input)
    if (!parsed.success) return { error: parsed.error.flatten() }

    // Verificar que o projeto pertence ao tenant
    const [project] = await db
        .select({ id: projects.id })
        .from(projects)
        .where(and(eq(projects.id, parsed.data.projectId), eq(projects.tenantId, tenant.id)))
        .limit(1)

    if (!project) return { error: 'Obra não encontrada' }

    try {
        const result = await db.transaction(async (tx) => {
            const [diary] = await tx
                .insert(siteDiaries)
                .values({
                    projectId: parsed.data.projectId,
                    entryDate: parsed.data.entryDate,
                    orderNumber: parsed.data.orderNumber || null,
                    contractorName: parsed.data.contractorName || null,
                    networkDiagramRef: parsed.data.networkDiagramRef || null,
                    engineerName: parsed.data.engineerName || null,
                    foremanName: parsed.data.foremanName || null,
                    weatherCondition: parsed.data.weatherCondition,
                    workSuspended: parsed.data.workSuspended,
                    totalHours: parsed.data.totalHours?.toString() ?? null,
                    createdBy: user.id,
                })
                .returning()

            // Inserir sub-entradas em paralelo
            const inserts = []

            if (parsed.data.laborEntries?.length) {
                inserts.push(
                    tx.insert(diaryLaborEntries).values(
                        parsed.data.laborEntries.map((e, i) => ({
                            diaryId: diary.id,
                            role: e.role,
                            quantity: e.quantity,
                            hours: e.hours.toString(),
                            sortOrder: e.sortOrder ?? i,
                        }))
                    )
                )
            }

            if (parsed.data.equipmentEntries?.length) {
                inserts.push(
                    tx.insert(diaryEquipmentEntries).values(
                        parsed.data.equipmentEntries.map((e, i) => ({
                            diaryId: diary.id,
                            description: e.description,
                            quantity: e.quantity,
                            notes: e.notes || null,
                            sortOrder: e.sortOrder ?? i,
                        }))
                    )
                )
            }

            if (parsed.data.servicesExecuted?.length) {
                inserts.push(
                    tx.insert(diaryServicesExecuted).values(
                        parsed.data.servicesExecuted.map((e, i) => ({
                            diaryId: diary.id,
                            description: e.description,
                            serviceId: e.serviceId || null,
                            sortOrder: e.sortOrder ?? i,
                        }))
                    )
                )
            }

            if (parsed.data.observations?.length) {
                inserts.push(
                    tx.insert(diaryObservations).values(
                        parsed.data.observations.map((o) => ({
                            diaryId: diary.id,
                            origin: o.origin,
                            text: o.text,
                            createdBy: user.id,
                        }))
                    )
                )
            }

            await Promise.all(inserts)
            return diary
        })

        logger.info({ userId: user.id, diaryId: result.id, action: 'diary.created' }, 'Diário de obra criado')
        revalidatePath(`/${tenant.slug}/site-diary`)
        return { data: result }
    } catch (err: any) {
        if (err?.code === '23505') {
            return { error: 'Já existe um diário para esta obra nesta data' }
        }
        logger.error({ err }, 'Erro ao criar diário de obra')
        return { error: 'Erro ao criar diário de obra' }
    }
}

/**
 * Atualiza um diário de obra (apenas DRAFT).
 */
export async function updateSiteDiary(diaryId: string, input: unknown) {
    const { user, tenant } = await getAuthContext()

    if (user.role === 'inspetor') return { error: 'Sem permissão' }

    const parsed = updateSiteDiarySchema.safeParse(input)
    if (!parsed.success) return { error: parsed.error.flatten() }

    try {
        // Verificar que o diário pertence ao tenant e está em DRAFT
        const [existing] = await db
            .select({ id: siteDiaries.id, status: siteDiaries.status })
            .from(siteDiaries)
            .innerJoin(projects, eq(projects.id, siteDiaries.projectId))
            .where(and(eq(siteDiaries.id, diaryId), eq(projects.tenantId, tenant.id)))
            .limit(1)

        if (!existing) return { error: 'Diário não encontrado' }
        if (existing.status !== 'DRAFT') return { error: 'Apenas diários em rascunho podem ser editados' }

        await db.transaction(async (tx) => {
            // Atualizar campos do cabeçalho
            const updateData: Record<string, unknown> = { updatedAt: new Date() }
            if (parsed.data.entryDate !== undefined) updateData.entryDate = parsed.data.entryDate
            if (parsed.data.orderNumber !== undefined) updateData.orderNumber = parsed.data.orderNumber || null
            if (parsed.data.contractorName !== undefined) updateData.contractorName = parsed.data.contractorName || null
            if (parsed.data.networkDiagramRef !== undefined) updateData.networkDiagramRef = parsed.data.networkDiagramRef || null
            if (parsed.data.engineerName !== undefined) updateData.engineerName = parsed.data.engineerName || null
            if (parsed.data.foremanName !== undefined) updateData.foremanName = parsed.data.foremanName || null
            if (parsed.data.weatherCondition !== undefined) updateData.weatherCondition = parsed.data.weatherCondition
            if (parsed.data.workSuspended !== undefined) updateData.workSuspended = parsed.data.workSuspended
            if (parsed.data.totalHours !== undefined) updateData.totalHours = parsed.data.totalHours?.toString() ?? null

            await tx.update(siteDiaries).set(updateData).where(eq(siteDiaries.id, diaryId))

            // Delete + re-insert sub-entradas
            if (parsed.data.laborEntries !== undefined) {
                await tx.delete(diaryLaborEntries).where(eq(diaryLaborEntries.diaryId, diaryId))
                if (parsed.data.laborEntries?.length) {
                    await tx.insert(diaryLaborEntries).values(
                        parsed.data.laborEntries.map((e, i) => ({
                            diaryId,
                            role: e.role,
                            quantity: e.quantity,
                            hours: e.hours.toString(),
                            sortOrder: e.sortOrder ?? i,
                        }))
                    )
                }
            }

            if (parsed.data.equipmentEntries !== undefined) {
                await tx.delete(diaryEquipmentEntries).where(eq(diaryEquipmentEntries.diaryId, diaryId))
                if (parsed.data.equipmentEntries?.length) {
                    await tx.insert(diaryEquipmentEntries).values(
                        parsed.data.equipmentEntries.map((e, i) => ({
                            diaryId,
                            description: e.description,
                            quantity: e.quantity,
                            notes: e.notes || null,
                            sortOrder: e.sortOrder ?? i,
                        }))
                    )
                }
            }

            if (parsed.data.servicesExecuted !== undefined) {
                await tx.delete(diaryServicesExecuted).where(eq(diaryServicesExecuted.diaryId, diaryId))
                if (parsed.data.servicesExecuted?.length) {
                    await tx.insert(diaryServicesExecuted).values(
                        parsed.data.servicesExecuted.map((e, i) => ({
                            diaryId,
                            description: e.description,
                            serviceId: e.serviceId || null,
                            sortOrder: e.sortOrder ?? i,
                        }))
                    )
                }
            }

            if (parsed.data.observations !== undefined) {
                await tx.delete(diaryObservations).where(eq(diaryObservations.diaryId, diaryId))
                if (parsed.data.observations?.length) {
                    await tx.insert(diaryObservations).values(
                        parsed.data.observations.map((o) => ({
                            diaryId,
                            origin: o.origin,
                            text: o.text,
                            createdBy: user.id,
                        }))
                    )
                }
            }
        })

        logger.info({ userId: user.id, diaryId, action: 'diary.updated' }, 'Diário de obra atualizado')
        revalidatePath(`/${tenant.slug}/site-diary`)
        return { data: { id: diaryId } }
    } catch (err: any) {
        if (err?.code === '23505') {
            return { error: 'Já existe um diário para esta obra nesta data' }
        }
        logger.error({ err, diaryId }, 'Erro ao atualizar diário de obra')
        return { error: 'Erro ao atualizar diário de obra' }
    }
}

/**
 * Submete o diário para assinatura (DRAFT → SUBMITTED).
 */
export async function submitDiary(diaryId: string) {
    const { user, tenant } = await getAuthContext()

    try {
        const [diary] = await db
            .select({ id: siteDiaries.id, status: siteDiaries.status })
            .from(siteDiaries)
            .innerJoin(projects, eq(projects.id, siteDiaries.projectId))
            .where(and(eq(siteDiaries.id, diaryId), eq(projects.tenantId, tenant.id)))
            .limit(1)

        if (!diary) return { error: 'Diário não encontrado' }
        if (diary.status !== 'DRAFT') return { error: 'Diário já foi submetido' }

        await db.update(siteDiaries)
            .set({ status: 'SUBMITTED', updatedAt: new Date() })
            .where(eq(siteDiaries.id, diaryId))

        logger.info({ userId: user.id, diaryId, action: 'diary.submitted' }, 'Diário submetido')
        revalidatePath(`/${tenant.slug}/site-diary`)
        return { data: { id: diaryId } }
    } catch (err) {
        logger.error({ err, diaryId }, 'Erro ao submeter diário')
        return { error: 'Erro ao submeter diário' }
    }
}

/**
 * Assina o diário (Prestadora ou Fiscalização).
 */
export async function signDiary(diaryId: string, stage: 'CONTRACTOR' | 'INSPECTION') {
    const { user, tenant } = await getAuthContext()

    try {
        const [diary] = await db
            .select({ id: siteDiaries.id, status: siteDiaries.status })
            .from(siteDiaries)
            .innerJoin(projects, eq(projects.id, siteDiaries.projectId))
            .where(and(eq(siteDiaries.id, diaryId), eq(projects.tenantId, tenant.id)))
            .limit(1)

        if (!diary) return { error: 'Diário não encontrado' }

        // Validar transição de status
        if (stage === 'CONTRACTOR' && diary.status !== 'SUBMITTED') {
            return { error: 'Diário precisa estar submetido para assinatura da prestadora' }
        }
        if (stage === 'INSPECTION' && diary.status !== 'CONTRACTOR_SIGNED') {
            return { error: 'Prestadora precisa assinar antes da fiscalização' }
        }

        const newStatus = stage === 'CONTRACTOR' ? 'CONTRACTOR_SIGNED' : 'INSPECTION_SIGNED'

        // Transaction para garantir atomicidade entre release + status update
        await db.transaction(async (tx) => {
            await tx.insert(diaryServiceReleases).values({
                diaryId,
                stage,
                signedBy: user.id,
                signedAt: new Date(),
            })

            await tx.update(siteDiaries)
                .set({ status: newStatus, updatedAt: new Date() })
                .where(eq(siteDiaries.id, diaryId))
        })

        logger.info({ userId: user.id, diaryId, stage, action: 'diary.signed' }, 'Diário assinado')
        revalidatePath(`/${tenant.slug}/site-diary`)
        return { data: { id: diaryId } }
    } catch (err: any) {
        if (err?.code === '23505') {
            return { error: 'Esta etapa já foi assinada' }
        }
        logger.error({ err, diaryId }, 'Erro ao assinar diário')
        return { error: 'Erro ao assinar diário' }
    }
}

/**
 * Exclui um diário (apenas DRAFT, admin only).
 */
export async function deleteSiteDiary(diaryId: string) {
    const { user, tenant } = await getAuthContext()

    if (user.role !== 'admin') return { error: 'Sem permissão' }

    try {
        const [diary] = await db
            .select({ id: siteDiaries.id, status: siteDiaries.status })
            .from(siteDiaries)
            .innerJoin(projects, eq(projects.id, siteDiaries.projectId))
            .where(and(eq(siteDiaries.id, diaryId), eq(projects.tenantId, tenant.id)))
            .limit(1)

        if (!diary) return { error: 'Diário não encontrado' }
        if (diary.status !== 'DRAFT') return { error: 'Apenas diários em rascunho podem ser excluídos' }

        await db.delete(siteDiaries).where(eq(siteDiaries.id, diaryId))

        logger.info({ userId: user.id, diaryId, action: 'diary.deleted' }, 'Diário excluído')
        revalidatePath(`/${tenant.slug}/site-diary`)
        return { data: { deleted: true } }
    } catch (err) {
        logger.error({ err, diaryId }, 'Erro ao excluir diário')
        return { error: 'Erro ao excluir diário' }
    }
}
