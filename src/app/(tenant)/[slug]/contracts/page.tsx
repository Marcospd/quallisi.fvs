import Link from 'next/link'
import { Plus } from 'lucide-react'
import { listContracts } from '@/features/contracts/actions'
import { Button } from '@/components/ui/button'
import { DataTableSearch } from '@/components/data-table-search'
import { DataTablePagination } from '@/components/data-table-pagination'
import { ContractsPageClient } from '@/features/contracts/components/contracts-page-client'

export const metadata = {
    title: 'Contratos — Quallisy FVS',
}

export default async function ContractsPage({
    params,
    searchParams,
}: {
    params: Promise<{ slug: string }>
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
    const { slug } = await params
    const sp = await searchParams
    const page = typeof sp.page === 'string' ? parseInt(sp.page, 10) : 1
    const limit = typeof sp.limit === 'string' ? parseInt(sp.limit, 10) : 10
    const q = typeof sp.q === 'string' ? sp.q : undefined
    const sort = typeof sp.sort === 'string' ? sp.sort : undefined
    const order = sp.order === 'desc' ? 'desc' as const : sp.order === 'asc' ? 'asc' as const : undefined

    const result = await listContracts({ page, limit, q, sort, order })

    return (
        <div className="flex min-h-full flex-1 flex-col gap-6 p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold">Contratos</h1>
                    <p className="text-muted-foreground">
                        Contratos com empreiteiras vinculados às obras
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <DataTableSearch placeholder="Buscar contrato..." />
                    {result.data && result.data.length > 0 && (
                        <Link href={`/${slug}/contracts/new`}>
                            <Button>
                                <Plus className="mr-2 h-4 w-4" />
                                Novo Contrato
                            </Button>
                        </Link>
                    )}
                </div>
            </div>

            <ContractsPageClient
                contracts={result.data ?? []}
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
