import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ErrorState } from '@/components/error-state'
import { getContract } from '@/features/contracts/actions'
import { ContractDetail } from '@/features/contracts/components/contract-detail'

export const metadata = {
    title: 'Contrato — Quallisy FVS',
}

export default async function ContractDetailPage({
    params,
}: {
    params: Promise<{ slug: string; id: string }>
}) {
    const { slug, id } = await params
    const result = await getContract(id)

    if (result.error || !result.data) {
        return (
            <div className="flex min-h-full flex-1 flex-col gap-6 p-6">
                <ErrorState description={result.error || 'Contrato não encontrado'} />
            </div>
        )
    }

    return (
        <div className="flex min-h-full flex-1 flex-col gap-6 p-6">
            <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" asChild>
                    <Link href={`/${slug}/contracts`}>
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
            </div>

            <ContractDetail contract={result.data} />
        </div>
    )
}
