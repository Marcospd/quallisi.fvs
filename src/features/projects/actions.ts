'use server'

import { eq, and } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'
import { projects } from '@/lib/db/schema'
import { getAuthContext } from '@/features/auth/actions'
import { createProjectSchema } from './schemas'
import { logger } from '@/lib/logger'

/**
 * Lista obras do tenant atual.
 * Sempre filtrado por tenantId — isolamento obrigatório.
 */
export async function listProjects() {
    const { tenant } = await getAuthContext()

    try {
        const result = await db
            .select()
            .from(projects)
            .where(eq(projects.tenantId, tenant.id))
            .orderBy(projects.name)

        return { data: result }
    } catch (err) {
        logger.error({ err, tenantId: tenant.id }, 'Erro ao listar obras')
        return { error: 'Erro ao carregar obras' }
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
