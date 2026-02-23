'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { loginSchema, type LoginInput } from '../schemas'
import { systemLogin } from '../actions'
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
 * Formulário de login do Painel SISTEMA.
 * Isolado do login de tenant.
 */
export function SystemLoginForm() {
    const [isPending, setIsPending] = useState(false)

    const form = useForm<LoginInput>({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            email: '',
            password: '',
        },
    })

    async function onSubmit(data: LoginInput) {
        setIsPending(true)
        try {
            const result = await systemLogin(data)
            if (result?.error) {
                const errorMsg =
                    typeof result.error === 'string'
                        ? result.error
                        : 'Verifique os dados e tente novamente'
                toast.error(errorMsg)
            }
        } catch (err) {
            // Se o server action der crash (500), mas não for redirect de sucesso
            const e = err as { digest?: string; message?: string };
            if (e?.digest?.startsWith('NEXT_REDIRECT') || e?.message === 'NEXT_REDIRECT') {
                throw err
            }
            toast.error('Ocorreu um erro interno de conexão. Nossa equipe foi notificada.')
        } finally {
            setIsPending(false)
        }
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
                                    placeholder="admin@quallisy.com"
                                    autoComplete="email"
                                    disabled={isPending}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Senha</FormLabel>
                            <FormControl>
                                <Input
                                    {...field}
                                    type="password"
                                    placeholder="••••••"
                                    autoComplete="current-password"
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
                            Entrando...
                        </>
                    ) : (
                        'Acessar Painel'
                    )}
                </Button>
            </form>
        </Form>
    )
}
