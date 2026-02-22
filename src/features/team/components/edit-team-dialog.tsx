'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { updateMemberSchema, type UpdateMemberInput } from '../schemas'
import { updateMember } from '../actions'
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'

interface TeamMember {
    id: string
    name: string
    email: string
    role: string
    active: boolean
    createdAt: Date | null
}

interface EditTeamDialogProps {
    member: TeamMember | null
    open: boolean
    onOpenChange: (open: boolean) => void
    currentUserId: string
}

/**
 * Dialog para editar nome e perfil de acesso de um membro da equipe.
 */
export function EditTeamDialog({ member, open, onOpenChange, currentUserId }: EditTeamDialogProps) {
    const [isPending, setIsPending] = useState(false)

    const form = useForm<UpdateMemberInput>({
        resolver: zodResolver(updateMemberSchema),
        defaultValues: {
            name: '',
            role: 'inspetor',
        },
    })

    // Preenche o form quando a pessoa muda
    useEffect(() => {
        if (member && open) {
            form.reset({
                name: member.name,
                role: member.role as 'admin' | 'supervisor' | 'inspetor',
            })
        }
    }, [member, open, form])

    async function onSubmit(data: UpdateMemberInput) {
        if (!member) return

        setIsPending(true)
        try {
            const result = await updateMember(member.id, data)
            if (result?.error) {
                const msg = typeof result.error === 'string' ? result.error : 'Verifique os dados'
                toast.error(msg)
            } else {
                toast.success('Membro atualizado com sucesso!')
                onOpenChange(false)
            }
        } catch {
            toast.error('Erro ao editar membro')
        } finally {
            setIsPending(false)
        }
    }

    const isSelfAdmin = member?.id === currentUserId && member?.role === 'admin'

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Editar Membro da Equipe</DialogTitle>
                    <DialogDescription>Edite nome e perfil de acesso. O e-mail não pode ser alterado por segurança.</DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Nome</FormLabel>
                                    <FormControl>
                                        <Input {...field} placeholder="João da Silva" disabled={isPending} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <div className="space-y-2">
                            <FormLabel>E-mail (apenas visualização)</FormLabel>
                            <Input value={member?.email || ''} disabled readOnly />
                        </div>
                        <FormField
                            control={form.control}
                            name="role"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Perfil de Acesso</FormLabel>
                                    <Select
                                        disabled={isPending || isSelfAdmin}
                                        onValueChange={field.onChange}
                                        value={field.value}
                                        defaultValue={field.value}
                                    >
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Selecione um perfil..." />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="admin">Administrador</SelectItem>
                                            <SelectItem value="supervisor">Supervisor</SelectItem>
                                            <SelectItem value="inspetor">Inspetor</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    {isSelfAdmin && (
                                        <p className="text-[0.8rem] text-muted-foreground mt-1">
                                            Você não pode remover seu próprio acesso de administrador.
                                        </p>
                                    )}
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <div className="flex justify-end gap-2 pt-2">
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
