'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { Eye, Edit2, Power } from 'lucide-react'
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
import { toggleContractActive } from '../actions'
import { toast } from 'sonner'

interface ContractRow {
    id: string
    contractNumber: string
    projectId: string
    projectName: string
    contractorId: string
    contractorName: string
    startDate: string
    endDate: string | null
    technicalRetentionPct: string
    active: boolean
    createdAt: Date | null
}

interface ContractsTableProps {
    contracts: ContractRow[]
}

function formatDate(dateStr: string) {
    const [y, m, d] = dateStr.split('-')
    return `${d}/${m}/${y}`
}

export function ContractsTable({ contracts }: ContractsTableProps) {
    const params = useParams()
    const slug = params.slug as string
    const [pendingId, setPendingId] = useState<string | null>(null)

    async function handleToggle(e: React.MouseEvent, contractId: string) {
        e.stopPropagation()
        setPendingId(contractId)
        try {
            const result = await toggleContractActive(contractId)
            if (result?.error) {
                toast.error(typeof result.error === 'string' ? result.error : 'Erro')
            } else {
                toast.success(result.data?.active ? 'Contrato ativado' : 'Contrato desativado')
            }
        } catch {
            toast.error('Erro ao alterar contrato')
        } finally {
            setPendingId(null)
        }
    }

    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <DataTableSortHeader column="number">N. Contrato</DataTableSortHeader>
                    <DataTableSortHeader column="project">Obra</DataTableSortHeader>
                    <DataTableSortHeader column="contractor">Empreiteira</DataTableSortHeader>
                    <DataTableSortHeader column="start">Início</DataTableSortHeader>
                    <TableHead>Fim</TableHead>
                    <TableHead className="text-center">Retenção</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[120px]">Ações</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {contracts.map((contract) => (
                    <TableRow key={contract.id}>
                        <TableCell className="font-medium">{contract.contractNumber}</TableCell>
                        <TableCell>{contract.projectName}</TableCell>
                        <TableCell className="text-muted-foreground">{contract.contractorName}</TableCell>
                        <TableCell className="whitespace-nowrap">{formatDate(contract.startDate)}</TableCell>
                        <TableCell className="whitespace-nowrap">
                            {contract.endDate ? formatDate(contract.endDate) : '—'}
                        </TableCell>
                        <TableCell className="text-center">{contract.technicalRetentionPct}%</TableCell>
                        <TableCell>
                            <Badge variant={contract.active ? 'default' : 'secondary'}>
                                {contract.active ? 'Ativo' : 'Inativo'}
                            </Badge>
                        </TableCell>
                        <TableCell>
                            <div className="flex items-center gap-1">
                                <Button variant="ghost" size="icon" asChild title="Visualizar">
                                    <Link href={`/${slug}/contracts/${contract.id}`}>
                                        <Eye className="h-4 w-4" />
                                    </Link>
                                </Button>
                                <Button variant="ghost" size="icon" asChild title="Editar">
                                    <Link href={`/${slug}/contracts/${contract.id}/edit`}>
                                        <Edit2 className="h-4 w-4" />
                                    </Link>
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={(e) => handleToggle(e, contract.id)}
                                    disabled={pendingId === contract.id}
                                    title={contract.active ? 'Desativar' : 'Ativar'}
                                >
                                    <Power className={`h-4 w-4 ${contract.active ? 'text-emerald-500' : 'text-muted-foreground'}`} />
                                </Button>
                            </div>
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    )
}
