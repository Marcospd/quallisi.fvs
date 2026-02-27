import { z } from 'zod'

const SERVICE_UNITS = [
    'm²', 'm', 'm³', 'un', 'kg', 'vb', 'h', 't', 'l', 'cx', 'pç', 'sc',
] as const

/**
 * Schema para criar serviço.
 */
export const createServiceSchema = z.object({
    name: z.string().min(3, 'Nome mínimo 3 caracteres').max(255),
    unit: z.string().max(50).optional().or(z.literal('')),
    description: z.string().max(500).optional().or(z.literal('')),
})

/**
 * Schema para adicionar critério a um serviço.
 */
export const addCriterionSchema = z.object({
    serviceId: z.string().uuid(),
    description: z.string().min(5, 'Descrição mínima 5 caracteres'),
    sortOrder: z.number().int().min(0).optional(),
})

export const updateServiceSchema = createServiceSchema.partial()

export type CreateServiceInput = z.infer<typeof createServiceSchema>
export type AddCriterionInput = z.infer<typeof addCriterionSchema>
export { SERVICE_UNITS }
