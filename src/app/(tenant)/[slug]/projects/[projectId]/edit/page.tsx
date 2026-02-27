import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getProject } from '@/features/projects/actions'
import { ProjectForm } from '@/features/projects/components/project-form'

export const metadata = { title: 'Editar Obra — Quallisy FVS' }

export default async function EditProjectPage({
    params,
}: {
    params: Promise<{ slug: string; projectId: string }>
}) {
    const { slug, projectId } = await params

    const result = await getProject(projectId)
    if (result.error || !result.data) notFound()

    const project = result.data

    return (
        <div className="flex min-h-full flex-1 flex-col gap-6 p-6">
            <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" asChild>
                    <Link href={`/${slug}/projects`}>
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-2xl font-bold">{project.name}</h1>
                    <p className="text-muted-foreground text-sm">Editar informações da obra</p>
                </div>
            </div>

            <ProjectForm mode="edit" slug={slug} project={project} />
        </div>
    )
}
