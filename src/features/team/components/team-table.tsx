'use client'

import { useState } from 'react'
import { Shield, ShieldCheck, HardHat, UserX, UserCheck, KeyRound } from 'lucide-react'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { DataTableSortHeader } from '@/components/data-table-sort-header'
import { Badge } from '@/components/ui/badge'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { toast } from 'sonner'
import { updateMemberRole, toggleMemberActive } from '../actions'
import { EditTeamDialog } from './edit-team-dialog'
import { ResetPasswordDialog } from './reset-password-dialog'
import { Edit2 } from 'lucide-react'

interface TeamMember {
    id: string
    name: string
    email: string
    role: string
    active: boolean
    createdAt: Date | null
}

interface TeamTableProps {
    members: TeamMember[]
    currentUserId: string
    isAdmin: boolean
}

const roleConfig: Record<string, { label: string; icon: React.ReactNode; variant: 'default' | 'secondary' | 'outline' }> = {
    admin: { label: 'Administrador', icon: <ShieldCheck className="h-3.5 w-3.5" />, variant: 'default' },
    supervisor: { label: 'Supervisor', icon: <Shield className="h-3.5 w-3.5" />, variant: 'secondary' },
    inspetor: { label: 'Inspetor', icon: <HardHat className="h-3.5 w-3.5" />, variant: 'outline' },
}

export function TeamTable({ members, currentUserId, isAdmin }: TeamTableProps) {
    const [updating, setUpdating] = useState<string | null>(null)
    const [editingMember, setEditingMember] = useState<TeamMember | null>(null)
    const [resetPasswordMember, setResetPasswordMember] = useState<TeamMember | null>(null)

    async function handleRoleChange(userId: string, role: string) {
        setUpdating(userId)
        try {
            const result = await updateMemberRole({ userId, role })
            if (result.error) {
                const msg = typeof result.error === 'string' ? result.error : 'Erro ao atualizar'
                toast.error(msg)
            } else {
                toast.success('Perfil atualizado')
            }
        } catch {
            toast.error('Erro ao atualizar perfil')
        } finally {
            setUpdating(null)
        }
    }

    async function handleToggleActive(userId: string, currentActive: boolean) {
        setUpdating(userId)
        try {
            const result = await toggleMemberActive(userId)
            if (result.error) {
                toast.error(result.error)
            } else {
                toast.success(currentActive ? 'Membro desativado' : 'Membro reativado')
            }
        } catch {
            toast.error('Erro ao alterar status')
        } finally {
            setUpdating(null)
        }
    }

    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <DataTableSortHeader column="name">Nome</DataTableSortHeader>
                        <DataTableSortHeader column="email">E-mail</DataTableSortHeader>
                        <DataTableSortHeader column="role">Perfil</DataTableSortHeader>
                        <DataTableSortHeader column="status">Status</DataTableSortHeader>
                        {isAdmin && <TableHead className="w-[120px]">Ações</TableHead>}
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {members.map((member) => {
                        const role = roleConfig[member.role] ?? { label: member.role, icon: null, variant: 'outline' as const }
                        const isSelf = member.id === currentUserId
                        const isDisabled = updating === member.id

                        return (
                            <TableRow
                                key={member.id}
                                className={`${!member.active ? 'opacity-50' : ''} ${isAdmin && !isSelf ? 'cursor-pointer hover:bg-muted/30' : ''}`}
                                onDoubleClick={() => isAdmin && !isSelf && setEditingMember(member)}
                            >
                                <TableCell className="font-medium">
                                    {member.name}
                                    {isSelf && (
                                        <span className="ml-2 text-xs text-muted-foreground">(você)</span>
                                    )}
                                </TableCell>
                                <TableCell>{member.email}</TableCell>
                                <TableCell>
                                    <Badge variant={role.variant} className="gap-1">
                                        {role.icon}
                                        {role.label}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    <Badge variant={member.active ? 'default' : 'destructive'}>
                                        {member.active ? 'Ativo' : 'Inativo'}
                                    </Badge>
                                </TableCell>
                                {isAdmin && (
                                    <TableCell>
                                        {!isSelf && (
                                            <div className="flex items-center gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        setEditingMember(member)
                                                    }}
                                                    disabled={isDisabled}
                                                    title="Editar membro"
                                                >
                                                    <Edit2 className="h-4 w-4 text-muted-foreground" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        setResetPasswordMember(member)
                                                    }}
                                                    disabled={isDisabled}
                                                    title="Redefinir senha"
                                                >
                                                    <KeyRound className="h-4 w-4 text-muted-foreground" />
                                                </Button>
                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            disabled={isDisabled}
                                                        >
                                                            {member.active ? (
                                                                <UserX className="mr-1 h-4 w-4" />
                                                            ) : (
                                                                <UserCheck className="mr-1 h-4 w-4" />
                                                            )}
                                                            {member.active ? 'Desativar' : 'Reativar'}
                                                        </Button>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle>
                                                                {member.active ? 'Desativar membro?' : 'Reativar membro?'}
                                                            </AlertDialogTitle>
                                                            <AlertDialogDescription>
                                                                {member.active
                                                                    ? `${member.name} não conseguirá mais acessar o sistema.`
                                                                    : `${member.name} poderá acessar o sistema novamente.`}
                                                            </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                            <AlertDialogAction
                                                                onClick={() => handleToggleActive(member.id, member.active)}
                                                            >
                                                                Confirmar
                                                            </AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            </div>
                                        )}
                                    </TableCell>
                                )}
                            </TableRow>
                        )
                    })}
                </TableBody>
            </Table>

            <EditTeamDialog
                member={editingMember}
                open={!!editingMember}
                onOpenChange={(open) => !open && setEditingMember(null)}
                currentUserId={currentUserId}
            />

            <ResetPasswordDialog
                memberId={resetPasswordMember?.id ?? null}
                memberName={resetPasswordMember?.name ?? ''}
                open={!!resetPasswordMember}
                onOpenChange={(open) => !open && setResetPasswordMember(null)}
            />
        </div>
    )
}
