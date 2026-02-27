import { z } from 'zod'

/**
 * Schema para criar empreiteira.
 */
export const createContractorSchema = z.object({
    name: z.string().min(3, 'Nome mínimo 3 caracteres').max(255),
    cnpj: z.string().max(18).optional().or(z.literal('')),
    contactName: z.string().max(255).optional().or(z.literal('')),
    contactEmail: z.string().email('E-mail inválido').max(255).optional().or(z.literal('')),
    contactPhone: z.string().max(20).optional().or(z.literal('')),
    bankInfo: z.string().max(1000).optional().or(z.literal('')),
    nfAddress: z.string().max(1000).optional().or(z.literal('')),
    ceiMatricula: z.string().max(30).optional().or(z.literal('')),
})

export const updateContractorSchema = createContractorSchema.partial()

export type CreateContractorInput = z.infer<typeof createContractorSchema>
