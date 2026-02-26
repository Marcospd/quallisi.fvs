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
export default async function BillingPage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
    const sp = await searchParams
    const sort = typeof sp.sort === 'string' ? sp.sort : undefined
    const order = sp.order === 'desc' ? 'desc' as const : sp.order === 'asc' ? 'asc' as const : undefined
    const result = await listInvoices({ sort, order })

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
