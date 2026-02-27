'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { Eye, Edit2, Trash2, Cloud, CloudRain, CloudDrizzle, PauseCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
import { DiaryStatusBadge } from './diary-status-badge'
import { deleteSiteDiary } from '../actions'
import { toast } from 'sonner'

interface DiaryRow {
    id: string
    projectId: string
    projectName: string
    entryDate: string
    contractorName: string | null
    engineerName: string | null
    weatherCondition: string
    workSuspended: boolean
    status: string
    createdAt: Date | null
}

interface SiteDiaryTableProps {
    diaries: DiaryRow[]
}

const weatherIcons: Record<string, { icon: typeof Cloud; label: string }> = {
    NONE: { icon: Cloud, label: 'Sem chuva' },
    LIGHT_RAIN: { icon: CloudDrizzle, label: 'Chuva leve' },
    HEAVY_RAIN: { icon: CloudRain, label: 'Chuva forte' },
}

function formatDate(dateStr: string) {
    const [y, m, d] = dateStr.split('-')
    return `${d}/${m}/${y}`
}

export function SiteDiaryTable({ diaries }: SiteDiaryTableProps) {
    const params = useParams()
    const slug = params.slug as string
    const [deletingId, setDeletingId] = useState<string | null>(null)
    const [pendingDelete, setPendingDelete] = useState(false)

    async function handleDelete() {
        if (!deletingId) return
        setPendingDelete(true)
        try {
            const result = await deleteSiteDiary(deletingId)
            if (result?.error) {
                toast.error(typeof result.error === 'string' ? result.error : 'Erro ao excluir')
            } else {
                toast.success('Diário excluído')
            }
        } catch {
            toast.error('Erro ao excluir diário')
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
                        <DataTableSortHeader column="date">Data</DataTableSortHeader>
                        <DataTableSortHeader column="project">Obra</DataTableSortHeader>
                        <DataTableSortHeader column="contractor">Prestadora</DataTableSortHeader>
                        <TableHead>Clima</TableHead>
                        <DataTableSortHeader column="status">Status</DataTableSortHeader>
                        <TableHead className="w-[120px]">Ações</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {diaries.map((diary) => {
                        const weather = weatherIcons[diary.weatherCondition] ?? weatherIcons.NONE
                        const WeatherIcon = weather.icon

                        return (
                            <TableRow key={diary.id}>
                                <TableCell className="font-medium whitespace-nowrap">
                                    {formatDate(diary.entryDate)}
                                </TableCell>
                                <TableCell>{diary.projectName}</TableCell>
                                <TableCell className="text-muted-foreground">
                                    {diary.contractorName || '—'}
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-1.5">
                                        <WeatherIcon className="h-4 w-4 text-muted-foreground" />
                                        {diary.workSuspended && (
                                            <Badge variant="destructive" className="text-xs px-1.5 py-0">
                                                <PauseCircle className="h-3 w-3 mr-1" />
                                                Suspenso
                                            </Badge>
                                        )}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <DiaryStatusBadge status={diary.status} />
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-1">
                                        <Button variant="ghost" size="icon" asChild title="Visualizar">
                                            <Link href={`/${slug}/site-diary/${diary.id}`}>
                                                <Eye className="h-4 w-4" />
                                            </Link>
                                        </Button>
                                        {diary.status === 'DRAFT' && (
                                            <>
                                                <Button variant="ghost" size="icon" asChild title="Editar">
                                                    <Link href={`/${slug}/site-diary/${diary.id}/edit`}>
                                                        <Edit2 className="h-4 w-4" />
                                                    </Link>
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    title="Excluir"
                                                    onClick={() => setDeletingId(diary.id)}
                                                >
                                                    <Trash2 className="h-4 w-4 text-destructive" />
                                                </Button>
                                            </>
                                        )}
                                    </div>
                                </TableCell>
                            </TableRow>
                        )
                    })}
                </TableBody>
            </Table>

            <AlertDialog open={!!deletingId} onOpenChange={(open) => !open && setDeletingId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Excluir diário de obra?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta ação não pode ser desfeita. O diário e todos os seus dados serão removidos.
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
