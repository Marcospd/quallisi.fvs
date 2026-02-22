import { describe, it, expect } from 'vitest'
import { createTenantSchema, changeTenantStatusSchema } from './schemas'

describe('createTenantSchema', () => {
    it('aceita dados válidos', () => {
        const result = createTenantSchema.safeParse({ name: 'Construtora ABC', slug: 'construtora-abc' })
        expect(result.success).toBe(true)
    })

    it('rejeita nome curto', () => {
        const result = createTenantSchema.safeParse({ name: 'AB', slug: 'abc' })
        expect(result.success).toBe(false)
    })

    it('rejeita slug com caracteres inválidos', () => {
        const result = createTenantSchema.safeParse({ name: 'Construtora ABC', slug: 'Construtora ABC' })
        expect(result.success).toBe(false)
    })

    it('aceita slug com letras minúsculas, números e hífens', () => {
        const result = createTenantSchema.safeParse({ name: 'Construtora 123', slug: 'const-123' })
        expect(result.success).toBe(true)
    })
})

describe('changeTenantStatusSchema', () => {
    it('aceita status ACTIVE', () => {
        const result = changeTenantStatusSchema.safeParse({
            tenantId: '550e8400-e29b-41d4-a716-446655440000',
            status: 'ACTIVE',
        })
        expect(result.success).toBe(true)
    })

    it('aceita status SUSPENDED', () => {
        const result = changeTenantStatusSchema.safeParse({
            tenantId: '550e8400-e29b-41d4-a716-446655440000',
            status: 'SUSPENDED',
        })
        expect(result.success).toBe(true)
    })

    it('rejeita status inválido', () => {
        const result = changeTenantStatusSchema.safeParse({
            tenantId: '550e8400-e29b-41d4-a716-446655440000',
            status: 'INVALID',
        })
        expect(result.success).toBe(false)
    })

    it('rejeita UUID inválido', () => {
        const result = changeTenantStatusSchema.safeParse({
            tenantId: 'not-a-uuid',
            status: 'ACTIVE',
        })
        expect(result.success).toBe(false)
    })
})
