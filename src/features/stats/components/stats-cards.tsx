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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

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
 * Cards de KPIs do dashboard do tenant.
 */
export function StatsCards({ stats }: StatsCardsProps) {
    const cards = [
        {
            title: 'Taxa de Conformidade',
            value: `${stats.conformityRate}%`,
            icon: TrendingUp,
            description: 'Inspeções aprovadas vs total',
            color: stats.conformityRate >= 80 ? 'text-emerald-600' : stats.conformityRate >= 50 ? 'text-yellow-600' : 'text-red-600',
        },
        {
            title: 'Total de Inspeções',
            value: stats.totalInspections,
            icon: ClipboardCheck,
            description: 'Todas as inspeções realizadas',
            color: 'text-blue-600',
        },
        {
            title: 'Aprovadas',
            value: stats.approvedInspections,
            icon: CheckCircle2,
            description: 'Inspeções conformes',
            color: 'text-emerald-600',
        },
        {
            title: 'Reprovadas',
            value: stats.rejectedInspections,
            icon: XCircle,
            description: 'Inspeções com NC',
            color: 'text-red-600',
        },
        {
            title: 'Em Andamento',
            value: stats.pendingInspections,
            icon: Clock,
            description: 'Rascunho ou em progresso',
            color: 'text-yellow-600',
        },
        {
            title: 'Pendências Abertas',
            value: stats.openIssues,
            icon: AlertTriangle,
            description: 'NC aguardando resolução',
            color: stats.openIssues > 0 ? 'text-red-600' : 'text-emerald-600',
        },
        {
            title: 'Pendências Resolvidas',
            value: stats.resolvedIssues,
            icon: ThumbsUp,
            description: 'NC já corrigidas',
            color: 'text-emerald-600',
        },
        {
            title: 'Obras Ativas',
            value: stats.activeProjects,
            icon: Building2,
            description: 'Obras em operação',
            color: 'text-blue-600',
        },
        {
            title: 'Planejados este Mês',
            value: stats.plannedThisMonth,
            icon: CalendarDays,
            description: 'Itens no planejamento mensal',
            color: 'text-purple-600',
        },
    ]

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {cards.map((card) => {
                const Icon = card.icon
                return (
                    <Card key={card.title}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                {card.title}
                            </CardTitle>
                            <Icon className={`h-5 w-5 ${card.color}`} />
                        </CardHeader>
                        <CardContent>
                            <div className={`text-2xl font-bold ${card.color}`}>
                                {card.value}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                                {card.description}
                            </p>
                        </CardContent>
                    </Card>
                )
            })}
        </div>
    )
}
