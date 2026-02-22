'use client'

import { useState } from 'react'
import { toggleServiceActive } from '../actions'
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
import { EditServiceDialog } from './edit-service-dialog'
import { Power, ChevronRight, Edit2 } from 'lucide-react'
import { toast } from 'sonner'

interface ServiceRow {
    id: string
    tenantId: string
    name: string
    description: string | null
    active: boolean
    createdAt: Date | null
    updatedAt: Date | null
    criteriaCount: number
}

interface ServicesTableProps {
    services: ServiceRow[]
    onSelectService: (serviceId: string) => void
    selectedServiceId?: string | null
}

/**
 * Tabela de serviços com toggle ativo/inativo e seleção para gerenciar critérios.
 */
export function ServicesTable({ services: data, onSelectService, selectedServiceId }: ServicesTableProps) {
    const [pendingId, setPendingId] = useState<string | null>(null)
    const [editingService, setEditingService] = useState<ServiceRow | null>(null)

    async function handleToggle(e: React.MouseEvent, serviceId: string) {
        e.stopPropagation()
        setPendingId(serviceId)
        try {
            const result = await toggleServiceActive(serviceId)
            if (result?.error) {
                toast.error(typeof result.error === 'string' ? result.error : 'Erro')
            } else {
                toast.success(result.data?.active ? 'Serviço ativado' : 'Serviço desativado')
            }
        } catch {
            toast.error('Erro ao alterar serviço')
        } finally {
            setPendingId(null)
        }
    }

    return (
        <>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Serviço</TableHead>
                        <TableHead>Descrição</TableHead>
                        <TableHead className="text-center">Critérios</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="w-[100px]">Ações</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {data.map((service) => (
                        <TableRow
                            key={service.id}
                            className={`cursor-pointer transition-colors ${selectedServiceId === service.id ? 'bg-muted/50' : 'hover:bg-muted/30'}`}
                            onClick={() => onSelectService(service.id)}
                            onDoubleClick={() => setEditingService(service)}
                        >
                            <TableCell className="font-medium">{service.name}</TableCell>
                            <TableCell className="text-muted-foreground max-w-[300px] truncate">
                                {service.description || '—'}
                            </TableCell>
                            <TableCell className="text-center">
                                <Badge variant="outline">{service.criteriaCount}</Badge>
                            </TableCell>
                            <TableCell>
                                <Badge variant={service.active ? 'default' : 'secondary'}>
                                    {service.active ? 'Ativo' : 'Inativo'}
                                </Badge>
                            </TableCell>
                            <TableCell>
                                <div className="flex items-center gap-1">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            setEditingService(service)
                                        }}
                                        title="Editar serviço"
                                    >
                                        <Edit2 className="h-4 w-4 text-muted-foreground" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={(e) => handleToggle(e, service.id)}
                                        disabled={pendingId === service.id}
                                        title={service.active ? 'Desativar' : 'Ativar'}
                                    >
                                        <Power className={`h-4 w-4 ${service.active ? 'text-emerald-500' : 'text-muted-foreground'}`} />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => onSelectService(service.id)}
                                        title="Ver critérios"
                                    >
                                        <ChevronRight className="h-4 w-4" />
                                    </Button>
                                </div>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>

            <EditServiceDialog
                service={editingService}
                open={!!editingService}
                onOpenChange={(open) => !open && setEditingService(null)}
            />
        </>
    )
}
