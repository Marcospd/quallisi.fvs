'use client'

import { Inbox } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

/**
 * Estado vazio reutilizável.
 * Exibe mensagem quando não há dados com ação opcional.
 */
interface EmptyStateProps {
    title?: string
    description?: string
    action?: React.ReactNode
}

export function EmptyState({
    title = 'Nenhum item encontrado',
    description = 'Não há dados para exibir.',
    action,
}: EmptyStateProps) {
    return (
        <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-10 text-center">
                <Inbox className="h-10 w-10 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold">{title}</h3>
                <p className="text-sm text-muted-foreground mt-1 max-w-md">
                    {description}
                </p>
                {action && <div className="mt-4">{action}</div>}
            </CardContent>
        </Card>
    )
}
