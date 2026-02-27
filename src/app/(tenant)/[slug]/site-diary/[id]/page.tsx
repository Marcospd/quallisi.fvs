import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ErrorState } from '@/components/error-state'
import { getSiteDiary } from '@/features/site-diary/actions'
import { DiaryDetail } from '@/features/site-diary/components/diary-detail'

export const metadata = {
    title: 'Diário de Obra — Quallisy FVS',
}

export default async function SiteDiaryDetailPage({
    params,
}: {
    params: Promise<{ slug: string; id: string }>
}) {
    const { slug, id } = await params
    const result = await getSiteDiary(id)

    if (result.error || !result.data) {
        return (
            <div className="flex min-h-full flex-1 flex-col gap-6 p-6">
                <ErrorState description={result.error || 'Diário não encontrado'} />
            </div>
        )
    }

    return (
        <div className="flex min-h-full flex-1 flex-col gap-6 p-6">
            <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" asChild>
                    <Link href={`/${slug}/site-diary`}>
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
            </div>

            <DiaryDetail diary={result.data} />
        </div>
    )
}
