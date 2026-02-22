'use server'

import { eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'
import { tenants } from '@/lib/db/schema'
import { getSystemAuthContext } from '@/features/auth/actions'
import { createTenantSchema, changeTenantStatusSchema } from './schemas'
import { logger } from '@/lib/logger'

/**
 * Cria um novo tenant (construtora).
 * Apenas system users podem executar.
 */
export async function createTenant(input: unknown) {
    const ctx = await getSystemAuthContext()

    const parsed = createTenantSchema.safeParse(input)
    if (!parsed.success) {
        return { error: parsed.error.flatten() }
    }

    try {
        // Verificar se slug já existe
        const [existing] = await db
            .select()
            .from(tenants)
            .where(eq(tenants.slug, parsed.data.slug))
            .limit(1)

        if (existing) {
            return { error: 'Já existe uma construtora com este slug' }
        }

        const [tenant] = await db
            .insert(tenants)
            .values({
                name: parsed.data.name,
                slug: parsed.data.slug,
            })
            .returning()

        logger.info(
            { userId: ctx.user.id, tenantId: tenant.id, action: 'tenant.created' },
            'Tenant criado'
        )

        revalidatePath('/system/tenants')
        revalidatePath('/system')
        return { data: tenant }
    } catch (err) {
        logger.error({ err }, 'Erro ao criar tenant')
        return { error: 'Erro ao criar construtora' }
    }
}

/**
 * Altera o status de um tenant.
 * ACTIVE → SUSPENDED → CANCELLED (ou qualquer combinação).
 */
export async function changeTenantStatus(input: unknown) {
    const ctx = await getSystemAuthContext()

    const parsed = changeTenantStatusSchema.safeParse(input)
    if (!parsed.success) {
        return { error: parsed.error.flatten() }
    }

    try {
        const [tenant] = await db
            .update(tenants)
            .set({
                status: parsed.data.status,
                updatedAt: new Date(),
            })
            .where(eq(tenants.id, parsed.data.tenantId))
            .returning()

        if (!tenant) {
            return { error: 'Construtora não encontrada' }
        }

        logger.info(
            {
                userId: ctx.user.id,
                tenantId: tenant.id,
                newStatus: parsed.data.status,
                action: 'tenant.status_changed',
            },
            'Status do tenant alterado'
        )

        revalidatePath('/system/tenants')
        revalidatePath('/system')
        return { data: tenant }
    } catch (err) {
        logger.error({ err }, 'Erro ao alterar status do tenant')
        return { error: 'Erro ao alterar status' }
    }
}

/**
 * Busca detalhes de um tenant por ID.
 */
export async function getTenantById(tenantId: string) {
    await getSystemAuthContext()

    try {
        const [tenant] = await db
            .select()
            .from(tenants)
            .where(eq(tenants.id, tenantId))
            .limit(1)

        if (!tenant) return { error: 'Construtora não encontrada' }

        return { data: tenant }
    } catch (err) {
        logger.error({ err, tenantId }, 'Erro ao buscar tenant')
        return { error: 'Erro ao carregar construtora' }
    }
}
