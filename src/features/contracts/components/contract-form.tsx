'use client'

import { useEffect, useState, useTransition, useMemo } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useForm, useFieldArray, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Plus, Trash2, Loader2, BookOpen } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
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

import { createContractSchema, unitOptions, type CreateContractInput } from '../schemas'
import { createContract, updateContract } from '../actions'
import { listProjectOptions } from '@/features/projects/actions'
import { listActiveContractors } from '@/features/contractors/actions'
import { listServiceOptions } from '@/features/services/actions'

interface OptionItem {
    id: string
    name: string
}

interface ServiceOption {
    id: string
    name: string
    unit: string | null
}

interface ContractFormProps {
    mode: 'create' | 'edit'
    contractId?: string
    defaultValues?: Partial<CreateContractInput>
}

const unitLabels: Record<string, string> = {
    M2: 'm²',
    M3: 'm³',
    ML: 'ml',
    KG: 'kg',
    VB: 'vb',
    DIA: 'dia',
    UNID: 'un',
    M: 'm',
    TON: 'ton',
    L: 'L',
}

// Mapeia unidade livre (do catálogo) para enum do contrato
function mapUnitToContractUnit(unit: string | null): string {
    if (!unit) return 'M2'
    const normalized = unit.toLowerCase().replace('²', '2').replace('³', '3')
    const map: Record<string, string> = {
        'm2': 'M2', 'm²': 'M2',
        'm3': 'M3', 'm³': 'M3',
        'ml': 'ML', 'm': 'M',
        'kg': 'KG',
        'vb': 'VB',
        'dia': 'DIA',
        'un': 'UNID', 'unid': 'UNID',
        'ton': 'TON', 't': 'TON',
        'l': 'L',
    }
    return map[normalized] ?? 'M2'
}

function formatCurrency(value: number) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

