'use server'

import { eq, and } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'
import { locations, projects } from '@/lib/db/schema'
import { getAuthContext } from '@/features/auth/actions'
import { createLocationSchema } from './schemas'
import { logger } from '@/lib/logger'

/**
 * Lista locais filtrados por obra e tenant.
 * Isolamento: verifica que a obra pertence ao tenant atual.
 */
export async function listLocations(projectId?: string) {
    const { tenant } = await getAuthContext()

    try {
        if (projectId) {
            // Verificar que a obra pertence ao tenant
            const [project] = await db
                .select()
                .from(projects)
                .where(and(eq(projects.id, projectId), eq(projects.tenantId, tenant.id)))
                .limit(1)

            if (!project) return { error: 'Obra não encontrada' }

            const result = await db
                .select()
                .from(locations)
                .where(eq(locations.projectId, projectId))
                .orderBy(locations.name)

            return { data: result }
        }

        // Listar todos os locais de todas as obras do tenant
        const result = await db
            .select({
                location: locations,
                project: projects,
            })
            .from(locations)
            .innerJoin(projects, eq(locations.projectId, projects.id))
            .where(eq(projects.tenantId, tenant.id))
            .orderBy(projects.name, locations.name)

        return { data: result }
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
