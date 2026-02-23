'use client'

import { useState } from 'react'
import { toggleLocationActive } from '../actions'
import { Button } from '@/components/ui/button'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { StatusBadge } from '@/components/status-badge'
import { Power, MapPin, Edit2 } from 'lucide-react'
import { toast } from 'sonner'
import type { InferSelectModel } from 'drizzle-orm'
import type { locations, projects } from '@/lib/db/schema'
import { EditLocationDialog } from './edit-location-dialog'

type Location = InferSelectModel<typeof locations>
type Project = InferSelectModel<typeof projects>

type LocationWithProject = {
    location: Location
    project: Project
}

interface LocationsTableProps {
    data: (LocationWithProject | { location: Location; project: null })[]
    projects: Project[] // Para o select do edit dialog
}

/**
 * Tabela de locais com elemento visual por item, status badge e suporte a edição.
 */
export function LocationsTable({ data, projects }: LocationsTableProps) {
    const [pendingId, setPendingId] = useState<string | null>(null)
    const [editingLocation, setEditingLocation] = useState<Location | null>(null)

    async function handleToggle(locationId: string) {
        setPendingId(locationId)
        try {
            const result = await toggleLocationActive(locationId)
            if (result?.error) {
                toast.error(typeof result.error === 'string' ? result.error : 'Erro')
            } else {
                toast.success(result.data?.active ? 'Local ativado' : 'Local desativado')
            }
        } catch {
            toast.error('Erro ao alterar local')
        } finally {
            setPendingId(null)
        }
    }

    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Local</TableHead>
                        <TableHead>Obra</TableHead>
                        <TableHead>Descrição</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="w-[80px]">Ações</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {data.map((item) => {
                        const loc = 'location' in item ? item.location : item as unknown as Location
                        const proj = 'project' in item ? item.project : null

                        return (
                            <TableRow
                                key={loc.id}
                                onDoubleClick={() => setEditingLocation(loc)}
                                className="cursor-pointer"
                            >
                                <TableCell>
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400">
                                            <MapPin className="h-4 w-4" />
                                        </div>
                                        <span className="font-medium">{loc.name}</span>
                                    </div>
                                </TableCell>
                                <TableCell className="text-sm text-muted-foreground">
                                    {proj?.name || '—'}
                                </TableCell>
                                <TableCell className="text-sm text-muted-foreground">
                                    {loc.description || '—'}
                                </TableCell>
                                <TableCell>
                                    <StatusBadge
                                        label={loc.active ? 'Ativo' : 'Inativo'}
                                        variant={loc.active ? 'success' : 'neutral'}
                                    />
                                </TableCell>
                                <TableCell>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => setEditingLocation(loc)}
                                        title="Editar local"
                                    >
                                        <Edit2 className="h-4 w-4 text-muted-foreground" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleToggle(loc.id)}
                                        disabled={pendingId === loc.id}
                                        title={loc.active ? 'Desativar' : 'Ativar'}
                                    >
                                        <Power className={`h-4 w-4 ${loc.active ? 'text emerald-500' : 'text-muted-foreground'}`} />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        )
                    })}
                </TableBody>
            </Table>

            <EditLocationDialog
                location={editingLocation}
                projects={projects}
                open={!!editingLocation}
                onOpenChange={(open) => !open && setEditingLocation(null)}
            />
        </div>
    )
}
