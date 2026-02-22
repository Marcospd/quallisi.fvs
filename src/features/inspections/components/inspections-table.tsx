'use client'

import { useRouter } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { Eye } from 'lucide-react'

interface InspectionRow {
    inspection: {
        id: string
        status: string
        result: string | null
        referenceMonth: string
        createdAt: Date | null
    }
    service: { id: string; name: string }
    location: { id: string; name: string }
    inspector: { id: string; name: string }
}

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
    DRAFT: { label: 'Rascunho', variant: 'outline' },
    IN_PROGRESS: { label: 'Em andamento', variant: 'secondary' },
    COMPLETED: { label: 'Concluída', variant: 'default' },
}

const resultConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
    APPROVED: { label: 'Aprovada', variant: 'default' },
    APPROVED_WITH_RESTRICTIONS: { label: 'Com Restrições', variant: 'secondary' },
    REJECTED: { label: 'Reprovada', variant: 'destructive' },
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
 * Tabela de inspeções com link para detalhe.
 */
export function InspectionsTable({ inspections, tenantSlug }: InspectionsTableProps) {
    const router = useRouter()

    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Serviço</TableHead>
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
                {inspections.map(({ inspection, service, location, inspector }) => {
                    const status = statusConfig[inspection.status] ?? { label: inspection.status, variant: 'outline' as const }
                    const res = inspection.result ? resultConfig[inspection.result] ?? { label: inspection.result, variant: 'outline' as const } : null

                    return (
                        <TableRow
                            key={inspection.id}
                            className="cursor-pointer hover:bg-muted/50"
                            onClick={() => router.push(`/${tenantSlug}/inspections/${inspection.id}`)}
                        >
                            <TableCell className="font-medium">{service.name}</TableCell>
                            <TableCell>{location.name}</TableCell>
                            <TableCell className="text-muted-foreground">{inspector.name}</TableCell>
                            <TableCell>{inspection.referenceMonth}</TableCell>
                            <TableCell>
                                <Badge variant={status.variant}>{status.label}</Badge>
                            </TableCell>
                            <TableCell>
                                {res ? <Badge variant={res.variant}>{res.label}</Badge> : '—'}
                            </TableCell>
                            <TableCell className="text-muted-foreground">
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
    )
}
