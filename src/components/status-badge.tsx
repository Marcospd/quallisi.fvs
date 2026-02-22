'use client'

import { cn } from '@/lib/utils'

type StatusVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral'

const variantStyles: Record<StatusVariant, string> = {
    success: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
    warning: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
    danger: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    info: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    neutral: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
}

interface StatusBadgeProps {
    label: string
    variant: StatusVariant
    dot?: boolean
    className?: string
}

/**
 * Badge de status com cores semânticas consistentes.
 * Substitui o Badge genérico do Shadcn para status visuais.
 */
export function StatusBadge({ label, variant, dot = true, className }: StatusBadgeProps) {
    return (
        <span className={cn(
            'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium',
            variantStyles[variant],
            className
        )}>
            {dot && (
                <span className={cn(
                    'h-1.5 w-1.5 rounded-full',
                    variant === 'success' && 'bg-emerald-500',
                    variant === 'warning' && 'bg-amber-500',
                    variant === 'danger' && 'bg-red-500',
                    variant === 'info' && 'bg-blue-500',
                    variant === 'neutral' && 'bg-gray-500',
                )} />
            )}
            {label}
        </span>
    )
}
