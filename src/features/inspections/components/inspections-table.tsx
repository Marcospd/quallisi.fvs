'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { StatusBadge } from '@/components/status-badge'
import { Eye, ClipboardCheck, MapPin, User, Calendar } from 'lucide-react'

interface InspectionRow {
    inspection: {
        id: string
        status: string
        result: string | null
        referenceMonth: string
        createdAt: Date | null
    }
    service: { id: string; name: string }
    project: { id: string; name: string }
    location: { id: string; name: string }
    inspector: { id: string; name: string }
}

type StatusVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral'

const statusConfig: Record<string, { label: string; variant: StatusVariant }> = {
    DRAFT: { label: 'Rascunho', variant: 'neutral' },
    IN_PROGRESS: { label: 'Em andamento', variant: 'warning' },
    COMPLETED: { label: 'Concluída', variant: 'success' },
}

const resultConfig: Record<string, { label: string; variant: StatusVariant }> = {
    APPROVED: { label: 'Aprovada', variant: 'success' },
    APPROVED_WITH_RESTRICTIONS: { label: 'Com Restrições', variant: 'warning' },
    REJECTED: { label: 'Reprovada', variant: 'danger' },
}

function formatDate(date: Date | null) {
    if (!date) return '—'
    return new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    }).format(new Date(date))
}

interface InspectionsTableProps {
    inspections: InspectionRow[]
    tenantSlug: string
}

/**
 * Tabela de inspeções melhorada com ícones visuais e badges de status.
 */
export function InspectionsTable({ inspections, tenantSlug }: InspectionsTableProps) {
    const router = useRouter()

    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Serviço</TableHead>
                        <TableHead>Obra</TableHead>
                        <TableHead>Local</TableHead>
                        <TableHead>Inspetor</TableHead>
                        <TableHead>Mês</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Resultado</TableHead>
                        <TableHead>Data</TableHead>
                        <TableHead className="w-[80px]">Ações</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {inspections.map(({ inspection, service, project, location, inspector }) => {
                        const status = statusConfig[inspection.status] ?? { label: inspection.status, variant: 'neutral' as const }
                        const res = inspection.result ? resultConfig[inspection.result] ?? { label: inspection.result, variant: 'neutral' as const } : null

                        return (
                            <TableRow
                                key={inspection.id}
                                className="cursor-pointer hover:bg-muted/50"
                                onClick={() => router.push(`/${tenantSlug}/inspections/${inspection.id}`)}
                            >
                                <TableCell>
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                                            <ClipboardCheck className="h-4 w-4" />
                                        </div>
                                        <span className="font-medium">{service.name}</span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <span className="font-semibold text-sm">{project.name}</span>
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-1.5 text-muted-foreground">
                                        <MapPin className="h-3.5 w-3.5 shrink-0" />
                                        <span className="text-sm">{location.name}</span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-1.5 text-muted-foreground">
                                        <User className="h-3.5 w-3.5 shrink-0" />
                                        <span className="text-sm">{inspector.name}</span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-1.5 text-muted-foreground">
                                        <Calendar className="h-3.5 w-3.5 shrink-0" />
                                        <span className="text-sm">{inspection.referenceMonth}</span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <StatusBadge label={status.label} variant={status.variant} />
                                </TableCell>
                                <TableCell>
                                    {res ? <StatusBadge label={res.label} variant={res.variant} /> : <span className="text-sm text-muted-foreground">—</span>}
                                </TableCell>
                                <TableCell className="text-sm text-muted-foreground">
                                    {formatDate(inspection.createdAt)}
                                </TableCell>
                                <TableCell>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        title="Ver inspeção"
                                    >
                                        <Eye className="h-4 w-4" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        )
                    })}
                </TableBody>
            </Table>
        </div>
    )
}
