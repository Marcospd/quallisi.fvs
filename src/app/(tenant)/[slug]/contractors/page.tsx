import { Plus } from 'lucide-react'
import { listContractors } from '@/features/contractors/actions'
import { Button } from '@/components/ui/button'
import { CreateContractorDialog } from '@/features/contractors/components/create-contractor-dialog'
import { DataTableSearch } from '@/components/data-table-search'
import { DataTablePagination } from '@/components/data-table-pagination'
import { ContractorsPageClient } from '@/features/contractors/components/contractors-page-client'

export const metadata = {
    title: 'Empreiteiras — Quallisy FVS',
}

/**
 * Página de gestão de empreiteiras (subcontratadas).
 * Rota: /[slug]/contractors
 */
export default async function ContractorsPage({
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

    const result = await listContractors({ page, limit, q, sort, order })

    return (
        <div className="flex min-h-full flex-1 flex-col gap-6 p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold">Empreiteiras</h1>
                    <p className="text-muted-foreground">
                        Empresas subcontratadas que atuam nas obras
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <DataTableSearch placeholder="Buscar empreiteira..." />
                    {result.data && result.data.length > 0 && (
                        <CreateContractorDialog>
                            <Button>
                                <Plus className="mr-2 h-4 w-4" />
                                Nova Empreiteira
                            </Button>
                        </CreateContractorDialog>
                    )}
                </div>
            </div>

            <ContractorsPageClient
                contractors={result.data ?? []}
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
