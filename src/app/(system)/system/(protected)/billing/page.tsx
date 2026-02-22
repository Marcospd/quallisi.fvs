import { listInvoices } from '@/features/system/billing-actions'
import { InvoicesTable } from '@/features/system/components/invoices-table'
import { EmptyState } from '@/components/empty-state'
import { ErrorState } from '@/components/error-state'

export const metadata = {
    title: 'Assinaturas — Painel SISTEMA',
}

/**
 * Página de gestão de billing/faturas.
 * Rota: /system/billing
 */
export default async function BillingPage() {
    const result = await listInvoices()

    return (
        <div className="space-y-6 p-6">
            <div>
                <h1 className="text-2xl font-bold">Assinaturas e Faturas</h1>
                <p className="text-muted-foreground">
                    Gerencie as faturas e pagamentos das construtoras
                </p>
            </div>

            {result.error ? (
                <ErrorState description={result.error} />
            ) : !result.data || result.data.length === 0 ? (
                <EmptyState
                    title="Nenhuma fatura encontrada"
                    description="As faturas serão geradas conforme os tenants forem cadastrados"
                />
            ) : (
                <InvoicesTable invoices={result.data} />
            )}
        </div>
    )
}
