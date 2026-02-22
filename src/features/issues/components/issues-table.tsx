'use client'

import { useState } from 'react'
import { updateIssueStatus } from '../actions'
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Loader2 } from 'lucide-react'
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
}

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
    OPEN: { label: 'Aberta', variant: 'destructive' },
    IN_PROGRESS: { label: 'Em andamento', variant: 'secondary' },
    RESOLVED: { label: 'Resolvida', variant: 'default' },
    CANCELLED: { label: 'Cancelada', variant: 'outline' },
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
 * Tabela de pendências com ações de status.
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
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Serviço</TableHead>
                    <TableHead>Local</TableHead>
                    <TableHead>Mês Ref.</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Criada em</TableHead>
                    <TableHead className="w-[160px]">Alterar Status</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {data.map(({ issue, service, location, inspection }) => {
                    const status = statusConfig[issue.status] ?? { label: issue.status, variant: 'outline' as const }
                    const isUpdating = updatingId === issue.id

                    return (
                        <TableRow key={issue.id}>
                            <TableCell className="font-medium max-w-[300px]">
                                <p className="truncate">{issue.description}</p>
                                {issue.notes && (
                                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                                        {issue.notes}
                                    </p>
                                )}
                            </TableCell>
                            <TableCell>{service.name}</TableCell>
                            <TableCell>{location.name}</TableCell>
                            <TableCell>{inspection.referenceMonth}</TableCell>
                            <TableCell>
                                <Badge variant={status.variant}>{status.label}</Badge>
                            </TableCell>
                            <TableCell className="text-muted-foreground">
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
    )
}
