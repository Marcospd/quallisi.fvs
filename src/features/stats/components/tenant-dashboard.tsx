'use client'

import dynamic from 'next/dynamic'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import {
    TrendingUp,
    ClipboardCheck,
    CheckCircle2,
    Clock,
    AlertTriangle,
    Building2,
    CalendarDays,
    CalendarX2,
    Plus,
} from 'lucide-react'
import { MetricCard } from '@/components/metric-card'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'

const DashboardCharts = dynamic(
    () => import('./dashboard-charts').then((mod) => mod.DashboardCharts),
    {
        ssr: false,
        loading: () => (
            <div className="grid gap-6 md:grid-cols-2">
                <Skeleton className="h-[300px]" />
                <Skeleton className="h-[300px]" />
            </div>
        ),
    }
)

interface StatsData {
    totalInspections: number
    approvedInspections: number
    rejectedInspections: number
    pendingInspections: number
    openIssues: number
    resolvedIssues: number
    activeProjects: number
    plannedThisMonth: number
    conformityRate: number
    delayedProjects: number
}

interface ProjectOption {
    id: string
    name: string
    active: boolean
}

interface TenantDashboardProps {
    stats: StatsData
    tenantSlug: string
    projects: ProjectOption[]
    selectedProjectId?: string
}

const COLORS = {
    approved: '#10b981',
    rejected: '#ef4444',
    pending: '#f59e0b',
}

/**
 * Dashboard completo do tenant com métricas, gráficos e atalhos.
 */
