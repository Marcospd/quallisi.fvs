import { z } from 'zod'

/**
 * Unidades de medida disponíveis para itens de contrato.
 */
export const unitOptions = ['M2', 'M3', 'ML', 'KG', 'VB', 'DIA', 'UNID', 'M', 'TON', 'L'] as const

/**
 * Sub-schema para item de contrato.
 */
export const contractItemSchema = z.object({
    itemNumber: z.string().min(1, 'Informe o número do item'),
    serviceName: z.string().min(2, 'Informe o serviço'),
    unit: z.enum(['M2', 'M3', 'ML', 'KG', 'VB', 'DIA', 'UNID', 'M', 'TON', 'L'], {
        message: 'Selecione a unidade',
    }),
    unitPrice: z.number().min(0.0001, 'Preço deve ser maior que zero'),
    contractedQuantity: z.number().min(0.0001, 'Quantidade deve ser maior que zero'),
    sortOrder: z.number().int().optional(),
})

/**
 * Schema para criar contrato.
 */
export const createContractSchema = z.object({
    projectId: z.string().uuid('Selecione uma obra'),
    contractorId: z.string().uuid('Selecione uma empreiteira'),
    contractNumber: z.string().min(1, 'Informe o número do contrato').max(50),
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida'),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida').optional().or(z.literal('')),
    technicalRetentionPct: z.number().min(0).max(100),
    notes: z.string().max(2000).optional().or(z.literal('')),
    items: z.array(contractItemSchema).min(1, 'Adicione pelo menos um item'),
})

export const updateContractSchema = createContractSchema.partial()

export type CreateContractInput = z.infer<typeof createContractSchema>
export type ContractItemInput = z.infer<typeof contractItemSchema>
