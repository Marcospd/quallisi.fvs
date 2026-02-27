'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/empty-state'
import { ErrorState } from '@/components/error-state'
import { ContractsTable } from './contracts-table'

interface ContractRow {
    id: string
    contractNumber: string
    projectId: string
    projectName: string
    contractorId: string
    contractorName: string
    startDate: string
    endDate: string | null
    technicalRetentionPct: string
    active: boolean
    createdAt: Date | null
}

interface ContractsPageClientProps {
    contracts: ContractRow[]
    error?: string
}

export function ContractsPageClient({ contracts, error }: ContractsPageClientProps) {
    const params = useParams()
    const slug = params.slug as string

    if (error) {
        return <ErrorState description={error} />
    }

    if (!contracts || contracts.length === 0) {
        return (
            <EmptyState
                title="Nenhum contrato cadastrado"
                description="Cadastre contratos com empreiteiras para gerenciar itens e medições"
                action={
                    <Link href={`/${slug}/contracts/new`}>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            Novo Contrato
                        </Button>
                    </Link>
                }
            />
        )
    }

    return <ContractsTable contracts={contracts} />
}
