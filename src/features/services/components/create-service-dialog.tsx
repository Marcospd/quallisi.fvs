'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { createServiceSchema, type CreateServiceInput } from '../schemas'
import { createService } from '../actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
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

/**
 * Dialog para criar um novo serviço.
 */
export function CreateServiceDialog({ children }: { children: React.ReactNode }) {
    const [open, setOpen] = useState(false)
    const [isPending, setIsPending] = useState(false)

    const form = useForm<CreateServiceInput>({
        resolver: zodResolver(createServiceSchema),
        defaultValues: { name: '', description: '' },
    })

    async function onSubmit(data: CreateServiceInput) {
        setIsPending(true)
        try {
            const result = await createService(data)
            if (result?.error) {
                const msg = typeof result.error === 'string' ? result.error : 'Verifique os dados'
                toast.error(msg)
            } else {
                toast.success('Serviço criado com sucesso!')
                form.reset()
                setOpen(false)
            }
        } catch {
            toast.error('Erro ao criar serviço')
        } finally {
            setIsPending(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Novo Serviço</DialogTitle>
                    <DialogDescription>
                        Cadastre um serviço de engenharia para usar nas inspeções FVS
                    </DialogDescription>
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
                        <Button type="submit" className="w-full" disabled={isPending}>
                            {isPending ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Criando...
                                </>
                            ) : (
                                'Criar Serviço'
                            )}
                        </Button>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
