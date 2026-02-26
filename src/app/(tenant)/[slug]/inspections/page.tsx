import { Plus, ClipboardCheck } from 'lucide-react'
import { listInspections } from '@/features/inspections/actions'
import { getAuthContext } from '@/features/auth/actions'
import { EmptyState } from '@/components/empty-state'
import { ErrorState } from '@/components/error-state'
import { Button } from '@/components/ui/button'
import { InspectionsTable } from '@/features/inspections/components/inspections-table'
import { CreateInspectionDialog } from '@/features/inspections/components/create-inspection-dialog'

export const metadata = {
    title: 'Inspeções — Quallisy FVS',
}

/**
 * Página de listagem de inspeções FVS.
 * Inspetor vê apenas suas inspeções; admin/supervisor vê todas.
 * Rota: /[slug]/inspections
 */
export default async function InspectionsPage({
    params,
    searchParams,
}: {
    params: Promise<{ slug: string }>
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
    const [{ slug }, sp] = await Promise.all([params, searchParams])
    const sort = typeof sp.sort === 'string' ? sp.sort : undefined
    const order = sp.order === 'desc' ? 'desc' as const : sp.order === 'asc' ? 'asc' as const : undefined
    const page = typeof sp.page === 'string' ? Math.max(1, parseInt(sp.page, 10) || 1) : 1

    // Busca paralela: getAuthContext() com cache() não duplica queries com listInspections
    const [result, { user }] = await Promise.all([
        listInspections({ sort, order, page }),
        getAuthContext(),
    ])

    const canCreate = user.role === 'admin' || user.role === 'supervisor'

    return (
        <div className="space-y-6 p-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Inspeções FVS</h1>
                    <p className="text-muted-foreground">
                        Fichas de Verificação de Serviço — avaliação de qualidade no campo
                    </p>
                </div>
                {canCreate && (
                    <CreateInspectionDialog tenantSlug={slug}>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            Nova Inspeção
                        </Button>
                    </CreateInspectionDialog>
                )}
            </div>

            {result.error ? (
                <ErrorState description={result.error} />
            ) : !result.data || result.data.length === 0 ? (
                <EmptyState
                    icon={ClipboardCheck}
                    title="Nenhuma inspeção encontrada"
                    description={
                        canCreate
                            ? 'Agende uma FVS para planejar a avaliação de qualidade dos serviços.'
                            : 'Nenhuma inspeção foi atribuída a você ainda.'
                    }
                    action={
                        canCreate ? (
                            <CreateInspectionDialog tenantSlug={slug}>
                                <Button>
                                    <Plus className="mr-2 h-4 w-4" />
                                    Nova Inspeção
                                </Button>
                            </CreateInspectionDialog>
                        ) : undefined
                    }
                />
            ) : (
                <InspectionsTable
                    inspections={result.data}
                    tenantSlug={slug}
                    currentUserId={result.currentUserId!}
                    currentUserRole={result.currentUserRole!}
                    meta={result.meta}
                />
            )}
        </div>
    )
}
