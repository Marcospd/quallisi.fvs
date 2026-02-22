'use client'

import { Loader2, Check } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip'

interface ServiceItem {
    id: string
    name: string
}

interface LocationItem {
    id: string
    name: string
}

interface PlanningDataItem {
    planning: {
        id: string
        serviceId: string
        locationId: string
        status: string
    }
    service: { id: string; name: string }
    location: { id: string; name: string }
}

interface PlanningGridProps {
    services: ServiceItem[]
    locations: LocationItem[]
    planningData: PlanningDataItem[]
    onToggle: (serviceId: string, locationId: string) => void
    togglingKey: string | null
}

/**
 * Grid de planejamento: Serviços (linhas) × Locais (colunas).
 * Cada célula é um checkbox que marca/desmarca inspeção planejada.
 */
export function PlanningGrid({
    services,
    locations,
    planningData,
    onToggle,
    togglingKey,
}: PlanningGridProps) {
    function isPlanned(serviceId: string, locationId: string): PlanningDataItem | undefined {
        return planningData.find(
            (item) =>
                item.planning.serviceId === serviceId &&
                item.planning.locationId === locationId
        )
    }

    function getKey(serviceId: string, locationId: string): string {
        return `${serviceId}-${locationId}`
    }

    return (
        <Card>
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Grade de Planejamento</CardTitle>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                            <div className="h-4 w-4 rounded bg-primary/20 border border-primary flex items-center justify-center">
                                <Check className="h-3 w-3 text-primary" />
                            </div>
                            <span>Planejado</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <div className="h-4 w-4 rounded border border-muted-foreground/30 bg-background" />
                            <span>Não planejado</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <Badge variant="secondary" className="text-xs h-5">INSPECTED</Badge>
                            <span>Já inspecionado</span>
                        </div>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="overflow-x-auto">
                    <TooltipProvider>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="min-w-[200px] sticky left-0 bg-background z-10">
                                        Serviço
                                    </TableHead>
                                    {locations.map((location) => (
                                        <TableHead
                                            key={location.id}
                                            className="text-center min-w-[100px]"
                                        >
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <span className="truncate block max-w-[100px]">
                                                        {location.name}
                                                    </span>
                                                </TooltipTrigger>
                                                <TooltipContent>{location.name}</TooltipContent>
                                            </Tooltip>
                                        </TableHead>
                                    ))}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {services.map((service) => (
                                    <TableRow key={service.id}>
                                        <TableCell className="font-medium sticky left-0 bg-background z-10">
                                            {service.name}
                                        </TableCell>
                                        {locations.map((location) => {
                                            const planned = isPlanned(service.id, location.id)
                                            const key = getKey(service.id, location.id)
                                            const isToggling = togglingKey === key
                                            const isInspected = planned?.planning.status === 'INSPECTED'

                                            return (
                                                <TableCell
                                                    key={location.id}
                                                    className="text-center"
                                                >
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <button
                                                                type="button"
                                                                onClick={() => onToggle(service.id, location.id)}
                                                                disabled={isToggling || isInspected}
                                                                className={`
                                                                    h-8 w-8 rounded border-2 mx-auto flex items-center justify-center
                                                                    transition-all duration-150
                                                                    ${isInspected
                                                                        ? 'bg-emerald-100 border-emerald-500 cursor-not-allowed dark:bg-emerald-950'
                                                                        : planned
                                                                            ? 'bg-primary/20 border-primary hover:bg-primary/30 cursor-pointer'
                                                                            : 'bg-background border-muted-foreground/20 hover:border-muted-foreground/50 cursor-pointer'
                                                                    }
                                                                    ${isToggling ? 'opacity-50' : ''}
                                                                `}
                                                            >
                                                                {isToggling ? (
                                                                    <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                                                                ) : planned ? (
                                                                    <Check className={`h-4 w-4 ${isInspected ? 'text-emerald-600' : 'text-primary'}`} />
                                                                ) : null}
                                                            </button>
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            {isInspected
                                                                ? `${service.name} × ${location.name} — Já inspecionado`
                                                                : planned
                                                                    ? `Remover: ${service.name} × ${location.name}`
                                                                    : `Planejar: ${service.name} × ${location.name}`
                                                            }
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </TableCell>
                                            )
                                        })}
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TooltipProvider>
                </div>
            </CardContent>
        </Card>
    )
}
