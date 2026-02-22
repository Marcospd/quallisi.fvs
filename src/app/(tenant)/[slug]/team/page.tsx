import { UserPlus } from 'lucide-react'
import { listTeamMembers } from '@/features/team/actions'
import { getAuthContext } from '@/features/auth/actions'
import { EmptyState } from '@/components/empty-state'
import { ErrorState } from '@/components/error-state'
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
export default async function TeamPage() {
    const [result, auth] = await Promise.all([listTeamMembers(), getAuthContext()])
    const isAdmin = auth.user.role === 'admin'

    return (
        <div className="space-y-6 p-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Equipe</h1>
                    <p className="text-muted-foreground">
                        Gerencie os inspetores e supervisores da sua construtora
                    </p>
                </div>
                {isAdmin && (
                    <InviteMemberDialog>
                        <Button>
                            <UserPlus className="mr-2 h-4 w-4" />
                            Convidar Membro
                        </Button>
                    </InviteMemberDialog>
                )}
            </div>

            {result.error ? (
                <ErrorState description={result.error} />
            ) : !result.data || result.data.length === 0 ? (
                <EmptyState
                    title="Nenhum membro cadastrado"
                    description="Convide inspetores e supervisores para sua equipe"
                />
            ) : (
                <TeamTable
                    members={result.data}
                    currentUserId={auth.user.id}
                    isAdmin={isAdmin}
                />
            )}
        </div>
    )
}
