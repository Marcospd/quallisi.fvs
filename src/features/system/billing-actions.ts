'use server'

import { eq, asc, desc } from 'drizzle-orm'
import type { AnyColumn } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'
import { plans, subscriptions, invoices, tenants } from '@/lib/db/schema'
import { getSystemAuthContext } from '@/features/auth/actions'
import { logger } from '@/lib/logger'

/**
 * Lista todos os planos do SaaS.
 */
export async function listPlans() {
    await getSystemAuthContext()

    try {
        const result = await db.select().from(plans).orderBy(plans.name)
        return { data: result }
    } catch (err) {
        logger.error({ err }, 'Erro ao listar planos')
        return { error: 'Erro ao carregar planos' }
    }
}

/**
 * Lista assinaturas com dados do tenant e plano.
 */
export async function listSubscriptions() {
    await getSystemAuthContext()

    try {
        const result = await db
            .select({
                subscription: subscriptions,
                tenant: tenants,
                plan: plans,
            })
            .from(subscriptions)
            .innerJoin(tenants, eq(subscriptions.tenantId, tenants.id))
            .innerJoin(plans, eq(subscriptions.planId, plans.id))
            .orderBy(desc(subscriptions.currentPeriodEnd))

        return { data: result }
    } catch (err) {
        logger.error({ err }, 'Erro ao listar assinaturas')
        return { error: 'Erro ao carregar assinaturas' }
    }
}

/**
 * Lista faturas com dados da assinatura e tenant.
 */
export async function listInvoices(options?: {
    sort?: string
    order?: 'asc' | 'desc'
}) {
    await getSystemAuthContext()

    const sortMap: Record<string, AnyColumn> = {
        tenant: tenants.name,
        amount: invoices.amountBrl,
        dueDate: invoices.dueDate,
        status: invoices.status,
    }

    try {
        const sortColumn = sortMap[options?.sort ?? '']
        const orderFn = options?.order === 'desc' ? desc : asc

        const result = await db
            .select({
                invoice: invoices,
                subscription: subscriptions,
                tenant: tenants,
            })
            .from(invoices)
            .innerJoin(subscriptions, eq(invoices.subscriptionId, subscriptions.id))
            .innerJoin(tenants, eq(subscriptions.tenantId, tenants.id))
            .orderBy(sortColumn ? orderFn(sortColumn) : desc(invoices.dueDate))

        return { data: result }
    } catch (err) {
        logger.error({ err }, 'Erro ao listar faturas')
        return { error: 'Erro ao carregar faturas' }
    }
}

/**
 * Marca uma fatura como paga.
 * Registra a data e o método de pagamento.
 */
export async function markInvoiceAsPaid(invoiceId: string, paymentMethod: string) {
    const ctx = await getSystemAuthContext()

    try {
        const [invoice] = await db
            .update(invoices)
            .set({
                status: 'PAID',
                paidAt: new Date(),
                paymentMethod,
            })
            .where(eq(invoices.id, invoiceId))
            .returning()

        if (!invoice) return { error: 'Fatura não encontrada' }

        logger.info(
            { userId: ctx.user.id, invoiceId, action: 'invoice.paid' },
            'Fatura marcada como paga'
        )

        revalidatePath('/system/billing')
        return { data: invoice }
    } catch (err) {
        logger.error({ err, invoiceId }, 'Erro ao marcar fatura como paga')
        return { error: 'Erro ao registrar pagamento' }
    }
}

/**
 * Marca uma fatura como em atraso (OVERDUE).
 */
export async function markInvoiceAsOverdue(invoiceId: string) {
    const ctx = await getSystemAuthContext()

    try {
        const [invoice] = await db
            .update(invoices)
            .set({ status: 'OVERDUE' })
            .where(eq(invoices.id, invoiceId))
            .returning()

        if (!invoice) return { error: 'Fatura não encontrada' }

        logger.info(
            { userId: ctx.user.id, invoiceId, action: 'invoice.overdue' },
            'Fatura marcada como em atraso'
        )

        revalidatePath('/system/billing')
        return { data: invoice }
    } catch (err) {
        logger.error({ err, invoiceId }, 'Erro ao marcar fatura como atrasada')
        return { error: 'Erro ao alterar status da fatura' }
    }
}
