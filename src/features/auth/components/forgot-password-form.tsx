'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import Link from 'next/link'
import { forgotPasswordSchema, type ForgotPasswordInput } from '../schemas'
import { forgotPassword } from '../actions'
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
 * Formulario de recuperacao de senha.
 * Envia link por e-mail via Supabase.
 */
export function ForgotPasswordForm() {
    const [isPending, setIsPending] = useState(false)
    const [sent, setSent] = useState(false)

    const form = useForm<ForgotPasswordInput>({
        resolver: zodResolver(forgotPasswordSchema),
        defaultValues: {
            email: '',
        },
    })

    async function onSubmit(data: ForgotPasswordInput) {
        setIsPending(true)
        try {
            const result = await forgotPassword(data)
            if (result?.error) {
                const errorMsg =
                    typeof result.error === 'string'
                        ? result.error
                        : 'Verifique os dados e tente novamente'
                toast.error(errorMsg)
            } else {
                setSent(true)
            }
        } catch {
            toast.error('Ocorreu um erro interno. Tente novamente.')
        } finally {
            setIsPending(false)
        }
    }

    if (sent) {
        return (
            <div className="space-y-4 text-center">
                <p className="text-sm text-muted-foreground">
                    Se o e-mail informado estiver cadastrado, você receberá um link para redefinir sua senha.
                </p>
                <p className="text-sm text-muted-foreground">
                    Verifique sua caixa de entrada e spam.
                </p>
                <Link
                    href="/login"
                    className="inline-block text-sm text-primary underline-offset-4 hover:underline"
                >
                    Voltar para login
                </Link>
            </div>
        )
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>E-mail</FormLabel>
                            <FormControl>
                                <Input
                                    {...field}
                                    type="email"
                                    placeholder="seu@email.com"
                                    autoComplete="email"
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
                            Enviando...
                        </>
                    ) : (
                        'Enviar link de recuperação'
                    )}
                </Button>

                <p className="text-center text-sm text-muted-foreground">
                    <Link href="/login" className="text-primary underline-offset-4 hover:underline">
                        Voltar para login
                    </Link>
                </p>
            </form>
        </Form>
    )
}
