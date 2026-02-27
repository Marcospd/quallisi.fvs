'use client'

import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/empty-state'
import { ErrorState } from '@/components/error-state'
import { ContractorsTable } from './contractors-table'
import { CreateContractorDialog } from './create-contractor-dialog'

interface ContractorRow {
    id: string
    tenantId: string
    name: string
    cnpj: string | null
    contactName: string | null
    contactEmail: string | null
    contactPhone: string | null
    bankInfo: string | null
    nfAddress: string | null
    ceiMatricula: string | null
    active: boolean
    createdAt: Date | null
    updatedAt: Date | null
}

interface ContractorsPageClientProps {
    contractors: ContractorRow[]
    error?: string
}

/**
 * Componente client que organiza a página de empreiteiras.
 */
export function ContractorsPageClient({ contractors, error }: ContractorsPageClientProps) {
    if (error) {
        return <ErrorState description={error} />
    }

    if (!contractors || contractors.length === 0) {
        return (
            <EmptyState
                title="Nenhuma empreiteira cadastrada"
                description="Cadastre as empreiteiras (subcontratadas) que atuam nas suas obras"
                action={
                    <CreateContractorDialog>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            Nova Empreiteira
                        </Button>
                    </CreateContractorDialog>
                }
            />
        )
    }

    return (
        <ContractorsTable contractors={contractors} />
    )
}
