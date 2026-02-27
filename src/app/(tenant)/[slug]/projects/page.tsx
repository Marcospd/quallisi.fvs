import Link from 'next/link'
import { Plus, Building2 } from 'lucide-react'
import { listProjects } from '@/features/projects/actions'
import { ProjectCard } from '@/features/projects/components/project-card'
import { DataTableSearch } from '@/components/data-table-search'
import { DataTablePagination } from '@/components/data-table-pagination'
import { EmptyState } from '@/components/empty-state'
import { ErrorState } from '@/components/error-state'
import { Button } from '@/components/ui/button'

export const metadata = {
    title: 'Obras — Quallisy FVS',
}

/**
 * Página de gestão de obras do tenant.
 * Rota: /[slug]/projects
 */
export default async function ProjectsPage({
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

    const result = await listProjects({ page, limit, q })

    return (
        <div className="flex min-h-full flex-1 flex-col gap-6 p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold">Obras</h1>
                    <p className="text-muted-foreground">
                        Gerencie as obras da sua construtora
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <DataTableSearch placeholder="Buscar obra..." />
                    <Button asChild>
                        <Link href={`/${slug}/projects/new`}>
                            <Plus className="h-4 w-4 mr-2" />
                            Nova Obra
                        </Link>
                    </Button>
                </div>
            </div>

            {result.error ? (
                <ErrorState description={result.error} />
            ) : !result.data || result.data.length === 0 ? (
                <EmptyState
                    icon={Building2}
                    title="Nenhuma obra cadastrada"
                    description="Cadastre sua primeira obra para começar a gerenciar inspeções de qualidade."
                    action={
                        <Button asChild>
                            <Link href={`/${slug}/projects/new`}>
                                <Plus className="h-4 w-4 mr-2" />
                                Nova Obra
                            </Link>
                        </Button>
                    }
                />
            ) : (
                <div className="flex flex-1 flex-col gap-4">
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                        {result.data.map((item) => (
                            <ProjectCard
                                key={item.project.id}
                                project={item.project}
                                stats={item.stats}
                            />
                        ))}
                    </div>
                    {result.meta && result.data.length > 0 && (
                        <DataTablePagination
                            totalItems={result.meta.totalItems}
                            pageSize={result.meta.limit}
                            currentPage={result.meta.page}
                        />
                    )}
                </div>
            )}
        </div>
    )
}
