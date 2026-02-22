import { z } from 'zod/v4'

/**
 * Validação de variáveis de ambiente no startup.
 * Garante que variáveis obrigatórias estão definidas antes do app iniciar.
 *
 * Uso: importar este módulo em qualquer lugar que use variáveis de ambiente.
 * O Zod vai lançar um erro claro se alguma variável obrigatória estiver faltando.
 */

const serverEnvSchema = z.object({
    // Banco de dados
    DATABASE_URL: z.string().min(1, 'DATABASE_URL é obrigatória'),

    // Supabase
    NEXT_PUBLIC_SUPABASE_URL: z.string().url('NEXT_PUBLIC_SUPABASE_URL deve ser uma URL válida'),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, 'NEXT_PUBLIC_SUPABASE_ANON_KEY é obrigatória'),
    SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, 'SUPABASE_SERVICE_ROLE_KEY é obrigatória'),

    // Opcionais
    RESEND_API_KEY: z.string().optional(),
    NEXT_PUBLIC_SENTRY_DSN: z.string().optional(),
    SENTRY_AUTH_TOKEN: z.string().optional(),
    NEXT_PUBLIC_APP_URL: z.string().url().optional(),
})

export type ServerEnv = z.infer<typeof serverEnvSchema>

/**
 * Valida as variáveis de ambiente do servidor.
 * Chame no início da aplicação para falhar cedo se algo estiver errado.
 */
export function validateEnv(): ServerEnv {
    const result = serverEnvSchema.safeParse(process.env)

    if (!result.success) {
        const errors = result.error.issues
            .map((issue) => `  ❌ ${issue.path.join('.')}: ${issue.message}`)
            .join('\n')

        console.error(
            '\n🚨 Variáveis de ambiente inválidas:\n' + errors + '\n'
        )

        throw new Error('Variáveis de ambiente inválidas. Verifique o console.')
    }

    return result.data
}

/**
 * Variáveis de ambiente do cliente (acessíveis no browser).
 * Apenas variáveis com prefixo NEXT_PUBLIC_ devem estar aqui.
 */
const clientEnvSchema = z.object({
    NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
    NEXT_PUBLIC_SENTRY_DSN: z.string().optional(),
    NEXT_PUBLIC_APP_URL: z.string().url().optional(),
})

export type ClientEnv = z.infer<typeof clientEnvSchema>
