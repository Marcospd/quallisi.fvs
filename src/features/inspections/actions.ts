'use server'

import { eq, and, asc, desc, sql, count } from 'drizzle-orm'
import type { AnyColumn } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'
import { inspections, inspectionItems, projects, services, locations, users, criteria, issues } from '@/lib/db/schema'
import { getAuthContext } from '@/features/auth/actions'
import { logger } from '@/lib/logger'
import { notifyInspectionCompleted, notifyInspectionAssigned } from '@/features/notifications/create-notification'

/**
 * Lista inspeções do tenant atual com dados de serviço, local e inspetor.
 * Inspetor vê apenas suas inspeções; admin/supervisor vê todas.
 * Suporta paginação via page/limit.
 */
export async function listInspections(options?: {
    projectId?: string
    sort?: string
    order?: 'asc' | 'desc'
    page?: number
    limit?: number
}) {
    const { user, tenant } = await getAuthContext()

    const page = options?.page && options.page > 0 ? options.page : 1
    const limit = options?.limit && options.limit > 0 ? options.limit : 20
    const offset = (page - 1) * limit

    const sortMap: Record<string, AnyColumn> = {
        service: services.name,
        project: projects.name,
        location: locations.name,
        inspector: users.name,
        month: inspections.referenceMonth,
        status: inspections.status,
        result: inspections.result,
        date: inspections.createdAt,
    }

    try {
        const sortColumn = sortMap[options?.sort ?? '']
        const orderFn = options?.order === 'desc' ? desc : asc

        const conditions = [eq(projects.tenantId, tenant.id)]

        if (options?.projectId) {
            conditions.push(eq(inspections.projectId, options.projectId))
        }

        // Inspetor vê apenas suas inspeções
        if (user.role === 'inspetor') {
            conditions.push(eq(inspections.inspectorId, user.id))
        }

        const baseQuery = db
            .select({
                inspection: inspections,
                project: projects,
                service: services,
                location: locations,
                inspector: users,
            })
            .from(inspections)
            .innerJoin(services, eq(inspections.serviceId, services.id))
            .innerJoin(locations, eq(inspections.locationId, locations.id))
            .innerJoin(users, eq(inspections.inspectorId, users.id))
            .innerJoin(projects, eq(inspections.projectId, projects.id))
            .where(and(...conditions))

        const [countResult, result] = await Promise.all([
            db
                .select({ total: count() })
                .from(inspections)
                .innerJoin(projects, eq(inspections.projectId, projects.id))
                .where(and(...conditions)),
            baseQuery
                .orderBy(sortColumn ? orderFn(sortColumn) : desc(inspections.createdAt))
                .limit(limit)
                .offset(offset),
        ])

        const totalItems = countResult[0]?.total ?? 0

        return {
            data: result,
            meta: { totalItems, page, limit },
            currentUserId: user.id,
            currentUserRole: user.role,
        }
    } catch (err) {
        logger.error({ err, tenantId: tenant.id }, 'Erro ao listar inspeções')
        return { error: 'Erro ao carregar inspeções' }
    }
}

/**
 * Cria uma nova inspeção FVS (planejamento).
 * Somente admin/supervisor podem criar. A inspeção nasce como DRAFT (agendada).
 * Gera os inspection_items automaticamente a partir dos critérios do serviço.
 */
