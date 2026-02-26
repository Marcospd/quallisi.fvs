'use server'

import { eq, and, asc, desc } from 'drizzle-orm'
import type { AnyColumn } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'
import { issues, inspections, projects, services, locations, users } from '@/lib/db/schema'
import { getAuthContext } from '@/features/auth/actions'
import { logger } from '@/lib/logger'
import { notifyIssueCreated } from '@/features/notifications/create-notification'
import { z } from 'zod'

const createIssueSchema = z.object({
    inspectionId: z.string().uuid(),
    description: z.string().min(5, 'Descrição mínima 5 caracteres'),
    assignedTo: z.string().uuid().optional(),
})

const updateIssueStatusSchema = z.object({
    issueId: z.string().uuid(),
    status: z.enum(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CANCELLED']),
    notes: z.string().optional(),
})

/**
 * Lista pendências do tenant com dados da inspeção.
 */
export async function listIssues(filter?: {
    status?: string
    sort?: string
    order?: 'asc' | 'desc'
}) {
    const { user, tenant } = await getAuthContext()

    const sortMap: Record<string, AnyColumn> = {
        description: issues.description,
        project: projects.name,
        service: services.name,
        location: locations.name,
        month: inspections.referenceMonth,
        status: issues.status,
        date: issues.createdAt,
    }

    try {
        const sortColumn = sortMap[filter?.sort ?? '']
        const orderFn = filter?.order === 'desc' ? desc : asc

        const conditions = [eq(projects.tenantId, tenant.id)]

        if (filter?.status) {
            conditions.push(eq(issues.status, filter.status))
        }

        // Inspetor vê apenas pendências das suas inspeções
        if (user.role === 'inspetor') {
            conditions.push(eq(inspections.inspectorId, user.id))
        }

        const result = await db
            .select({
                issue: issues,
                service: services,
                location: locations,
                inspection: inspections,
                project: projects,
            })
            .from(issues)
            .innerJoin(inspections, eq(issues.inspectionId, inspections.id))
            .innerJoin(services, eq(inspections.serviceId, services.id))
            .innerJoin(locations, eq(inspections.locationId, locations.id))
            .innerJoin(projects, eq(inspections.projectId, projects.id))
            .where(and(...conditions))
            .orderBy(sortColumn ? orderFn(sortColumn) : desc(issues.createdAt))

        return { data: result }
    } catch (err) {
        logger.error({ err, tenantId: tenant.id }, 'Erro ao listar pendências')
        return { error: 'Erro ao carregar pendências' }
    }
}

/**
 * Cria uma pendência a partir de uma inspeção com NC.
 */
export async function createIssue(input: unknown) {
    const { user, tenant } = await getAuthContext()

    const parsed = createIssueSchema.safeParse(input)
    if (!parsed.success) return { error: parsed.error.flatten() }

    try {
        // Verificar que a inspeção pertence ao tenant
        const [inspection] = await db
            .select({ id: inspections.id, projectId: inspections.projectId })
            .from(inspections)
            .innerJoin(projects, eq(inspections.projectId, projects.id))
            .where(
                and(eq(inspections.id, parsed.data.inspectionId), eq(projects.tenantId, tenant.id))
            )
            .limit(1)

        if (!inspection) return { error: 'Inspeção não encontrada' }

        const [issue] = await db
            .insert(issues)
            .values({
                inspectionId: parsed.data.inspectionId,
                description: parsed.data.description,
                assignedTo: parsed.data.assignedTo || null,
            })
            .returning()

        logger.info({ userId: user.id, issueId: issue.id, action: 'issue.created' }, 'Pendência criada')
        revalidatePath(`/${tenant.slug}/issues`)

        // Notificar supervisores (fire-and-forget)
        notifyIssueCreated({
            inspectionId: parsed.data.inspectionId,
            description: parsed.data.description,
            tenantSlug: tenant.slug,
        }).catch(() => {})

        return { data: issue }
    } catch (err) {
        logger.error({ err }, 'Erro ao criar pendência')
        return { error: 'Erro ao criar pendência' }
    }
}

/**
 * Atualiza o status de uma pendência.
 */
export async function updateIssueStatus(input: unknown) {
    const { user, tenant } = await getAuthContext()

    const parsed = updateIssueStatusSchema.safeParse(input)
    if (!parsed.success) return { error: parsed.error.flatten() }

    try {
        // Verificar que a pendência pertence ao tenant
        const [issue] = await db
            .select({ id: issues.id, inspectionId: issues.inspectionId })
            .from(issues)
            .where(eq(issues.id, parsed.data.issueId))
            .limit(1)

        if (!issue) return { error: 'Pendência não encontrada' }

        const [inspection] = await db
            .select()
            .from(inspections)
            .innerJoin(projects, eq(inspections.projectId, projects.id))
            .where(
                and(eq(inspections.id, issue.inspectionId), eq(projects.tenantId, tenant.id))
            )
            .limit(1)

        if (!inspection) return { error: 'Inspeção não encontrada' }

        const [updated] = await db
            .update(issues)
            .set({
                status: parsed.data.status,
                notes: parsed.data.notes || null,
                resolvedAt: parsed.data.status === 'RESOLVED' ? new Date() : null,
                updatedAt: new Date(),
            })
            .where(eq(issues.id, parsed.data.issueId))
            .returning()

        logger.info(
            { userId: user.id, issueId: parsed.data.issueId, status: parsed.data.status, action: 'issue.status_changed' },
            'Status da pendência alterado'
        )

        revalidatePath(`/${tenant.slug}/issues`)
        return { data: updated }
    } catch (err) {
        logger.error({ err }, 'Erro ao atualizar pendência')
        return { error: 'Erro ao atualizar pendência' }
    }
}
