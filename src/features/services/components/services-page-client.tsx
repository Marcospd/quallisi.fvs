'use client'

import Link from 'next/link'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/empty-state'
import { ErrorState } from '@/components/error-state'
import { ServicesTable } from './services-table'

interface ServiceRow {
    id: string
    tenantId: string
    name: string
    unit: string | null
    description: string | null
    active: boolean
    createdAt: Date | null
    updatedAt: Date | null
    criteriaCount: number
}

interface ServicesPageClientProps {
    services: ServiceRow[]
    slug: string
    error?: string
}

/**
 * Componente client da página de serviços.
 * Navegação para tela cheia de criação/edição.
 */
export function ServicesPageClient({ services, slug, error }: ServicesPageClientProps) {
    if (error) {
        return <ErrorState description={error} />
    }

    if (!services || services.length === 0) {
        return (
            <EmptyState
                title="Nenhum serviço cadastrado"
                description="Cadastre serviços como Alvenaria, Revestimento e seus critérios de verificação"
                action={
                    <Link href={`/${slug}/services/new`}>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            Novo Serviço
                        </Button>
                    </Link>
                }
            />
        )
    }

    return (
        <ServicesTable
            services={services}
            slug={slug}
        />
    )
}
