'use client'

import { useState } from 'react'
import { toggleProjectActive } from '../actions'
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
import { Power } from 'lucide-react'
import { toast } from 'sonner'
import type { InferSelectModel } from 'drizzle-orm'
import type { projects } from '@/lib/db/schema/projects'

type Project = InferSelectModel<typeof projects>

/**
 * Tabela de obras com toggle de ativo/inativo.
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
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Endereço</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[80px]">Ações</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {data.map((project) => (
                    <TableRow key={project.id}>
                        <TableCell className="font-medium">{project.name}</TableCell>
                        <TableCell className="text-muted-foreground">
                            {project.address || '—'}
                        </TableCell>
                        <TableCell>
                            <Badge variant={project.active ? 'default' : 'secondary'}>
                                {project.active ? 'Ativa' : 'Inativa'}
                            </Badge>
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
    )
}
