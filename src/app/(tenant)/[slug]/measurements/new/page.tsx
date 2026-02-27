import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { BulletinForm } from '@/features/measurements/components/bulletin-form'

export const metadata = {
    title: 'Novo Boletim de Medição — Quallisy FVS',
}

export default async function NewBulletinPage({
    params,
}: {
    params: Promise<{ slug: string }>
}) {
    const { slug } = await params

    return (
        <div className="flex min-h-full flex-1 flex-col gap-6 p-6">
            <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" asChild>
                    <Link href={`/${slug}/measurements`}>
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-2xl font-bold">Novo Boletim de Medição</h1>
                    <p className="text-muted-foreground">
                        Selecione o contrato e informe as quantidades executadas no período
                    </p>
                </div>
            </div>

            <BulletinForm mode="create" />
        </div>
    )
}
