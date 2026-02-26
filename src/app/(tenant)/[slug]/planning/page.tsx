import { redirect } from 'next/navigation'
import { listProjects } from '@/features/projects/actions'
import { listTeamMembersForAssignment, listInspectionsForPlanning } from '@/features/inspections/actions'
import { getAuthContext } from '@/features/auth/actions'
import { ErrorState } from '@/components/error-state'
import { PlanningTable } from '@/features/inspections/components/planning-table'

export const metadata = {
    title: 'Planejamento — Quallisy FVS',
}

function getCurrentMonth(): string {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

/**
 * Painel de controle de planejamento de inspeções.
 * Somente admin/supervisor. Inspetor é redirecionado.
 * Rota: /[slug]/planning
 */
export default async function PlanningPage({
    params,
}: {
    params: Promise<{ slug: string }>
}) {
    const { slug } = await params
    const { user } = await getAuthContext()

    // Inspetor não acessa o planejamento
    if (user.role === 'inspetor') {
        redirect(`/${slug}/inspections`)
    }

    const currentMonth = getCurrentMonth()

    // Busca paralela: projetos, time e inspeções do mês atual (dados iniciais)
    const [projectsResult, teamResult, initialInspections] = await Promise.all([
        listProjects(),
        listTeamMembersForAssignment(),
        listInspectionsForPlanning({ referenceMonth: currentMonth }),
    ])

    if (projectsResult.error || teamResult.error) {
        return (
            <div className="space-y-6 p-6">
                <ErrorState description={projectsResult.error || teamResult.error || 'Erro ao carregar dados'} />
            </div>
        )
    }

    return (
        <div className="space-y-6 p-6">
            <div>
                <h1 className="text-2xl font-bold">Planejamento de Inspeções</h1>
                <p className="text-muted-foreground">
                    Painel de controle — acompanhe o status de todas as inspeções planejadas
                </p>
            </div>

            <PlanningTable
                projects={(projectsResult.data ?? []).map((item) => ({
                    id: item.project.id,
                    name: item.project.name,
                    active: item.project.active,
                }))}
                teamMembers={teamResult.data ?? []}
                tenantSlug={slug}
                initialData={initialInspections.data ?? []}
                initialMonth={currentMonth}
            />
        </div>
    )
}
