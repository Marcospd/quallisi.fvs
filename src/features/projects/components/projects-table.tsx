'use client'

import { useState } from 'react'
import { toggleProjectActive } from '../actions'
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
import { Power, Building2, MapPin } from 'lucide-react'
import { toast } from 'sonner'
import type { InferSelectModel } from 'drizzle-orm'
import type { projects } from '@/lib/db/schema/projects'

type Project = InferSelectModel<typeof projects>

/**
 * Tabela de obras melhorada com elemento visual por item e status badge.
 */
export function ProjectsTable({ projects: data }: { projects: Project[] }) {
    const [pendingId, setPendingId] = useState<string | null>(null)

    async function handleToggle(projectId: string) {
        setPendingId(projectId)
        try {
            const result = await toggleProjectActive(projectId)
            if (result?.error) {
                toast.error(typeof result.error === 'string' ? result.error : 'Erro')
            } else {
                toast.success(result.data?.active ? 'Obra ativada' : 'Obra desativada')
            }
        } catch {
            toast.error('Erro ao alterar obra')
        } finally {
            setPendingId(null)
        }
    }

    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Obra</TableHead>
                        <TableHead>Endereço</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="w-[80px]">Ações</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {data.map((project) => (
                        <TableRow key={project.id}>
                            <TableCell>
                                <div className="flex items-center gap-3">
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                                        <Building2 className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <p className="font-medium">{project.name}</p>
                                    </div>
                                </div>
                            </TableCell>
                            <TableCell>
                                {project.address ? (
                                    <div className="flex items-center gap-1.5 text-muted-foreground">
                                        <MapPin className="h-3.5 w-3.5 shrink-0" />
                                        <span className="text-sm">{project.address}</span>
                                    </div>
                                ) : (
                                    <span className="text-sm text-muted-foreground">—</span>
                                )}
                            </TableCell>
                            <TableCell>
                                <StatusBadge
                                    label={project.active ? 'Ativa' : 'Inativa'}
                                    variant={project.active ? 'success' : 'neutral'}
                                />
                            </TableCell>
                            <TableCell>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleToggle(project.id)}
                                    disabled={pendingId === project.id}
                                    title={project.active ? 'Desativar' : 'Ativar'}
                                >
                                    <Power className={`h-4 w-4 ${project.active ? 'text-emerald-500' : 'text-muted-foreground'}`} />
                                </Button>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    )
}
