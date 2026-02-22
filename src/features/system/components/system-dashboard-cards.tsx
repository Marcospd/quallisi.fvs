'use client'

import { Building2, Users, AlertTriangle, XCircle, Activity } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface DashboardStats {
    totalTenants: number
    activeTenants: number
    suspendedTenants: number
    cancelledTenants: number
    totalUsers: number
}

/**
 * Cards de KPIs do dashboard do Painel SISTEMA.
 * Exibe métricas globais da plataforma.
 */
export function SystemDashboardCards({ stats }: { stats: DashboardStats }) {
    const cards = [
        {
            title: 'Total de Construtoras',
            value: stats.totalTenants,
            icon: Building2,
            description: 'Cadastradas na plataforma',
            color: 'text-blue-500',
        },
        {
            title: 'Ativas',
            value: stats.activeTenants,
            icon: Activity,
            description: 'Com acesso normal',
            color: 'text-emerald-500',
        },
        {
            title: 'Suspensas',
            value: stats.suspendedTenants,
            icon: AlertTriangle,
            description: 'Login bloqueado',
            color: 'text-amber-500',
        },
        {
            title: 'Canceladas',
            value: stats.cancelledTenants,
            icon: XCircle,
            description: 'Acesso encerrado',
            color: 'text-red-500',
        },
        {
            title: 'Total de Usuários',
            value: stats.totalUsers,
            icon: Users,
            description: 'Em todas as construtoras',
            color: 'text-violet-500',
        },
    ]

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {cards.map((card) => (
                <Card key={card.title}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            {card.title}
                        </CardTitle>
                        <card.icon className={`h-4 w-4 ${card.color}`} />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{card.value}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {card.description}
                        </p>
                    </CardContent>
                </Card>
            ))}
        </div>
    )
}
