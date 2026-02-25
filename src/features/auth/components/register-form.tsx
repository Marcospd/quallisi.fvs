'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import Link from 'next/link'
import { tenantRegisterSchema, type TenantRegisterInput } from '../schemas'
import { register } from '../actions'
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'

type Plan = {
    id: string
    name: string
    priceBrl: string
    maxProjects: number
    maxUsers: number
    maxFvsMonth: number
}

type RegisterFormProps = {
    plans: Plan[]
    preselectedPlanId?: string
}

/**
 * Formulario de cadastro de empresa (construtora).
 * Recebe planos disponiveis como prop (carregados no server component).
 * Se preselectedPlanId for passado, o campo de plano fica travado.
 */
export function RegisterForm({ plans, preselectedPlanId }: RegisterFormProps) {
    const [isPending, setIsPending] = useState(false)
    const isPlanLocked = !!preselectedPlanId

    const form = useForm<TenantRegisterInput>({
        resolver: zodResolver(tenantRegisterSchema),
        defaultValues: {
            companyName: '',
            name: '',
            email: '',
            password: '',
            planId: preselectedPlanId ?? '',
        },
    })

    async function onSubmit(data: TenantRegisterInput) {
        setIsPending(true)
        try {
            const result = await register(data)
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

    function formatPlanLabel(plan: Plan) {
        const price = Number(plan.priceBrl).toLocaleString('pt-BR', {
            style: 'currency',
            currency: 'BRL',
        })
        return `${plan.name} — ${price}/mes`
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                    control={form.control}
                    name="companyName"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Nome da Empresa</FormLabel>
                            <FormControl>
                                <Input
                                    {...field}
                                    placeholder="Construtora ABC"
                                    disabled={isPending}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="planId"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Plano</FormLabel>
                            <Select
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                                disabled={isPending || isPlanLocked}
                            >
                                <FormControl>
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Selecione um plano" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {plans.map((plan) => (
                                        <SelectItem key={plan.id} value={plan.id}>
                                            {formatPlanLabel(plan)}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {isPlanLocked && (
                                <p className="text-xs text-muted-foreground">
                                    Plano selecionado na página anterior.{' '}
                                    <Link href="/#planos" className="text-primary underline-offset-4 hover:underline">
                                        Alterar plano
                                    </Link>
                                </p>
                            )}
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Nome do Responsavel</FormLabel>
                            <FormControl>
                                <Input
                                    {...field}
                                    placeholder="Joao Silva"
                                    disabled={isPending}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

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
                            Cadastrando...
                        </>
                    ) : (
                        'Cadastrar Empresa'
                    )}
                </Button>

                <p className="text-center text-sm text-muted-foreground">
                    Ja tem conta?{' '}
                    <Link href="/login" className="text-primary underline-offset-4 hover:underline">
                        Faca login
                    </Link>
                </p>
            </form>
        </Form>
    )
}
