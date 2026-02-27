'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { Eye, Edit2, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { DataTableSortHeader } from '@/components/data-table-sort-header'
import { BulletinStatusBadge } from './bulletin-status-badge'
import { deleteBulletin } from '../actions'
import { toast } from 'sonner'

interface BulletinRow {
    id: string
    contractId: string
    contractNumber: string
    contractorName: string
    projectName: string
    bmNumber: number
    periodStart: string
    periodEnd: string
    dueDate: string | null
    status: string
    createdAt: Date | null
}

interface BulletinsTableProps {
    bulletins: BulletinRow[]
}

function formatDate(dateStr: string) {
    const [y, m, d] = dateStr.split('-')
    return `${d}/${m}/${y}`
}

export function BulletinsTable({ bulletins }: BulletinsTableProps) {
    const params = useParams()
    const slug = params.slug as string
    const [deletingId, setDeletingId] = useState<string | null>(null)
    const [pendingDelete, setPendingDelete] = useState(false)

    async function handleDelete() {
        if (!deletingId) return
        setPendingDelete(true)
        try {
            const result = await deleteBulletin(deletingId)
            if (result?.error) {
                toast.error(typeof result.error === 'string' ? result.error : 'Erro ao excluir')
            } else {
                toast.success('Boletim excluído')
            }
        } catch {
            toast.error('Erro ao excluir boletim')
        } finally {
            setPendingDelete(false)
            setDeletingId(null)
        }
    }

    return (
        <>
            <Table>
                <TableHeader>
                    <TableRow>
                        <DataTableSortHeader column="bm">BM N.</DataTableSortHeader>
                        <TableHead>Contrato</TableHead>
                        <TableHead>Empreiteira</TableHead>
                        <DataTableSortHeader column="period">Período</DataTableSortHeader>
                        <TableHead>Vencimento</TableHead>
                        <DataTableSortHeader column="status">Status</DataTableSortHeader>
                        <TableHead className="w-[120px]">Ações</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {bulletins.map((bm) => (
                        <TableRow key={bm.id}>
                            <TableCell className="font-medium">BM {bm.bmNumber}</TableCell>
                            <TableCell className="text-muted-foreground">{bm.contractNumber}</TableCell>
                            <TableCell>{bm.contractorName}</TableCell>
                            <TableCell className="whitespace-nowrap">
                                {formatDate(bm.periodStart)} — {formatDate(bm.periodEnd)}
                            </TableCell>
                            <TableCell className="whitespace-nowrap">
                                {bm.dueDate ? formatDate(bm.dueDate) : '—'}
                            </TableCell>
                            <TableCell>
                                <BulletinStatusBadge status={bm.status} />
                            </TableCell>
                            <TableCell>
                                <div className="flex items-center gap-1">
                                    <Button variant="ghost" size="icon" asChild title="Visualizar">
                                        <Link href={`/${slug}/measurements/${bm.id}`}>
                                            <Eye className="h-4 w-4" />
                                        </Link>
                                    </Button>
                                    {(bm.status === 'DRAFT' || bm.status === 'REJECTED') && (
                                        <>
                                            <Button variant="ghost" size="icon" asChild title="Editar">
                                                <Link href={`/${slug}/measurements/${bm.id}/edit`}>
                                                    <Edit2 className="h-4 w-4" />
                                                </Link>
                                            </Button>
                                            {bm.status === 'DRAFT' && (
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    title="Excluir"
                                                    onClick={() => setDeletingId(bm.id)}
                                                >
                                                    <Trash2 className="h-4 w-4 text-destructive" />
                                                </Button>
                                            )}
                                        </>
                                    )}
                                </div>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>

            <AlertDialog open={!!deletingId} onOpenChange={(open) => !open && setDeletingId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Excluir boletim de medição?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta ação não pode ser desfeita. O boletim e todos os seus dados serão removidos.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={pendingDelete}>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} disabled={pendingDelete}>
                            {pendingDelete ? 'Excluindo...' : 'Excluir'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}
