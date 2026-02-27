import { z } from 'zod'

/**
 * Sub-schema para item de medição (quantidade executada no período).
 */
export const measurementItemSchema = z.object({
    contractItemId: z.string().uuid(),
    quantityThisPeriod: z.number().min(0, 'Quantidade não pode ser negativa'),
})

/**
 * Sub-schema para aditivo (item fora do contrato).
 */
export const measurementAdditiveSchema = z.object({
    itemNumber: z.string().min(1, 'Informe o número do item'),
    serviceName: z.string().min(2, 'Informe o serviço'),
    unit: z.enum(['M2', 'M3', 'ML', 'KG', 'VB', 'DIA', 'UNID', 'M', 'TON', 'L'], {
        message: 'Selecione a unidade',
    }),
    unitPrice: z.number().min(0.0001, 'Preço deve ser maior que zero'),
    contractedQuantity: z.number().min(0.0001, 'Quantidade deve ser maior que zero'),
    quantityThisPeriod: z.number().min(0, 'Quantidade não pode ser negativa'),
    sortOrder: z.number().int().optional(),
})

/**
 * Schema para criar boletim de medição.
 */
export const createBulletinSchema = z.object({
    contractId: z.string().uuid('Selecione um contrato'),
    bmNumber: z.number().int().min(1, 'Número do BM obrigatório'),
    sheetNumber: z.number().int().min(1).optional(),
    periodStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida'),
    periodEnd: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida'),
    dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida').optional().or(z.literal('')),
    discountValue: z.number().min(0),
    observations: z.string().max(2000).optional().or(z.literal('')),
    items: z.array(measurementItemSchema),
    additives: z.array(measurementAdditiveSchema).optional(),
})

export const updateBulletinSchema = createBulletinSchema.partial()

/**
 * Schema para aprovação/rejeição.
 */
export const approvalSchema = z.object({
    stage: z.enum(['PLANNING', 'MANAGEMENT', 'CONTRACTOR'], {
        message: 'Selecione a etapa',
    }),
    action: z.enum(['APPROVED', 'REJECTED'], {
        message: 'Selecione a ação',
    }),
    notes: z.string().max(1000).optional().or(z.literal('')),
})

export type CreateBulletinInput = z.infer<typeof createBulletinSchema>
export type MeasurementItemInput = z.infer<typeof measurementItemSchema>
export type MeasurementAdditiveInput = z.infer<typeof measurementAdditiveSchema>
export type ApprovalInput = z.infer<typeof approvalSchema>
