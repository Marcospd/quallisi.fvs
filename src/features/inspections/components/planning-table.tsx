'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
    CalendarDays,
    ChevronLeft,
    ChevronRight,
    Eye,
    Pencil,
    MapPin,
    User,
    Wrench,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { StatusBadge } from '@/components/status-badge'
import { EmptyState } from '@/components/empty-state'
import { Skeleton } from '@/components/ui/skeleton'
import { EditMonthDialog } from './edit-month-dialog'
import { listInspectionsForPlanning } from '../actions'
import { toast } from 'sonner'

interface Project {
    id: string
    name: string
    active: boolean
}

interface TeamMember {
    id: string
    name: string
    role: string
}

interface InspectionRow {
    inspection: {
        id: string
        status: string
        result: string | null
        referenceMonth: string
        startedAt: Date | null
        completedAt: Date | null
        createdAt: Date | null
    }
    service: { id: string; name: string }
    project: { id: string; name: string }
    location: { id: string; name: string }
    inspector: { id: string; name: string }
}

type PlanningStatus = 'REALIZADA' | 'PENDENTE' | 'NAO_REALIZADA' | 'AGENDADA'

const planningStatusConfig: Record<PlanningStatus, { label: string; variant: 'success' | 'warning' | 'danger' | 'info' }> = {
    REALIZADA: { label: 'Realizada', variant: 'success' },
    PENDENTE: { label: 'Pendente', variant: 'warning' },
    NAO_REALIZADA: { label: 'Não Realizada', variant: 'danger' },
    AGENDADA: { label: 'Agendada', variant: 'info' },
}

