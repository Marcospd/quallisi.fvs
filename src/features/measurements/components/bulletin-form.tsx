'use client'

import { useEffect, useState, useTransition, useMemo } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useForm, useFieldArray, useWatch, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Plus, Trash2, Loader2 } from 'lucide-react'
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
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'

import { createBulletinSchema, type CreateBulletinInput } from '../schemas'
import { createBulletin, updateBulletin, listContractsForBulletin, getAccumulatedQuantities } from '../actions'
import { listContractItemsForBulletin } from '@/features/contracts/actions'
import { unitOptions } from '@/features/contracts/schemas'

interface ContractOption {
    id: string
    contractNumber: string
    projectName: string
    contractorName: string
}

interface ContractItem {
    id: string
    itemNumber: string
    serviceName: string
    unit: string
    unitPrice: string
    contractedQuantity: string
    sortOrder: number
}

interface BulletinFormProps {
    mode: 'create' | 'edit'
    bulletinId?: string
    defaultValues?: Partial<CreateBulletinInput>
    contractItems?: ContractItem[]
    accumulated?: Record<string, string>
}

const unitLabels: Record<string, string> = {
    M2: 'm²', M3: 'm³', ML: 'ml', KG: 'kg', VB: 'vb',
    DIA: 'dia', UNID: 'un', M: 'm', TON: 'ton', L: 'L',
}

function formatCurrency(value: number) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

function formatNumber(value: number, decimals = 4) {
    return new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: decimals }).format(value)
}

