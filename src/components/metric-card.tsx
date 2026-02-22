'use client'

import type { LucideIcon } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface MetricCardProps {
    title: string
    value: string | number
    icon: LucideIcon
    description?: string
    trend?: string
    trendUp?: boolean
    className?: string
    iconClassName?: string
}

/**
 * Card de métrica reutilizável com ícone, valor e tendência.
 * Usado nos dashboards para exibir KPIs de forma visual.
 */
export function MetricCard({
    title,
    value,
    icon: Icon,
    description,
    trend,
    trendUp,
    className,
    iconClassName,
}: MetricCardProps) {
    return (
        <Card className={cn('relative overflow-hidden', className)}>
            <CardContent className="p-6">
                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground">
                            {title}
                        </p>
                        <p className="text-3xl font-bold tracking-tight">
                            {value}
                        </p>
                        {trend && (
                            <p className={cn(
                                'text-xs font-medium',
                                trendUp === true && 'text-emerald-600',
                                trendUp === false && 'text-red-600',
                                trendUp === undefined && 'text-muted-foreground'
                            )}>
                                {trendUp === true && '↑ '}
                                {trendUp === false && '↓ '}
                                {trend}
                            </p>
                        )}
                        {description && !trend && (
                            <p className="text-xs text-muted-foreground">
                                {description}
                            </p>
                        )}
                    </div>
                    <div className={cn(
                        'flex h-12 w-12 shrink-0 items-center justify-center rounded-xl',
                        iconClassName ?? 'bg-primary/10 text-primary'
                    )}>
                        <Icon className="h-6 w-6" />
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
