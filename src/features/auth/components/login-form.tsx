'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { loginSchema, type LoginInput } from '../schemas'
import { login } from '../actions'
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
 * Formulário de login para tenants (construtoras).
 * Valida com Zod e chama server action.
 */
export function LoginForm() {
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
            const result = await login(data)
            if (result?.error) {
                const errorMsg =
                    typeof result.error === 'string'
                        ? result.error
                        : 'Verifique os dados e tente novamente'
                toast.error(errorMsg)
            }
        } catch {
            // redirect() do Next.js lança um erro — isso é esperado
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
                                    placeholder="seu@email.com"
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
                        'Entrar'
                    )}
                </Button>
            </form>
        </Form>
    )
}