export function BulletinForm({ mode, bulletinId, defaultValues, contractItems: initialItems, accumulated: initialAccumulated }: BulletinFormProps) {
    const router = useRouter()
    const params = useParams()
    const slug = params.slug as string
    const [isPending, startTransition] = useTransition()
    const [contractOptions, setContractOptions] = useState<ContractOption[]>([])
    const [contractItemsData, setContractItemsData] = useState<ContractItem[]>(initialItems ?? [])
    const [accumulated, setAccumulated] = useState<Record<string, string>>(initialAccumulated ?? {})
    const [loadingItems, setLoadingItems] = useState(false)

    const form = useForm<CreateBulletinInput>({
        resolver: zodResolver(createBulletinSchema),
        defaultValues: {
            contractId: '',
            bmNumber: 1,
            sheetNumber: 1,
            periodStart: new Date().toISOString().slice(0, 10),
            periodEnd: new Date().toISOString().slice(0, 10),
            dueDate: '',
            discountValue: 0,
            observations: '',
            items: [],
            additives: [],
            ...defaultValues,
        },
    })

    const additivesFields = useFieldArray({ control: form.control, name: 'additives' })

    const watchedItems = useWatch({ control: form.control, name: 'items' })
    const watchedAdditives = useWatch({ control: form.control, name: 'additives' })
    const watchedContract = useWatch({ control: form.control, name: 'contractId' })
    const watchedDiscount = useWatch({ control: form.control, name: 'discountValue' }) || 0

    // Carregar contratos disponíveis
    useEffect(() => {
        listContractsForBulletin().then((res) => {
            if (res.data) setContractOptions(res.data)
        })
    }, [])

    // Quando seleciona contrato, carregar itens
    useEffect(() => {
        if (!watchedContract || mode === 'edit') return

        setLoadingItems(true)
        Promise.all([
            listContractItemsForBulletin(watchedContract),
            getAccumulatedQuantities(watchedContract, form.getValues('bmNumber')),
        ]).then(([itemsRes, accRes]) => {
            if (itemsRes.data) {
                setContractItemsData(itemsRes.data as ContractItem[])
                // Inicializar itens de medição (1 por item de contrato)
                form.setValue('items', itemsRes.data.map((ci: any) => ({
                    contractItemId: ci.id,
                    quantityThisPeriod: 0,
                })))
            }
            if (accRes.data) setAccumulated(accRes.data)
            setLoadingItems(false)
        })
    }, [watchedContract]) // eslint-disable-line react-hooks/exhaustive-deps

    // Cálculos financeiros
    const calculations = useMemo(() => {
        let totalBrutoItems = 0

        const itemCalcs = (watchedItems ?? []).map((item, i) => {
            const ci = contractItemsData.find((c) => c.id === item.contractItemId)
            if (!ci) return null

            const unitPrice = parseFloat(ci.unitPrice) || 0
            const contractedQty = parseFloat(ci.contractedQuantity) || 0
            const totalItem = unitPrice * contractedQty
            const acumAnt = parseFloat(accumulated[item.contractItemId] ?? '0')
            const noMes = item.quantityThisPeriod || 0
            const acumAtual = acumAnt + noMes
            const pctExec = contractedQty > 0 ? (acumAtual / contractedQty) * 100 : 0
            const saldoFisico = contractedQty - acumAtual
            const acumAntR$ = acumAnt * unitPrice
            const noMesR$ = noMes * unitPrice
            const acumAtualR$ = acumAntR$ + noMesR$
            const saldoR$ = totalItem - acumAtualR$

            totalBrutoItems += noMesR$

            return {
                itemNumber: ci.itemNumber,
                serviceName: ci.serviceName,
                unit: ci.unit,
                unitPrice,
                contractedQty,
                totalItem,
                acumAnt,
                noMes,
                acumAtual,
                pctExec,
                saldoFisico,
                acumAntR$,
                noMesR$,
                acumAtualR$,
                saldoR$,
            }
        }).filter(Boolean)

        // Aditivos
        let totalBrutoAdditives = 0
        const addCalcs = (watchedAdditives ?? []).map((add) => {
            const noMesR$ = (add.quantityThisPeriod || 0) * (add.unitPrice || 0)
            totalBrutoAdditives += noMesR$
            return { noMesR$ }
        })

        const totalBruto = totalBrutoItems + totalBrutoAdditives
        const totalLiquido = totalBruto - watchedDiscount

        // Buscar retenção técnica do contrato selecionado
        // (não temos esse dado diretamente no form, então usamos 5% como padrão)
        const retencaoPct = 5
        const retencao = totalLiquido * (retencaoPct / 100)
        const valorNF = totalLiquido - retencao

        return {
            itemCalcs,
            addCalcs,
            totalBrutoItems,
            totalBrutoAdditives,
            totalBruto,
            totalLiquido,
            retencaoPct,
            retencao,
            valorNF,
        }
    }, [watchedItems, watchedAdditives, watchedDiscount, contractItemsData, accumulated])

    function onSubmit(data: CreateBulletinInput) {
        startTransition(async () => {
            const result = mode === 'create'
                ? await createBulletin(data)
                : await updateBulletin(bulletinId!, data)

            if (result?.error) {
                const msg = typeof result.error === 'string' ? result.error : 'Erro de validação'
                toast.error(msg)
                return
            }

            toast.success(mode === 'create' ? 'Boletim criado com sucesso!' : 'Boletim atualizado!')
            router.push(`/${slug}/measurements`)
        })
    }

    return (
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Cabeçalho */}
            <Card>
                <CardHeader>
                    <CardTitle>Dados do Boletim</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="space-y-2 sm:col-span-2">
                        <Label>Contrato *</Label>
                        <Select
                            value={watchedContract}
                            onValueChange={(v) => form.setValue('contractId', v, { shouldValidate: true })}
                            disabled={mode === 'edit'}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Selecione o contrato" />
                            </SelectTrigger>
                            <SelectContent>
                                {contractOptions.map((c) => (
                                    <SelectItem key={c.id} value={c.id}>
                                        {c.contractNumber} — {c.contractorName} ({c.projectName})
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {form.formState.errors.contractId && (
                            <p className="text-xs text-destructive">{form.formState.errors.contractId.message}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label>N. BM *</Label>
                        <Input
                            type="number"
                            min="1"
                            {...form.register('bmNumber', { valueAsNumber: true })}
                        />
                        {form.formState.errors.bmNumber && (
                            <p className="text-xs text-destructive">{form.formState.errors.bmNumber.message}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label>N. Folha</Label>
                        <Input
                            type="number"
                            min="1"
                            {...form.register('sheetNumber', { valueAsNumber: true })}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Período Início *</Label>
                        <Input type="date" {...form.register('periodStart')} />
                        {form.formState.errors.periodStart && (
                            <p className="text-xs text-destructive">{form.formState.errors.periodStart.message}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label>Período Fim *</Label>
                        <Input type="date" {...form.register('periodEnd')} />
                        {form.formState.errors.periodEnd && (
                            <p className="text-xs text-destructive">{form.formState.errors.periodEnd.message}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label>Vencimento</Label>
                        <Input type="date" {...form.register('dueDate')} />
                    </div>

                    <div className="space-y-2">
                        <Label>Descontos (R$)</Label>
                        <Input
                            type="number"
                            step="0.01"
                            min="0"
                            {...form.register('discountValue', { valueAsNumber: true })}
                        />
                    </div>

                    <div className="space-y-2 sm:col-span-2 lg:col-span-4">
                        <Label>Observações</Label>
                        <Textarea {...form.register('observations')} placeholder="Observações do boletim..." rows={2} />
                    </div>
                </CardContent>
            </Card>

            {/* Itens de Medição */}
            <Card>
                <CardHeader>
                    <CardTitle>Itens do Contrato — Medição</CardTitle>
                </CardHeader>
                <CardContent>
                    {loadingItems ? (
                        <div className="flex items-center justify-center py-8 text-muted-foreground">
                            <Loader2 className="h-5 w-5 animate-spin mr-2" />
                            Carregando itens do contrato...
                        </div>
                    ) : contractItemsData.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-4">
                            {watchedContract ? 'Nenhum item encontrado neste contrato' : 'Selecione um contrato para ver os itens'}
                        </p>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-[50px]">Item</TableHead>
                                        <TableHead>Serviço</TableHead>
                                        <TableHead className="text-center w-[60px]">Und</TableHead>
                                        <TableHead className="text-right w-[100px]">P. Unit.</TableHead>
                                        <TableHead className="text-right w-[80px]">Qtd Contr.</TableHead>
                                        <TableHead className="text-right w-[80px]">Acum. Ant.</TableHead>
                                        <TableHead className="text-center w-[100px]">No Mês</TableHead>
                                        <TableHead className="text-right w-[80px]">Acum. Atual</TableHead>
                                        <TableHead className="text-right w-[60px]">%</TableHead>
                                        <TableHead className="text-right w-[100px]">No Mês (R$)</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {contractItemsData.map((ci, index) => {
                                        const calc = calculations.itemCalcs[index]
                                        return (
                                            <TableRow key={ci.id}>
                                                <TableCell className="font-medium">{ci.itemNumber}</TableCell>
                                                <TableCell className="text-sm">{ci.serviceName}</TableCell>
                                                <TableCell className="text-center text-muted-foreground">
                                                    {unitLabels[ci.unit] ?? ci.unit}
                                                </TableCell>
                                                <TableCell className="text-right text-muted-foreground">
                                                    {formatCurrency(parseFloat(ci.unitPrice))}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    {formatNumber(parseFloat(ci.contractedQuantity))}
                                                </TableCell>
                                                <TableCell className="text-right text-muted-foreground">
                                                    {formatNumber(calc?.acumAnt ?? 0)}
                                                </TableCell>
                                                <TableCell>
                                                    <Input
                                                        type="number"
                                                        step="0.01"
                                                        min="0"
                                                        className="w-[90px] text-right"
                                                        {...form.register(`items.${index}.quantityThisPeriod`, { valueAsNumber: true })}
                                                    />
                                                </TableCell>
                                                <TableCell className="text-right font-medium">
                                                    {formatNumber(calc?.acumAtual ?? 0)}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <span className={calc && calc.pctExec > 100 ? 'text-destructive font-bold' : ''}>
                                                        {formatNumber(calc?.pctExec ?? 0, 1)}%
                                                    </span>
                                                </TableCell>
                                                <TableCell className="text-right font-medium">
                                                    {formatCurrency(calc?.noMesR$ ?? 0)}
                                                </TableCell>
                                            </TableRow>
                                        )
                                    })}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Aditivos */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Aditivos (Itens Extra-Contrato)</CardTitle>
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() =>
                            additivesFields.append({
                                itemNumber: `AD-${additivesFields.fields.length + 1}`,
                                serviceName: '',
                                unit: 'M2' as any,
                                unitPrice: 0,
                                contractedQuantity: 0,
                                quantityThisPeriod: 0,
                            })
                        }
                    >
                        <Plus className="h-4 w-4 mr-1" /> Adicionar Aditivo
                    </Button>
                </CardHeader>
                <CardContent>
                    {additivesFields.fields.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-4">
                            Nenhum item aditivo. Adicione se houver serviços fora do contrato.
                        </p>
                    ) : (
                        <div className="space-y-3">
                            <div className="grid grid-cols-[60px_1fr_80px_100px_100px_100px_40px] gap-2 text-xs font-medium text-muted-foreground px-1">
                                <span>Item</span>
                                <span>Serviço</span>
                                <span>Unidade</span>
                                <span>P. Unitário</span>
                                <span>Qtd</span>
                                <span>No Mês</span>
                                <span />
                            </div>
                            {additivesFields.fields.map((field, index) => (
                                <div key={field.id} className="grid grid-cols-[60px_1fr_80px_100px_100px_100px_40px] gap-2 items-start">
                                    <Input {...form.register(`additives.${index}.itemNumber`)} placeholder="#" />
                                    <div>
                                        <Input {...form.register(`additives.${index}.serviceName`)} placeholder="Nome do serviço" />
                                        {form.formState.errors.additives?.[index]?.serviceName && (
                                            <p className="text-xs text-destructive mt-1">
                                                {form.formState.errors.additives[index]?.serviceName?.message}
                                            </p>
                                        )}
                                    </div>
                                    <Controller
                                        control={form.control}
                                        name={`additives.${index}.unit`}
                                        render={({ field }) => (
                                            <Select value={field.value} onValueChange={field.onChange}>
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
                                        )}
                                    />
                                    <Input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        {...form.register(`additives.${index}.unitPrice`, { valueAsNumber: true })}
                                        placeholder="0,00"
                                    />
                                    <Input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        {...form.register(`additives.${index}.contractedQuantity`, { valueAsNumber: true })}
                                        placeholder="0,00"
                                    />
                                    <Input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        {...form.register(`additives.${index}.quantityThisPeriod`, { valueAsNumber: true })}
                                        placeholder="0,00"
                                    />
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => additivesFields.remove(index)}
                                    >
                                        <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Resumo Financeiro */}
            <Card>
                <CardHeader>
                    <CardTitle>Resumo Financeiro</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                        <SummaryItem label="Total Itens (No Mês)" value={formatCurrency(calculations.totalBrutoItems)} />
                        <SummaryItem label="Total Aditivos (No Mês)" value={formatCurrency(calculations.totalBrutoAdditives)} />
                        <SummaryItem label="Total Bruto" value={formatCurrency(calculations.totalBruto)} bold />
                        <SummaryItem label="Descontos" value={`- ${formatCurrency(watchedDiscount)}`} />
                        <SummaryItem label="Total Líquido" value={formatCurrency(calculations.totalLiquido)} bold />
                        <SummaryItem label={`Retenção Técnica (${calculations.retencaoPct}%)`} value={`- ${formatCurrency(calculations.retencao)}`} />
                        <div className="sm:col-span-2 border-t pt-3">
                            <div className="flex justify-between items-center">
                                <span className="text-lg font-bold">Valor NF</span>
                                <span className="text-lg font-bold text-primary">{formatCurrency(calculations.valorNF)}</span>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Ações */}
            <div className="flex justify-end gap-3">
                <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push(`/${slug}/measurements`)}
                >
                    Cancelar
                </Button>
                <Button type="submit" disabled={isPending}>
                    {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {mode === 'create' ? 'Criar Boletim' : 'Salvar Alterações'}
                </Button>
            </div>
        </form>
    )
}

function SummaryItem({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
    return (
        <div className="flex justify-between">
            <span className={bold ? 'font-semibold' : 'text-muted-foreground'}>{label}</span>
            <span className={bold ? 'font-semibold' : ''}>{value}</span>
        </div>
    )
}
