import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ErrorState } from '@/components/error-state'
import { getSiteDiary } from '@/features/site-diary/actions'
import { DiaryForm } from '@/features/site-diary/components/diary-form'

export const metadata = {
    title: 'Editar Diário de Obra — Quallisy FVS',
}

export default async function EditSiteDiaryPage({
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

    if (result.data.status !== 'DRAFT') {
        redirect(`/${slug}/site-diary/${id}`)
    }

    const diary = result.data

    return (
        <div className="flex min-h-full flex-1 flex-col gap-6 p-6">
            <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" asChild>
                    <Link href={`/${slug}/site-diary/${id}`}>
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-2xl font-bold">Editar Diário de Obra</h1>
                    <p className="text-muted-foreground">
                        Modifique os dados do diário em rascunho
                    </p>
                </div>
            </div>

            <DiaryForm
                mode="edit"
                diaryId={id}
                defaultValues={{
                    projectId: diary.projectId,
                    entryDate: diary.entryDate,
                    orderNumber: diary.orderNumber ?? '',
                    contractorName: diary.contractorName ?? '',
                    networkDiagramRef: diary.networkDiagramRef ?? '',
                    engineerName: diary.engineerName ?? '',
                    foremanName: diary.foremanName ?? '',
                    weatherCondition: diary.weatherCondition as any,
                    workSuspended: diary.workSuspended,
                    totalHours: diary.totalHours ? parseFloat(diary.totalHours) : undefined,
                    laborEntries: diary.laborEntries.map((e) => ({
                        role: e.role,
                        quantity: e.quantity,
                        hours: parseFloat(e.hours),
                    })),
                    equipmentEntries: diary.equipmentEntries.map((e) => ({
                        description: e.description,
                        quantity: e.quantity,
                        notes: e.notes ?? '',
                    })),
                    servicesExecuted: diary.servicesExecuted.map((e) => ({
                        description: e.description,
                        serviceId: e.serviceId ?? '',
                    })),
                    observations: diary.observations.map((o) => ({
                        origin: o.origin as any,
                        text: o.text,
                    })),
                }}
            />
        </div>
    )
}
