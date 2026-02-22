import { Plus, ClipboardCheck } from 'lucide-react'
import { listInspections } from '@/features/inspections/actions'
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
 * Rota: /[slug]/inspections
 */
export default async function InspectionsPage({
    params,
}: {
    params: Promise<{ slug: string }>
}) {
    const { slug } = await params
    const result = await listInspections()

    return (
        <div className="space-y-6 p-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Inspeções FVS</h1>
                    <p className="text-muted-foreground">
                        Fichas de Verificação de Serviço — avaliação de qualidade no campo
                    </p>
                </div>
                <CreateInspectionDialog tenantSlug={slug}>
                    <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        Nova Inspeção
                    </Button>
                </CreateInspectionDialog>
            </div>

            {result.error ? (
                <ErrorState description={result.error} />
            ) : !result.data || result.data.length === 0 ? (
                <EmptyState
                    icon={ClipboardCheck}
                    title="Nenhuma inspeção realizada"
                    description="Crie uma FVS para avaliar a qualidade dos serviços diretamente no campo."
                    action={
                        <CreateInspectionDialog tenantSlug={slug}>
                            <Button>
                                <Plus className="mr-2 h-4 w-4" />
                                Nova Inspeção
                            </Button>
                        </CreateInspectionDialog>
                    }
                />
            ) : (
                <InspectionsTable
                    inspections={result.data}
                    tenantSlug={slug}
                />
            )}
        </div>
    )
}
