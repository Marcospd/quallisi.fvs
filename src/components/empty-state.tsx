import type { LucideIcon } from 'lucide-react'
import { Inbox } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

/**
 * Estado vazio reutilizável e melhorado.
 * Exibe ícone contextual, mensagem e ação opcional.
 */
interface EmptyStateProps {
    title?: string
    description?: string
    icon?: LucideIcon
    action?: React.ReactNode
    className?: string
}

export function EmptyState({
    title = 'Nenhum item encontrado',
    description = 'Não há dados para exibir.',
    icon: Icon = Inbox,
    action,
    className,
}: EmptyStateProps) {
    return (
        <Card className={cn('border-dashed', className)}>
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
                    <Icon className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold">{title}</h3>
                <p className="text-sm text-muted-foreground mt-1 max-w-md">
                    {description}
                </p>
                {action && <div className="mt-6">{action}</div>}
            </CardContent>
        </Card>
    )
}
