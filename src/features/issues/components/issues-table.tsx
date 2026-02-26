'use client'

import { useState } from 'react'
import { updateIssueStatus } from '../actions'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { DataTableSortHeader } from '@/components/data-table-sort-header'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { StatusBadge } from '@/components/status-badge'
import { Loader2, AlertTriangle, Wrench, MapPin, Calendar, Building } from 'lucide-react'
import { toast } from 'sonner'

interface IssueRow {
    issue: {
        id: string
        description: string
        status: string
        notes: string | null
        resolvedAt: Date | null
        createdAt: Date | null
    }
    service: { id: string; name: string }
    location: { id: string; name: string }
    inspection: { id: string; referenceMonth: string }
    project: { id: string; name: string }
}

type StatusVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral'

const statusConfig: Record<string, { label: string; variant: StatusVariant }> = {
    OPEN: { label: 'Aberta', variant: 'danger' },
    IN_PROGRESS: { label: 'Em andamento', variant: 'warning' },
    RESOLVED: { label: 'Resolvida', variant: 'success' },
    CANCELLED: { label: 'Cancelada', variant: 'neutral' },
}

function formatDate(date: Date | null) {
    if (!date) return '—'
    return new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    }).format(new Date(date))
}

interface IssuesTableProps {
    issues: IssueRow[]
}

/**
 * Tabela de pendências melhorada com ícones visuais e status semânticos.
 */
export function IssuesTable({ issues: data }: IssuesTableProps) {
    const [updatingId, setUpdatingId] = useState<string | null>(null)

    async function handleStatusChange(issueId: string, newStatus: string) {
        setUpdatingId(issueId)
        try {
            const result = await updateIssueStatus({ issueId, status: newStatus })
            if (result.error) {
                toast.error(typeof result.error === 'string' ? result.error : 'Erro')
            } else {
                toast.success(`Pendência atualizada para: ${statusConfig[newStatus]?.label}`)
            }
        } catch {
            toast.error('Erro ao atualizar pendência')
        } finally {
            setUpdatingId(null)
        }
    }

    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <DataTableSortHeader column="description">Descrição</DataTableSortHeader>
                        <DataTableSortHeader column="project">Obra</DataTableSortHeader>
                        <DataTableSortHeader column="service">Serviço</DataTableSortHeader>
                        <DataTableSortHeader column="location">Local</DataTableSortHeader>
                        <DataTableSortHeader column="month">Mês Ref.</DataTableSortHeader>
                        <DataTableSortHeader column="status">Status</DataTableSortHeader>
                        <DataTableSortHeader column="date">Criada em</DataTableSortHeader>
                        <TableHead className="w-[160px]">Alterar Status</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {data.map(({ issue, service, location, inspection, project }) => {
                        const status = statusConfig[issue.status] ?? { label: issue.status, variant: 'neutral' as const }
                        const isUpdating = updatingId === issue.id

                        return (
                            <TableRow key={issue.id}>
                                <TableCell className="max-w-[300px]">
                                    <div className="flex items-start gap-3">
                                        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg mt-0.5 ${
                                            issue.status === 'OPEN'
                                                ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                                                : issue.status === 'IN_PROGRESS'
                                                    ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400'
                                                    : 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400'
                                        }`}>
                                            <AlertTriangle className="h-4 w-4" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="font-medium truncate">{issue.description}</p>
                                            {issue.notes && (
                                                <p className="text-xs text-muted-foreground truncate mt-0.5">
                                                    {issue.notes}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-1.5 text-muted-foreground">
                                        <Building className="h-3.5 w-3.5 shrink-0" />
                                        <span className="text-sm font-semibold">{project.name}</span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-1.5 text-muted-foreground">
                                        <Wrench className="h-3.5 w-3.5 shrink-0" />
                                        <span className="text-sm">{service.name}</span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-1.5 text-muted-foreground">
                                        <MapPin className="h-3.5 w-3.5 shrink-0" />
                                        <span className="text-sm">{location.name}</span>
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
                                <TableCell className="text-sm text-muted-foreground">
                                    {formatDate(issue.createdAt)}
                                </TableCell>
                                <TableCell>
                                    {isUpdating ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <Select
                                            value={issue.status}
                                            onValueChange={(val) => handleStatusChange(issue.id, val)}
                                            disabled={issue.status === 'RESOLVED' || issue.status === 'CANCELLED'}
                                        >
                                            <SelectTrigger className="h-8 text-xs">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="OPEN">Aberta</SelectItem>
                                                <SelectItem value="IN_PROGRESS">Em andamento</SelectItem>
                                                <SelectItem value="RESOLVED">Resolvida</SelectItem>
                                                <SelectItem value="CANCELLED">Cancelada</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    )}
                                </TableCell>
                            </TableRow>
                        )
                    })}
                </TableBody>
            </Table>
        </div>
    )
}
