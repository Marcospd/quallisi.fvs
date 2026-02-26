'use client'

import { useState } from 'react'
import { changeTenantStatus } from '../tenant-actions'
import { Badge } from '@/components/ui/badge'
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
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { DataTableSortHeader } from '@/components/data-table-sort-header'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { MoreHorizontal, Play, Pause, XCircle } from 'lucide-react'
import { toast } from 'sonner'
import type { Tenant, TenantStatus } from '@/features/auth/types'

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
    ACTIVE: { label: 'Ativo', variant: 'default' },
    SUSPENDED: { label: 'Suspenso', variant: 'secondary' },
    CANCELLED: { label: 'Cancelado', variant: 'destructive' },
}

/**
 * Tabela de tenants com ações de status (ativar/suspender/cancelar).
 */
export function TenantsTable({ tenants: data }: { tenants: Tenant[] }) {
    const [pendingId, setPendingId] = useState<string | null>(null)
    const [confirmAction, setConfirmAction] = useState<{
        tenantId: string
        tenantName: string
        status: TenantStatus
    } | null>(null)

    async function handleStatusChange(tenantId: string, status: TenantStatus) {
        setPendingId(tenantId)
        try {
            const result = await changeTenantStatus({ tenantId, status })
            if (result?.error) {
                const msg = typeof result.error === 'string' ? result.error : 'Erro ao alterar status'
                toast.error(msg)
            } else {
                const label = statusConfig[status]?.label ?? status
                toast.success(`Status alterado para ${label}`)
            }
        } catch {
            toast.error('Erro ao alterar status')
        } finally {
            setPendingId(null)
            setConfirmAction(null)
        }
    }

    function formatDate(date: Date | null) {
        if (!date) return '—'
        return new Intl.DateTimeFormat('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
        }).format(new Date(date))
    }

    return (
        <>
            <Table>
                <TableHeader>
                    <TableRow>
                        <DataTableSortHeader column="name">Nome</DataTableSortHeader>
                        <DataTableSortHeader column="slug">Slug</DataTableSortHeader>
                        <DataTableSortHeader column="status">Status</DataTableSortHeader>
                        <DataTableSortHeader column="date">Cadastro</DataTableSortHeader>
                        <TableHead className="w-[70px]">Ações</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {data.map((tenant) => {
                        const config = statusConfig[tenant.status] ?? { label: tenant.status, variant: 'outline' as const }
                        return (
                            <TableRow key={tenant.id}>
                                <TableCell className="font-medium">{tenant.name}</TableCell>
                                <TableCell className="text-muted-foreground">{tenant.slug}</TableCell>
                                <TableCell>
                                    <Badge variant={config.variant}>{config.label}</Badge>
                                </TableCell>
                                <TableCell className="text-muted-foreground">
                                    {formatDate(tenant.createdAt)}
                                </TableCell>
                                <TableCell>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                disabled={pendingId === tenant.id}
                                            >
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            {tenant.status !== 'ACTIVE' && (
                                                <DropdownMenuItem
                                                    onClick={() =>
                                                        setConfirmAction({
                                                            tenantId: tenant.id,
                                                            tenantName: tenant.name,
                                                            status: 'ACTIVE',
                                                        })
                                                    }
                                                >
                                                    <Play className="h-4 w-4 mr-2" />
                                                    Ativar
                                                </DropdownMenuItem>
                                            )}
                                            {tenant.status !== 'SUSPENDED' && (
                                                <DropdownMenuItem
                                                    onClick={() =>
                                                        setConfirmAction({
                                                            tenantId: tenant.id,
                                                            tenantName: tenant.name,
                                                            status: 'SUSPENDED',
                                                        })
                                                    }
                                                >
                                                    <Pause className="h-4 w-4 mr-2" />
                                                    Suspender
                                                </DropdownMenuItem>
                                            )}
                                            {tenant.status !== 'CANCELLED' && (
                                                <DropdownMenuItem
                                                    className="text-destructive"
                                                    onClick={() =>
                                                        setConfirmAction({
                                                            tenantId: tenant.id,
                                                            tenantName: tenant.name,
                                                            status: 'CANCELLED',
                                                        })
                                                    }
                                                >
                                                    <XCircle className="h-4 w-4 mr-2" />
                                                    Cancelar
                                                </DropdownMenuItem>
                                            )}
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        )
                    })}
                </TableBody>
            </Table>

            {/* AlertDialog para confirmação de ação destrutiva */}
            <AlertDialog
                open={!!confirmAction}
                onOpenChange={(open) => !open && setConfirmAction(null)}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Confirmar alteração de status</AlertDialogTitle>
                        <AlertDialogDescription>
                            Deseja alterar o status de <strong>{confirmAction?.tenantName}</strong> para{' '}
                            <strong>{confirmAction ? statusConfig[confirmAction.status]?.label : ''}</strong>?
                            {confirmAction?.status === 'CANCELLED' && (
                                <span className="block mt-2 text-destructive">
                                    Esta ação bloqueia o acesso e os dados serão mantidos por 90 dias.
                                </span>
                            )}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() =>
                                confirmAction &&
                                handleStatusChange(confirmAction.tenantId, confirmAction.status)
                            }
                        >
                            Confirmar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}
