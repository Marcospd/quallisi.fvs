'use client'

import { Building2, Users, AlertTriangle, XCircle, Activity } from 'lucide-react'
import {
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    Tooltip,
} from 'recharts'
import { MetricCard } from '@/components/metric-card'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

interface DashboardStats {
    totalTenants: number
    activeTenants: number
    suspendedTenants: number
    cancelledTenants: number
    totalUsers: number
}

const COLORS = {
    active: '#10b981',
    suspended: '#f59e0b',
    cancelled: '#ef4444',
}

/**
 * Dashboard do Painel SISTEMA com métricas e gráfico.
 * Exibe KPIs globais da plataforma.
 */
export function SystemDashboardCards({ stats }: { stats: DashboardStats }) {
    const pieData = [
        { name: 'Ativas', value: stats.activeTenants, color: COLORS.active },
        { name: 'Suspensas', value: stats.suspendedTenants, color: COLORS.suspended },
        { name: 'Canceladas', value: stats.cancelledTenants, color: COLORS.cancelled },
    ].filter(d => d.value > 0)

    return (
        <div className="space-y-6">
            {/* Cards de métricas */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                <MetricCard
                    title="Total de Construtoras"
                    value={stats.totalTenants}
                    icon={Building2}
                    description="Cadastradas na plataforma"
                    iconClassName="bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
                />
                <MetricCard
                    title="Ativas"
                    value={stats.activeTenants}
                    icon={Activity}
                    trend={stats.totalTenants > 0 ? `${Math.round((stats.activeTenants / stats.totalTenants) * 100)}% do total` : undefined}
                    trendUp={true}
                    iconClassName="bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400"
                />
                <MetricCard
                    title="Suspensas"
                    value={stats.suspendedTenants}
                    icon={AlertTriangle}
                    description="Login bloqueado"
                    iconClassName="bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400"
                />
                <MetricCard
                    title="Canceladas"
                    value={stats.cancelledTenants}
                    icon={XCircle}
                    description="Acesso encerrado"
                    iconClassName="bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
                />
                <MetricCard
                    title="Total de Usuários"
                    value={stats.totalUsers}
                    icon={Users}
                    description="Em todas as construtoras"
                    iconClassName="bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400"
                />
            </div>

            {/* Gráfico de distribuição */}
            {stats.totalTenants > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Distribuição de Construtoras</CardTitle>
                        <CardDescription>Status das construtoras cadastradas na plataforma</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-8">
                            <ResponsiveContainer width="100%" height={220}>
                                <PieChart>
                                    <Pie
                                        data={pieData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={90}
                                        paddingAngle={4}
                                        dataKey="value"
                                    >
                                        {pieData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip formatter={(value) => [`${value} construtoras`, '']} />
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="space-y-4 shrink-0">
                                {pieData.map((entry) => (
                                    <div key={entry.name} className="flex items-center gap-3">
                                        <div
                                            className="h-3 w-3 rounded-full shrink-0"
                                            style={{ backgroundColor: entry.color }}
                                        />
                                        <div>
                                            <p className="text-sm font-medium">{entry.name}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {entry.value} construtora{entry.value !== 1 ? 's' : ''}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
