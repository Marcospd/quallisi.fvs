import { z } from 'zod'

/**
 * Schema para criar/editar obra.
 */
export const createProjectSchema = z.object({
    name: z
        .string()
        .min(3, 'Nome deve ter no mínimo 3 caracteres')
        .max(255, 'Nome deve ter no máximo 255 caracteres'),
    address: z
        .string()
        .max(500, 'Endereço deve ter no máximo 500 caracteres')
        .optional()
        .or(z.literal('')),
})

export const updateProjectSchema = createProjectSchema.partial()

export type CreateProjectInput = z.infer<typeof createProjectSchema>
