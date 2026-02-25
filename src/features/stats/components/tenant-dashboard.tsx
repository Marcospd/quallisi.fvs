'use client'

import Link from 'next/link'
import {
    TrendingUp,
    ClipboardCheck,
    CheckCircle2,
    XCircle,
    Clock,
    AlertTriangle,
    ThumbsUp,
    Building2,
    CalendarDays,
    Plus,
    ArrowRight,
} from 'lucide-react'
import {
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    CartesianGrid,
} from 'recharts'
import { MetricCard } from '@/components/metric-card'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/empty-state'

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
}

interface TenantDashboardProps {
    stats: StatsData
    tenantSlug: string
}

const COLORS = {
    approved: '#10b981',
    rejected: '#ef4444',
    pending: '#f59e0b',
}

/**
 * Dashboard completo do tenant com métricas, gráficos e atalhos.
 */
export function TenantDashboard({ stats, tenantSlug }: TenantDashboardProps) {
    const hasData = stats.totalInspections > 0

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

            {/* Gráficos — só mostrar se tem dados */}
            {hasData ? (
                <div className="grid gap-6 md:grid-cols-2">
                    {/* Gráfico de Pizza — Distribuição de Inspeções */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Distribuição de Inspeções</CardTitle>
                            <CardDescription>Resultado das FVS realizadas</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {pieData.length > 0 ? (
                                <div className="flex items-center gap-6">
                                    <ResponsiveContainer width="100%" height={200}>
                                        <PieChart>
                                            <Pie
                                                data={pieData}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={50}
                                                outerRadius={80}
                                                paddingAngle={4}
                                                dataKey="value"
                                            >
                                                {pieData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                                ))}
                                            </Pie>
                                            <Tooltip
                                                formatter={(value) => [`${value} inspeções`, '']}
                                            />
                                        </PieChart>
                                    </ResponsiveContainer>
                                    <div className="space-y-3 shrink-0">
                                        {pieData.map((entry) => (
                                            <div key={entry.name} className="flex items-center gap-2">
                                                <div
                                                    className="h-3 w-3 rounded-full shrink-0"
                                                    style={{ backgroundColor: entry.color }}
                                                />
                                                <span className="text-sm text-muted-foreground">
                                                    {entry.name}: <span className="font-medium text-foreground">{entry.value}</span>
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <p className="text-sm text-muted-foreground text-center py-8">
                                    Sem dados suficientes
                                </p>
                            )}
                        </CardContent>
                    </Card>

                    {/* Gráfico de Barras — Visão Geral */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Visão Geral</CardTitle>
                            <CardDescription>Resumo das atividades do tenant</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={200}>
                                <BarChart data={barData}>
                                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                                    <XAxis dataKey="name" className="text-xs" tick={{ fontSize: 12 }} />
                                    <YAxis className="text-xs" tick={{ fontSize: 12 }} />
                                    <Tooltip />
                                    <Bar dataKey="total" fill="#6366f1" radius={[4, 4, 0, 0]} name="Total" />
                                    <Bar dataKey="aprovadas" fill="#10b981" radius={[4, 4, 0, 0]} name="Concluídas" />
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </div>
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
