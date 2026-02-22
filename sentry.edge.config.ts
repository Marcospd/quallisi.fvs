import * as Sentry from '@sentry/nextjs'

/**
 * Configuração do Sentry para o edge runtime (middleware).
 * Captura erros que ocorrem no middleware do Next.js.
 */
Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

    // Percentual de requests rastreados para performance (5%)
    tracesSampleRate: 0.05,

    // Desabilitar em desenvolvimento
    enabled: process.env.NODE_ENV === 'production',
})
