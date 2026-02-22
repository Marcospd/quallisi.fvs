import { getTenantStats } from '@/features/stats/actions'
import { TenantDashboard } from '@/features/stats/components/tenant-dashboard'
import { ErrorState } from '@/components/error-state'
import { EmptyState } from '@/components/empty-state'
import { ClipboardCheck } from 'lucide-react'

/**
 * Dashboard do tenant — página inicial após login.
 * Exibe métricas, gráficos e atalhos rápidos.
 * Rota: /[slug]
 */
export const metadata = {
    title: 'Dashboard — Quallisy FVS',
}

export default async function TenantDashboardPage({
    params,
}: {
    params: Promise<{ slug: string }>
}) {
    const { slug } = await params
    const result = await getTenantStats()

    return (
        <div className="space-y-6 p-6">
            <div>
                <h1 className="text-2xl font-bold">Dashboard</h1>
                <p className="text-muted-foreground">
                    Visão geral da qualidade e atividades das suas obras
                </p>
            </div>

            {result.error ? (
                <ErrorState description={result.error} />
            ) : !result.data ? (
                <EmptyState
                    icon={ClipboardCheck}
                    title="Comece sua jornada de qualidade"
                    description="Cadastre obras, serviços e realize inspeções para ver seus indicadores aqui."
                />
            ) : (
                <TenantDashboard stats={result.data} tenantSlug={slug} />
            )}
        </div>
    )
}
