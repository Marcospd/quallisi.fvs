import { describe, it, expect } from 'vitest'
import { createServiceSchema, addCriterionSchema } from './schemas'

const validUuid = '550e8400-e29b-41d4-a716-446655440000'

describe('createServiceSchema', () => {
    it('aceita nome válido', () => {
        const result = createServiceSchema.safeParse({ name: 'Alvenaria' })
        expect(result.success).toBe(true)
    })

    it('aceita nome e descrição', () => {
        const result = createServiceSchema.safeParse({
            name: 'Revestimento',
            description: 'Revestimento interno',
        })
        expect(result.success).toBe(true)
    })

    it('rejeita nome curto', () => {
        const result = createServiceSchema.safeParse({ name: 'A' })
        expect(result.success).toBe(false)
    })
})

describe('addCriterionSchema', () => {
    it('aceita dados válidos', () => {
        const result = addCriterionSchema.safeParse({
            serviceId: validUuid,
            description: 'Verificar prumo da parede',
        })
        expect(result.success).toBe(true)
    })

    it('aceita com sortOrder explícito', () => {
        const result = addCriterionSchema.safeParse({
            serviceId: validUuid,
            description: 'Verificar nível',
            sortOrder: 5,
        })
        expect(result.success).toBe(true)
        if (result.success) {
            expect(result.data.sortOrder).toBe(5)
        }
    })

    it('rejeita descrição vazia', () => {
        const result = addCriterionSchema.safeParse({
            serviceId: validUuid,
            description: '',
        })
        expect(result.success).toBe(false)
    })
})
