import { listIssues } from '@/features/issues/actions'
import { EmptyState } from '@/components/empty-state'
import { ErrorState } from '@/components/error-state'
import { IssuesTable } from '@/features/issues/components/issues-table'

export const metadata = {
    title: 'Pendências — Quallisy FVS',
}

/**
 * Página de pendências geradas por não-conformidades.
 * Rota: /[slug]/issues
 */
export default async function IssuesPage() {
    const result = await listIssues()

    return (
        <div className="space-y-6 p-6">
            <div>
                <h1 className="text-2xl font-bold">Pendências</h1>
                <p className="text-muted-foreground">
                    Não-conformidades identificadas nas inspeções que precisam de resolução
                </p>
            </div>

            {result.error ? (
                <ErrorState description={result.error} />
            ) : !result.data || result.data.length === 0 ? (
                <EmptyState
                    title="Nenhuma pendência registrada"
                    description="As pendências são geradas quando inspeções contêm não-conformidades (NC)"
                />
            ) : (
                <IssuesTable issues={result.data} />
            )}
        </div>
    )
}
