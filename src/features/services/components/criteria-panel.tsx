'use client'

import { useState, useEffect, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, Plus, Trash2, X, GripVertical } from 'lucide-react'
import { addCriterionSchema } from '../schemas'
import { listCriteria, addCriterion, deleteCriterion } from '../actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
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
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormMessage,
} from '@/components/ui/form'
import { toast } from 'sonner'
import { z } from 'zod'

const addCriterionFormSchema = z.object({
    description: z.string().min(5, 'Descrição mínima 5 caracteres'),
})

type AddCriterionFormInput = z.infer<typeof addCriterionFormSchema>

interface Criterion {
    id: string
    serviceId: string
    description: string
    sortOrder: number
    active: boolean
    createdAt: Date | null
}

interface ServiceInfo {
    id: string
    name: string
    description: string | null
    active: boolean
}

interface CriteriaPanelProps {
    serviceId: string
    onClose: () => void
}

/**
 * Painel lateral para gerenciar critérios de um serviço.
 */
export function CriteriaPanel({ serviceId, onClose }: CriteriaPanelProps) {
    const [criteriaList, setCriteriaList] = useState<Criterion[]>([])
    const [service, setService] = useState<ServiceInfo | null>(null)
    const [loading, setLoading] = useState(true)
    const [isPending, setIsPending] = useState(false)
    const [deletingId, setDeletingId] = useState<string | null>(null)

    const form = useForm<AddCriterionFormInput>({
        resolver: zodResolver(addCriterionFormSchema),
        defaultValues: { description: '' },
    })

    const loadCriteria = useCallback(async () => {
        setLoading(true)
        try {
            const result = await listCriteria(serviceId)
            if (result.error) {
                toast.error(typeof result.error === 'string' ? result.error : 'Erro')
            } else {
                setCriteriaList(result.data ?? [])
                setService(result.service as ServiceInfo ?? null)
            }
        } catch {
            toast.error('Erro ao carregar critérios')
        } finally {
            setLoading(false)
        }
    }, [serviceId])

    useEffect(() => {
        loadCriteria()
    }, [loadCriteria])

    async function onSubmit(data: AddCriterionFormInput) {
        setIsPending(true)
        try {
            const result = await addCriterion({
                serviceId,
                description: data.description,
            })
            if (result?.error) {
                const msg = typeof result.error === 'string' ? result.error : 'Verifique os dados'
                toast.error(msg)
            } else {
                toast.success('Critério adicionado!')
                form.reset()
                await loadCriteria()
            }
        } catch {
            toast.error('Erro ao adicionar critério')
        } finally {
            setIsPending(false)
        }
    }

    async function handleDelete(criterionId: string) {
        setDeletingId(criterionId)
        // Optimistic update: remove da lista imediatamente
        const previousList = criteriaList
        setCriteriaList(prev => prev.filter(c => c.id !== criterionId))
        try {
            const result = await deleteCriterion(criterionId)
            if (result?.error) {
                // Reverte em caso de erro
                setCriteriaList(previousList)
                toast.error(typeof result.error === 'string' ? result.error : 'Erro')
            } else {
                toast.success('Critério removido')
            }
        } catch {
            setCriteriaList(previousList)
            toast.error('Erro ao remover critério')
        } finally {
            setDeletingId(null)
        }
    }

    return (
        <Card className="h-full">
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <CardTitle className="text-lg">
                            {loading ? <Skeleton className="h-6 w-40" /> : service?.name}
                        </CardTitle>
                        {!loading && service?.description && (
                            <p className="text-sm text-muted-foreground">{service.description}</p>
                        )}
                    </div>
                    <Button variant="ghost" size="icon" onClick={onClose}>
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            </CardHeader>

            <Separator />

            <CardContent className="pt-4 space-y-4">
                {/* Formulário para adicionar critério */}
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="flex gap-2">
                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem className="flex-1">
                                    <FormControl>
                                        <Input
                                            {...field}
                                            placeholder="Descrição do critério de verificação"
                                            disabled={isPending}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <Button type="submit" size="icon" disabled={isPending}>
                            {isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Plus className="h-4 w-4" />
                            )}
                        </Button>
                    </form>
                </Form>

                {/* Lista de critérios */}
                {loading ? (
                    <div className="space-y-2">
                        {[1, 2, 3].map((i) => (
                            <Skeleton key={i} className="h-12 w-full" />
                        ))}
                    </div>
                ) : criteriaList.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                        <p className="text-sm">Nenhum critério cadastrado</p>
                        <p className="text-xs mt-1">
                            Adicione critérios que o inspetor irá avaliar em campo
                        </p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                            <span>{criteriaList.length} critério{criteriaList.length !== 1 ? 's' : ''}</span>
                            <Badge variant="outline" className="text-xs">
                                Ordem de verificação
                            </Badge>
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
                                                onClick={() => handleDelete(criterion.id)}
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
    )
}
