import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ErrorState } from '@/components/error-state'
import { getContract } from '@/features/contracts/actions'
import { ContractForm } from '@/features/contracts/components/contract-form'

export const metadata = {
    title: 'Editar Contrato — Quallisy FVS',
}

export default async function EditContractPage({
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

    const contract = result.data

    return (
        <div className="flex min-h-full flex-1 flex-col gap-6 p-6">
            <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" asChild>
                    <Link href={`/${slug}/contracts/${id}`}>
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-2xl font-bold">Editar Contrato</h1>
                    <p className="text-muted-foreground">
                        Modifique os dados do contrato {contract.contractNumber}
                    </p>
                </div>
            </div>

            <ContractForm
                mode="edit"
                contractId={id}
                defaultValues={{
                    projectId: contract.projectId,
                    contractorId: contract.contractorId,
                    contractNumber: contract.contractNumber,
                    startDate: contract.startDate,
                    endDate: contract.endDate ?? '',
                    technicalRetentionPct: parseFloat(contract.technicalRetentionPct),
                    notes: contract.notes ?? '',
                    items: contract.items.map((item) => ({
                        itemNumber: item.itemNumber,
                        serviceName: item.serviceName,
                        unit: item.unit as any,
                        unitPrice: parseFloat(item.unitPrice),
                        contractedQuantity: parseFloat(item.contractedQuantity),
                        sortOrder: item.sortOrder,
                    })),
                }}
            />
        </div>
    )
}
