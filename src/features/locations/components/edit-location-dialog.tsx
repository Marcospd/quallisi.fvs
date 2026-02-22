'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { createLocationSchema, type CreateLocationInput } from '../schemas'
import { updateLocation } from '../actions'
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import type { InferSelectModel } from 'drizzle-orm'
import type { locations, projects } from '@/lib/db/schema'

type Location = InferSelectModel<typeof locations>
type Project = InferSelectModel<typeof projects>

interface EditLocationDialogProps {
    location: Location | null
    projects: Project[]
    open: boolean
    onOpenChange: (open: boolean) => void
}

/**
 * Dialog para editar um local existente.
 */
export function EditLocationDialog({ location, projects, open, onOpenChange }: EditLocationDialogProps) {
    const [isPending, setIsPending] = useState(false)

    const form = useForm<CreateLocationInput>({
        resolver: zodResolver(createLocationSchema),
        defaultValues: {
            projectId: '',
            name: '',
            description: '',
        },
    })

    // Preenche o form quando o local muda
    useEffect(() => {
        if (location && open) {
            form.reset({
                projectId: location.projectId,
                name: location.name,
                description: location.description || '',
            })
        }
    }, [location, open, form])

    async function onSubmit(data: CreateLocationInput) {
        if (!location) return

        setIsPending(true)
        try {
            const result = await updateLocation(location.id, data)
            if (result?.error) {
                const msg = typeof result.error === 'string' ? result.error : 'Verifique os dados'
                toast.error(msg)
            } else {
                toast.success('Local atualizado com sucesso!')
                onOpenChange(false)
            }
        } catch {
            toast.error('Erro ao editar local')
        } finally {
            setIsPending(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Editar Local</DialogTitle>
                    <DialogDescription>Edite as informações do local de inspeção selecionado</DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="projectId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Obra</FormLabel>
                                    <Select
                                        disabled={isPending}
                                        onValueChange={field.onChange}
                                        value={field.value}
                                        defaultValue={field.value}
                                    >
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Selecione uma obra..." />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {projects.map((p) => (
                                                <SelectItem key={p.id} value={p.id}>
                                                    {p.name}
                                                </SelectItem>
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
                                        <Input {...field} placeholder="Torre A - 5º Andar" disabled={isPending} />
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
                                        <Textarea {...field} placeholder="Detalhes de acesso..." disabled={isPending} />
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
