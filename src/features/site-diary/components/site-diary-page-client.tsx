'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/empty-state'
import { ErrorState } from '@/components/error-state'
import { SiteDiaryTable } from './site-diary-table'

interface DiaryRow {
    id: string
    projectId: string
    projectName: string
    entryDate: string
    contractorName: string | null
    engineerName: string | null
    weatherCondition: string
    workSuspended: boolean
    status: string
    createdAt: Date | null
}

interface SiteDiaryPageClientProps {
    diaries: DiaryRow[]
    error?: string
}

export function SiteDiaryPageClient({ diaries, error }: SiteDiaryPageClientProps) {
    const params = useParams()
    const slug = params.slug as string

    if (error) {
        return <ErrorState description={error} />
    }

    if (!diaries || diaries.length === 0) {
        return (
            <EmptyState
                title="Nenhum diário de obra registrado"
                description="Registre o diário de obra diário com mão de obra, equipamentos, serviços e observações"
                action={
                    <Link href={`/${slug}/site-diary/new`}>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            Novo Diário
                        </Button>
                    </Link>
                }
            />
        )
    }

    return <SiteDiaryTable diaries={diaries} />
}
