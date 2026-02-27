'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import type { InferSelectModel } from 'drizzle-orm'

import { createProjectSchema, type CreateProjectInput } from '../schemas'
import { createProject, updateProject } from '../actions'
import { uploadProjectCover } from '../actions-upload'
import type { projects } from '@/lib/db/schema/projects'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { ImageUpload } from '@/components/image-upload'
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form'

type Project = InferSelectModel<typeof projects>

interface ProjectFormProps {
    mode: 'create' | 'edit'
    slug: string
    project?: Project
}

export function ProjectForm({ mode, slug, project }: ProjectFormProps) {
    const router = useRouter()
    const [isPending, setIsPending] = useState(false)

    const form = useForm<CreateProjectInput>({
        resolver: zodResolver(createProjectSchema),
        defaultValues: {
            name: project?.name ?? '',
            address: project?.address ?? '',
            imageUrl: project?.imageUrl ?? null,
            clientName: project?.clientName ?? '',
            contractNumber: project?.contractNumber ?? '',
            startDate: project?.startDate ?? '',
            endDate: project?.endDate ?? '',
            engineerName: project?.engineerName ?? '',
            supervision: project?.supervision ?? '',
            characteristics: project?.characteristics ?? '',
            notes: project?.notes ?? '',
        },
    })

    async function onSubmit(data: CreateProjectInput) {
        setIsPending(true)
        try {
            let finalImageUrl = data.imageUrl

            // Se for base64, faz upload para o Storage
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

            const payload = { ...data, imageUrl: finalImageUrl }

            if (mode === 'create') {
                const result = await createProject(payload)
                if (result?.error) {
                    const msg = typeof result.error === 'string' ? result.error : 'Verifique os dados'
                    toast.error(msg)
                } else {
                    toast.success('Obra criada com sucesso!')
                    router.push(`/${slug}/projects`)
                }
            } else {
                if (!project) return
                const result = await updateProject(project.id, payload)
                if (result?.error) {
                    const msg = typeof result.error === 'string' ? result.error : 'Verifique os dados'
                    toast.error(msg)
                } else {
                    toast.success('Obra atualizada com sucesso!')
                    router.push(`/${slug}/projects`)
                }
            }
        } catch {
            toast.error('Erro ao salvar obra')
        } finally {
            setIsPending(false)
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 max-w-2xl">

                {/* Foto */}
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

                <Separator />

                {/* Dados básicos */}
                <div>
                    <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">
                        Identificação
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem className="sm:col-span-2">
                                    <FormLabel>Nome da Obra *</FormLabel>
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
                                <FormItem className="sm:col-span-2">
                                    <FormLabel>Endereço</FormLabel>
                                    <FormControl>
                                        <Input {...field} placeholder="Rua das Flores, 123 — São Paulo/SP" disabled={isPending} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="clientName"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Nome do Cliente</FormLabel>
                                    <FormControl>
                                        <Input {...field} placeholder="Construtora XYZ Ltda" disabled={isPending} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="contractNumber"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Nº do Contrato</FormLabel>
                                    <FormControl>
                                        <Input {...field} placeholder="CT-2024-001" disabled={isPending} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                </div>

                <Separator />

                {/* Prazos */}
                <div>
                    <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">
                        Prazo de Execução
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <FormField
                            control={form.control}
                            name="startDate"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Data de Início</FormLabel>
                                    <FormControl>
                                        <Input {...field} type="date" disabled={isPending} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="endDate"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Data de Conclusão</FormLabel>
                                    <FormControl>
                                        <Input {...field} type="date" disabled={isPending} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                </div>

                <Separator />

                {/* Responsáveis */}
                <div>
                    <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">
                        Responsáveis
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <FormField
                            control={form.control}
                            name="engineerName"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Engenheiro RT</FormLabel>
                                    <FormControl>
                                        <Input {...field} placeholder="Eng. João Silva" disabled={isPending} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="supervision"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Fiscalização</FormLabel>
                                    <FormControl>
                                        <Input {...field} placeholder="Prefeitura / Engenheiro contratante" disabled={isPending} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                </div>

                <Separator />

                {/* Informações adicionais */}
                <div>
                    <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">
                        Informações Adicionais
                    </h2>
                    <div className="space-y-4">
                        <FormField
                            control={form.control}
                            name="characteristics"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Características da Obra</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            {...field}
                                            rows={3}
                                            placeholder="Descreva as características principais da obra, tipo de estrutura, materiais principais, etc."
                                            disabled={isPending}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="notes"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Comentários / Lembretes</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            {...field}
                                            rows={3}
                                            placeholder="Observações importantes, pontos de atenção, restrições de acesso, etc."
                                            disabled={isPending}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => router.push(`/${slug}/projects`)}
                        disabled={isPending}
                    >
                        Cancelar
                    </Button>
                    <Button type="submit" disabled={isPending}>
                        {isPending ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Salvando...
                            </>
                        ) : mode === 'create' ? (
                            'Criar Obra'
                        ) : (
                            'Salvar Alterações'
                        )}
                    </Button>
                </div>
            </form>
        </Form>
    )
}
