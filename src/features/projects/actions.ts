'use server'

import { eq, and, ilike, count, sql, asc } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'
import { projects, inspections, inspectionItems } from '@/lib/db/schema'
import { getAuthContext } from '@/features/auth/actions'
import { createProjectSchema, updateProjectSchema } from './schemas'
import { logger } from '@/lib/logger'

/**
 * Lista obras ativas do tenant para uso em dropdowns/selects.
 * Query leve: sem JOINs, apenas id, name, active.
 */
export async function listProjectOptions() {
    const { tenant } = await getAuthContext()

    try {
        const result = await db
            .select({
                id: projects.id,
                name: projects.name,
                active: projects.active,
            })
            .from(projects)
            .where(and(eq(projects.tenantId, tenant.id), eq(projects.active, true)))
            .orderBy(asc(projects.name))

        return { data: result }
    } catch (err) {
        logger.error({ err, tenantId: tenant.id }, 'Erro ao listar opções de obras')
        return { error: 'Erro ao carregar obras' }
    }
}

/**
 * Lista obras do tenant atual.
 * Sempre filtrado por tenantId — isolamento obrigatório.
 */
export async function listProjects(options?: {
    q?: string
    page?: number
    limit?: number
}) {
    const { tenant } = await getAuthContext()
    const page = options?.page && options.page > 0 ? options.page : 1
    const limit = options?.limit && options.limit > 0 ? options.limit : 10
    const offset = (page - 1) * limit
    const search = options?.q ? `%${options.q}%` : null

    try {
        const filters = [eq(projects.tenantId, tenant.id)]
        if (search) {
            filters.push(ilike(projects.name, search))
        }

        const [queryCount, rows] = await Promise.all([
            db
                .select({ count: count() })
                .from(projects)
                .where(and(...filters)),
            db
                .select({
                    project: projects,
                    total: sql<number>`count(case when ${inspectionItems.evaluation} in ('C', 'NC') then 1 end)`.mapWith(Number),
                    approved: sql<number>`count(case when ${inspectionItems.evaluation} = 'C' then 1 end)`.mapWith(Number),
                })
                .from(projects)
                .leftJoin(inspections, eq(inspections.projectId, projects.id))
                .leftJoin(inspectionItems, eq(inspectionItems.inspectionId, inspections.id))
                .where(and(...filters))
                .groupBy(projects.id)
                .limit(limit)
                .offset(offset)
                .orderBy(projects.name),
        ])

        const totalItems = queryCount[0]?.count || 0

        const data = rows.map((r) => ({
            project: r.project,
            stats: { total: r.total, approved: r.approved },
        }))

        return {
            data,
            meta: { totalItems, page, limit }
        }
    } catch (err) {
        logger.error({ err, tenantId: tenant.id }, 'Erro ao listar obras')
        return { error: 'Erro ao carregar obras' }
    }
}

/**
 * Retorna uma obra pelo ID, validando que pertence ao tenant.
 */
export async function getProject(projectId: string) {
    const { tenant } = await getAuthContext()

    try {
        const [project] = await db
            .select()
            .from(projects)
            .where(and(eq(projects.id, projectId), eq(projects.tenantId, tenant.id)))
            .limit(1)

        if (!project) return { error: 'Obra não encontrada' }
        return { data: project }
    } catch (err) {
        logger.error({ err, projectId, tenantId: tenant.id }, 'Erro ao buscar obra')
        return { error: 'Erro ao carregar obra' }
    }
}

/**
 * Cria uma nova obra vinculada ao tenant atual.
 */
