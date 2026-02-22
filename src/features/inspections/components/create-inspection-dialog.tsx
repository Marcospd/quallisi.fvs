'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { createInspection } from '../actions'
import { listProjects } from '@/features/projects/actions'
import { listLocations } from '@/features/locations/actions'
import { listServices } from '@/features/services/actions'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'

function getCurrentMonth(): string {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

interface Project {
    id: string
    name: string
    active: boolean
}

interface Location {
    id: string
    name: string
    active: boolean
}

interface Service {
    id: string
    name: string
    active: boolean
    criteriaCount: number
}

/**
 * Dialog para criar uma nova inspeção FVS.
 */
export function CreateInspectionDialog({
    children,
    tenantSlug,
}: {
    children: React.ReactNode
    tenantSlug: string
}) {
    const router = useRouter()
    const [open, setOpen] = useState(false)
    const [isPending, setIsPending] = useState(false)
    const [loading, setLoading] = useState(false)

    const [projectsList, setProjectsList] = useState<Project[]>([])
    const [locationsList, setLocationsList] = useState<Location[]>([])
    const [servicesList, setServicesList] = useState<Service[]>([])

    const [selectedProject, setSelectedProject] = useState('')
    const [selectedLocation, setSelectedLocation] = useState('')
    const [selectedService, setSelectedService] = useState('')

    // Carregar obras e serviços quando o dialog abre
    useEffect(() => {
        if (!open) return
        setLoading(true)
        Promise.all([listProjects(), listServices()])
            .then(([projectsResult, servicesResult]) => {
                if (projectsResult.data) {
                    setProjectsList(projectsResult.data.filter((p) => p.active) as Project[])
                }
                if (servicesResult.data) {
                    setServicesList(
                        (servicesResult.data as Service[]).filter((s) => s.active && s.criteriaCount > 0)
                    )
                }
            })
            .finally(() => setLoading(false))
    }, [open])

    // Carregar locais quando selecionar obra
    useEffect(() => {
        if (!selectedProject) {
            setLocationsList([])
            setSelectedLocation('')
            return
        }
        listLocations({ projectId: selectedProject, limit: 1000 }).then((result) => {
            if (result.data) {
                setLocationsList((result.data.map(d => d.location) as Location[]).filter((l) => l.active))
            }
        })
    }, [selectedProject])

    async function handleCreate() {
        if (!selectedProject || !selectedService || !selectedLocation) {
            toast.error('Selecione obra, serviço e local')
            return
        }

        setIsPending(true)
        try {
            const result = await createInspection({
                projectId: selectedProject,
                serviceId: selectedService,
                locationId: selectedLocation,
                referenceMonth: getCurrentMonth(),
            })

            if (result.error) {
                toast.error(typeof result.error === 'string' ? result.error : 'Erro')
            } else if (result.data) {
                toast.success('Inspeção criada! Redirecionando...')
                setOpen(false)
                router.push(`/${tenantSlug}/inspections/${result.data.id}`)
            }
        } catch {
            toast.error('Erro ao criar inspeção')
        } finally {
            setIsPending(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Nova Inspeção FVS</DialogTitle>
                    <DialogDescription>
                        Selecione a obra, serviço e local para iniciar uma inspeção
                    </DialogDescription>
                </DialogHeader>

                {loading ? (
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>Obra</Label>
                            <Select value={selectedProject} onValueChange={setSelectedProject}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecione uma obra" />
                                </SelectTrigger>
                                <SelectContent>
                                    {projectsList.map((p) => (
                                        <SelectItem key={p.id} value={p.id}>
                                            {p.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Serviço</Label>
                            <Select value={selectedService} onValueChange={setSelectedService}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecione um serviço" />
                                </SelectTrigger>
                                <SelectContent>
                                    {servicesList.map((s) => (
                                        <SelectItem key={s.id} value={s.id}>
                                            {s.name} ({s.criteriaCount} critérios)
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Local</Label>
                            <Select
                                value={selectedLocation}
                                onValueChange={setSelectedLocation}
                                disabled={!selectedProject}
                            >
                                <SelectTrigger>
                                    <SelectValue
                                        placeholder={
                                            !selectedProject
                                                ? 'Selecione uma obra primeiro'
                                                : 'Selecione um local'
                                        }
                                    />
                                </SelectTrigger>
                                <SelectContent>
                                    {locationsList.map((l) => (
                                        <SelectItem key={l.id} value={l.id}>
                                            {l.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <Button
                            onClick={handleCreate}
                            className="w-full"
                            disabled={
                                isPending || !selectedProject || !selectedService || !selectedLocation
                            }
                        >
                            {isPending ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Criando...
                                </>
                            ) : (
                                'Criar Inspeção'
                            )}
                        </Button>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    )
}
