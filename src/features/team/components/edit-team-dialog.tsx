'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, Eye, EyeOff, KeyRound } from 'lucide-react'
import { updateMemberSchema, type UpdateMemberInput } from '../schemas'
import { updateMember, resetMemberPassword } from '../actions'
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
 * Dialog para editar nome, perfil de acesso e redefinir senha de um membro da equipe.
 */
export function EditTeamDialog({ member, open, onOpenChange, currentUserId }: EditTeamDialogProps) {
    const [isPending, setIsPending] = useState(false)
    const [newPassword, setNewPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [isResettingPassword, setIsResettingPassword] = useState(false)

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
            setNewPassword('')
            setShowPassword(false)
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

    async function handleResetPassword() {
        if (!member || !newPassword) return

        if (newPassword.length < 6) {
            toast.error('Senha deve ter pelo menos 6 caracteres')
            return
        }

        setIsResettingPassword(true)
        try {
            const result = await resetMemberPassword({ userId: member.id, password: newPassword })
            if (result?.error) {
                const msg = typeof result.error === 'string' ? result.error : 'Erro ao redefinir'
                toast.error(msg)
            } else {
                toast.success('Senha redefinida com sucesso!')
                setNewPassword('')
                setShowPassword(false)
            }
        } catch {
            toast.error('Erro ao redefinir senha')
        } finally {
            setIsResettingPassword(false)
        }
    }

    const isSelfAdmin = member?.id === currentUserId && member?.role === 'admin'
    const isAnyPending = isPending || isResettingPassword

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
                                        <Input {...field} placeholder="João da Silva" disabled={isAnyPending} />
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
                                        disabled={isAnyPending || isSelfAdmin}
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

                        {/* Seção de redefinição de senha */}
                        <div className="space-y-2 rounded-md border p-4">
                            <div className="flex items-center gap-2 mb-2">
                                <KeyRound className="h-4 w-4 text-muted-foreground" />
                                <FormLabel className="mb-0">Redefinir Senha</FormLabel>
                            </div>
                            <div className="flex gap-2">
                                <div className="relative flex-1">
                                    <Input
                                        type={showPassword ? 'text' : 'password'}
                                        placeholder="Nova senha (mín. 6 caracteres)"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        disabled={isAnyPending}
                                    />
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                                        onClick={() => setShowPassword(!showPassword)}
                                        tabIndex={-1}
                                    >
                                        {showPassword ? (
                                            <EyeOff className="h-4 w-4 text-muted-foreground" />
                                        ) : (
                                            <Eye className="h-4 w-4 text-muted-foreground" />
                                        )}
                                    </Button>
                                </div>
                                <Button
                                    type="button"
                                    variant="secondary"
                                    onClick={handleResetPassword}
                                    disabled={isAnyPending || !newPassword}
                                >
                                    {isResettingPassword ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        'Redefinir'
                                    )}
                                </Button>
                            </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-2">
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isAnyPending}>
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={isAnyPending}>
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
