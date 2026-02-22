'use server'

import { eq, and, ilike, count, or, sql, SQL } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'
import { locations, projects } from '@/lib/db/schema'
import { getAuthContext } from '@/features/auth/actions'
import { createLocationSchema, updateLocationSchema } from './schemas'
import { logger } from '@/lib/logger'

/**
 * Lista locais filtrados por obra e tenant.
 * Isolamento: verifica que a obra pertence ao tenant atual.
 */
export async function listLocations(options?: {
    projectId?: string
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
        const filters: SQL[] = [eq(projects.tenantId, tenant.id)]
        if (options?.projectId) {
            filters.push(eq(locations.projectId, options.projectId))
        }
        if (search) {
            filters.push(
                or(
                    ilike(locations.name, search),
                    ilike(projects.name, search)
                ) as SQL
            )
        }

        const queryCount = await db
            .select({ count: count() })
            .from(locations)
            .innerJoin(projects, eq(locations.projectId, projects.id))
            .where(and(...filters))
            .execute()

        const totalItems = queryCount[0]?.count || 0

        const result = await db
            .select({
                location: locations,
                project: projects,
            })
            .from(locations)
            .innerJoin(projects, eq(locations.projectId, projects.id))
            .where(and(...filters))
            .limit(limit)
            .offset(offset)
            .orderBy(projects.name, locations.name)

        return {
            data: result,
            meta: { totalItems, page, limit }
        }
    } catch (err) {
        logger.error({ err, tenantId: tenant.id }, 'Erro ao listar locais')
        return { error: 'Erro ao carregar locais' }
    }
}

/**
 * Cria um novo local vinculado a uma obra do tenant.
 */
export async function createLocation(input: unknown) {
    const { user, tenant } = await getAuthContext()

    if (user.role !== 'admin') {
        return { error: 'Sem permissão para criar locais' }
    }

    const parsed = createLocationSchema.safeParse(input)
    if (!parsed.success) {
        return { error: parsed.error.flatten() }
    }

    try {
        // Verificar que a obra pertence ao tenant
        const [project] = await db
            .select()
            .from(projects)
            .where(and(eq(projects.id, parsed.data.projectId), eq(projects.tenantId, tenant.id)))
            .limit(1)

        if (!project) return { error: 'Obra não encontrada' }

        const [location] = await db
            .insert(locations)
            .values({
                projectId: parsed.data.projectId,
                name: parsed.data.name,
                description: parsed.data.description || null,
            })
            .returning()

        logger.info(
            { userId: user.id, tenantId: tenant.id, locationId: location.id, action: 'location.created' },
            'Local criado'
        )

        revalidatePath(`/${tenant.slug}/locations`)
        return { data: location }
    } catch (err) {
        logger.error({ err, tenantId: tenant.id }, 'Erro ao criar local')
        return { error: 'Erro ao criar local' }
    }
}

/**
 * Ativa ou desativa um local.
 */
export async function toggleLocationActive(locationId: string) {
    const { user, tenant } = await getAuthContext()

    if (user.role !== 'admin') {
        return { error: 'Sem permissão' }
    }

    try {
        const [location] = await db
            .select({ id: locations.id, active: locations.active, projectId: locations.projectId })
            .from(locations)
            .where(eq(locations.id, locationId))
            .limit(1)

        if (!location) return { error: 'Local não encontrado' }

        // Validar isolamento via project
        const [project] = await db
            .select()
            .from(projects)
            .where(and(eq(projects.id, location.projectId), eq(projects.tenantId, tenant.id)))
            .limit(1)

        if (!project) return { error: 'Local não encontrado no tenant atual' }

        const [updated] = await db
            .update(locations)
            .set({ active: !location.active, updatedAt: new Date() })
            .where(eq(locations.id, locationId))
            .returning()

        logger.info({ userId: user.id, locationId, active: updated.active, action: 'location.toggled' }, 'Status do local alterado')

        revalidatePath(`/${tenant.slug}/locations`)
        return { data: updated }
    } catch (err) {
        logger.error({ err, locationId }, 'Erro ao alterar local')
        return { error: 'Erro ao alterar local' }
    }
}

/**
 * Atualiza um local.
 */
export async function updateLocation(locationId: string, input: unknown) {
    const { user, tenant } = await getAuthContext()

    if (user.role !== 'admin') {
        return { error: 'Sem permissão para editar locais' }
    }

    const parsed = updateLocationSchema.safeParse(input)
    if (!parsed.success) {
        return { error: parsed.error.flatten() }
    }

    try {
        const [location] = await db
            .select({ id: locations.id, projectId: locations.projectId })
            .from(locations)
            .where(eq(locations.id, locationId))
            .limit(1)

        if (!location) return { error: 'Local não encontrado' }

        // Manteve o mesmo projectId ou tentou mudar
        const targetProjectId = parsed.data.projectId || location.projectId

        // Validar se obra alvo pertence ao tenant
        const [project] = await db
            .select()
            .from(projects)
            .where(and(eq(projects.id, targetProjectId), eq(projects.tenantId, tenant.id)))
            .limit(1)

        if (!project) return { error: 'Obra não encontrada no tenant atual' }

        const updateData: Record<string, unknown> = { updatedAt: new Date() }
        if (parsed.data.name !== undefined) updateData.name = parsed.data.name
        if (parsed.data.description !== undefined) updateData.description = parsed.data.description
        if (parsed.data.projectId !== undefined) updateData.projectId = parsed.data.projectId

        const [updated] = await db
            .update(locations)
            .set(updateData)
            .where(eq(locations.id, locationId))
            .returning()

        logger.info({ userId: user.id, tenantId: tenant.id, locationId, action: 'location.updated' }, 'Local atualizado')

        revalidatePath(`/${tenant.slug}/locations`)
        return { data: updated }
    } catch (err) {
        logger.error({ err, locationId }, 'Erro ao atualizar local')
        return { error: 'Erro ao atualizar local' }
    }
}
