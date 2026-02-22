import { describe, it, expect } from 'vitest'
import { createProjectSchema } from './schemas'

describe('createProjectSchema', () => {
    it('aceita nome válido sem endereço', () => {
        const result = createProjectSchema.safeParse({ name: 'Obra Residencial' })
        expect(result.success).toBe(true)
    })

    it('aceita nome e endereço válidos', () => {
        const result = createProjectSchema.safeParse({
            name: 'Edifício Solar',
            address: 'Rua das Flores, 123',
        })
        expect(result.success).toBe(true)
    })

    it('aceita endereço vazio', () => {
        const result = createProjectSchema.safeParse({
            name: 'Obra Comercial',
            address: '',
        })
        expect(result.success).toBe(true)
    })

    it('rejeita nome curto', () => {
        const result = createProjectSchema.safeParse({ name: 'AB' })
        expect(result.success).toBe(false)
    })

    it('rejeita nome longo demais', () => {
        const result = createProjectSchema.safeParse({ name: 'a'.repeat(256) })
        expect(result.success).toBe(false)
    })
})
