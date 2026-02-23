'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { createLocationSchema, type CreateLocationInput } from '../schemas'
import { createLocation } from '../actions'
import { listProjects } from '@/features/projects/actions'
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'

type Project = { id: string; name: string }

/**
 * Dialog para criar um novo local de inspeção.
 * Carrega a lista de obras para seleção.
 */
export function CreateLocationDialog({ children }: { children: React.ReactNode }) {
    const [open, setOpen] = useState(false)
    const [isPending, setIsPending] = useState(false)
    const [projectsList, setProjectsList] = useState<Project[]>([])

    const form = useForm<CreateLocationInput>({
        resolver: zodResolver(createLocationSchema),
        defaultValues: { projectId: '', name: '', description: '' },
    })

    useEffect(() => {
        if (open) {
            listProjects().then((result) => {
                if (result.data) {
                    setProjectsList(result.data.map((item) => item.project).filter((p) => p.active))
                }
            })
        }
    }, [open])

    async function onSubmit(data: CreateLocationInput) {
        setIsPending(true)
        try {
            const result = await createLocation(data)
            if (result?.error) {
                const msg = typeof result.error === 'string' ? result.error : 'Verifique os dados'
                toast.error(msg)
            } else {
                toast.success('Local criado com sucesso!')
                form.reset()
                setOpen(false)
            }
        } catch {
            toast.error('Erro ao criar local')
        } finally {
            setIsPending(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Novo Local</DialogTitle>
                    <DialogDescription>Cadastre um ponto de inspeção dentro de uma obra</DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="projectId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Obra</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Selecione a obra" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {projectsList.map((p) => (
                                                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Nome do Local</FormLabel>
                                    <FormControl>
                                        <Input {...field} placeholder="Bloco A - Apt 101" disabled={isPending} />
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
                                        <Input {...field} placeholder="2° andar, lado esquerdo" disabled={isPending} />
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
                                'Criar Local'
                            )}
                        </Button>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
