'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
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
import { DataTableSortHeader } from '@/components/data-table-sort-header'
import { Power, Edit2 } from 'lucide-react'
import { toast } from 'sonner'

interface ServiceRow {
    id: string
    tenantId: string
    name: string
    unit: string | null
    description: string | null
    active: boolean
    createdAt: Date | null
    updatedAt: Date | null
    criteriaCount: number
}

interface ServicesTableProps {
    services: ServiceRow[]
    slug: string
}

/**
 * Tabela de serviços. Edição navega para tela cheia /services/[id]/edit.
 */
export function ServicesTable({ services: data, slug }: ServicesTableProps) {
    const router = useRouter()
    const [pendingId, setPendingId] = useState<string | null>(null)

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
        <Table>
            <TableHeader>
                <TableRow>
                    <DataTableSortHeader column="name">Serviço</DataTableSortHeader>
                    <TableHead>Unidade</TableHead>
                    <DataTableSortHeader column="description">Descrição</DataTableSortHeader>
                    <TableHead className="text-center">Critérios</TableHead>
                    <DataTableSortHeader column="status">Status</DataTableSortHeader>
                    <TableHead className="w-[100px]">Ações</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {data.map((service) => (
                    <TableRow
                        key={service.id}
                        className="cursor-pointer hover:bg-muted/30"
                        onDoubleClick={() => router.push(`/${slug}/services/${service.id}/edit`)}
                    >
                        <TableCell className="font-medium">{service.name}</TableCell>
                        <TableCell>
                            {service.unit ? (
                                <Badge variant="outline" className="font-mono text-xs">
                                    {service.unit}
                                </Badge>
                            ) : (
                                <span className="text-muted-foreground text-sm">—</span>
                            )}
                        </TableCell>
                        <TableCell className="text-muted-foreground max-w-[280px] truncate">
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
                                    asChild
                                    title="Editar serviço"
                                >
                                    <Link href={`/${slug}/services/${service.id}/edit`}>
                                        <Edit2 className="h-4 w-4 text-muted-foreground" />
                                    </Link>
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
                            </div>
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    )
}