export async function createInspection(input: {
    projectId: string
    serviceId: string
    locationId: string
    inspectorId: string
    referenceMonth: string
}) {
    const { user, tenant } = await getAuthContext()

    if (user.role === 'inspetor') {
        return { error: 'Apenas gestores podem agendar inspeções' }
    }

    try {
        // Verificar que a obra pertence ao tenant
        const [project] = await db
            .select()
            .from(projects)
            .where(and(eq(projects.id, input.projectId), eq(projects.tenantId, tenant.id)))
            .limit(1)

        if (!project) return { error: 'Obra não encontrada' }

        // Verificar que o inspetor pertence ao tenant e está ativo
        const [inspector] = await db
            .select()
            .from(users)
            .where(
                and(
                    eq(users.id, input.inspectorId),
                    eq(users.tenantId, tenant.id),
                    eq(users.active, true),
                )
            )
            .limit(1)

        if (!inspector) return { error: 'Inspetor não encontrado ou inativo' }

        // Buscar critérios do serviço
        const serviceCriteria = await db
            .select()
            .from(criteria)
            .where(eq(criteria.serviceId, input.serviceId))
            .orderBy(criteria.sortOrder)

        // Criar inspeção (nasce como DRAFT, sem startedAt)
        const [inspection] = await db
            .insert(inspections)
            .values({
                projectId: input.projectId,
                serviceId: input.serviceId,
                locationId: input.locationId,
                inspectorId: input.inspectorId,
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
            { userId: user.id, inspectionId: inspection.id, inspectorId: input.inspectorId, action: 'inspection.created' },
            'Inspeção agendada'
        )

        revalidatePath(`/${tenant.slug}/inspections`)
        revalidatePath(`/${tenant.slug}/planning`)

        // Notificar inspetor por e-mail e sino (fire-and-forget)
        notifyInspectionAssigned({
            inspectionId: inspection.id,
            inspectorId: input.inspectorId,
            assignedByName: user.name,
            tenantSlug: tenant.slug,
        }).catch(() => {})

        return { data: inspection }
    } catch (err) {
        logger.error({ err }, 'Erro ao criar inspeção')
        return { error: 'Erro ao criar inspeção' }
    }
}

/**
 * Inicia uma inspeção (botão Play).
 * Só funciona quando o mês/ano atual coincide com o referenceMonth.
 * Captura a data de início automaticamente.
 */
export async function startInspection(inspectionId: string) {
    const { user, tenant } = await getAuthContext()

    try {
        const [inspData] = await db
            .select({ inspection: inspections })
            .from(inspections)
            .innerJoin(projects, eq(inspections.projectId, projects.id))
            .where(
                and(
                    eq(inspections.id, inspectionId),
                    eq(projects.tenantId, tenant.id),
                )
            )
            .limit(1)

        if (!inspData) return { error: 'Inspeção não encontrada' }

        const insp = inspData.inspection

        // Inspetor só pode iniciar inspeções atribuídas a ele
        if (user.role === 'inspetor' && insp.inspectorId !== user.id) {
            return { error: 'Você só pode iniciar inspeções atribuídas a você' }
        }

        if (insp.startedAt || insp.status !== 'DRAFT') {
            return { error: 'Esta inspeção já foi iniciada' }
        }

        // Validar que referenceMonth é o mês atual
        const now = new Date()
        const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
        if (insp.referenceMonth !== currentMonth) {
            return { error: 'Só é possível iniciar inspeções do mês vigente' }
        }

        const [updated] = await db
            .update(inspections)
            .set({
                startedAt: new Date(),
                status: 'IN_PROGRESS',
                updatedAt: new Date(),
            })
            .where(eq(inspections.id, inspectionId))
            .returning()

        logger.info(
            { userId: user.id, inspectionId, action: 'inspection.started' },
            'Inspeção iniciada (Play)'
        )

        revalidatePath(`/${tenant.slug}/inspections`)
        revalidatePath(`/${tenant.slug}/planning`)
        return { data: updated }
    } catch (err) {
        logger.error({ err, inspectionId }, 'Erro ao iniciar inspeção')
        return { error: 'Erro ao iniciar inspeção' }
    }
}

/**
 * Atualiza o mês de vigência de uma inspeção agendada.
 * Somente admin/supervisor; só para DRAFT sem startedAt.
 */
export async function updateInspectionMonth(inspectionId: string, referenceMonth: string) {
    const { user, tenant } = await getAuthContext()

    if (user.role === 'inspetor') {
        return { error: 'Sem permissão' }
    }

    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(referenceMonth)) {
        return { error: 'Formato de mês inválido' }
    }

    try {
        const [inspData] = await db
            .select({ inspection: inspections })
            .from(inspections)
            .innerJoin(projects, eq(inspections.projectId, projects.id))
            .where(
                and(
                    eq(inspections.id, inspectionId),
                    eq(projects.tenantId, tenant.id),
                )
            )
            .limit(1)

        if (!inspData) return { error: 'Inspeção não encontrada' }

        if (inspData.inspection.startedAt || inspData.inspection.status !== 'DRAFT') {
            return { error: 'Não é possível alterar o mês de uma inspeção já iniciada' }
        }

        const [updated] = await db
            .update(inspections)
            .set({ referenceMonth, updatedAt: new Date() })
            .where(eq(inspections.id, inspectionId))
            .returning()

        logger.info(
            { userId: user.id, inspectionId, referenceMonth, action: 'inspection.month_updated' },
            'Vigência da inspeção atualizada'
        )

        revalidatePath(`/${tenant.slug}/inspections`)
        revalidatePath(`/${tenant.slug}/planning`)
        return { data: updated }
    } catch (err) {
        logger.error({ err, inspectionId }, 'Erro ao atualizar vigência')
        return { error: 'Erro ao atualizar vigência' }
    }
}

