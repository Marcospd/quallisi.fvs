import { describe, it, expect } from 'vitest'
import { loginSchema, registerSchema } from './schemas'

describe('loginSchema', () => {
    it('aceita dados válidos', () => {
        const result = loginSchema.safeParse({ email: 'test@email.com', password: '123456' })
        expect(result.success).toBe(true)
    })

    it('rejeita e-mail vazio', () => {
        const result = loginSchema.safeParse({ email: '', password: '123456' })
        expect(result.success).toBe(false)
    })

    it('rejeita e-mail inválido', () => {
        const result = loginSchema.safeParse({ email: 'invalido', password: '123456' })
        expect(result.success).toBe(false)
    })

    it('rejeita senha curta', () => {
        const result = loginSchema.safeParse({ email: 'test@email.com', password: '123' })
        expect(result.success).toBe(false)
    })

    it('rejeita campos ausentes', () => {
        const result = loginSchema.safeParse({})
        expect(result.success).toBe(false)
    })
})

describe('registerSchema', () => {
    it('aceita dados válidos', () => {
        const result = registerSchema.safeParse({
            name: 'João Silva',
            email: 'joao@email.com',
            password: 'senha123',
        })
        expect(result.success).toBe(true)
    })

    it('rejeita nome curto', () => {
        const result = registerSchema.safeParse({
            name: 'AB',
            email: 'test@email.com',
            password: 'senha123',
        })
        expect(result.success).toBe(false)
    })

    it('rejeita senha longa demais', () => {
        const result = registerSchema.safeParse({
            name: 'João Silva',
            email: 'test@email.com',
            password: 'a'.repeat(73),
        })
        expect(result.success).toBe(false)
    })
})
