import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ContractForm } from '@/features/contracts/components/contract-form'

export const metadata = {
    title: 'Novo Contrato — Quallisy FVS',
}

export default async function NewContractPage({
    params,
}: {
    params: Promise<{ slug: string }>
}) {
    const { slug } = await params

    return (
        <div className="flex min-h-full flex-1 flex-col gap-6 p-6">
            <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" asChild>
                    <Link href={`/${slug}/contracts`}>
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-2xl font-bold">Novo Contrato</h1>
                    <p className="text-muted-foreground">
                        Cadastre um contrato com a empreiteira e seus itens
                    </p>
                </div>
            </div>

            <ContractForm mode="create" />
        </div>
    )
}
