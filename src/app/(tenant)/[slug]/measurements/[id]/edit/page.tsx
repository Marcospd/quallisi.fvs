import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ErrorState } from '@/components/error-state'
import { getBulletin } from '@/features/measurements/actions'
import { BulletinForm } from '@/features/measurements/components/bulletin-form'

export const metadata = {
    title: 'Editar Boletim de Medição — Quallisy FVS',
}

export default async function EditBulletinPage({
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

    const bulletin = result.data

    if (bulletin.status !== 'DRAFT' && bulletin.status !== 'REJECTED') {
        redirect(`/${slug}/measurements/${id}`)
    }

    return (
        <div className="flex min-h-full flex-1 flex-col gap-6 p-6">
            <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" asChild>
                    <Link href={`/${slug}/measurements/${id}`}>
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-2xl font-bold">Editar Boletim BM {bulletin.bmNumber}</h1>
                    <p className="text-muted-foreground">
                        Ajuste as quantidades medidas no período
                    </p>
                </div>
            </div>

            <BulletinForm
                mode="edit"
                bulletinId={id}
                defaultValues={{
                    contractId: bulletin.contractId,
                    bmNumber: bulletin.bmNumber,
                    sheetNumber: bulletin.sheetNumber,
                    periodStart: bulletin.periodStart,
                    periodEnd: bulletin.periodEnd,
                    dueDate: bulletin.dueDate ?? '',
                    discountValue: parseFloat(bulletin.discountValue) || 0,
                    observations: bulletin.observations ?? '',
                    items: bulletin.items.map((item) => ({
                        contractItemId: item.contractItemId,
                        quantityThisPeriod: parseFloat(item.quantityThisPeriod) || 0,
                    })),
                    additives: bulletin.additives.map((add) => ({
                        itemNumber: add.itemNumber,
                        serviceName: add.serviceName,
                        unit: add.unit as any,
                        unitPrice: parseFloat(add.unitPrice) || 0,
                        contractedQuantity: parseFloat(add.contractedQuantity) || 0,
                        quantityThisPeriod: parseFloat(add.quantityThisPeriod) || 0,
                        sortOrder: add.sortOrder,
                    })),
                }}
                contractItems={bulletin.items.map((item) => ({
                    id: item.contractItemId,
                    itemNumber: item.itemNumber,
                    serviceName: item.serviceName,
                    unit: item.unit,
                    unitPrice: item.unitPrice,
                    contractedQuantity: item.contractedQuantity,
                    sortOrder: 0,
                }))}
                accumulated={bulletin.accumulated}
            />
        </div>
    )
}
