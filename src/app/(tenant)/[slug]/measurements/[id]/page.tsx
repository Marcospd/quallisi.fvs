import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ErrorState } from '@/components/error-state'
import { getBulletin } from '@/features/measurements/actions'
import { BulletinDetail } from '@/features/measurements/components/bulletin-detail'

export const metadata = {
    title: 'Boletim de Medição — Quallisy FVS',
}

export default async function BulletinDetailPage({
    params,
}: {
    params: Promise<{ slug: string; id: string }>
}) {
    const { slug, id } = await params
    const result = await getBulletin(id)

    if (result.error || !result.data) {
        return (
            <div className="flex min-h-full flex-1 flex-col gap-6 p-6">
                <ErrorState description={result.error || 'Boletim não encontrado'} />
            </div>
        )
    }

    return (
        <div className="flex min-h-full flex-1 flex-col gap-6 p-6">
            <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" asChild>
                    <Link href={`/${slug}/measurements`}>
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
            </div>

            <BulletinDetail bulletin={result.data} />
        </div>
    )
}