export function TenantDashboard({ stats, tenantSlug, projects, selectedProjectId }: TenantDashboardProps) {
    const router = useRouter()
    const searchParams = useSearchParams()
    const hasData = stats.totalInspections > 0

    function handleProjectFilter(projectId: string) {
        const params = new URLSearchParams(searchParams.toString())
        if (projectId === 'all') {
            params.delete('projectId')
        } else {
            params.set('projectId', projectId)
        }
        router.push(`?${params.toString()}`)
    }

    // Dados para gráfico de pizza (distribuição de inspeções)
    const pieData = [
        { name: 'Aprovadas', value: stats.approvedInspections, color: COLORS.approved },
        { name: 'Com Pendências', value: stats.rejectedInspections, color: COLORS.rejected },
        { name: 'Em andamento', value: stats.pendingInspections, color: COLORS.pending },
    ].filter(d => d.value > 0)

    // Dados para gráfico de barras (visão geral)
    const barData = [
        { name: 'Inspeções', total: stats.totalInspections, aprovadas: stats.approvedInspections },
        { name: 'Pendências', total: stats.openIssues + stats.resolvedIssues, aprovadas: stats.resolvedIssues },
        { name: 'Planejadas', total: stats.plannedThisMonth, aprovadas: 0 },
    ]

    return (
        <div className="space-y-6">
            {/* Filtro por obra */}
            {projects.length > 0 && (
                <div className="flex items-center gap-3">
                    <span className="text-sm text-muted-foreground">Filtrar por obra:</span>
                    <Select
                        value={selectedProjectId ?? 'all'}
                        onValueChange={handleProjectFilter}
                    >
                        <SelectTrigger className="w-[240px]">
                            <SelectValue placeholder="Todas as obras" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todas as obras</SelectItem>
                            {projects.map((p) => (
                                <SelectItem key={p.id} value={p.id}>
                                    {p.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            )}

            {/* Alerta de obras atrasadas — só exibe sem filtro de projeto */}
            {!selectedProjectId && stats.delayedProjects > 0 && (
                <div className="flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-amber-800 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-300">
                    <CalendarX2 className="h-5 w-5 shrink-0" />
                    <span className="text-sm font-medium">
                        {stats.delayedProjects === 1
                            ? '1 obra está com prazo vencido.'
                            : `${stats.delayedProjects} obras estão com prazo vencido.`}
                    </span>
                    <Link
                        href={`/${tenantSlug}/projects`}
                        className="ml-auto text-sm underline underline-offset-2 hover:no-underline"
                    >
                        Ver obras
                    </Link>
                </div>
            )}

            {/* Cards de métricas principais */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <MetricCard
                    title="Taxa de Conformidade"
                    value={`${stats.conformityRate}%`}
                    icon={TrendingUp}
                    trend={stats.conformityRate >= 80 ? 'Dentro da meta' : 'Abaixo da meta'}
                    trendUp={stats.conformityRate >= 80}
                    iconClassName={
                        stats.conformityRate >= 80
                            ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400'
                            : stats.conformityRate >= 50
                                ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400'
                                : 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                    }
                />
                <MetricCard
                    title="Total de Inspeções"
                    value={stats.totalInspections}
                    icon={ClipboardCheck}
                    description="Todas as FVS realizadas"
                    iconClassName="bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
                />
                <MetricCard
                    title="Pendências Abertas"
                    value={stats.openIssues}
                    icon={AlertTriangle}
                    trend={stats.openIssues > 0 ? `${stats.openIssues} NC aguardando` : 'Nenhuma pendência'}
                    trendUp={stats.openIssues === 0}
                    iconClassName={
                        stats.openIssues > 0
                            ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                            : 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400'
                    }
                />
                <MetricCard
                    title="Obras Ativas"
                    value={stats.activeProjects}
                    icon={Building2}
                    description="Em operação"
                    iconClassName="bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400"
                />
            </div>

            {/* Gráficos — lazy-loaded, só mostrar se tem dados */}
            {hasData ? (
                <DashboardCharts pieData={pieData} barData={barData} />
            ) : null}

            {/* Cards secundários */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <MetricCard
                    title="Aprovadas"
                    value={stats.approvedInspections}
                    icon={CheckCircle2}
                    description="FVS conformes"
                    iconClassName="bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400"
                />
                <MetricCard
                    title="Com Pendências"
                    value={stats.rejectedInspections}
                    icon={AlertTriangle}
                    description="FVS com NC"
                    iconClassName="bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400"
                />
                <MetricCard
                    title="Em Andamento"
                    value={stats.pendingInspections}
                    icon={Clock}
                    description="Rascunho ou em progresso"
                    iconClassName="bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400"
                />
                <MetricCard
                    title="Planejadas"
                    value={stats.plannedThisMonth}
                    icon={CalendarDays}
                    description="Este mês"
                    iconClassName="bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400"
                />
            </div>

            {/* Atalhos rápidos */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Ações Rápidas</CardTitle>
                    <CardDescription>Acesse as funcionalidades mais usadas</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                        <Link href={`/${tenantSlug}/inspections`}>
                            <Button variant="outline" className="w-full justify-start gap-2 h-auto py-3">
                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                                    <Plus className="h-4 w-4" />
                                </div>
                                <div className="text-left">
                                    <p className="text-sm font-medium">Nova Inspeção</p>
                                    <p className="text-xs text-muted-foreground">Criar FVS</p>
                                </div>
                            </Button>
                        </Link>
                        <Link href={`/${tenantSlug}/issues`}>
                            <Button variant="outline" className="w-full justify-start gap-2 h-auto py-3">
                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400">
                                    <AlertTriangle className="h-4 w-4" />
                                </div>
                                <div className="text-left">
                                    <p className="text-sm font-medium">Pendências</p>
                                    <p className="text-xs text-muted-foreground">{stats.openIssues} abertas</p>
                                </div>
                            </Button>
                        </Link>
                        <Link href={`/${tenantSlug}/planning`}>
                            <Button variant="outline" className="w-full justify-start gap-2 h-auto py-3">
                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400">
                                    <CalendarDays className="h-4 w-4" />
                                </div>
                                <div className="text-left">
                                    <p className="text-sm font-medium">Planejamento</p>
                                    <p className="text-xs text-muted-foreground">Cronograma mensal</p>
                                </div>
                            </Button>
                        </Link>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
