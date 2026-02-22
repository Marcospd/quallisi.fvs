'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { createServiceSchema, type CreateServiceInput } from '../schemas'
import { updateService } from '../actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form'
import { toast } from 'sonner'

interface EditServiceDialogProps {
    service: { id: string; name: string; description: string | null } | null
    open: boolean
    onOpenChange: (open: boolean) => void
}

/**
 * Dialog para editar um serviço existente.
 */
export function EditServiceDialog({ service, open, onOpenChange }: EditServiceDialogProps) {
    const [isPending, setIsPending] = useState(false)

    const form = useForm<CreateServiceInput>({
        resolver: zodResolver(createServiceSchema),
        defaultValues: {
            name: '',
            description: '',
        },
    })

    // Preenche o form quando o serviço muda
    useEffect(() => {
        if (service && open) {
            form.reset({
                name: service.name,
                description: service.description || '',
            })
        }
    }, [service, open, form])

    async function onSubmit(data: CreateServiceInput) {
        if (!service) return

        setIsPending(true)
        try {
            const result = await updateService(service.id, data)
            if (result?.error) {
                const msg = typeof result.error === 'string' ? result.error : 'Verifique os dados'
                toast.error(msg)
            } else {
                toast.success('Serviço atualizado com sucesso!')
                onOpenChange(false)
            }
        } catch {
            toast.error('Erro ao editar serviço')
        } finally {
            setIsPending(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Editar Serviço</DialogTitle>
                    <DialogDescription>Edite as informações do serviço/atividade selecionado</DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Nome do Serviço</FormLabel>
                                    <FormControl>
                                        <Input {...field} placeholder="Alvenaria de Vedação" disabled={isPending} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Descrição (opcional)</FormLabel>
                                    <FormControl>
                                        <Textarea {...field} placeholder="Serviço referente aos blocos 1 e 2..." disabled={isPending} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <div className="flex justify-end gap-2">
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={isPending}>
                                {isPending ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Salvando...
                                    </>
                                ) : (
                                    'Salvar Alterações'
                                )}
                            </Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
