import Link from 'next/link'
import { Plus } from 'lucide-react'
import { listBulletins } from '@/features/measurements/actions'
import { Button } from '@/components/ui/button'
import { DataTableSearch } from '@/components/data-table-search'
import { DataTablePagination } from '@/components/data-table-pagination'
import { BulletinsPageClient } from '@/features/measurements/components/bulletins-page-client'

export const metadata = {
    title: 'Medições — Quallisy FVS',
}

export default async function MeasurementsPage({
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
    const sort = typeof sp.sort === 'string' ? sp.sort : undefined
    const order = sp.order === 'desc' ? 'desc' as const : sp.order === 'asc' ? 'asc' as const : undefined
    const status = typeof sp.status === 'string' ? sp.status : undefined

    const result = await listBulletins({ page, limit, sort, order, status })

    return (
        <div className="flex min-h-full flex-1 flex-col gap-6 p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold">Boletins de Medição</h1>
                    <p className="text-muted-foreground">
                        Medição de serviços executados pelas empreiteiras
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <DataTableSearch placeholder="Buscar boletim..." />
                    {result.data && result.data.length > 0 && (
                        <Link href={`/${slug}/measurements/new`}>
                            <Button>
                                <Plus className="mr-2 h-4 w-4" />
                                Novo Boletim
                            </Button>
                        </Link>
                    )}
                </div>
            </div>

            <BulletinsPageClient
                bulletins={result.data ?? []}
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
