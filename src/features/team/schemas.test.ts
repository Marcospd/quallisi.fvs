import { describe, it, expect } from 'vitest'
import { inviteMemberSchema, updateMemberRoleSchema } from './schemas'

describe('inviteMemberSchema', () => {
    it('aceita dados válidos de inspetor', () => {
        const result = inviteMemberSchema.safeParse({
            name: 'Maria Silva',
            email: 'maria@email.com',
            role: 'inspetor',
        })
        expect(result.success).toBe(true)
    })

    it('aceita role admin', () => {
        const result = inviteMemberSchema.safeParse({
            name: 'João Admin',
            email: 'joao@email.com',
            role: 'admin',
        })
        expect(result.success).toBe(true)
    })

    it('aceita role supervisor', () => {
        const result = inviteMemberSchema.safeParse({
            name: 'Ana Supervisor',
            email: 'ana@email.com',
            role: 'supervisor',
        })
        expect(result.success).toBe(true)
    })

    it('rejeita role inválido', () => {
        const result = inviteMemberSchema.safeParse({
            name: 'Teste',
            email: 'teste@email.com',
            role: 'gerente',
        })
        expect(result.success).toBe(false)
    })

    it('rejeita nome curto', () => {
        const result = inviteMemberSchema.safeParse({
            name: 'A',
            email: 'teste@email.com',
            role: 'inspetor',
        })
        expect(result.success).toBe(false)
    })

    it('rejeita e-mail inválido', () => {
        const result = inviteMemberSchema.safeParse({
            name: 'Teste Silva',
            email: 'nao-eh-email',
            role: 'inspetor',
        })
        expect(result.success).toBe(false)
    })
})

describe('updateMemberRoleSchema', () => {
    it('aceita dados válidos', () => {
        const result = updateMemberRoleSchema.safeParse({
            userId: '550e8400-e29b-41d4-a716-446655440000',
            role: 'supervisor',
        })
        expect(result.success).toBe(true)
    })

    it('rejeita UUID inválido', () => {
        const result = updateMemberRoleSchema.safeParse({
            userId: 'not-uuid',
            role: 'admin',
        })
        expect(result.success).toBe(false)
    })
})
