import { getSystemDashboardData } from '@/features/system/actions'
import { SystemDashboardCards } from '@/features/system/components/system-dashboard-cards'

export const metadata = {
    title: 'Dashboard — Painel SISTEMA',
}

/**
 * Página principal do Painel SISTEMA.
 * Exibe KPIs globais da plataforma.
 * Rota: /system
 */
export default async function SystemDashboardPage() {
    const result = await getSystemDashboardData()

    const stats = result.data ?? {
        totalTenants: 0,
        activeTenants: 0,
        suspendedTenants: 0,
        cancelledTenants: 0,
        totalUsers: 0,
    }

    return (
        <div className="space-y-6 p-6">
            <div>
                <h1 className="text-2xl font-bold">Dashboard</h1>
                <p className="text-muted-foreground">
                    Visão geral da plataforma Quallisy FVS
                </p>
            </div>

            <SystemDashboardCards stats={stats} />
        </div>
    )
}
