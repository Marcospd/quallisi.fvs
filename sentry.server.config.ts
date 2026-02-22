import * as Sentry from '@sentry/nextjs'

/**
 * Configuração do Sentry para o lado do servidor (Node.js runtime).
 * Captura erros em server actions, API routes e SSR.
 */
Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

    // Percentual de requests rastreados para performance (10%)
    tracesSampleRate: 0.1,

    // Desabilitar em desenvolvimento
    enabled: process.env.NODE_ENV === 'production',
})
