'use client'

import * as Sentry from '@sentry/nextjs'
import { useEffect } from 'react'

/**
 * Error boundary global do Next.js.
 * Captura erros não tratados e reporta ao Sentry.
 */
export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    useEffect(() => {
        Sentry.captureException(error)
    }, [error])

    return (
        <html>
            <body>
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        minHeight: '100vh',
                        fontFamily: 'system-ui, sans-serif',
                        gap: '16px',
                        padding: '24px',
                        textAlign: 'center',
                    }}
                >
                    <h2 style={{ fontSize: '24px', fontWeight: 600 }}>
                        Algo deu errado
                    </h2>
                    <p style={{ color: '#666', maxWidth: '400px' }}>
                        Ocorreu um erro inesperado. Nossa equipe já foi notificada.
                    </p>
                    <button
                        onClick={reset}
                        style={{
                            padding: '10px 24px',
                            backgroundColor: '#0f172a',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontSize: '14px',
                            fontWeight: 500,
                        }}
                    >
                        Tentar novamente
                    </button>
                </div>
            </body>
        </html>
    )
}
