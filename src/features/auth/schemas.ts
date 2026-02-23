import { z } from 'zod'

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
        .min(6, 'Senha deve ter no mínimo 6 caracteres'),
})

/**
 * Schema de registro — e-mail, senha e nome.
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
    password: z
        .string()
        .min(6, 'Senha deve ter no mínimo 6 caracteres')
        .max(72, 'Senha deve ter no máximo 72 caracteres'),
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

export type LoginInput = z.infer<typeof loginSchema>
export type RegisterInput = z.infer<typeof registerSchema>
export type TenantRegisterInput = z.infer<typeof tenantRegisterSchema>
