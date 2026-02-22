'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'
import { Toaster } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'

/**
 * Providers globais da aplicação.
 * Envolve toda a app com:
 * - TanStack Query (cache e estado de servidor)
 * - Sonner (toasts de notificação)
 * - Tooltip (tooltips do Shadcn/UI)
 */
export function Providers({ children }: { children: React.ReactNode }) {
    const [queryClient] = useState(
        () =>
            new QueryClient({
                defaultOptions: {
                    queries: {
                        staleTime: 60 * 1000, // 1 minuto
                        retry: 1,
                    },
                },
            })
    )

    return (
        <QueryClientProvider client={queryClient}>
            <TooltipProvider>
                {children}
                <Toaster richColors position="top-right" />
            </TooltipProvider>
        </QueryClientProvider>
    )
}
