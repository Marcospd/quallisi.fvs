'use client'

import { useEffect, useState, useTransition } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useForm, useFieldArray, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Plus, Trash2, Loader2, BookOpen } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
} from '@/components/ui/command'
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover'

import { createSiteDiarySchema, type CreateSiteDiaryInput } from '../schemas'
import { createSiteDiary, updateSiteDiary } from '../actions'
import { listProjectOptions, getProject } from '@/features/projects/actions'
import { listServiceOptions } from '@/features/services/actions'

interface ProjectOption {
    id: string
    name: string
    active: boolean
}

interface ServiceOption {
    id: string
    name: string
    unit: string | null
}

interface DiaryFormProps {
    mode: 'create' | 'edit'
    diaryId?: string
    defaultValues?: Partial<CreateSiteDiaryInput>
}

export function DiaryForm({ mode, diaryId, defaultValues }: DiaryFormProps) {
    const router = useRouter()
    const params = useParams()
    const slug = params.slug as string
    const [isPending, startTransition] = useTransition()
    const [projects, setProjects] = useState<ProjectOption[]>([])
    const [serviceOptions, setServiceOptions] = useState<ServiceOption[]>([])
    const [openServicePopover, setOpenServicePopover] = useState<number | null>(null)

    const form = useForm<CreateSiteDiaryInput>({
        resolver: zodResolver(createSiteDiarySchema),
        defaultValues: {
            projectId: '',
            entryDate: new Date().toISOString().slice(0, 10),
            orderNumber: '',
            contractorName: '',
            networkDiagramRef: '',
            engineerName: '',
            foremanName: '',
            weatherCondition: 'NONE',
            workSuspended: false,
            totalHours: undefined,
            laborEntries: [],
            equipmentEntries: [],
            servicesExecuted: [],
            observations: [],
            ...defaultValues,
        },
    })

    const laborFields = useFieldArray({ control: form.control, name: 'laborEntries' })
    const equipmentFields = useFieldArray({ control: form.control, name: 'equipmentEntries' })
    const servicesFields = useFieldArray({ control: form.control, name: 'servicesExecuted' })
    const observationFields = useFieldArray({ control: form.control, name: 'observations' })

    useEffect(() => {
        Promise.all([
            listProjectOptions(),
            listServiceOptions(),
        ]).then(([projRes, svcRes]) => {
            if (projRes.data) setProjects(projRes.data)
            if (svcRes.data) setServiceOptions(svcRes.data.map((s) => ({ id: s.id, name: s.name, unit: s.unit })))
        })
    }, [])

    // Auto-fill campos da obra quando projeto muda (apenas em criação)
    async function handleProjectChange(projectId: string) {
        form.setValue('projectId', projectId, { shouldValidate: true })

        if (mode === 'create' && projectId) {
            const res = await getProject(projectId)
            if (res.data) {
                const project = res.data
                if (!form.getValues('engineerName') && project.engineerName) {
                    form.setValue('engineerName', project.engineerName)
                }
                if (!form.getValues('contractorName') && project.clientName) {
                    form.setValue('contractorName', project.clientName)
                }
            }
        }
    }

    function handleSelectService(index: number, service: ServiceOption) {
        form.setValue(`servicesExecuted.${index}.description`, service.name, { shouldValidate: true })
        form.setValue(`servicesExecuted.${index}.serviceId`, service.id)
        form.setValue(`servicesExecuted.${index}.unit`, service.unit || '')
        setOpenServicePopover(null)
    }

    function onSubmit(data: CreateSiteDiaryInput) {
        startTransition(async () => {
            const result = mode === 'create'
                ? await createSiteDiary(data)
                : await updateSiteDiary(diaryId!, data)

            if (result?.error) {
                const msg = typeof result.error === 'string' ? result.error : 'Erro de validação'
                toast.error(msg)
                return
            }

            toast.success(mode === 'create' ? 'Diário criado com sucesso!' : 'Diário atualizado!')
            router.push(`/${slug}/site-diary`)
        })
    }

    return (
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Cabeçalho */}
            <Card>
                <CardHeader>
                    <CardTitle>Informações Gerais</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="space-y-2">
                        <Label>Obra *</Label>
                        <Controller
                            control={form.control}
                            name="projectId"
                            render={({ field }) => (
                                <Select value={field.value} onValueChange={handleProjectChange}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecione a obra" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {projects.map((p) => (
                                            <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}
                        />
                        {form.formState.errors.projectId && (
                            <p className="text-xs text-destructive">{form.formState.errors.projectId.message}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label>Data *</Label>
                        <Input type="date" {...form.register('entryDate')} />
                        {form.formState.errors.entryDate && (
                            <p className="text-xs text-destructive">{form.formState.errors.entryDate.message}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label>N. Ordem de Serviço</Label>
                        <Input {...form.register('orderNumber')} placeholder="Ex: OS-001" />
                    </div>

                    <div className="space-y-2">
                        <Label>Prestadora</Label>
                        <Input {...form.register('contractorName')} placeholder="Nome da empreiteira" />
                    </div>

                    <div className="space-y-2">
                        <Label>Ref. Diagrama de Rede</Label>
                        <Input {...form.register('networkDiagramRef')} placeholder="Referência" />
                    </div>

                    <div className="space-y-2">
                        <Label>Engenheiro</Label>
                        <Input {...form.register('engineerName')} placeholder="Preenchido automaticamente da obra" />
                    </div>

                    <div className="space-y-2">
                        <Label>Encarregado</Label>
                        <Input {...form.register('foremanName')} placeholder="Nome do encarregado" />
                    </div>

                    <div className="space-y-2">
                        <Label>Condição Climática *</Label>
                        <Controller
                            control={form.control}
                            name="weatherCondition"
                            render={({ field }) => (
                                <Select value={field.value} onValueChange={field.onChange}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="NONE">Sem chuva</SelectItem>
                                        <SelectItem value="LIGHT_RAIN">Chuva leve</SelectItem>
                                        <SelectItem value="HEAVY_RAIN">Chuva forte</SelectItem>
                                    </SelectContent>
                                </Select>
                            )}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Total de Horas</Label>
                        <Input
                            type="number"
                            step="0.5"
                            min="0"
                            max="24"
                            {...form.register('totalHours', { valueAsNumber: true })}
                            placeholder="0"
                        />
                    </div>

                    <div className="flex items-center gap-2 pt-6">
                        <Controller
                            control={form.control}
                            name="workSuspended"
                            render={({ field }) => (
                                <Checkbox
                                    id="workSuspended"
                                    checked={field.value}
                                    onCheckedChange={(v) => field.onChange(!!v)}
                                />
                            )}
                        />
                        <Label htmlFor="workSuspended" className="cursor-pointer">
                            Trabalho suspenso
                        </Label>
                    </div>
                </CardContent>
            </Card>

            {/* Mão de Obra */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Mão de Obra</CardTitle>
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => laborFields.append({ role: '', quantity: 1, hours: 8 })}
                    >
                        <Plus className="h-4 w-4 mr-1" /> Adicionar
                    </Button>
                </CardHeader>
                <CardContent>
                    {laborFields.fields.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-4">
                            Nenhuma entrada de mão de obra
                        </p>
                    ) : (
                        <div className="space-y-3">
                            <div className="grid grid-cols-[1fr_80px_80px_40px] gap-2 text-xs font-medium text-muted-foreground px-1">
                                <span>Função</span>
                                <span>Qtd</span>
                                <span>Horas</span>
                                <span />
                            </div>
                            {laborFields.fields.map((field, index) => (
                                <div key={field.id} className="grid grid-cols-[1fr_80px_80px_40px] gap-2 items-start">
                                    <div>
                                        <Input
                                            {...form.register(`laborEntries.${index}.role`)}
                                            placeholder="Ex: Pedreiro"
                                        />
                                        {form.formState.errors.laborEntries?.[index]?.role && (
                                            <p className="text-xs text-destructive mt-1">
                                                {form.formState.errors.laborEntries[index]?.role?.message}
                                            </p>
                                        )}
                                    </div>
                                    <Input
                                        type="number"
                                        min="1"
                                        {...form.register(`laborEntries.${index}.quantity`, { valueAsNumber: true })}
                                    />
                                    <Input
                                        type="number"
                                        step="0.5"
                                        min="0.5"
                                        {...form.register(`laborEntries.${index}.hours`, { valueAsNumber: true })}
                                    />
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => laborFields.remove(index)}
                                    >
                                        <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Equipamentos */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Equipamentos</CardTitle>
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => equipmentFields.append({ description: '', quantity: 1, notes: '' })}
                    >
                        <Plus className="h-4 w-4 mr-1" /> Adicionar
                    </Button>
                </CardHeader>
                <CardContent>
                    {equipmentFields.fields.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-4">
                            Nenhum equipamento registrado
                        </p>
                    ) : (
                        <div className="space-y-3">
                            <div className="grid grid-cols-[1fr_80px_1fr_40px] gap-2 text-xs font-medium text-muted-foreground px-1">
                                <span>Descrição</span>
                                <span>Qtd</span>
                                <span>Observação</span>
                                <span />
                            </div>
                            {equipmentFields.fields.map((field, index) => (
                                <div key={field.id} className="grid grid-cols-[1fr_80px_1fr_40px] gap-2 items-start">
                                    <div>
                                        <Input
                                            {...form.register(`equipmentEntries.${index}.description`)}
                                            placeholder="Ex: Betoneira 400L"
                                        />
                                        {form.formState.errors.equipmentEntries?.[index]?.description && (
                                            <p className="text-xs text-destructive mt-1">
                                                {form.formState.errors.equipmentEntries[index]?.description?.message}
                                            </p>
                                        )}
                                    </div>
                                    <Input
                                        type="number"
                                        min="1"
                                        {...form.register(`equipmentEntries.${index}.quantity`, { valueAsNumber: true })}
                                    />
                                    <Input
                                        {...form.register(`equipmentEntries.${index}.notes`)}
                                        placeholder="Observação (opcional)"
                                    />
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => equipmentFields.remove(index)}
                                    >
                                        <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Serviços Executados */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Serviços Executados</CardTitle>
                        {serviceOptions.length > 0 && (
                            <p className="text-xs text-muted-foreground mt-1">
                                Use <BookOpen className="inline h-3 w-3" /> para buscar no catálogo de serviços
                            </p>
                        )}
                    </div>
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => servicesFields.append({ description: '', serviceId: '', quantity: undefined, unit: '' })}
                    >
                        <Plus className="h-4 w-4 mr-1" /> Adicionar
                    </Button>
                </CardHeader>
                <CardContent>
                    {servicesFields.fields.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-4">
                            Nenhum serviço executado registrado
                        </p>
                    ) : (
                        <div className="space-y-3">
                            <div className="hidden md:grid md:grid-cols-[1fr_100px_80px_40px] gap-2 text-xs font-medium text-muted-foreground px-1">
                                <span>Serviço / Descrição</span>
                                <span>Unidade</span>
                                <span>Qtd</span>
                                <span />
                            </div>
                            {servicesFields.fields.map((field, index) => (
                                <div key={field.id} className="grid grid-cols-1 md:grid-cols-[1fr_100px_80px_40px] gap-2 items-start border rounded-lg p-3 md:border-none md:p-0">
                                    <div className="flex gap-1">
                                        <div className="flex-1">
                                            <Input
                                                {...form.register(`servicesExecuted.${index}.description`)}
                                                placeholder="Ex: Execução de alvenaria bloco 14x19x39"
                                            />
                                            {form.formState.errors.servicesExecuted?.[index]?.description && (
                                                <p className="text-xs text-destructive mt-1">
                                                    {form.formState.errors.servicesExecuted[index]?.description?.message}
                                                </p>
                                            )}
                                        </div>
                                        {serviceOptions.length > 0 && (
                                            <Popover
                                                open={openServicePopover === index}
                                                onOpenChange={(open) => setOpenServicePopover(open ? index : null)}
                                            >
                                                <PopoverTrigger asChild>
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="icon"
                                                        title="Buscar no catálogo de serviços"
                                                    >
                                                        <BookOpen className="h-4 w-4" />
                                                    </Button>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-72 p-0" align="start">
                                                    <Command>
                                                        <CommandInput placeholder="Buscar serviço..." />
                                                        <CommandEmpty>Nenhum serviço encontrado.</CommandEmpty>
                                                        <CommandGroup className="max-h-48 overflow-y-auto">
                                                            {serviceOptions.map((svc) => (
                                                                <CommandItem
                                                                    key={svc.id}
                                                                    value={svc.name}
                                                                    onSelect={() => handleSelectService(index, svc)}
                                                                >
                                                                    <span className="flex-1">{svc.name}</span>
                                                                    {svc.unit && (
                                                                        <span className="text-xs text-muted-foreground ml-2">{svc.unit}</span>
                                                                    )}
                                                                </CommandItem>
                                                            ))}
                                                        </CommandGroup>
                                                    </Command>
                                                </PopoverContent>
                                            </Popover>
                                        )}
                                    </div>
                                    <Input
                                        {...form.register(`servicesExecuted.${index}.unit`)}
                                        placeholder="m², m, un..."
                                    />
                                    <Input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        {...form.register(`servicesExecuted.${index}.quantity`, { valueAsNumber: true })}
                                        placeholder="0,00"
                                    />
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => servicesFields.remove(index)}
                                    >
                                        <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Observações */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Observações / Recomendações</CardTitle>
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => observationFields.append({ origin: 'CONTRACTOR', text: '' })}
                    >
                        <Plus className="h-4 w-4 mr-1" /> Adicionar
                    </Button>
                </CardHeader>
                <CardContent>
                    {observationFields.fields.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-4">
                            Nenhuma observação registrada
                        </p>
                    ) : (
                        <div className="space-y-4">
                            {observationFields.fields.map((field, index) => (
                                <div key={field.id} className="flex gap-3 items-start">
                                    <div className="w-48 shrink-0">
                                        <Controller
                                            control={form.control}
                                            name={`observations.${index}.origin`}
                                            render={({ field }) => (
                                                <Select value={field.value} onValueChange={field.onChange}>
                                                    <SelectTrigger>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="CONTRACTOR">Prestadora</SelectItem>
                                                        <SelectItem value="INSPECTION">Fiscalização</SelectItem>
                                                        <SelectItem value="DMUA">DMUA</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            )}
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <Textarea
                                            {...form.register(`observations.${index}.text`)}
                                            placeholder="Texto da observação..."
                                            rows={2}
                                        />
                                        {form.formState.errors.observations?.[index]?.text && (
                                            <p className="text-xs text-destructive mt-1">
                                                {form.formState.errors.observations[index]?.text?.message}
                                            </p>
                                        )}
                                    </div>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => observationFields.remove(index)}
                                    >
                                        <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Ações */}
            <div className="flex justify-end gap-3">
                <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push(`/${slug}/site-diary`)}
                >
                    Cancelar
                </Button>
                <Button type="submit" disabled={isPending}>
                    {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {mode === 'create' ? 'Criar Diário' : 'Salvar Alterações'}
                </Button>
            </div>
        </form>
    )
}
