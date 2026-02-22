'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { createTenantSchema, type CreateTenantInput } from '../schemas'
import { createTenant } from '../tenant-actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
 * Dialog para criar uma nova construtora.
 * Gera slug automaticamente a partir do nome.
 */
export function CreateTenantDialog({ children }: { children: React.ReactNode }) {
    const [open, setOpen] = useState(false)
    const [isPending, setIsPending] = useState(false)

    const form = useForm<CreateTenantInput>({
        resolver: zodResolver(createTenantSchema),
        defaultValues: {
            name: '',
            slug: '',
        },
    })

    // Gerar slug automaticamente a partir do nome
    function handleNameChange(name: string) {
        form.setValue('name', name)
        const slug = name
            .toLowerCase()
            .normalize('NFD')
            .replace(/[̀-ͯ]/g, '')
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .trim()
        form.setValue('slug', slug)
    }

    async function onSubmit(data: CreateTenantInput) {
        setIsPending(true)
        try {
            const result = await createTenant(data)
            if (result?.error) {
                const errorMsg =
                    typeof result.error === 'string'
                        ? result.error
                        : 'Verifique os dados e tente novamente'
                toast.error(errorMsg)
            } else {
                toast.success('Construtora criada com sucesso!')
                form.reset()
                setOpen(false)
            }
        } catch {
            toast.error('Erro ao criar construtora')
        } finally {
            setIsPending(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Nova Construtora</DialogTitle>
                    <DialogDescription>
                        Cadastre uma nova construtora na plataforma
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Nome da Construtora</FormLabel>
                                    <FormControl>
                                        <Input
                                            {...field}
                                            placeholder="Construtora ABC"
                                            disabled={isPending}
                                            onChange={(e) => handleNameChange(e.target.value)}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="slug"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Slug (URL)</FormLabel>
                                    <FormControl>
                                        <Input
                                            {...field}
                                            placeholder="construtora-abc"
                                            disabled={isPending}
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
                                'Criar Construtora'
                            )}
                        </Button>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
