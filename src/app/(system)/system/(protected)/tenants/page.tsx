import { Plus } from 'lucide-react'
import { listTenants } from '@/features/tenant/actions'
import { TenantsTable } from '@/features/system/components/tenants-table'
import { CreateTenantDialog } from '@/features/system/components/create-tenant-dialog'
import { EmptyState } from '@/components/empty-state'
import { ErrorState } from '@/components/error-state'
import { Button } from '@/components/ui/button'

export const metadata = {
    title: 'Construtoras — Painel SISTEMA',
}

/**
 * Página de gestão de construtoras (tenants).
 * Rota: /system/tenants
 */
export default async function TenantsPage() {
    const result = await listTenants()

    return (
        <div className="space-y-6 p-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Construtoras</h1>
                    <p className="text-muted-foreground">
                        Gerencie as construtoras cadastradas na plataforma
                    </p>
                </div>
                <CreateTenantDialog>
                    <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Nova Construtora
                    </Button>
                </CreateTenantDialog>
            </div>

            {result.error ? (
                <ErrorState description={result.error} />
            ) : !result.data || result.data.length === 0 ? (
                <EmptyState
                    title="Nenhuma construtora cadastrada"
                    description="Crie a primeira construtora para começar"
                    action={
                        <CreateTenantDialog>
                            <Button>
                                <Plus className="h-4 w-4 mr-2" />
                                Nova Construtora
                            </Button>
                        </CreateTenantDialog>
                    }
                />
            ) : (
                <TenantsTable tenants={result.data} />
            )}
        </div>
    )
}
