import { getTenantStats } from '@/features/stats/actions'
import { ErrorState } from '@/components/error-state'
import { EmptyState } from '@/components/empty-state'
import { StatsCards } from '@/features/stats/components/stats-cards'

export const metadata = {
    title: 'Estatísticas — Quallisy FVS',
}

/**
 * Dashboard do tenant com KPIs de qualidade.
 * Rota: /[slug]/stats
 */
export default async function StatsPage() {
    const result = await getTenantStats()

    return (
        <div className="space-y-6 p-6">
            <div>
                <h1 className="text-2xl font-bold">Estatísticas</h1>
                <p className="text-muted-foreground">
                    Indicadores de qualidade — conformidade, pendências e desempenho
                </p>
            </div>

            {result.error ? (
                <ErrorState description={result.error} />
            ) : !result.data ? (
                <EmptyState
                    title="Sem dados suficientes"
                    description="Os indicadores serão calculados após a realização das primeiras inspeções"
                />
            ) : (
                <StatsCards stats={result.data} />
            )}
        </div>
    )
}
