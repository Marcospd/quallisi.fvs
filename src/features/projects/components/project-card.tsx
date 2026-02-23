'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Building2, MapPin, Edit2, MoreVertical, Power, FileText, Settings } from 'lucide-react'
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

    // Cor dinâmica da barra de qualidade baseada no valor mockado
    const getQualityColor = (value: number) => {
        if (value >= 90) return 'bg-emerald-500'
        if (value >= 70) return 'bg-amber-500'
        return 'bg-destructive'
    }

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
                <div className="relative h-48 w-full overflow-hidden rounded-t-xl bg-muted/50">
                    {project.imageUrl ? (
                        <Image
                            src={project.imageUrl}
                            alt={`Capa da obra ${project.name}`}
                            fill
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                            className="object-cover transition-transform hover:scale-105 duration-500"
                        />
                    ) : (
                        <div className="absolute inset-0 flex items-center justify-center bg-blue-50 dark:bg-blue-950/20">
                            <Building2 className="h-12 w-12 text-blue-200 dark:text-blue-800" />
                        </div>
                    )}

                    {/* Status / Tags floatings */}
                    <div className="absolute left-3 top-3 flex gap-2 flex-col items-start">
                        {!project.active && (
                            <Badge variant="destructive" className="shadow-sm">
                                Inativa
                            </Badge>
                        )}
                    </div>

                    {/* Quick Menu */}
                    <div className="absolute right-3 top-3">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="secondary" size="icon" className="h-8 w-8 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background shadow-sm">
                                    <MoreVertical className="h-4 w-4" />
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
                <div className="flex flex-1 flex-col p-5 gap-4">
                    <div>
                        <h3 className="font-semibold text-lg line-clamp-1 leading-tight tracking-tight mb-1" title={project.name}>
                            {project.name}
                        </h3>
                        <div className="flex items-start text-muted-foreground gap-1.5 min-h-5">
                            <MapPin className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                            <p className="text-sm line-clamp-1" title={project.address || 'Sem endereço'}>
                                {project.address || 'Endereço não cadastrado'}
                            </p>
                        </div>
                    </div>

                    {/* Quality Metrics */}
                    <div className="space-y-2 mt-auto pt-2 border-t">
                        <div className="flex items-center justify-between text-sm">
                            <span className="font-medium text-muted-foreground">Índice de Qualidade</span>
                            <span className="font-bold tracking-tight">
                                {total > 0 ? `${qualityPercent}% aprovado` : 'Sem dados'}
                            </span>
                        </div>
                        <Progress
                            value={qualityPercent}
                            className="h-2"
                            indicatorColor={total > 0 ? getQualityColor(qualityPercent) : 'bg-muted'}
                        />
                        {total > 0 && (
                            <p className="text-[10px] text-muted-foreground text-right w-full">
                                {approved} de {total} inspeções
                            </p>
                        )}
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="grid grid-cols-2 gap-2 p-5 pt-0">
                    <Button variant="outline" className="w-full text-xs sm:text-sm" disabled>
                        <FileText className="mr-2 h-3.5 w-3.5" />
                        Relatórios
                    </Button>
                    <Button asChild className="w-full text-xs sm:text-sm">
                        <Link href={`/${tenant.slug}/locations?projectId=${project.id}`}>
                            <Settings className="mr-2 h-3.5 w-3.5" />
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
