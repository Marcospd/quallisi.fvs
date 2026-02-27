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
    imageUrl: z.string().url('URL da imagem inválida').optional().nullable(),
    // Campos novos
    clientName: z
        .string()
        .max(255, 'Nome do cliente deve ter no máximo 255 caracteres')
        .optional()
        .or(z.literal('')),
    contractNumber: z
        .string()
        .max(100, 'Número do contrato deve ter no máximo 100 caracteres')
        .optional()
        .or(z.literal('')),
    startDate: z.string().optional().or(z.literal('')),
    endDate: z.string().optional().or(z.literal('')),
    engineerName: z
        .string()
        .max(255, 'Nome do engenheiro deve ter no máximo 255 caracteres')
        .optional()
        .or(z.literal('')),
    supervision: z
        .string()
        .max(255, 'Fiscalização deve ter no máximo 255 caracteres')
        .optional()
        .or(z.literal('')),
    characteristics: z
        .string()
        .max(2000, 'Características deve ter no máximo 2000 caracteres')
        .optional()
        .or(z.literal('')),
    notes: z
        .string()
        .max(2000, 'Observações deve ter no máximo 2000 caracteres')
        .optional()
        .or(z.literal('')),
})

export const updateProjectSchema = createProjectSchema.partial()

export type CreateProjectInput = z.infer<typeof createProjectSchema>
