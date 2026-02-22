import { z } from 'zod'

/**
 * Schema para criar/editar tenant.
 * Slug é gerado automaticamente se não fornecido.
 */
export const createTenantSchema = z.object({
    name: z
        .string()
        .min(3, 'Nome deve ter no mínimo 3 caracteres')
        .max(255, 'Nome deve ter no máximo 255 caracteres'),
    slug: z
        .string()
        .min(3, 'Slug deve ter no mínimo 3 caracteres')
        .max(100, 'Slug deve ter no máximo 100 caracteres')
        .regex(/^[a-z0-9-]+$/, 'Slug deve conter apenas letras minúsculas, números e hífens'),
})

export const updateTenantSchema = createTenantSchema.partial()

export const changeTenantStatusSchema = z.object({
    tenantId: z.string().uuid('ID do tenant inválido'),
    status: z.enum(['ACTIVE', 'SUSPENDED', 'CANCELLED'], {
        message: 'Status inválido',
    }),
})

export type CreateTenantInput = z.infer<typeof createTenantSchema>
export type UpdateTenantInput = z.infer<typeof updateTenantSchema>
export type ChangeTenantStatusInput = z.infer<typeof changeTenantStatusSchema>
