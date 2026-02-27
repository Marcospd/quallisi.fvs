import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DiaryForm } from '@/features/site-diary/components/diary-form'

export const metadata = {
    title: 'Novo Diário de Obra — Quallisy FVS',
}

export default async function NewSiteDiaryPage({
    params,
}: {
    params: Promise<{ slug: string }>
}) {
    const { slug } = await params

    return (
        <div className="flex min-h-full flex-1 flex-col gap-6 p-6">
            <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" asChild>
                    <Link href={`/${slug}/site-diary`}>
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-2xl font-bold">Novo Diário de Obra</h1>
                    <p className="text-muted-foreground">
                        Preencha os dados do diário de obra
                    </p>
                </div>
            </div>

            <DiaryForm mode="create" />
        </div>
    )
}
