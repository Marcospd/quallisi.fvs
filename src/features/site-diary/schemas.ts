import { z } from 'zod'

/**
 * Sub-schema para entrada de mão de obra.
 */
export const laborEntrySchema = z.object({
    role: z.string().min(2, 'Informe a função'),
    quantity: z.number().int().min(1, 'Mínimo 1'),
    hours: z.number().min(0.5, 'Mínimo 0.5h'),
    sortOrder: z.number().int().optional(),
})

/**
 * Sub-schema para entrada de equipamento.
 */
export const equipmentEntrySchema = z.object({
    description: z.string().min(2, 'Informe o equipamento'),
    quantity: z.number().int().min(1, 'Mínimo 1'),
    notes: z.string().max(500).optional().or(z.literal('')),
    sortOrder: z.number().int().optional(),
})

/**
 * Sub-schema para serviço executado.
 */
export const serviceExecutedSchema = z.object({
    description: z.string().min(2, 'Informe o serviço executado'),
    serviceId: z.string().uuid().optional().or(z.literal('')),
    sortOrder: z.number().int().optional(),
})

/**
 * Sub-schema para observação/recomendação.
 */
export const observationSchema = z.object({
    origin: z.enum(['CONTRACTOR', 'INSPECTION', 'DMUA']),
    text: z.string().min(3, 'Mínimo 3 caracteres'),
})

/**
 * Schema para criar diário de obra.
 */
export const createSiteDiarySchema = z.object({
    projectId: z.string().uuid('Selecione uma obra'),
    entryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida'),
    orderNumber: z.string().max(50).optional().or(z.literal('')),
    contractorName: z.string().max(255).optional().or(z.literal('')),
    networkDiagramRef: z.string().max(100).optional().or(z.literal('')),
    engineerName: z.string().max(255).optional().or(z.literal('')),
    foremanName: z.string().max(255).optional().or(z.literal('')),
    weatherCondition: z.enum(['NONE', 'LIGHT_RAIN', 'HEAVY_RAIN']),
    workSuspended: z.boolean(),
    totalHours: z.number().min(0).max(24).optional(),
    laborEntries: z.array(laborEntrySchema).optional(),
    equipmentEntries: z.array(equipmentEntrySchema).optional(),
    servicesExecuted: z.array(serviceExecutedSchema).optional(),
    observations: z.array(observationSchema).optional(),
})

export const updateSiteDiarySchema = createSiteDiarySchema.partial()

export type CreateSiteDiaryInput = z.infer<typeof createSiteDiarySchema>
export type LaborEntryInput = z.infer<typeof laborEntrySchema>
export type EquipmentEntryInput = z.infer<typeof equipmentEntrySchema>
export type ServiceExecutedInput = z.infer<typeof serviceExecutedSchema>
export type ObservationInput = z.infer<typeof observationSchema>