/**
 * Lista inspeções para o painel de planejamento/monitoramento.
 * Somente admin/supervisor. Suporta filtros por obra, mês e inspetor.
 */
export async function listInspectionsForPlanning(options?: {
    projectId?: string
    referenceMonth?: string
    inspectorId?: string
}) {
    const { user, tenant } = await getAuthContext()

    if (user.role === 'inspetor') {
        return { error: 'Sem permissão' }
    }

    try {
        const conditions = [eq(projects.tenantId, tenant.id)]

        if (options?.projectId) {
            conditions.push(eq(inspections.projectId, options.projectId))
        }
        if (options?.referenceMonth) {
            conditions.push(eq(inspections.referenceMonth, options.referenceMonth))
        }
        if (options?.inspectorId) {
            conditions.push(eq(inspections.inspectorId, options.inspectorId))
        }

        const result = await db
            .select({
                inspection: inspections,
                project: projects,
                service: services,
                location: locations,
                inspector: users,
            })
            .from(inspections)
            .innerJoin(services, eq(inspections.serviceId, services.id))
            .innerJoin(locations, eq(inspections.locationId, locations.id))
            .innerJoin(users, eq(inspections.inspectorId, users.id))
            .innerJoin(projects, eq(inspections.projectId, projects.id))
            .where(and(...conditions))
            .orderBy(desc(inspections.referenceMonth), services.name)

        return { data: result }
    } catch (err) {
        logger.error({ err, tenantId: tenant.id }, 'Erro ao listar inspeções para planejamento')
        return { error: 'Erro ao carregar planejamento' }
    }
}

/**
 * Lista membros ativos do tenant para o dropdown de atribuição de inspetor.
 */
