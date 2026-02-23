'use client'

import {
    ClipboardCheck,
    CheckCircle2,
    XCircle,
    Clock,
    AlertTriangle,
    ThumbsUp,
    Building2,
    CalendarDays,
    TrendingUp,
} from 'lucide-react'
import { MetricCard } from '@/components/metric-card'

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

interface StatsCardsProps {
    stats: StatsData
}

/**
 * Cards de KPIs do dashboard do tenant — melhorado com MetricCard.
 */
export function StatsCards({ stats }: StatsCardsProps) {
    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
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
                title="Aprovadas"
                value={stats.approvedInspections}
                icon={CheckCircle2}
                description="Inspeções conformes"
                iconClassName="bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400"
            />
            <MetricCard
                title="Com Pendências"
                value={stats.rejectedInspections}
                icon={AlertTriangle}
                description="Inspeções com NC"
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
                title="Pendências Resolvidas"
                value={stats.resolvedIssues}
                icon={ThumbsUp}
                description="NC já corrigidas"
                iconClassName="bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400"
            />
            <MetricCard
                title="Obras Ativas"
                value={stats.activeProjects}
                icon={Building2}
                description="Obras em operação"
                iconClassName="bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
            />
            <MetricCard
                title="Planejados este Mês"
                value={stats.plannedThisMonth}
                icon={CalendarDays}
                description="Itens no planejamento mensal"
                iconClassName="bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400"
            />
        </div>
    )
}
