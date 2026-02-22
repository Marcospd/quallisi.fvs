import { UserPlus, Users } from 'lucide-react'
import { listTeamMembers } from '@/features/team/actions'
import { getAuthContext } from '@/features/auth/actions'
import { EmptyState } from '@/components/empty-state'
import { ErrorState } from '@/components/error-state'
import { DataTableSearch } from '@/components/data-table-search'
import { DataTablePagination } from '@/components/data-table-pagination'
import { Button } from '@/components/ui/button'
import { TeamTable } from '@/features/team/components/team-table'
import { InviteMemberDialog } from '@/features/team/components/invite-member-dialog'

export const metadata = {
    title: 'Equipe — Quallisy FVS',
}

/**
 * Página de gestão de equipe (inspetores do tenant).
 * Rota: /[slug]/team
 */
export default async function TeamPage({
    searchParams
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
    const sp = await searchParams
    const page = typeof sp.page === 'string' ? parseInt(sp.page, 10) : 1
    const limit = typeof sp.limit === 'string' ? parseInt(sp.limit, 10) : 10
    const q = typeof sp.q === 'string' ? sp.q : undefined

    const [result, auth] = await Promise.all([
        listTeamMembers({ page, limit, q }),
        getAuthContext()
    ])
    const isAdmin = auth.user.role === 'admin'

    return (
        <div className="space-y-6 p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold">Equipe</h1>
                    <p className="text-muted-foreground">
                        Gerencie os inspetores e supervisores da sua construtora
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <DataTableSearch placeholder="Buscar membro..." />
                    {isAdmin && (
                        <InviteMemberDialog>
                            <Button>
                                <UserPlus className="mr-2 h-4 w-4" />
                                Convidar Membro
                            </Button>
                        </InviteMemberDialog>
                    )}
                </div>
            </div>

            {result.error ? (
                <ErrorState description={result.error} />
            ) : !result.data || result.data.length === 0 ? (
                <EmptyState
                    icon={Users}
                    title="Nenhum membro cadastrado"
                    description="Convide inspetores e supervisores para começar a criar e gerenciar inspeções de qualidade."
                />
            ) : (
                <div className="flex flex-col gap-4">
                    <TeamTable
                        members={result.data as unknown as any}
                        currentUserId={auth.user.id}
                        isAdmin={isAdmin}
                    />
                    {result.meta && result.data.length > 0 && (
                        <DataTablePagination
                            totalItems={result.meta.totalItems}
                            pageSize={result.meta.limit}
                            currentPage={result.meta.page}
                        />
                    )}
                </div>
            )}
        </div>
    )
}
