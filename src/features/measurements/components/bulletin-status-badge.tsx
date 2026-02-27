'use client'

import { Badge } from '@/components/ui/badge'

const statusConfig: Record<string, { label: string; variant: 'outline' | 'secondary' | 'default' | 'destructive' }> = {
    DRAFT: { label: 'Rascunho', variant: 'outline' },
    SUBMITTED: { label: 'Submetido', variant: 'secondary' },
    PLANNING_APPROVED: { label: 'Aprov. Planejamento', variant: 'default' },
    MANAGEMENT_APPROVED: { label: 'Aprov. Gerência', variant: 'default' },
    CONTRACTOR_AGREED: { label: 'Acordo Empreiteira', variant: 'default' },
    REJECTED: { label: 'Rejeitado', variant: 'destructive' },
}

interface BulletinStatusBadgeProps {
    status: string
}

export function BulletinStatusBadge({ status }: BulletinStatusBadgeProps) {
    const config = statusConfig[status] ?? { label: status, variant: 'outline' as const }

    return (
        <Badge
            variant={config.variant}
            className={status === 'CONTRACTOR_AGREED' ? 'bg-emerald-600 hover:bg-emerald-700' : undefined}
        >
            {config.label}
        </Badge>
    )
}
