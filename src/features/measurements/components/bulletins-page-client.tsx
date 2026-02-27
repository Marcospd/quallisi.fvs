'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/empty-state'
import { ErrorState } from '@/components/error-state'
import { BulletinsTable } from './bulletins-table'

interface BulletinRow {
    id: string
    contractId: string
    contractNumber: string
    contractorName: string
    projectName: string
    bmNumber: number
    periodStart: string
    periodEnd: string
    dueDate: string | null
    status: string
    createdAt: Date | null
}

interface BulletinsPageClientProps {
    bulletins: BulletinRow[]
    error?: string
}

export function BulletinsPageClient({ bulletins, error }: BulletinsPageClientProps) {
    const params = useParams()
    const slug = params.slug as string

    if (error) {
        return <ErrorState description={error} />
    }

    if (!bulletins || bulletins.length === 0) {
        return (
            <EmptyState
                title="Nenhum boletim de medição"
                description="Crie boletins de medição para registrar os serviços executados pelas empreiteiras"
                action={
                    <Link href={`/${slug}/measurements/new`}>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            Novo Boletim
                        </Button>
                    </Link>
                }
            />
        )
    }

    return <BulletinsTable bulletins={bulletins} />
}
