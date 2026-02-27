import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ServiceForm } from '@/features/services/components/service-form'

export const metadata = {
    title: 'Novo Serviço — Quallisy FVS',
}

export default async function NewServicePage({
    params,
}: {
    params: Promise<{ slug: string }>
}) {
    const { slug } = await params

    return (
        <div className="flex min-h-full flex-1 flex-col gap-6 p-6">
            <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" asChild>
                    <Link href={`/${slug}/services`}>
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-2xl font-bold">Novo Serviço</h1>
                    <p className="text-muted-foreground">
                        Cadastre um serviço de engenharia com unidade e critérios de inspeção
                    </p>
                </div>
            </div>

            <ServiceForm mode="create" slug={slug} />
        </div>
    )
}
