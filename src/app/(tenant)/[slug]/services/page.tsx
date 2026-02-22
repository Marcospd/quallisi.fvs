import { Plus } from 'lucide-react'
import { listServices } from '@/features/services/actions'
import { Button } from '@/components/ui/button'
import { CreateServiceDialog } from '@/features/services/components/create-service-dialog'
import { ServicesPageClient } from '@/features/services/components/services-page-client'

export const metadata = {
    title: 'Serviços — Quallisy FVS',
}

/**
 * Página de gestão de serviços e critérios.
 * Rota: /[slug]/services
 */
export default async function ServicesPage() {
    const result = await listServices()

    return (
        <div className="space-y-6 p-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Serviços e Critérios</h1>
                    <p className="text-muted-foreground">
                        Serviços de engenharia com critérios de verificação para o FVS
                    </p>
                </div>
                {result.data && result.data.length > 0 && (
                    <CreateServiceDialog>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            Novo Serviço
                        </Button>
                    </CreateServiceDialog>
                )}
            </div>

            <ServicesPageClient
                services={result.data ?? []}
                error={result.error}
            />
        </div>
    )
}
