'use client'

import { useState, useEffect, useCallback } from 'react'
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { EmptyState } from '@/components/empty-state'
import { PlanningGrid } from './planning-grid'
import { listPlanningItems, createPlanningItem, deletePlanningItem } from '../actions'
import { listLocations } from '@/features/locations/actions'
import { listServices } from '@/features/services/actions'
import { toast } from 'sonner'
import { Skeleton } from '@/components/ui/skeleton'

interface Project {
    id: string
    name: string
    active: boolean
}

interface PlanningPageClientProps {
    projects: Project[]
}

function getCurrentMonth(): string {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

function formatMonthLabel(month: string): string {
    const [year, m] = month.split('-')
    const months = [
        'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
    ]
    return `${months[parseInt(m) - 1]} ${year}`
}

function changeMonth(month: string, delta: number): string {
    const [year, m] = month.split('-').map(Number)
    const date = new Date(year, m - 1 + delta, 1)
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

interface LocationItem {
    id: string
    name: string
    active: boolean
}

interface ServiceItem {
    id: string
    name: string
    active: boolean
    criteriaCount: number
}

interface PlanningDataItem {
    planning: {
        id: string
        projectId: string
        serviceId: string
        locationId: string
        referenceMonth: string
        status: string
    }
    service: { id: string; name: string }
    location: { id: string; name: string }
}

/**
 * Componente client da página de planejamento mensal.
 * Permite selecionar obra e mês, e exibir/editar grid serviço×local.
 */
export function PlanningPageClient({ projects }: PlanningPageClientProps) {
    const [selectedProjectId, setSelectedProjectId] = useState<string>('')
    const [referenceMonth, setReferenceMonth] = useState(getCurrentMonth())
    const [planningData, setPlanningData] = useState<PlanningDataItem[]>([])
    const [locationsList, setLocationsList] = useState<LocationItem[]>([])
    const [servicesList, setServicesList] = useState<ServiceItem[]>([])
    const [loading, setLoading] = useState(false)
    const [toggling, setToggling] = useState<string | null>(null)

    const activeProjects = projects.filter((p) => p.active)

    const loadData = useCallback(async () => {
        if (!selectedProjectId) return

        setLoading(true)
        try {
            const [planningResult, locationsResult, servicesResult] = await Promise.all([
                listPlanningItems(selectedProjectId, referenceMonth),
                listLocations({ projectId: selectedProjectId, limit: 1000 }),
                listServices(),
            ])

            if (planningResult.data) setPlanningData(planningResult.data as PlanningDataItem[])
            if (locationsResult.data) {
                // Mapear pq action retorna { location, project } e nós queremos só location
                setLocationsList(
                    (locationsResult.data.map(i => i.location) as LocationItem[]).filter((l) => l.active)
                )
            }
            if (servicesResult.data) {
                setServicesList(
                    (servicesResult.data as ServiceItem[]).filter((s) => s.active)
                )
            }
        } catch {
            toast.error('Erro ao carregar dados do planejamento')
        } finally {
            setLoading(false)
        }
    }, [selectedProjectId, referenceMonth])

    useEffect(() => {
        loadData()
    }, [loadData])

    async function handleToggleItem(serviceId: string, locationId: string) {
        if (!selectedProjectId) return

        const key = `${serviceId}-${locationId}`
        setToggling(key)

        // Verificar se já existe
        const existing = planningData.find(
            (item) =>
                item.planning.serviceId === serviceId &&
                item.planning.locationId === locationId
        )

        try {
            if (existing) {
                const result = await deletePlanningItem(existing.planning.id)
                if (result.error) {
                    toast.error(typeof result.error === 'string' ? result.error : 'Erro')
                } else {
                    setPlanningData((prev) =>
                        prev.filter((item) => item.planning.id !== existing.planning.id)
                    )
                }
            } else {
                const result = await createPlanningItem({
                    projectId: selectedProjectId,
                    serviceId,
                    locationId,
                    referenceMonth,
                })
                if (result.error) {
                    toast.error(typeof result.error === 'string' ? result.error : 'Erro')
                } else {
                    await loadData()
                }
            }
        } catch {
            toast.error('Erro ao atualizar planejamento')
        } finally {
            setToggling(null)
        }
    }

    if (activeProjects.length === 0) {
        return (
            <EmptyState
                title="Nenhuma obra ativa"
                description="Cadastre e ative obras para começar o planejamento mensal"
            />
        )
    }

    return (
        <div className="space-y-6">
            {/* Filtros: Obra e Mês */}
            <Card>
                <CardContent className="pt-6">
                    <div className="flex flex-wrap items-center gap-4">
                        <div className="w-[280px]">
                            <Select
                                value={selectedProjectId}
                                onValueChange={setSelectedProjectId}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecione uma obra" />
                                </SelectTrigger>
                                <SelectContent>
                                    {activeProjects.map((project) => (
                                        <SelectItem key={project.id} value={project.id}>
                                            {project.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={() => setReferenceMonth(changeMonth(referenceMonth, -1))}
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <div className="flex items-center gap-2 min-w-[180px] justify-center">
                                <CalendarDays className="h-4 w-4 text-muted-foreground" />
                                <span className="font-medium">
                                    {formatMonthLabel(referenceMonth)}
                                </span>
                            </div>
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={() => setReferenceMonth(changeMonth(referenceMonth, 1))}
                            >
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>

                        {planningData.length > 0 && (
                            <span className="text-sm text-muted-foreground ml-auto">
                                {planningData.length} item{planningData.length !== 1 ? 's' : ''} planejado{planningData.length !== 1 ? 's' : ''}
                            </span>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Grid */}
            {!selectedProjectId ? (
                <EmptyState
                    title="Selecione uma obra"
                    description="Escolha uma obra acima para visualizar e editar o planejamento mensal"
                />
            ) : loading ? (
                <Card>
                    <CardHeader>
                        <Skeleton className="h-6 w-48" />
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {[1, 2, 3, 4].map((i) => (
                            <Skeleton key={i} className="h-10 w-full" />
                        ))}
                    </CardContent>
                </Card>
            ) : servicesList.length === 0 || locationsList.length === 0 ? (
                <EmptyState
                    title={servicesList.length === 0 ? 'Nenhum serviço ativo' : 'Nenhum local cadastrado'}
                    description={
                        servicesList.length === 0
                            ? 'Cadastre serviços em "Serviços e Critérios" antes de planejar'
                            : 'Cadastre locais em "Locais" para esta obra antes de planejar'
                    }
                />
            ) : (
                <PlanningGrid
                    services={servicesList}
                    locations={locationsList}
                    planningData={planningData}
                    onToggle={handleToggleItem}
                    togglingKey={toggling}
                />
            )}
        </div>
    )
}
