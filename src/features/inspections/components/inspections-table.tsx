'use client'

import { useState } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
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
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip'
import { DataTableSortHeader } from '@/components/data-table-sort-header'
import { StatusBadge } from '@/components/status-badge'
import { Eye, Play, ClipboardCheck, MapPin, User, Calendar, Loader2, ChevronLeft, ChevronRight } from 'lucide-react'
import { startInspection } from '../actions'
import { toast } from 'sonner'

interface InspectionRow {
    inspection: {
        id: string
        status: string
        result: string | null
        referenceMonth: string
        startedAt: Date | null
        inspectorId: string
        createdAt: Date | null
    }
    service: { id: string; name: string }
    project: { id: string; name: string }
    location: { id: string; name: string }
    inspector: { id: string; name: string }
}

type StatusVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral'

const statusConfig: Record<string, { label: string; variant: StatusVariant }> = {
    DRAFT: { label: 'Agendada', variant: 'info' },
    IN_PROGRESS: { label: 'Em andamento', variant: 'warning' },
    COMPLETED: { label: 'Concluída', variant: 'success' },
}

const resultConfig: Record<string, { label: string; variant: StatusVariant }> = {
    APPROVED: { label: 'Aprovada', variant: 'success' },
    APPROVED_WITH_RESTRICTIONS: { label: 'Com Pendências', variant: 'warning' },
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

function getCurrentMonth(): string {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

interface PaginationMeta {
    totalItems: number
    page: number
    limit: number
}

interface InspectionsTableProps {
    inspections: InspectionRow[]
    tenantSlug: string
    currentUserId: string
    currentUserRole: string
    meta?: PaginationMeta
}

/**
 * Tabela de inspeções com botão Play para iniciar, filtro por papel e paginação.
 */
export function InspectionsTable({ inspections, tenantSlug, currentUserId, currentUserRole, meta }: InspectionsTableProps) {
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()
    const [startingId, setStartingId] = useState<string | null>(null)

    const currentMonth = getCurrentMonth()

    const totalPages = meta ? Math.ceil(meta.totalItems / meta.limit) : 1
    const currentPage = meta?.page ?? 1

    function navigatePage(page: number) {
        const params = new URLSearchParams(searchParams.toString())
        params.set('page', String(page))
        router.push(`${pathname}?${params.toString()}`)
    }

    async function handleStart(e: React.MouseEvent, inspectionId: string) {
        e.stopPropagation()
        setStartingId(inspectionId)
        try {
            const result = await startInspection(inspectionId)
            if (result.error) {
                toast.error(result.error)
            } else if (result.data) {
                toast.success('Inspeção iniciada!')
                router.push(`/${tenantSlug}/inspections/${result.data.id}`)
            }
        } catch {
            toast.error('Erro ao iniciar inspeção')
        } finally {
            setStartingId(null)
        }
    }

    function handleRowClick(inspection: InspectionRow['inspection']) {
        // Só navega se a inspeção já foi iniciada
        if (inspection.startedAt || inspection.status !== 'DRAFT') {
            router.push(`/${tenantSlug}/inspections/${inspection.id}`)
        }
    }

    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <DataTableSortHeader column="service">Serviço</DataTableSortHeader>
                        <DataTableSortHeader column="project">Obra</DataTableSortHeader>
                        <DataTableSortHeader column="location">Local</DataTableSortHeader>
                        <DataTableSortHeader column="inspector">Inspetor</DataTableSortHeader>
                        <DataTableSortHeader column="month">Mês</DataTableSortHeader>
                        <DataTableSortHeader column="status">Status</DataTableSortHeader>
                        <DataTableSortHeader column="result">Resultado</DataTableSortHeader>
                        <DataTableSortHeader column="date">Data</DataTableSortHeader>
                        <TableHead className="w-[80px]">Ações</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {inspections.map(({ inspection, service, project, location, inspector }) => {
                        const status = statusConfig[inspection.status] ?? { label: inspection.status, variant: 'neutral' as const }
                        const res = inspection.result ? resultConfig[inspection.result] ?? { label: inspection.result, variant: 'neutral' as const } : null

                        const canStart = !inspection.startedAt && inspection.status === 'DRAFT'
                        const isCurrentMonth = inspection.referenceMonth === currentMonth
                        const isMyInspection = inspection.inspectorId === currentUserId
                        const canPlay = canStart && isCurrentMonth && (isMyInspection || currentUserRole !== 'inspetor')
                        const isStarted = !!inspection.startedAt || inspection.status !== 'DRAFT'

                        return (
                            <TableRow
                                key={inspection.id}
                                className={isStarted ? 'cursor-pointer hover:bg-muted/50' : 'hover:bg-muted/50'}
                                onClick={() => handleRowClick(inspection)}
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
                                    {formatDate(inspection.startedAt || inspection.createdAt)}
                                </TableCell>
                                <TableCell>
                                    {canStart ? (
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        disabled={!canPlay || startingId === inspection.id}
                                                        onClick={(e) => handleStart(e, inspection.id)}
                                                        title="Iniciar inspeção"
                                                    >
                                                        {startingId === inspection.id ? (
                                                            <Loader2 className="h-4 w-4 animate-spin" />
                                                        ) : (
                                                            <Play className="h-4 w-4 text-emerald-600" />
                                                        )}
                                                    </Button>
                                                </TooltipTrigger>
                                                {!isCurrentMonth && (
                                                    <TooltipContent>
                                                        <p>Disponível apenas no mês de vigência ({inspection.referenceMonth})</p>
                                                    </TooltipContent>
                                                )}
                                            </Tooltip>
                                        </TooltipProvider>
                                    ) : (
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            title="Ver inspeção"
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                router.push(`/${tenantSlug}/inspections/${inspection.id}`)
                                            }}
                                        >
                                            <Eye className="h-4 w-4" />
                                        </Button>
                                    )}
                                </TableCell>
                            </TableRow>
                        )
                    })}
                </TableBody>
            </Table>

            {meta && totalPages > 1 && (
                <div className="flex items-center justify-between border-t px-4 py-3">
                    <p className="text-sm text-muted-foreground">
                        {meta.totalItems} inspeções — página {currentPage} de {totalPages}
                    </p>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="icon"
                            disabled={currentPage <= 1}
                            onClick={() => navigatePage(currentPage - 1)}
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="outline"
                            size="icon"
                            disabled={currentPage >= totalPages}
                            onClick={() => navigatePage(currentPage + 1)}
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            )}
        </div>
    )
}