export async function listTeamMembersForAssignment() {
    const { tenant } = await getAuthContext()

    try {
        const result = await db
            .select({
                id: users.id,
                name: users.name,
                role: users.role,
            })
            .from(users)
            .where(and(eq(users.tenantId, tenant.id), eq(users.active, true)))
            .orderBy(users.name)

        return { data: result }
    } catch (err) {
        logger.error({ err, tenantId: tenant.id }, 'Erro ao listar membros para atribuição')
        return { error: 'Erro ao carregar membros' }
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
                project: projects,
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
 * Calcula automaticamente: todos C → APPROVED, algum NC → APPROVED_WITH_RESTRICTIONS.
 * Itens NC geram pendências automaticamente para acompanhamento e resolução.
 */
export async function completeInspection(inspectionId: string) {
    const { user, tenant } = await getAuthContext()

    try {
        // Buscar todos os items desta inspeção com dados do critério
        const itemsWithCriteria = await db
            .select({
                item: inspectionItems,
                criterion: criteria,
            })
            .from(inspectionItems)
            .innerJoin(criteria, eq(inspectionItems.criterionId, criteria.id))
            .where(eq(inspectionItems.inspectionId, inspectionId))
            .orderBy(criteria.sortOrder)

        if (itemsWithCriteria.length === 0) return { error: 'Inspeção sem itens' }

        // Verificar se todos foram avaliados
        const unevaluated = itemsWithCriteria.filter((i) => !i.item.evaluation)
        if (unevaluated.length > 0) {
            return { error: `${unevaluated.length} critério(s) ainda não foram avaliados` }
        }

        // Calcular resultado: NC → gera pendências, não reprova
        const ncItems = itemsWithCriteria.filter((i) => i.item.evaluation === 'NC')
        const result = ncItems.length > 0 ? 'APPROVED_WITH_RESTRICTIONS' : 'APPROVED'

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

        // Criar pendências automaticamente para cada item NC
        if (ncItems.length > 0) {
            await db.insert(issues).values(
                ncItems.map((nc) => ({
                    inspectionId,
                    description: nc.item.notes
                        ? `${nc.criterion.description} — ${nc.item.notes}`
                        : nc.criterion.description,
                }))
            )

            logger.info(
                { inspectionId, issuesCreated: ncItems.length, action: 'issues.auto_created' },
                'Pendências criadas automaticamente a partir de itens NC'
            )
        }

        logger.info(
            { userId: user.id, inspectionId, result, action: 'inspection.completed' },
            'Inspeção finalizada'
        )

        revalidatePath(`/${tenant.slug}/inspections`)
        revalidatePath(`/${tenant.slug}/issues`)

        // Notificar supervisores e admins (fire-and-forget)
        notifyInspectionCompleted(inspectionId, tenant.slug).catch(() => { })

        return { data: updated }
    } catch (err) {
        logger.error({ err, inspectionId }, 'Erro ao finalizar inspeção')
        return { error: 'Erro ao finalizar inspeção' }
    }
}

/**
 * Conclui a revisão de uma inspeção com pendências.
 * Recalcula o resultado com base nos itens atuais.
 * Se todos C/NA → APPROVED e resolve todas as pendências.
 * Se ainda há NC → mantém APPROVED_WITH_RESTRICTIONS.
 */
export async function reviseInspection(inspectionId: string) {
    const { user, tenant } = await getAuthContext()

    try {
        // Verificar que a inspeção pertence ao tenant e tem pendências
        const [inspData] = await db
            .select({ inspection: inspections })
            .from(inspections)
            .innerJoin(projects, eq(inspections.projectId, projects.id))
            .where(
                and(
                    eq(inspections.id, inspectionId),
                    eq(projects.tenantId, tenant.id),
                    eq(inspections.status, 'COMPLETED'),
                )
            )
            .limit(1)

        if (!inspData) return { error: 'Inspeção não encontrada ou não pode ser revisada' }

        // Buscar todos os items
        const allItems = await db
            .select()
            .from(inspectionItems)
            .where(eq(inspectionItems.inspectionId, inspectionId))

        const ncItems = allItems.filter((i) => i.evaluation === 'NC')
        const newResult = ncItems.length > 0 ? 'APPROVED_WITH_RESTRICTIONS' : 'APPROVED'

        // Atualizar resultado da inspeção
        const [updated] = await db
            .update(inspections)
            .set({
                result: newResult,
                updatedAt: new Date(),
                ...(newResult === 'APPROVED' ? { approvedAt: new Date() } : {}),
            })
            .where(eq(inspections.id, inspectionId))
            .returning()

        // Se aprovada, resolver todas as pendências abertas desta inspeção
        if (newResult === 'APPROVED') {
            await db
                .update(issues)
                .set({
                    status: 'RESOLVED',
                    resolvedAt: new Date(),
                    updatedAt: new Date(),
                    notes: 'Resolvida automaticamente após revisão da inspeção',
                })
                .where(
                    and(
                        eq(issues.inspectionId, inspectionId),
                        sql`${issues.status} IN ('OPEN', 'IN_PROGRESS')`
                    )
                )
        }

        logger.info(
            { userId: user.id, inspectionId, result: newResult, action: 'inspection.revised' },
            'Inspeção revisada'
        )

        revalidatePath(`/${tenant.slug}/inspections`)
        revalidatePath(`/${tenant.slug}/issues`)

        return { data: updated }
    } catch (err) {
        logger.error({ err, inspectionId }, 'Erro ao revisar inspeção')
        return { error: 'Erro ao revisar inspeção' }
    }
}

/**
 * Migra inspeções legado com resultado REJECTED:
 * - Cria pendências para os itens NC que não tinham
 * - Atualiza resultado para APPROVED_WITH_RESTRICTIONS
 */
export async function migrateRejectedInspection(inspectionId: string) {
    const { user, tenant } = await getAuthContext()

    try {
        // Verificar que é uma inspeção REJECTED do tenant
        const [inspData] = await db
            .select({ inspection: inspections })
            .from(inspections)
            .innerJoin(projects, eq(inspections.projectId, projects.id))
            .where(
                and(
                    eq(inspections.id, inspectionId),
                    eq(projects.tenantId, tenant.id),
                    eq(inspections.result, 'REJECTED'),
                )
            )
            .limit(1)

        if (!inspData) return { error: 'Inspeção não encontrada' }

        // Verificar se já existem pendências para esta inspeção
        const existingIssues = await db
            .select({ id: issues.id })
            .from(issues)
            .where(eq(issues.inspectionId, inspectionId))
            .limit(1)

        if (existingIssues.length > 0) {
            // Já tem pendências, só atualizar resultado
            await db
                .update(inspections)
                .set({ result: 'APPROVED_WITH_RESTRICTIONS', updatedAt: new Date() })
                .where(eq(inspections.id, inspectionId))

            revalidatePath(`/${tenant.slug}/inspections`)
            return { data: { migrated: true, issuesCreated: 0 } }
        }

        // Buscar itens NC com critérios
        const ncItems = await db
            .select({
                item: inspectionItems,
                criterion: criteria,
            })
            .from(inspectionItems)
            .innerJoin(criteria, eq(inspectionItems.criterionId, criteria.id))
            .where(
                and(
                    eq(inspectionItems.inspectionId, inspectionId),
                    eq(inspectionItems.evaluation, 'NC'),
                )
            )

        // Criar pendências
        if (ncItems.length > 0) {
            await db.insert(issues).values(
                ncItems.map((nc) => ({
                    inspectionId,
                    description: nc.item.notes
                        ? `${nc.criterion.description} — ${nc.item.notes}`
                        : nc.criterion.description,
                }))
            )
        }

        // Atualizar resultado
        await db
            .update(inspections)
            .set({ result: 'APPROVED_WITH_RESTRICTIONS', updatedAt: new Date() })
            .where(eq(inspections.id, inspectionId))

        logger.info(
            { userId: user.id, inspectionId, issuesCreated: ncItems.length, action: 'inspection.migrated' },
            'Inspeção REJECTED migrada para APPROVED_WITH_RESTRICTIONS'
        )

        revalidatePath(`/${tenant.slug}/inspections`)
        revalidatePath(`/${tenant.slug}/issues`)

        return { data: { migrated: true, issuesCreated: ncItems.length } }
    } catch (err) {
        logger.error({ err, inspectionId }, 'Erro ao migrar inspeção')
        return { error: 'Erro ao migrar inspeção' }
    }
}
