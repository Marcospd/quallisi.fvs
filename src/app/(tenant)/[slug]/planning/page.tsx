import { listProjects } from '@/features/projects/actions'
import { ErrorState } from '@/components/error-state'
import { PlanningPageClient } from '@/features/planning/components/planning-page-client'

export const metadata = {
    title: 'Planejamento — Quallisy FVS',
}

/**
 * Página de planejamento mensal de FVS.
 * Rota: /[slug]/planning
 */
export default async function PlanningPage() {
    const projectsResult = await listProjects()

    return (
        <div className="space-y-6 p-6">
            <div>
                <h1 className="text-2xl font-bold">Planejamento Mensal</h1>
                <p className="text-muted-foreground">
                    Defina quais serviços serão inspecionados em cada local, por mês
                </p>
            </div>

            {projectsResult.error ? (
                <ErrorState description={projectsResult.error} />
            ) : (
                <PlanningPageClient
                    projects={(projectsResult.data ?? []).map((p) => ({
                        id: p.id,
                        name: p.name,
                        active: p.active,
                    }))}
                />
            )}
        </div>
    )
}
