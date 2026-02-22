'use server'

import { eq, and, desc } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'
import { notifications, users, projects } from '@/lib/db/schema'
import { getAuthContext } from '@/features/auth/actions'
import { logger } from '@/lib/logger'

/**
 * Lista notificações do usuário logado.
 */
export async function listNotifications() {
    const { user } = await getAuthContext()

    try {
        const result = await db
            .select()
            .from(notifications)
            .where(eq(notifications.userId, user.id))
            .orderBy(desc(notifications.createdAt))
            .limit(50)

        return { data: result }
    } catch (err) {
        logger.error({ err, userId: user.id }, 'Erro ao listar notificações')
        return { error: 'Erro ao carregar notificações' }
    }
}

/**
 * Marca uma notificação como lida.
 */
export async function markAsRead(notificationId: string) {
    const { user } = await getAuthContext()

    try {
        const [updated] = await db
            .update(notifications)
            .set({ read: true })
            .where(and(eq(notifications.id, notificationId), eq(notifications.userId, user.id)))
            .returning()

        if (!updated) return { error: 'Notificação não encontrada' }

        revalidatePath(`/${(await getAuthContext()).tenant.slug}/notifications`)
        return { data: updated }
    } catch (err) {
        logger.error({ err, notificationId }, 'Erro ao marcar como lida')
        return { error: 'Erro ao atualizar notificação' }
    }
}

/**
 * Marca todas as notificações do usuário como lidas.
 */
export async function markAllAsRead() {
    const { user, tenant } = await getAuthContext()

    try {
        await db
            .update(notifications)
            .set({ read: true })
            .where(and(eq(notifications.userId, user.id), eq(notifications.read, false)))

        revalidatePath(`/${tenant.slug}/notifications`)
        return { data: { success: true } }
    } catch (err) {
        logger.error({ err, userId: user.id }, 'Erro ao marcar todas como lidas')
        return { error: 'Erro ao atualizar notificações' }
    }
}

/**
 * Conta notificações não lidas do usuário.
 */
export async function getUnreadCount() {
    const { user } = await getAuthContext()

    try {
        const result = await db
            .select()
            .from(notifications)
            .where(and(eq(notifications.userId, user.id), eq(notifications.read, false)))

        return { data: result.length }
    } catch (err) {
        logger.error({ err, userId: user.id }, 'Erro ao contar notificações')
        return { error: 'Erro ao contar notificações' }
    }
}
