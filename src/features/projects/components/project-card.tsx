'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Building2, MapPin, Edit2, MoreVertical, Power, Settings } from 'lucide-react'
import { toast } from 'sonner'
import type { InferSelectModel } from 'drizzle-orm'

import type { projects } from '@/lib/db/schema/projects'
import { toggleProjectActive } from '../actions'
import { EditProjectDialog } from './edit-project-dialog'
import { useTenant } from '@/features/tenant/components/tenant-provider'

import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

type Project = InferSelectModel<typeof projects>

interface ProjectCardProps {
    project: Project
    stats?: {
        total: number
        approved: number
    }
}

export function ProjectCard({ project, stats }: ProjectCardProps) {
    const [pending, setPending] = useState(false)
    const [editing, setEditing] = useState(false)
    const { tenant } = useTenant()

    // Cálculo real baseado nas métricas vindas do BD (ou mock inicial 0)
    const total = stats?.total || 0
    const approved = stats?.approved || 0
    const qualityPercent = total > 0 ? Math.round((approved / total) * 100) : 0


    async function handleToggle() {
        setPending(true)
        try {
            const result = await toggleProjectActive(project.id)
            if (result?.error) {
                toast.error(typeof result.error === 'string' ? result.error : 'Erro ao alterar status')
            } else {
                toast.success(result.data?.active ? 'Obra ativada com sucesso' : 'Obra desativada com sucesso')
            }
        } catch {
            toast.error('Erro de conexão ao alterar a obra')
        } finally {
            setPending(false)
        }
    }

    return (
        <>
            <div className={`flex flex-col rounded-xl border bg-card text-card-foreground shadow-sm transition-all hover:shadow-md ${!project.active ? 'opacity-70 grayscale-[0.3]' : ''}`}>

                {/* Image Cover Area */}
                <div className="relative h-28 w-full overflow-hidden rounded-t-xl bg-muted/50">
                    {project.imageUrl ? (
                        <Image
                            src={project.imageUrl}
                            alt={`Capa da obra ${project.name}`}
                            fill
                            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 20vw"
                            className="object-cover transition-transform hover:scale-105 duration-500"
                        />
                    ) : (
                        <div className="absolute inset-0 flex items-center justify-center bg-blue-50 dark:bg-blue-950/20">
                            <Building2 className="h-8 w-8 text-blue-200 dark:text-blue-800" />
                        </div>
                    )}

                    {/* Status / Tags floatings */}
                    <div className="absolute left-2 top-2 flex gap-1 flex-col items-start">
                        {!project.active && (
                            <Badge variant="destructive" className="shadow-sm text-[10px] px-1.5 py-0">
                                Inativa
                            </Badge>
                        )}
                    </div>

                    {/* Quick Menu */}
                    <div className="absolute right-2 top-2">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="secondary" size="icon" className="h-6 w-6 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background shadow-sm">
                                    <MoreVertical className="h-3 w-3" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuLabel>Ações da Obra</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => setEditing(true)}>
                                    <Edit2 className="mr-2 h-4 w-4" />
                                    Editar Informações
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                    onClick={handleToggle}
                                    disabled={pending}
                                    className={project.active ? 'text-amber-600' : 'text-emerald-600'}
                                >
                                    <Power className="mr-2 h-4 w-4" />
                                    {project.active ? 'Pausar/Desativar Obra' : 'Reativar Obra'}
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>

                {/* Content Area */}
                <div className="flex flex-1 flex-col p-3 gap-2">
                    <div>
                        <h3 className="font-semibold text-sm line-clamp-1 leading-tight tracking-tight mb-0.5" title={project.name}>
                            {project.name}
                        </h3>
                        <div className="flex items-start text-muted-foreground gap-1 min-h-4">
                            <MapPin className="h-3 w-3 mt-0.5 shrink-0" />
                            <p className="text-xs line-clamp-1" title={project.address || 'Sem endereço'}>
                                {project.address || 'Endereço não cadastrado'}
                            </p>
                        </div>
                    </div>

                    {/* Quality Metrics */}
                    <div className="space-y-1 mt-auto pt-2 border-t">
                        <div className="flex items-center justify-between text-xs">
                            <span className="font-medium text-muted-foreground">Qualidade</span>
                            <span className="font-bold tracking-tight">
                                {total > 0 ? `${qualityPercent}%` : '—'}
                            </span>
                        </div>
                        <Progress
                            value={qualityPercent}
                            className="h-1.5"
                            indicatorColor={total > 0 ? 'bg-emerald-500' : 'bg-muted'}
                        />
                        {total > 0 && (
                            <p className="text-[10px] text-muted-foreground text-right w-full">
                                {approved}/{total} itens conformes
                            </p>
                        )}
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="p-3 pt-0">
                    <Button asChild className="w-full text-[11px] h-7">
                        <Link href={`/${tenant.slug}/locations?projectId=${project.id}`}>
                            <Settings className="mr-1 h-3 w-3" />
                            Gerenciar
                        </Link>
                    </Button>
                </div>
            </div>

            <EditProjectDialog
                project={project}
                open={editing}
                onOpenChange={setEditing}
            />
        </>
    )
}