export function ContractForm({ mode, contractId, defaultValues }: ContractFormProps) {
    const router = useRouter()
    const params = useParams()
    const slug = params.slug as string
    const [isPending, startTransition] = useTransition()
    const [projectOptions, setProjectOptions] = useState<OptionItem[]>([])
    const [contractorOptions, setContractorOptions] = useState<OptionItem[]>([])
    const [serviceOptions, setServiceOptions] = useState<ServiceOption[]>([])
    const [openServicePopover, setOpenServicePopover] = useState<number | null>(null)

    const form = useForm<CreateContractInput>({
        resolver: zodResolver(createContractSchema),
        defaultValues: {
            projectId: '',
            contractorId: '',
            contractNumber: '',
            startDate: new Date().toISOString().slice(0, 10),
            endDate: '',
            technicalRetentionPct: 5,
            notes: '',
            items: [{ itemNumber: '1', serviceName: '', unit: 'M2' as any, unitPrice: 0, contractedQuantity: 0 }],
            ...defaultValues,
        },
    })

    const itemsFields = useFieldArray({ control: form.control, name: 'items' })

    const watchedItems = useWatch({ control: form.control, name: 'items' })
    const totalGeral = useMemo(() => {
        return (watchedItems ?? []).reduce((sum, item) => {
            return sum + (item.unitPrice || 0) * (item.contractedQuantity || 0)
        }, 0)
    }, [watchedItems])

    useEffect(() => {
        Promise.all([
            listProjectOptions(),
            listActiveContractors(),
            listServiceOptions(),
        ]).then(([projRes, contRes, svcRes]) => {
            if (projRes.data) {
                setProjectOptions(projRes.data.map((p) => ({ id: p.id, name: p.name })))
            }
            if (contRes.data) {
                setContractorOptions(contRes.data.map((c: any) => ({ id: c.id, name: c.name })))
            }
            if (svcRes.data) {
                setServiceOptions(svcRes.data.map((s) => ({ id: s.id, name: s.name, unit: s.unit })))
            }
        })
    }, [])

    function handleSelectService(index: number, service: ServiceOption) {
        form.setValue(`items.${index}.serviceName`, service.name, { shouldValidate: true })
        const mappedUnit = mapUnitToContractUnit(service.unit)
        form.setValue(`items.${index}.unit`, mappedUnit as any, { shouldValidate: true })
        setOpenServicePopover(null)
    }

    function onSubmit(data: CreateContractInput) {
        startTransition(async () => {
            const result = mode === 'create'
                ? await createContract(data)
                : await updateContract(contractId!, data)

            if (result?.error) {
                const msg = typeof result.error === 'string' ? result.error : 'Erro de validação'
                toast.error(msg)
                return
            }

            toast.success(mode === 'create' ? 'Contrato criado com sucesso!' : 'Contrato atualizado!')
            router.push(`/${slug}/contracts`)
        })
    }

    return (
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Cabeçalho */}
            <Card>
                <CardHeader>
                    <CardTitle>Dados do Contrato</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="space-y-2">
                        <Label>Obra *</Label>
                        <Select
                            value={form.watch('projectId')}
                            onValueChange={(v) => form.setValue('projectId', v, { shouldValidate: true })}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Selecione a obra" />
                            </SelectTrigger>
                            <SelectContent>
                                {projectOptions.map((p) => (
                                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {form.formState.errors.projectId && (
                            <p className="text-xs text-destructive">{form.formState.errors.projectId.message}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label>Empreiteira *</Label>
                        <Select
                            value={form.watch('contractorId')}
                            onValueChange={(v) => form.setValue('contractorId', v, { shouldValidate: true })}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Selecione a empreiteira" />
                            </SelectTrigger>
                            <SelectContent>
                                {contractorOptions.map((c) => (
                                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {form.formState.errors.contractorId && (
                            <p className="text-xs text-destructive">{form.formState.errors.contractorId.message}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label>N. Contrato *</Label>
                        <Input {...form.register('contractNumber')} placeholder="Ex: CT-2026-001" />
                        {form.formState.errors.contractNumber && (
                            <p className="text-xs text-destructive">{form.formState.errors.contractNumber.message}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label>Data Início *</Label>
                        <Input type="date" {...form.register('startDate')} />
                        {form.formState.errors.startDate && (
                            <p className="text-xs text-destructive">{form.formState.errors.startDate.message}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label>Data Fim</Label>
                        <Input type="date" {...form.register('endDate')} />
                    </div>

                    <div className="space-y-2">
                        <Label>Retenção Técnica (%)</Label>
                        <Input
                            type="number"
                            step="0.5"
                            min="0"
                            max="100"
                            {...form.register('technicalRetentionPct', { valueAsNumber: true })}
                        />
                    </div>

                    <div className="space-y-2 sm:col-span-2 lg:col-span-3">
                        <Label>Observações</Label>
                        <Textarea {...form.register('notes')} placeholder="Observações sobre o contrato..." rows={3} />
                    </div>
                </CardContent>
            </Card>

            {/* Itens do contrato */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Itens do Contrato</CardTitle>
                        {serviceOptions.length > 0 && (
                            <p className="text-xs text-muted-foreground mt-1">
                                Use <BookOpen className="inline h-3 w-3" /> para buscar no catálogo de serviços cadastrados
                            </p>
                        )}
                    </div>
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() =>
                            itemsFields.append({
                                itemNumber: String(itemsFields.fields.length + 1),
                                serviceName: '',
                                unit: 'M2' as any,
                                unitPrice: 0,
                                contractedQuantity: 0,
                            })
                        }
                    >
                        <Plus className="h-4 w-4 mr-1" /> Adicionar Item
                    </Button>
                </CardHeader>
                <CardContent>
                    {form.formState.errors.items?.root && (
                        <p className="text-sm text-destructive mb-3">{form.formState.errors.items.root.message}</p>
                    )}

                    {itemsFields.fields.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-4">
                            Adicione pelo menos um item ao contrato
                        </p>
                    ) : (
                        <div className="space-y-3">
                            <div className="hidden md:grid md:grid-cols-[60px_1fr_90px_120px_120px_80px_40px] gap-2 text-xs font-medium text-muted-foreground px-1">
                                <span>Item</span>
                                <span>Serviço</span>
                                <span>Unidade</span>
                                <span>P. Unitário</span>
                                <span>Qtd Contratada</span>
                                <span className="text-right">Total</span>
                                <span />
                            </div>
                            {itemsFields.fields.map((field, index) => {
                                const unitPrice = form.watch(`items.${index}.unitPrice`) || 0
                                const qty = form.watch(`items.${index}.contractedQuantity`) || 0
                                const lineTotal = unitPrice * qty

                                return (
                                    <div key={field.id} className="grid grid-cols-1 md:grid-cols-[60px_1fr_90px_120px_120px_80px_40px] gap-2 items-start border rounded-lg p-3 md:border-none md:p-0">
                                        <Input
                                            {...form.register(`items.${index}.itemNumber`)}
                                            placeholder="#"
                                        />
                                        {/* Campo de serviço com busca do catálogo */}
                                        <div className="flex gap-1">
                                            <div className="flex-1">
                                                <Input
                                                    {...form.register(`items.${index}.serviceName`)}
                                                    placeholder="Nome do serviço"
                                                />
                                                {form.formState.errors.items?.[index]?.serviceName && (
                                                    <p className="text-xs text-destructive mt-1">
                                                        {form.formState.errors.items[index]?.serviceName?.message}
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
                                        <Select
                                            value={form.watch(`items.${index}.unit`)}
                                            onValueChange={(v) =>
                                                form.setValue(`items.${index}.unit`, v as any, { shouldValidate: true })
                                            }
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {unitOptions.map((u) => (
                                                    <SelectItem key={u} value={u}>
                                                        {unitLabels[u] ?? u}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <Input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            {...form.register(`items.${index}.unitPrice`, { valueAsNumber: true })}
                                            placeholder="0,00"
                                        />
                                        <Input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            {...form.register(`items.${index}.contractedQuantity`, { valueAsNumber: true })}
                                            placeholder="0,00"
                                        />
                                        <span className="text-sm text-right pt-2 font-medium">
                                            {formatCurrency(lineTotal)}
                                        </span>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => itemsFields.remove(index)}
                                        >
                                            <Trash2 className="h-4 w-4 text-destructive" />
                                        </Button>
                                    </div>
                                )
                            })}

                            {/* Total geral */}
                            <div className="flex justify-end border-t pt-3 pr-12">
                                <div className="text-right">
                                    <span className="text-sm text-muted-foreground mr-4">Total do Contrato:</span>
                                    <span className="text-lg font-bold">{formatCurrency(totalGeral)}</span>
                                </div>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Ações */}
            <div className="flex justify-end gap-3">
                <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push(`/${slug}/contracts`)}
                >
                    Cancelar
                </Button>
                <Button type="submit" disabled={isPending}>
                    {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {mode === 'create' ? 'Criar Contrato' : 'Salvar Alterações'}
                </Button>
            </div>
        </form>
    )
}
