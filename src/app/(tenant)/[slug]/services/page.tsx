import { Plus } from 'lucide-react'
import { listServices } from '@/features/services/actions'
import { Button } from '@/components/ui/button'
import { CreateServiceDialog } from '@/features/services/components/create-service-dialog'
import { DataTableSearch } from '@/components/data-table-search'
import { DataTablePagination } from '@/components/data-table-pagination'
import { ServicesPageClient } from '@/features/services/components/services-page-client'

export const metadata = {
    title: 'Serviços — Quallisy FVS',
}

/**
 * Página de gestão de serviços e critérios.
 * Rota: /[slug]/services
 */
export default async function ServicesPage({
    searchParams
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
    const sp = await searchParams
    const page = typeof sp.page === 'string' ? parseInt(sp.page, 10) : 1
    const limit = typeof sp.limit === 'string' ? parseInt(sp.limit, 10) : 10
    const q = typeof sp.q === 'string' ? sp.q : undefined
    const sort = typeof sp.sort === 'string' ? sp.sort : undefined
    const order = sp.order === 'desc' ? 'desc' as const : sp.order === 'asc' ? 'asc' as const : undefined

    const result = await listServices({ page, limit, q, sort, order })

    return (
        <div className="flex min-h-full flex-1 flex-col gap-6 p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold">Serviços e Critérios</h1>
                    <p className="text-muted-foreground">
                        Serviços de engenharia com critérios de verificação para o FVS
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <DataTableSearch placeholder="Buscar serviço..." />
                    {result.data && result.data.length > 0 && (
                        <CreateServiceDialog>
                            <Button>
                                <Plus className="mr-2 h-4 w-4" />
                                Novo Serviço
                            </Button>
                        </CreateServiceDialog>
                    )}
                </div>
            </div>

            <ServicesPageClient
                services={result.data ?? []}
                error={result.error}
            />

            {result.meta && result.data && result.data.length > 0 && (
                <DataTablePagination
                    totalItems={result.meta.totalItems}
                    pageSize={result.meta.limit}
                    currentPage={result.meta.page}
                />
            )}
        </div>
    )
}
