import { ArrowLeft, Clock } from 'lucide-react'
import Link from 'next/link'
import { getInspection } from '@/features/inspections/actions'
import { ErrorState } from '@/components/error-state'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { InspectionForm } from '@/features/inspections/components/inspection-form'
import { ExportPdfButton } from '@/features/inspections/components/export-pdf-button'

export const metadata = {
    title: 'Inspeção FVS — Quallisy FVS',
}

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
    DRAFT: { label: 'Agendada', variant: 'outline' },
    IN_PROGRESS: { label: 'Em andamento', variant: 'secondary' },
    COMPLETED: { label: 'Concluída', variant: 'default' },
}

/**
 * Página de detalhe/avaliação de uma inspeção FVS.
 * Rota: /[slug]/inspections/[id]
 */
export default async function InspectionDetailPage({
    params,
}: {
    params: Promise<{ slug: string; id: string }>
}) {
    const { slug, id } = await params
    const result = await getInspection(id)

    if (result.error || !result.data) {
        return (
            <div className="space-y-6 p-6">
                <ErrorState description={result.error || 'Inspeção não encontrada'} />
            </div>
        )
    }

    const { inspection } = result.data
    const status = statusConfig[inspection.status] ?? { label: inspection.status, variant: 'outline' as const }

    // Guard: inspeção DRAFT sem startedAt não pode ser acessada (precisa do Play)
    if (!inspection.startedAt && inspection.status === 'DRAFT') {
        return (
            <div className="space-y-6 p-6">
                <div className="flex items-center gap-4">
                    <Link href={`/${slug}/inspections`}>
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold">Inspeção FVS</h1>
                        <Badge variant="outline">Agendada</Badge>
                    </div>
                </div>
                <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
                    <Clock className="h-12 w-12 text-muted-foreground mb-4" />
                    <h2 className="text-lg font-semibold mb-2">Inspeção ainda não iniciada</h2>
                    <p className="text-muted-foreground max-w-md">
                        Esta inspeção está agendada para {inspection.referenceMonth}. Use o botão Iniciar na lista de inspeções quando o mês de vigência chegar.
                    </p>
                    <Link href={`/${slug}/inspections`} className="mt-4">
                        <Button variant="outline">Voltar para Inspeções</Button>
                    </Link>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6 p-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href={`/${slug}/inspections`}>
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-2xl font-bold">Inspeção FVS</h1>
                            <Badge variant={status.variant}>{status.label}</Badge>
                        </div>
                        <p className="text-muted-foreground">
                            Avalie cada critério de verificação no campo
                        </p>
                    </div>
                </div>
                {inspection.status === 'COMPLETED' && (
                    <ExportPdfButton data={result.data} />
                )}
            </div>

            <InspectionForm
                data={result.data}
                tenantSlug={slug}
            />
        </div>
    )
}
