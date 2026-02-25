import { z } from 'zod'

const inviteMemberBase = z.object({
    name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
    email: z.string().email('E-mail inválido'),
    role: z.enum(['admin', 'supervisor', 'inspetor'], {
        message: 'Selecione um perfil',
    }),
    sendInvite: z.boolean(),
    password: z.string().max(72).optional(),
})

export const inviteMemberSchema = inviteMemberBase.refine(
    (data) => data.sendInvite || (data.password && data.password.length >= 6),
    { message: 'Informe uma senha com pelo menos 6 caracteres', path: ['password'] }
)

export type InviteMemberInput = z.infer<typeof inviteMemberBase>

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

export const resetMemberPasswordSchema = z.object({
    userId: z.string().uuid(),
    password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres').max(72, 'Senha muito longa'),
})

export type ResetMemberPasswordInput = z.infer<typeof resetMemberPasswordSchema>
