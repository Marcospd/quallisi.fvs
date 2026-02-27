'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, Plus, Trash2, GripVertical, Save } from 'lucide-react'
import { createServiceSchema, type CreateServiceInput, SERVICE_UNITS } from '../schemas'
import { createService, updateService, addCriterion, deleteCriterion, listCriteria } from '../actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
    FormDescription,
} from '@/components/ui/form'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { toast } from 'sonner'

interface Criterion {
    id: string
    serviceId: string
    description: string
    sortOrder: number
    active: boolean
    createdAt: Date | null
}

interface ServiceFormProps {
    mode: 'create' | 'edit'
    slug: string
    serviceId?: string
    defaultValues?: {
        name: string
        unit?: string | null
        description?: string | null
    }
}

/**
 * Formulário de tela cheia para criar/editar serviços.
 * No modo edit, inclui gerenciamento de critérios de inspeção.
 */
export function ServiceForm({ mode, slug, serviceId, defaultValues }: ServiceFormProps) {
    const router = useRouter()
    const [isPending, setIsPending] = useState(false)

    // Estado dos critérios (somente no modo edit)
    const [criteriaList, setCriteriaList] = useState<Criterion[]>([])
    const [criteriaLoading, setCriteriaLoading] = useState(mode === 'edit')
    const [criterionInput, setCriterionInput] = useState('')
    const [addingCriterion, setAddingCriterion] = useState(false)
    const [deletingId, setDeletingId] = useState<string | null>(null)

    const form = useForm<CreateServiceInput>({
        resolver: zodResolver(createServiceSchema),
        defaultValues: {
            name: defaultValues?.name ?? '',
            unit: defaultValues?.unit ?? '',
            description: defaultValues?.description ?? '',
        },
    })

    // Carrega critérios no modo edit
    const loadCriteria = useCallback(async () => {
        if (mode !== 'edit' || !serviceId) return
        setCriteriaLoading(true)
        try {
            const result = await listCriteria(serviceId)
            if (result.error) {
                toast.error(typeof result.error === 'string' ? result.error : 'Erro ao carregar critérios')
            } else {
                setCriteriaList(result.data ?? [])
            }
        } catch {
            toast.error('Erro ao carregar critérios')
        } finally {
            setCriteriaLoading(false)
        }
    }, [mode, serviceId])

    useEffect(() => {
        loadCriteria()
    }, [loadCriteria])

    async function onSubmit(data: CreateServiceInput) {
        setIsPending(true)
        try {
            if (mode === 'create') {
                const result = await createService(data)
                if (result?.error) {
                    toast.error(typeof result.error === 'string' ? result.error : 'Verifique os dados')
                } else {
                    toast.success('Serviço criado com sucesso!')
                    router.push(`/${slug}/services/${result.data!.id}/edit`)
                }
            } else {
                const result = await updateService(serviceId!, data)
                if (result?.error) {
                    toast.error(typeof result.error === 'string' ? result.error : 'Verifique os dados')
                } else {
                    toast.success('Serviço atualizado!')
                }
            }
        } catch {
            toast.error('Erro ao salvar serviço')
        } finally {
            setIsPending(false)
        }
    }

    async function handleAddCriterion() {
        if (!criterionInput.trim() || criterionInput.trim().length < 5) {
            toast.error('Descrição mínima 5 caracteres')
            return
        }
        setAddingCriterion(true)
        try {
            const result = await addCriterion({ serviceId: serviceId!, description: criterionInput.trim() })
            if (result?.error) {
                toast.error(typeof result.error === 'string' ? result.error : 'Erro')
            } else {
                setCriterionInput('')
                await loadCriteria()
                toast.success('Critério adicionado!')
            }
        } catch {
            toast.error('Erro ao adicionar critério')
        } finally {
            setAddingCriterion(false)
        }
    }

    async function handleDeleteCriterion(criterionId: string) {
        setDeletingId(criterionId)
        const prev = criteriaList
        setCriteriaList(list => list.filter(c => c.id !== criterionId))
        try {
            const result = await deleteCriterion(criterionId)
            if (result?.error) {
                setCriteriaList(prev)
                toast.error(typeof result.error === 'string' ? result.error : 'Erro')
            } else {
                toast.success('Critério removido')
            }
        } catch {
            setCriteriaList(prev)
            toast.error('Erro ao remover critério')
        } finally {
            setDeletingId(null)
        }
    }

    return (
        <div className="flex flex-col gap-8 max-w-3xl">
            {/* Seção: Informações do Serviço */}
            <Card>
                <CardHeader>
                    <CardTitle>Informações do Serviço</CardTitle>
                    <CardDescription>
                        Dados básicos do serviço de engenharia
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div className="sm:col-span-2">
                                    <FormField
                                        control={form.control}
                                        name="name"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Nome do Serviço *</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        {...field}
                                                        placeholder="Ex: Alvenaria de Vedação"
                                                        disabled={isPending}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                <FormField
                                    control={form.control}
                                    name="unit"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Unidade</FormLabel>
                                            <FormControl>
                                                <Input
                                                    {...field}
                                                    placeholder="m², m, un..."
                                                    disabled={isPending}
                                                    list="service-units"
                                                />
                                            </FormControl>
                                            <datalist id="service-units">
                                                {SERVICE_UNITS.map(u => (
                                                    <option key={u} value={u} />
                                                ))}
                                            </datalist>
                                            <FormDescription className="text-xs">
                                                m², m, m³, un, kg, vb...
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <FormField
                                control={form.control}
                                name="description"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Descrição (opcional)</FormLabel>
                                        <FormControl>
                                            <Textarea
                                                {...field}
                                                placeholder="Descrição do serviço e observações gerais"
                                                disabled={isPending}
                                                rows={3}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="flex justify-end">
                                <Button type="submit" disabled={isPending}>
                                    {isPending ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Salvando...
                                        </>
                                    ) : (
                                        <>
                                            <Save className="mr-2 h-4 w-4" />
                                            {mode === 'create' ? 'Salvar e adicionar critérios' : 'Salvar alterações'}
                                        </>
                                    )}
                                </Button>
                            </div>
                        </form>
                    </Form>
                </CardContent>
            </Card>

            {/* Seção: Critérios de Inspeção — somente no modo edit */}
            {mode === 'edit' && serviceId && (
                <Card>
                    <CardHeader>
                        <CardTitle>Critérios de Inspeção</CardTitle>
                        <CardDescription>
                            Itens que o inspetor deve avaliar em campo para este serviço (FVS)
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* Campo para adicionar critério */}
                        <div className="flex gap-2">
                            <Input
                                value={criterionInput}
                                onChange={e => setCriterionInput(e.target.value)}
                                placeholder="Descreva o critério de verificação..."
                                disabled={addingCriterion}
                                onKeyDown={e => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault()
                                        handleAddCriterion()
                                    }
                                }}
                            />
                            <Button
                                onClick={handleAddCriterion}
                                disabled={addingCriterion || !criterionInput.trim()}
                                size="default"
                            >
                                {addingCriterion ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <><Plus className="mr-1 h-4 w-4" /> Adicionar</>
                                )}
                            </Button>
                        </div>

                        <Separator />

                        {/* Lista de critérios */}
                        {criteriaLoading ? (
                            <div className="space-y-2">
                                {[1, 2, 3].map(i => (
                                    <Skeleton key={i} className="h-12 w-full" />
                                ))}
                            </div>
                        ) : criteriaList.length === 0 ? (
                            <div className="text-center py-10 text-muted-foreground">
                                <p className="text-sm">Nenhum critério cadastrado</p>
                                <p className="text-xs mt-1">
                                    Adicione critérios que o inspetor irá avaliar em campo
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                                    <span>{criteriaList.length} critério{criteriaList.length !== 1 ? 's' : ''}</span>
                                    <Badge variant="outline" className="text-xs">Ordem de verificação</Badge>
                                </div>
                                {criteriaList.map((criterion, index) => (
                                    <div
                                        key={criterion.id}
                                        className="flex items-center gap-2 rounded-md border p-3 bg-background"
                                    >
                                        <GripVertical className="h-4 w-4 text-muted-foreground shrink-0" />
                                        <span className="text-sm font-medium text-muted-foreground w-6 shrink-0">
                                            {index + 1}.
                                        </span>
                                        <span className="text-sm flex-1">{criterion.description}</span>
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                                                    disabled={deletingId === criterion.id}
                                                >
                                                    {deletingId === criterion.id ? (
                                                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                                    ) : (
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    )}
                                                </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>Remover critério</AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        Tem certeza que deseja remover este critério? Esta ação não pode ser desfeita.
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                    <AlertDialogAction
                                                        onClick={() => handleDeleteCriterion(criterion.id)}
                                                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                                    >
                                                        Remover
                                                    </AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
