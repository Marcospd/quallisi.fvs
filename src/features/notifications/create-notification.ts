'use server'

import { db } from '@/lib/db'
import { notifications, users, projects, inspections, services, locations } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { sendEmail } from '@/lib/email/resend'
import { inspectionCompletedEmail, issueCreatedEmail, issueResolvedEmail } from '@/lib/email/templates'
import { logger } from '@/lib/logger'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

/**
 * Cria notificação in-app para um usuário.
 */
async function createInAppNotification(params: {
    userId: string
    type: string
    title: string
    message: string
    link?: string
}) {
    try {
        await db.insert(notifications).values({
            userId: params.userId,
            type: params.type,
            title: params.title,
            message: params.message,
            link: params.link || null,
        })
    } catch (err) {
        logger.error({ err, ...params }, 'Erro ao criar notificação in-app')
    }
}

/**
 * Notifica supervisores e admins quando uma inspeção é finalizada.
 */
export async function notifyInspectionCompleted(inspectionId: string, tenantSlug: string) {
    try {
        // Buscar dados da inspeção
        const [inspData] = await db
            .select({
                inspection: inspections,
                service: services,
                location: locations,
            })
            .from(inspections)
            .innerJoin(services, eq(inspections.serviceId, services.id))
            .innerJoin(locations, eq(inspections.locationId, locations.id))
            .where(eq(inspections.id, inspectionId))
            .limit(1)

        if (!inspData) return

        // Buscar inspetor
        const [inspector] = await db
            .select()
            .from(users)
            .where(eq(users.id, inspData.inspection.inspectorId))
            .limit(1)

        // Buscar supervisores e admins do tenant
        const [project] = await db
            .select()
            .from(projects)
            .where(eq(projects.id, inspData.inspection.projectId))
            .limit(1)

        if (!project) return

        const supervisorsAndAdmins = await db
            .select()
            .from(users)
            .where(
                and(
                    eq(users.tenantId, project.tenantId),
                    eq(users.active, true),
                )
            )

        const recipients = supervisorsAndAdmins.filter(
            (u) => (u.role === 'supervisor' || u.role === 'admin') && u.id !== inspData.inspection.inspectorId
        )

        const link = `${APP_URL}/${tenantSlug}/inspections/${inspectionId}`
        const resultLabel = inspData.inspection.result === 'APPROVED'
            ? 'aprovada'
            : inspData.inspection.result === 'APPROVED_WITH_RESTRICTIONS'
                ? 'concluída com pendências'
                : 'reprovada'

        // Notificação in-app + e-mail para cada destinatário
        for (const recipient of recipients) {
            await createInAppNotification({
                userId: recipient.id,
                type: 'INSPECTION_COMPLETED',
                title: `Inspeção ${resultLabel}`,
                message: `${inspector?.name || 'Inspetor'} finalizou a inspeção de ${inspData.service.name} em ${inspData.location.name} — ${resultLabel}`,
                link: `/${tenantSlug}/inspections/${inspectionId}`,
            })

            if (recipient.email) {
                const email = inspectionCompletedEmail({
                    inspectorName: inspector?.name || 'Inspetor',
                    serviceName: inspData.service.name,
                    locationName: inspData.location.name,
                    result: inspData.inspection.result || 'UNKNOWN',
                    link,
                })
                await sendEmail({ to: recipient.email, ...email })
            }
        }

        logger.info({ inspectionId, recipientCount: recipients.length }, 'Notificações de inspeção enviadas')
    } catch (err) {
        logger.error({ err, inspectionId }, 'Erro ao notificar inspeção concluída')
    }
}

/**
 * Notifica quando uma pendência é criada.
 */
export async function notifyIssueCreated(params: {
    inspectionId: string
    description: string
    tenantSlug: string
}) {
    try {
        const [inspData] = await db
            .select({
                inspection: inspections,
                service: services,
                location: locations,
            })
            .from(inspections)
            .innerJoin(services, eq(inspections.serviceId, services.id))
            .innerJoin(locations, eq(inspections.locationId, locations.id))
            .where(eq(inspections.id, params.inspectionId))
            .limit(1)

        if (!inspData) return

        const [project] = await db
            .select()
            .from(projects)
            .where(eq(projects.id, inspData.inspection.projectId))
            .limit(1)

        if (!project) return

        const supervisors = await db
            .select()
            .from(users)
            .where(
                and(
                    eq(users.tenantId, project.tenantId),
                    eq(users.active, true),
                    eq(users.role, 'supervisor'),
                )
            )

        const link = `${APP_URL}/${params.tenantSlug}/issues`

        for (const supervisor of supervisors) {
            await createInAppNotification({
                userId: supervisor.id,
                type: 'ISSUE_CREATED',
                title: 'Nova pendência',
                message: `NC em ${inspData.service.name} — ${inspData.location.name}: ${params.description}`,
                link: `/${params.tenantSlug}/issues`,
            })

            if (supervisor.email) {
                const email = issueCreatedEmail({
                    serviceName: inspData.service.name,
                    locationName: inspData.location.name,
                    description: params.description,
                    link,
                })
                await sendEmail({ to: supervisor.email, ...email })
            }
        }
    } catch (err) {
        logger.error({ err }, 'Erro ao notificar pendência criada')
    }
}
