import { z } from 'zod'

/**
 * Schema para criar/editar local de inspeção.
 */
export const createLocationSchema = z.object({
    projectId: z.string().uuid('Selecione uma obra'),
    name: z
        .string()
        .min(2, 'Nome deve ter no mínimo 2 caracteres')
        .max(255, 'Nome deve ter no máximo 255 caracteres'),
    description: z
        .string()
        .max(500, 'Descrição deve ter no máximo 500 caracteres')
        .optional()
        .or(z.literal('')),
})

export const updateLocationSchema = createLocationSchema.partial()

export type CreateLocationInput = z.infer<typeof createLocationSchema>
