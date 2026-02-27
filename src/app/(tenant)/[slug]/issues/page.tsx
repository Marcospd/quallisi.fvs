import { AlertTriangle } from 'lucide-react'
import { listIssues } from '@/features/issues/actions'
import { EmptyState } from '@/components/empty-state'
import { ErrorState } from '@/components/error-state'
import { IssuesTable } from '@/features/issues/components/issues-table'
import { IssuesFilter } from '@/features/issues/components/issues-filter'

export const metadata = {
    title: 'Pendências — Quallisy FVS',
}

/**
 * Página de pendências geradas por não-conformidades.
 * Rota: /[slug]/issues
 */
export default async function IssuesPage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
    const sp = await searchParams
    const sort = typeof sp.sort === 'string' ? sp.sort : undefined
    const order = sp.order === 'desc' ? 'desc' as const : sp.order === 'asc' ? 'asc' as const : undefined
    const status = typeof sp.status === 'string' ? sp.status : undefined

    const result = await listIssues({ sort, order, status })

    return (
        <div className="space-y-6 p-6">
            <div>
                <h1 className="text-2xl font-bold">Pendências</h1>
                <p className="text-muted-foreground">
                    Não-conformidades identificadas nas inspeções que precisam de resolução
                </p>
            </div>

            <IssuesFilter selectedStatus={status} />

            {result.error ? (
                <ErrorState description={result.error} />
            ) : !result.data || result.data.length === 0 ? (
                <EmptyState
                    icon={AlertTriangle}
                    title="Nenhuma pendência encontrada"
                    description={
                        status
                            ? 'Nenhuma pendência encontrada para o filtro selecionado.'
                            : 'As pendências são geradas automaticamente quando inspeções contêm não-conformidades (NC). Isso é um bom sinal!'
                    }
                />
            ) : (
                <IssuesTable issues={result.data} />
            )}
        </div>
    )
}
