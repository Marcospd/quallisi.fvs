import { Plus, MapPin } from 'lucide-react'
import { listLocations } from '@/features/locations/actions'
import { listProjects } from '@/features/projects/actions'
import { CreateLocationDialog } from '@/features/locations/components/create-location-dialog'
import { LocationsTable } from '@/features/locations/components/locations-table'
import { DataTableSearch } from '@/components/data-table-search'
import { DataTablePagination } from '@/components/data-table-pagination'
import { EmptyState } from '@/components/empty-state'
import { ErrorState } from '@/components/error-state'
import { Button } from '@/components/ui/button'

export const metadata = {
    title: 'Locais — Quallisy FVS',
}

/**
 * Página de gestão de locais de inspeção.
 * Rota: /[slug]/locations
 */
export default async function LocationsPage({
    searchParams
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
    const sp = await searchParams
    const page = typeof sp.page === 'string' ? parseInt(sp.page, 10) : 1
    const limit = typeof sp.limit === 'string' ? parseInt(sp.limit, 10) : 10
    const q = typeof sp.q === 'string' ? sp.q : undefined

    const [locationsResult, projectsResult] = await Promise.all([
        listLocations({ page, limit, q }),
        listProjects({ limit: 1000 }) // Busca rápida de todos os projetos para o Dialog Select
    ])

    return (
        <div className="space-y-6 p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold">Locais de Inspeção</h1>
                    <p className="text-muted-foreground">
                        Pontos físicos dentro das obras onde as inspeções são realizadas
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <DataTableSearch placeholder="Buscar local..." />
                    <CreateLocationDialog>
                        <Button>
                            <Plus className="h-4 w-4 mr-2" />
                            Novo Local
                        </Button>
                    </CreateLocationDialog>
                </div>
            </div>

            {locationsResult.error ? (
                <ErrorState description={locationsResult.error} />
            ) : !locationsResult.data || locationsResult.data.length === 0 ? (
                <EmptyState
                    icon={MapPin}
                    title="Nenhum local cadastrado"
                    description="Cadastre pontos de inspeção dentro das suas obras para poder criar FVS."
                    action={
                        <CreateLocationDialog>
                            <Button>
                                <Plus className="h-4 w-4 mr-2" />
                                Novo Local
                            </Button>
                        </CreateLocationDialog>
                    }
                />
            ) : (
                <div className="flex flex-col gap-4">
                    <LocationsTable
                        data={locationsResult.data as any}
                        projects={projectsResult.data || []}
                    />
                    {locationsResult.meta && locationsResult.data.length > 0 && (
                        <DataTablePagination
                            totalItems={locationsResult.meta.totalItems}
                            pageSize={locationsResult.meta.limit}
                            currentPage={locationsResult.meta.page}
                        />
                    )}
                </div>
            )}
        </div>
    )
}
