'use client'

import { useState } from 'react'
import { toggleContractorActive } from '../actions'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { DataTableSortHeader } from '@/components/data-table-sort-header'
import { EditContractorDialog } from './edit-contractor-dialog'
import { Power, Edit2 } from 'lucide-react'
import { toast } from 'sonner'

interface ContractorRow {
    id: string
    tenantId: string
    name: string
    cnpj: string | null
    contactName: string | null
    contactEmail: string | null
    contactPhone: string | null
    bankInfo: string | null
    nfAddress: string | null
    ceiMatricula: string | null
    active: boolean
    createdAt: Date | null
    updatedAt: Date | null
}

interface ContractorsTableProps {
    contractors: ContractorRow[]
}

/**
 * Tabela de empreiteiras com toggle ativo/inativo e edição.
 */
export function ContractorsTable({ contractors: data }: ContractorsTableProps) {
    const [pendingId, setPendingId] = useState<string | null>(null)
    const [editingContractor, setEditingContractor] = useState<ContractorRow | null>(null)

    async function handleToggle(e: React.MouseEvent, contractorId: string) {
        e.stopPropagation()
        setPendingId(contractorId)
        try {
            const result = await toggleContractorActive(contractorId)
            if (result?.error) {
                toast.error(typeof result.error === 'string' ? result.error : 'Erro')
            } else {
                toast.success(result.data?.active ? 'Empreiteira ativada' : 'Empreiteira desativada')
            }
        } catch {
            toast.error('Erro ao alterar empreiteira')
        } finally {
            setPendingId(null)
        }
    }

    return (
        <>
            <Table>
                <TableHeader>
                    <TableRow>
                        <DataTableSortHeader column="name">Nome</DataTableSortHeader>
                        <DataTableSortHeader column="cnpj">CNPJ</DataTableSortHeader>
                        <TableHead>Contato</TableHead>
                        <TableHead>Telefone</TableHead>
                        <DataTableSortHeader column="status">Status</DataTableSortHeader>
                        <TableHead className="w-[100px]">Ações</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {data.map((contractor) => (
                        <TableRow
                            key={contractor.id}
                            className="cursor-pointer hover:bg-muted/30"
                            onDoubleClick={() => setEditingContractor(contractor)}
                        >
                            <TableCell className="font-medium">{contractor.name}</TableCell>
                            <TableCell className="text-muted-foreground">
                                {contractor.cnpj || '—'}
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                                {contractor.contactName || '—'}
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                                {contractor.contactPhone || '—'}
                            </TableCell>
                            <TableCell>
                                <Badge variant={contractor.active ? 'default' : 'secondary'}>
                                    {contractor.active ? 'Ativo' : 'Inativo'}
                                </Badge>
                            </TableCell>
                            <TableCell>
                                <div className="flex items-center gap-1">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            setEditingContractor(contractor)
                                        }}
                                        title="Editar empreiteira"
                                    >
                                        <Edit2 className="h-4 w-4 text-muted-foreground" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={(e) => handleToggle(e, contractor.id)}
                                        disabled={pendingId === contractor.id}
                                        title={contractor.active ? 'Desativar' : 'Ativar'}
                                    >
                                        <Power className={`h-4 w-4 ${contractor.active ? 'text-emerald-500' : 'text-muted-foreground'}`} />
                                    </Button>
                                </div>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>

            <EditContractorDialog
                contractor={editingContractor}
                open={!!editingContractor}
                onOpenChange={(open) => !open && setEditingContractor(null)}
            />
        </>
    )
}
