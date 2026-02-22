import { z } from 'zod'

export const inviteMemberSchema = z.object({
    name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
    email: z.string().email('E-mail inválido'),
    role: z.enum(['admin', 'supervisor', 'inspetor'], {
        message: 'Selecione um perfil',
    }),
})

export type InviteMemberInput = z.infer<typeof inviteMemberSchema>

export const updateMemberRoleSchema = z.object({
    userId: z.string().uuid(),
    role: z.enum(['admin', 'supervisor', 'inspetor']),
})

export type UpdateMemberRoleInput = z.infer<typeof updateMemberRoleSchema>

export const updateMemberSchema = z.object({
    name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
    role: z.enum(['admin', 'supervisor', 'inspetor']),
})

export type UpdateMemberInput = z.infer<typeof updateMemberSchema>
