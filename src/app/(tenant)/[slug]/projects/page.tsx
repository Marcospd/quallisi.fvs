import { Plus } from 'lucide-react'
import { listProjects } from '@/features/projects/actions'
import { ProjectsTable } from '@/features/projects/components/projects-table'
import { CreateProjectDialog } from '@/features/projects/components/create-project-dialog'
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
export default async function ProjectsPage() {
    const result = await listProjects()

    return (
        <div className="space-y-6 p-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Obras</h1>
                    <p className="text-muted-foreground">
                        Gerencie as obras da sua construtora
                    </p>
                </div>
                <CreateProjectDialog>
                    <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Nova Obra
                    </Button>
                </CreateProjectDialog>
            </div>

            {result.error ? (
                <ErrorState description={result.error} />
            ) : !result.data || result.data.length === 0 ? (
                <EmptyState
                    title="Nenhuma obra cadastrada"
                    description="Crie a primeira obra para começar"
                    action={
                        <CreateProjectDialog>
                            <Button>
                                <Plus className="h-4 w-4 mr-2" />
                                Nova Obra
                            </Button>
                        </CreateProjectDialog>
                    }
                />
            ) : (
                <ProjectsTable projects={result.data} />
            )}
        </div>
    )
}
