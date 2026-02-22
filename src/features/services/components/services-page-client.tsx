'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/empty-state'
import { ErrorState } from '@/components/error-state'
import { ServicesTable } from './services-table'
import { CriteriaPanel } from './criteria-panel'
import { CreateServiceDialog } from './create-service-dialog'

interface ServiceRow {
    id: string
    tenantId: string
    name: string
    description: string | null
    active: boolean
    createdAt: Date | null
    updatedAt: Date | null
    criteriaCount: number
}

interface ServicesPageClientProps {
    services: ServiceRow[]
    error?: string
}

/**
 * Componente client que organiza a página de serviços:
 * - Tabela de serviços à esquerda
 * - Painel de critérios à direita (quando um serviço é selecionado)
 */
export function ServicesPageClient({ services, error }: ServicesPageClientProps) {
    const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null)

    if (error) {
        return <ErrorState description={error} />
    }

    if (!services || services.length === 0) {
        return (
            <EmptyState
                title="Nenhum serviço cadastrado"
                description="Cadastre serviços como Alvenaria, Revestimento e seus critérios de verificação"
                action={
                    <CreateServiceDialog>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            Novo Serviço
                        </Button>
                    </CreateServiceDialog>
                }
            />
        )
    }

    return (
        <div className="flex gap-6">
            {/* Tabela de serviços */}
            <div className={`transition-all duration-300 ${selectedServiceId ? 'flex-1' : 'w-full'}`}>
                <ServicesTable
                    services={services}
                    onSelectService={setSelectedServiceId}
                    selectedServiceId={selectedServiceId}
                />
            </div>

            {/* Painel de critérios */}
            {selectedServiceId && (
                <div className="w-[450px] shrink-0">
                    <CriteriaPanel
                        key={selectedServiceId}
                        serviceId={selectedServiceId}
                        onClose={() => setSelectedServiceId(null)}
                    />
                </div>
            )}
        </div>
    )
}
