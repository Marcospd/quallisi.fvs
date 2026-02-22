import { describe, it, expect } from 'vitest'
import { createPlanningItemSchema } from './schemas'

const validUuid = '550e8400-e29b-41d4-a716-446655440000'

describe('createPlanningItemSchema', () => {
    it('aceita dados válidos', () => {
        const result = createPlanningItemSchema.safeParse({
            projectId: validUuid,
            serviceId: validUuid,
            locationId: validUuid,
            referenceMonth: '2026-02',
        })
        expect(result.success).toBe(true)
    })

    it('rejeita mês em formato errado', () => {
        const result = createPlanningItemSchema.safeParse({
            projectId: validUuid,
            serviceId: validUuid,
            locationId: validUuid,
            referenceMonth: '02/2026',
        })
        expect(result.success).toBe(false)
    })

    it('rejeita mês com dia', () => {
        const result = createPlanningItemSchema.safeParse({
            projectId: validUuid,
            serviceId: validUuid,
            locationId: validUuid,
            referenceMonth: '2026-02-15',
        })
        expect(result.success).toBe(false)
    })

    it('rejeita UUID inválido', () => {
        const result = createPlanningItemSchema.safeParse({
            projectId: 'abc',
            serviceId: validUuid,
            locationId: validUuid,
            referenceMonth: '2026-02',
        })
        expect(result.success).toBe(false)
    })
})