function getCurrentMonth(): string {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

function formatMonthLabel(month: string): string {
    const [year, m] = month.split('-')
    const months = [
        'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
    ]
    return `${months[parseInt(m) - 1]} ${year}`
}

function changeMonth(month: string, delta: number): string {
    const [year, m] = month.split('-').map(Number)
    const date = new Date(year, m - 1 + delta, 1)
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

function computePlanningStatus(inspection: InspectionRow['inspection']): PlanningStatus {
    const currentMonth = getCurrentMonth()

    // Realizada: checklist finalizado e aprovado (sem pendências)
    if (inspection.status === 'COMPLETED' && inspection.result === 'APPROVED') {
        return 'REALIZADA'
    }
    // Pendente: Play dado mas não finalizou, OU finalizado com inconformidades
    if (inspection.startedAt) {
        return 'PENDENTE'
    }
    // Não Realizada: mês chegou/passou e Play nunca foi dado
    if (!inspection.startedAt && inspection.referenceMonth <= currentMonth) {
        return 'NAO_REALIZADA'
    }
    // Agendada: mês futuro
    return 'AGENDADA'
}

interface PlanningTableProps {
    projects: Project[]
    teamMembers: TeamMember[]
    tenantSlug: string
    initialData: InspectionRow[]
    initialMonth: string
}

/**
 * Painel de controle de planejamento de inspeções.
 * Mostra status inteligente: Realizada, Pendente, Não Realizada, Agendada.
 * Dados iniciais vêm do Server Component (sem waterfall no primeiro render).
 */
export function PlanningTable({ projects, teamMembers, tenantSlug, initialData, initialMonth }: PlanningTableProps) {
    const router = useRouter()
    const [selectedProjectId, setSelectedProjectId] = useState<string>('all')
    const [selectedInspectorId, setSelectedInspectorId] = useState<string>('all')
    const [referenceMonth, setReferenceMonth] = useState(initialMonth)
    const [data, setData] = useState<InspectionRow[]>(initialData)
    const [loading, setLoading] = useState(false)

    // Edit month dialog state
    const [editingInspection, setEditingInspection] = useState<{ id: string; month: string } | null>(null)

    const activeProjects = projects.filter((p) => p.active)

    // Referência para saber se é o primeiro render (já temos initialData)
    const isFirstRender = useRef(true)

    const loadData = useCallback(async () => {
        setLoading(true)
        try {
            const result = await listInspectionsForPlanning({
                projectId: selectedProjectId !== 'all' ? selectedProjectId : undefined,
                referenceMonth,
                inspectorId: selectedInspectorId !== 'all' ? selectedInspectorId : undefined,
            })

            if (result.error) {
                toast.error(result.error)
            } else if (result.data) {
                setData(result.data as InspectionRow[])
            }
        } catch {
            toast.error('Erro ao carregar dados do planejamento')
        } finally {
            setLoading(false)
        }
    }, [selectedProjectId, selectedInspectorId, referenceMonth])

    useEffect(() => {
        // Pula o fetch no primeiro render: dados já vieram do servidor
        if (isFirstRender.current) {
            isFirstRender.current = false
            return
        }
        loadData()
    }, [loadData])

    // Contadores de status
    const statusCounts = data.reduce(
        (acc, row) => {
            const status = computePlanningStatus(row.inspection)
            acc[status] = (acc[status] || 0) + 1
            return acc
        },
        {} as Record<PlanningStatus, number>
    )

    return (
        <div className="space-y-6">
            {/* Filtros */}
            <Card>
                <CardContent className="pt-6">
                    <div className="flex flex-wrap items-center gap-4">
                        <div className="w-[220px]">
                            <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Todas as obras" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todas as obras</SelectItem>
                                    {activeProjects.map((p) => (
                                        <SelectItem key={p.id} value={p.id}>
                                            {p.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={() => setReferenceMonth(changeMonth(referenceMonth, -1))}
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <div className="flex items-center gap-2 min-w-[180px] justify-center">
                                <CalendarDays className="h-4 w-4 text-muted-foreground" />
                                <span className="font-medium">
                                    {formatMonthLabel(referenceMonth)}
                                </span>
                            </div>
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={() => setReferenceMonth(changeMonth(referenceMonth, 1))}
                            >
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>

                        <div className="w-[220px]">
                            <Select value={selectedInspectorId} onValueChange={setSelectedInspectorId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Todos os inspetores" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todos os inspetores</SelectItem>
                                    {teamMembers.map((m) => (
                                        <SelectItem key={m.id} value={m.id}>
                                            {m.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Resumo de status */}
                        {data.length > 0 && (
                            <div className="flex items-center gap-3 ml-auto text-sm">
                                {statusCounts.REALIZADA && (
                                    <StatusBadge label={`${statusCounts.REALIZADA} Realizada${statusCounts.REALIZADA > 1 ? 's' : ''}`} variant="success" />
                                )}
                                {statusCounts.PENDENTE && (
                                    <StatusBadge label={`${statusCounts.PENDENTE} Pendente${statusCounts.PENDENTE > 1 ? 's' : ''}`} variant="warning" />
                                )}
                                {statusCounts.NAO_REALIZADA && (
                                    <StatusBadge label={`${statusCounts.NAO_REALIZADA} Não Realizada${statusCounts.NAO_REALIZADA > 1 ? 's' : ''}`} variant="danger" />
                                )}
                                {statusCounts.AGENDADA && (
                                    <StatusBadge label={`${statusCounts.AGENDADA} Agendada${statusCounts.AGENDADA > 1 ? 's' : ''}`} variant="info" />
                                )}
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Tabela */}
            {loading ? (
                <div className="space-y-3">
                    {[1, 2, 3, 4].map((i) => (
                        <Skeleton key={i} className="h-12 w-full" />
                    ))}
                </div>
            ) : data.length === 0 ? (
                <EmptyState
                    icon={CalendarDays}
                    title="Nenhuma inspeção planejada"
                    description={`Não há inspeções agendadas para ${formatMonthLabel(referenceMonth)}.`}
                />
            ) : (
                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Mês</TableHead>
                                <TableHead>Local</TableHead>
                                <TableHead>Serviço</TableHead>
                                <TableHead>Inspetor</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="w-[100px]">Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {data.map(({ inspection, service, location, inspector }) => {
                                const planningStatus = computePlanningStatus(inspection)
                                const cfg = planningStatusConfig[planningStatus]

                                return (
                                    <TableRow key={inspection.id}>
                                        <TableCell>
                                            <div className="flex items-center gap-1.5 text-muted-foreground">
                                                <CalendarDays className="h-3.5 w-3.5 shrink-0" />
                                                <span className="text-sm">{inspection.referenceMonth}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-1.5">
                                                <MapPin className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                                                <span className="text-sm">{location.name}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-1.5">
                                                <Wrench className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                                                <span className="text-sm font-medium">{service.name}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-1.5 text-muted-foreground">
                                                <User className="h-3.5 w-3.5 shrink-0" />
                                                <span className="text-sm">{inspector.name}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <StatusBadge label={cfg.label} variant={cfg.variant} />
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-1">
                                                {planningStatus === 'AGENDADA' && (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        title="Editar vigência"
                                                        onClick={() =>
                                                            setEditingInspection({
                                                                id: inspection.id,
                                                                month: inspection.referenceMonth,
                                                            })
                                                        }
                                                    >
                                                        <Pencil className="h-4 w-4" />
                                                    </Button>
                                                )}
                                                {(planningStatus === 'REALIZADA' || planningStatus === 'PENDENTE') && (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        title="Ver inspeção"
                                                        onClick={() =>
                                                            router.push(`/${tenantSlug}/inspections/${inspection.id}`)
                                                        }
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )
                            })}
                        </TableBody>
                    </Table>
                </div>
            )}

            {/* Edit Month Dialog */}
            {editingInspection && (
                <EditMonthDialog
                    open={!!editingInspection}
                    onOpenChange={(open) => !open && setEditingInspection(null)}
                    inspectionId={editingInspection.id}
                    currentMonth={editingInspection.month}
                    onSuccess={loadData}
                />
            )}
        </div>
    )
}
