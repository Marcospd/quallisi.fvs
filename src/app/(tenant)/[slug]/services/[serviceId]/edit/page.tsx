import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ErrorState } from '@/components/error-state'
import { getService } from '@/features/services/actions'
import { ServiceForm } from '@/features/services/components/service-form'

export const metadata = {
    title: 'Editar Serviço — Quallisy FVS',
}

export default async function EditServicePage({
    params,
}: {
    params: Promise<{ slug: string; serviceId: string }>
}) {
    const { slug, serviceId } = await params
    const result = await getService(serviceId)

    if (result.error || !result.data) {
        return (
            <div className="flex min-h-full flex-1 flex-col gap-6 p-6">
                <ErrorState description={result.error || 'Serviço não encontrado'} />
            </div>
        )
    }

    const service = result.data

    return (
        <div className="flex min-h-full flex-1 flex-col gap-6 p-6">
            <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" asChild>
                    <Link href={`/${slug}/services`}>
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-2xl font-bold">{service.name}</h1>
                    <p className="text-muted-foreground">
                        Edite os dados e critérios de inspeção do serviço
                    </p>
                </div>
            </div>

            <ServiceForm
                mode="edit"
                slug={slug}
                serviceId={serviceId}
                defaultValues={{
                    name: service.name,
                    unit: service.unit,
                    description: service.description,
                }}
            />
        </div>
    )
}
