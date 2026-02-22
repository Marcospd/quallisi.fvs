import { headers } from 'next/headers'

/**
 * Rate limiter in-memory com janela deslizante.
 * Limita a quantidade de requisições por IP em um intervalo de tempo.
 *
 * Em produção, considerar trocar para Redis (Upstash) para funcionar
 * com múltiplas instâncias serverless.
 */

interface RateLimitEntry {
    count: number
    resetAt: number
}

const store = new Map<string, RateLimitEntry>()

// Limpar entradas expiradas a cada 60 segundos
if (typeof setInterval !== 'undefined') {
    setInterval(() => {
        const now = Date.now()
        for (const [key, entry] of store.entries()) {
            if (now > entry.resetAt) {
                store.delete(key)
            }
        }
    }, 60_000)
}

interface RateLimiterOptions {
    /** Número máximo de requisições por janela */
    maxRequests: number
    /** Duração da janela em milissegundos */
    windowMs: number
}

/**
 * Cria um rate limiter com as opções especificadas.
 */
function createRateLimiter(options: RateLimiterOptions) {
    return {
        /**
         * Verifica se o IP atual pode fazer a requisição.
         * @returns `{ success: true }` se permitido, `{ success: false, retryAfterMs }` se bloqueado
         */
        async check(): Promise<{ success: true } | { success: false; retryAfterMs: number }> {
            const headersList = await headers()
            const ip = headersList.get('x-forwarded-for')?.split(',')[0]?.trim() ?? '127.0.0.1'
            const key = `${options.maxRequests}:${ip}`
            const now = Date.now()

            const entry = store.get(key)

            if (!entry || now > entry.resetAt) {
                store.set(key, { count: 1, resetAt: now + options.windowMs })
                return { success: true }
            }

            if (entry.count >= options.maxRequests) {
                return { success: false, retryAfterMs: entry.resetAt - now }
            }

            entry.count++
            return { success: true }
        },
    }
}

/**
 * Rate limiter para login: 5 tentativas por minuto.
 */
export const loginLimiter = createRateLimiter({
    maxRequests: 5,
    windowMs: 60_000, // 1 minuto
})

/**
 * Rate limiter para convites: 10 por minuto.
 */
export const inviteLimiter = createRateLimiter({
    maxRequests: 10,
    windowMs: 60_000, // 1 minuto
})

/**
 * Rate limiter genérico para API: 30 requisições por minuto.
 */
export const apiLimiter = createRateLimiter({
    maxRequests: 30,
    windowMs: 60_000, // 1 minuto
})
