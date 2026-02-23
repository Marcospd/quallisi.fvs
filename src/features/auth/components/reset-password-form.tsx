'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { resetPasswordSchema, type ResetPasswordInput } from '../schemas'
import { resetPassword } from '../actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
 * Formulario de redefinicao de senha.
 * Usado apos o usuario clicar no link de recuperacao.
 */
export function ResetPasswordForm() {
    const [isPending, setIsPending] = useState(false)

    const form = useForm<ResetPasswordInput>({
        resolver: zodResolver(resetPasswordSchema),
        defaultValues: {
            password: '',
            confirmPassword: '',
        },
    })

    async function onSubmit(data: ResetPasswordInput) {
        setIsPending(true)
        try {
            const result = await resetPassword(data)
            if (result?.error) {
                const errorMsg =
                    typeof result.error === 'string'
                        ? result.error
                        : 'Verifique os dados e tente novamente'
                toast.error(errorMsg)
            }
        } catch (err) {
            const e = err as { digest?: string; message?: string }
            if (e?.digest?.startsWith('NEXT_REDIRECT') || e?.message === 'NEXT_REDIRECT') {
                throw err
            }
            toast.error('Ocorreu um erro interno. Tente novamente.')
        } finally {
            setIsPending(false)
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Nova senha</FormLabel>
                            <FormControl>
                                <Input
                                    {...field}
                                    type="password"
                                    placeholder="******"
                                    autoComplete="new-password"
                                    disabled={isPending}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="confirmPassword"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Confirmar senha</FormLabel>
                            <FormControl>
                                <Input
                                    {...field}
                                    type="password"
                                    placeholder="******"
                                    autoComplete="new-password"
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
                            Redefinindo...
                        </>
                    ) : (
                        'Redefinir senha'
                    )}
                </Button>
            </form>
        </Form>
    )
}
