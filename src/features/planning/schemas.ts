import { z } from 'zod'

/**
 * Schema para criar item de planejamento.
 */
export const createPlanningItemSchema = z.object({
    projectId: z.string().uuid(),
    serviceId: z.string().uuid(),
    locationId: z.string().uuid(),
    referenceMonth: z.string().regex(/^\d{4}-\d{2}$/, 'Formato: YYYY-MM'),
})

export type CreatePlanningItemInput = z.infer<typeof createPlanningItemSchema>
