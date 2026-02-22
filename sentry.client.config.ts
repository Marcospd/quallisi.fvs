import * as Sentry from '@sentry/nextjs'

/**
 * Configuração do Sentry para o lado do cliente (browser).
 * Captura erros de JavaScript, console.error e rejeições de Promise.
 */
Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

    // Percentual de sessões rastreadas para performance (10%)
    tracesSampleRate: 0.1,

    // Captura replay de sessões com erro (100% em erro, 0% normal)
    replaysOnErrorSampleRate: 1.0,
    replaysSessionSampleRate: 0,

    // Desabilitar em desenvolvimento
    enabled: process.env.NODE_ENV === 'production',

    // Filtrar erros irrelevantes
    ignoreErrors: [
        // Erros de extensões de browser
        'ResizeObserver loop',
        'Non-Error exception captured',
        // Erros de rede
        'Failed to fetch',
        'NetworkError',
        'Load failed',
    ],
})
