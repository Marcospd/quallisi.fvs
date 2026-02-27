import { getTenantStats } from '@/features/stats/actions'
import { listProjectOptions } from '@/features/projects/actions'
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
    searchParams,
}: {
    params: Promise<{ slug: string }>
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
    const { slug } = await params
    const sp = await searchParams
    const projectId = typeof sp.projectId === 'string' ? sp.projectId : undefined

    const [result, projectsResult] = await Promise.all([
        getTenantStats({ projectId }),
        listProjectOptions(),
    ])

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
                <TenantDashboard
                    stats={result.data}
                    tenantSlug={slug}
                    projects={projectsResult.data ?? []}
                    selectedProjectId={projectId}
                />
            )}
        </div>
    )
}
