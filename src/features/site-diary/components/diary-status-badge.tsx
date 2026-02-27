'use client'

import { Badge } from '@/components/ui/badge'

const statusConfig: Record<string, { label: string; variant: 'outline' | 'secondary' | 'default' | 'destructive' }> = {
    DRAFT: { label: 'Rascunho', variant: 'outline' },
    SUBMITTED: { label: 'Submetido', variant: 'secondary' },
    CONTRACTOR_SIGNED: { label: 'Assinado Prestadora', variant: 'default' },
    INSPECTION_SIGNED: { label: 'Assinado Fiscalização', variant: 'default' },
}

interface DiaryStatusBadgeProps {
    status: string
}

export function DiaryStatusBadge({ status }: DiaryStatusBadgeProps) {
    const config = statusConfig[status] ?? { label: status, variant: 'outline' as const }

    return (
        <Badge
            variant={config.variant}
            className={status === 'INSPECTION_SIGNED' ? 'bg-emerald-600 hover:bg-emerald-700' : undefined}
        >
            {config.label}
        </Badge>
    )
}
