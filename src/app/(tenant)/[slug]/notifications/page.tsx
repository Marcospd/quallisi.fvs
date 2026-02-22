import { listNotifications } from '@/features/notifications/actions'
import { EmptyState } from '@/components/empty-state'
import { ErrorState } from '@/components/error-state'
import { NotificationsList } from '@/features/notifications/components/notifications-list'

export const metadata = {
    title: 'Notificações — Quallisy FVS',
}

/**
 * Página de notificações in-app do tenant.
 * Rota: /[slug]/notifications
 */
export default async function NotificationsPage({
    params,
}: {
    params: Promise<{ slug: string }>
}) {
    const { slug } = await params
    const result = await listNotifications()

    return (
        <div className="space-y-6 p-6">
            <div>
                <h1 className="text-2xl font-bold">Notificações</h1>
                <p className="text-muted-foreground">
                    Atualizações sobre inspeções, pendências e aprovações
                </p>
            </div>

            {result.error ? (
                <ErrorState description={result.error} />
            ) : !result.data || result.data.length === 0 ? (
                <EmptyState
                    title="Nenhuma notificação"
                    description="Você receberá notificações conforme as atividades ocorrerem"
                />
            ) : (
                <NotificationsList
                    notifications={result.data}
                    tenantSlug={slug}
                />
            )}
        </div>
    )
}
