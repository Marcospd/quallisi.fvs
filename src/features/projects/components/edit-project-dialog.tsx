'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { createProjectSchema, type CreateProjectInput } from '../schemas'
import { updateProject } from '../actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
import { ImageUpload } from '@/components/image-upload'
import { uploadProjectCover } from '../actions-upload'
import { toast } from 'sonner'
import type { InferSelectModel } from 'drizzle-orm'
import type { projects } from '@/lib/db/schema/projects'

type Project = InferSelectModel<typeof projects>

interface EditProjectDialogProps {
    project: Project | null
    open: boolean
    onOpenChange: (open: boolean) => void
}

/**
 * Dialog para editar uma obra existente.
 */
export function EditProjectDialog({ project, open, onOpenChange }: EditProjectDialogProps) {
    const [isPending, setIsPending] = useState(false)

    const form = useForm<CreateProjectInput>({
        resolver: zodResolver(createProjectSchema),
        defaultValues: {
            name: '',
            address: '',
            imageUrl: null,
        },
    })

    // Preenche o form quando a obra muda
    useEffect(() => {
        if (project && open) {
            form.reset({
                name: project.name,
                address: project.address || '',
                imageUrl: project.imageUrl || null,
            })
        }
    }, [project, open, form])

    async function onSubmit(data: CreateProjectInput) {
        if (!project) return

        setIsPending(true)
        try {
            let finalImageUrl = data.imageUrl

            // Se for string base64, fazer upload para o Storage
            if (data.imageUrl && data.imageUrl.startsWith('data:image')) {
                const mimeType = data.imageUrl.substring('data:'.length, data.imageUrl.indexOf(';base64'))
                const ext = mimeType.split('/')[1] || 'jpg'
                const safeName = data.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()

                const uploadRes = await uploadProjectCover(data.imageUrl, `capa_${safeName}.${ext}`, mimeType)

                if (uploadRes?.error) {
                    toast.error(uploadRes.error)
                    setIsPending(false)
                    return
                }

                finalImageUrl = uploadRes.url
            }

            const result = await updateProject(project.id, { ...data, imageUrl: finalImageUrl })
            if (result?.error) {
                const msg = typeof result.error === 'string' ? result.error : 'Verifique os dados'
                toast.error(msg)
            } else {
                toast.success('Obra atualizada com sucesso!')
                onOpenChange(false)
            }
        } catch {
            toast.error('Erro ao editar obra')
        } finally {
            setIsPending(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Editar Obra</DialogTitle>
                    <DialogDescription>Edite as informações da obra selecionada</DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="imageUrl"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Foto da Obra</FormLabel>
                                    <FormControl>
                                        <ImageUpload
                                            value={field.value}
                                            onChange={field.onChange}
                                            disabled={isPending}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Nome da Obra</FormLabel>
                                    <FormControl>
                                        <Input {...field} placeholder="Residencial Vila Nova" disabled={isPending} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="address"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Endereço (opcional)</FormLabel>
                                    <FormControl>
                                        <Input {...field} placeholder="Rua das Flores, 123" disabled={isPending} />
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
