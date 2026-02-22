'use client'

import { AlertCircle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

/**
 * Estado de erro reutilizável.
 * Exibe mensagem de erro com botão de retry.
 */
interface ErrorStateProps {
    title?: string
    description?: string
    onRetry?: () => void
}

export function ErrorState({
    title = 'Erro ao carregar',
    description = 'Não foi possível carregar os dados. Tente novamente.',
    onRetry,
}: ErrorStateProps) {
    return (
        <Card className="border-destructive/50 bg-destructive/5">
            <CardContent className="flex flex-col items-center justify-center py-10 text-center">
                <AlertCircle className="h-10 w-10 text-destructive mb-4" />
                <h3 className="text-lg font-semibold text-destructive">{title}</h3>
                <p className="text-sm text-muted-foreground mt-1 max-w-md">
                    {description}
                </p>
                {onRetry && (
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={onRetry}
                        className="mt-4"
                    >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Tentar novamente
                    </Button>
                )}
            </CardContent>
        </Card>
    )
}