export async function createProject(input: unknown) {
    const { user, tenant } = await getAuthContext()

    // Apenas admin pode criar obras
    if (user.role !== 'admin') {
        return { error: 'Sem permissão para criar obras' }
    }

    const parsed = createProjectSchema.safeParse(input)
    if (!parsed.success) {
        return { error: parsed.error.flatten() }
    }

    try {
        const [project] = await db
            .insert(projects)
            .values({
                tenantId: tenant.id,
                name: parsed.data.name,
                address: parsed.data.address || null,
                imageUrl: parsed.data.imageUrl || null,
                clientName: parsed.data.clientName || null,
                contractNumber: parsed.data.contractNumber || null,
                startDate: parsed.data.startDate || null,
                endDate: parsed.data.endDate || null,
                engineerName: parsed.data.engineerName || null,
                supervision: parsed.data.supervision || null,
                characteristics: parsed.data.characteristics || null,
                notes: parsed.data.notes || null,
            })
            .returning()

        logger.info(
            { userId: user.id, tenantId: tenant.id, projectId: project.id, action: 'project.created' },
            'Obra criada'
        )

        revalidatePath(`/${tenant.slug}/projects`)
        return { data: project }
    } catch (err) {
        logger.error({ err, tenantId: tenant.id }, 'Erro ao criar obra')
        return { error: 'Erro ao criar obra' }
    }
}

/**
 * Ativa ou desativa uma obra.
 */
export async function toggleProjectActive(projectId: string) {
    const { user, tenant } = await getAuthContext()

    if (user.role !== 'admin') {
        return { error: 'Sem permissão' }
    }

    try {
        // Buscar obra SEMPRE filtrando por tenantId
        const [project] = await db
            .select()
            .from(projects)
            .where(and(eq(projects.id, projectId), eq(projects.tenantId, tenant.id)))
            .limit(1)

        if (!project) return { error: 'Obra não encontrada' }

        const [updated] = await db
            .update(projects)
            .set({
                active: !project.active,
                updatedAt: new Date(),
            })
            .where(and(eq(projects.id, projectId), eq(projects.tenantId, tenant.id)))
            .returning()

        logger.info(
            { userId: user.id, projectId, active: updated.active, action: 'project.toggled' },
            'Status da obra alterado'
        )

        revalidatePath(`/${tenant.slug}/projects`)
        return { data: updated }
    } catch (err) {
        logger.error({ err, projectId }, 'Erro ao alterar obra')
        return { error: 'Erro ao alterar obra' }
    }
}

/**
 * Atualiza uma obra existente.
 */
export async function updateProject(projectId: string, input: unknown) {
    const { user, tenant } = await getAuthContext()

    if (user.role !== 'admin') {
        return { error: 'Sem permissão para editar obras' }
    }

    const parsed = updateProjectSchema.safeParse(input)
    if (!parsed.success) {
        return { error: parsed.error.flatten() }
    }

    const updateData: Record<string, unknown> = { updatedAt: new Date() }
    if (parsed.data.name !== undefined) updateData.name = parsed.data.name
    if (parsed.data.address !== undefined) updateData.address = parsed.data.address
    if (parsed.data.imageUrl !== undefined) updateData.imageUrl = parsed.data.imageUrl
    if (parsed.data.clientName !== undefined) updateData.clientName = parsed.data.clientName || null
    if (parsed.data.contractNumber !== undefined) updateData.contractNumber = parsed.data.contractNumber || null
    if (parsed.data.startDate !== undefined) updateData.startDate = parsed.data.startDate || null
    if (parsed.data.endDate !== undefined) updateData.endDate = parsed.data.endDate || null
    if (parsed.data.engineerName !== undefined) updateData.engineerName = parsed.data.engineerName || null
    if (parsed.data.supervision !== undefined) updateData.supervision = parsed.data.supervision || null
    if (parsed.data.characteristics !== undefined) updateData.characteristics = parsed.data.characteristics || null
    if (parsed.data.notes !== undefined) updateData.notes = parsed.data.notes || null

    try {
        const [project] = await db
            .update(projects)
            .set(updateData)
            .where(and(eq(projects.id, projectId), eq(projects.tenantId, tenant.id)))
            .returning()

        if (!project) return { error: 'Obra não encontrada' }

        logger.info(
            { userId: user.id, tenantId: tenant.id, projectId, action: 'project.updated' },
            'Obra atualizada'
        )

        revalidatePath(`/${tenant.slug}/projects`)
        return { data: project }
    } catch (err) {
        logger.error({ err, tenantId: tenant.id, projectId }, 'Erro ao atualizar obra')
        return { error: 'Erro ao atualizar obra' }
    }
}
