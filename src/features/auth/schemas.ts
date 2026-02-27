import { z } from 'zod'

/**
 * Validação de senha forte: mín. 8 chars, 1 maiúscula, 1 minúscula, 1 dígito.
 */
const strongPassword = z
    .string()
    .min(8, 'Senha deve ter no mínimo 8 caracteres')
    .max(72, 'Senha deve ter no máximo 72 caracteres')
    .refine((val) => /[A-Z]/.test(val), 'Senha deve conter pelo menos 1 letra maiúscula')
    .refine((val) => /[a-z]/.test(val), 'Senha deve conter pelo menos 1 letra minúscula')
    .refine((val) => /[0-9]/.test(val), 'Senha deve conter pelo menos 1 número')

/**
 * Schema de login — validação de e-mail e senha.
 * Mensagens em PT-BR.
 */
export const loginSchema = z.object({
    email: z
        .string()
        .min(1, 'E-mail é obrigatório')
        .email('E-mail inválido'),
    password: z
        .string()
        .min(8, 'Senha deve ter no mínimo 8 caracteres'),
})

/**
 * Schema de registro — e-mail, senha forte e nome.
 * Mensagens em PT-BR.
 */
export const registerSchema = z.object({
    name: z
        .string()
        .min(3, 'Nome deve ter no mínimo 3 caracteres')
        .max(255, 'Nome deve ter no máximo 255 caracteres'),
    email: z
        .string()
        .min(1, 'E-mail é obrigatório')
        .email('E-mail inválido'),
    password: strongPassword,
})

/**
 * Schema de cadastro de empresa — registro público com plano.
 * Estende registerSchema com dados da construtora.
 */
export const tenantRegisterSchema = registerSchema.extend({
    companyName: z
        .string()
        .min(3, 'Nome da empresa deve ter no mínimo 3 caracteres')
        .max(255, 'Nome da empresa deve ter no máximo 255 caracteres'),
    planId: z
        .string()
        .uuid('Plano inválido'),
})

/**
 * Schema de esqueci minha senha — apenas e-mail.
 */
export const forgotPasswordSchema = z.object({
    email: z
        .string()
        .min(1, 'E-mail é obrigatório')
        .email('E-mail inválido'),
})

/**
 * Schema de redefinição de senha — senha forte com confirmação.
 */
export const resetPasswordSchema = z.object({
    password: strongPassword,
    confirmPassword: z
        .string()
        .min(1, 'Confirmação de senha é obrigatória'),
}).refine((data) => data.password === data.confirmPassword, {
    message: 'As senhas não coincidem',
    path: ['confirmPassword'],
})

export type LoginInput = z.infer<typeof loginSchema>
export type RegisterInput = z.infer<typeof registerSchema>
export type TenantRegisterInput = z.infer<typeof tenantRegisterSchema>
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>
