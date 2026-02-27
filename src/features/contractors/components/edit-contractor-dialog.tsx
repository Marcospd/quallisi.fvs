'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { createContractorSchema, type CreateContractorInput } from '../schemas'
import { updateContractor } from '../actions'
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
import { toast } from 'sonner'

interface ContractorData {
    id: string
    name: string
    cnpj: string | null
    contactName: string | null
    contactEmail: string | null
    contactPhone: string | null
    bankInfo: string | null
    nfAddress: string | null
    ceiMatricula: string | null
}

interface EditContractorDialogProps {
    contractor: ContractorData | null
    open: boolean
    onOpenChange: (open: boolean) => void
}

/**
 * Dialog para editar uma empreiteira existente.
 */
export function EditContractorDialog({ contractor, open, onOpenChange }: EditContractorDialogProps) {
    const [isPending, setIsPending] = useState(false)

    const form = useForm<CreateContractorInput>({
        resolver: zodResolver(createContractorSchema),
        defaultValues: {
            name: '',
            cnpj: '',
            contactName: '',
            contactEmail: '',
            contactPhone: '',
            bankInfo: '',
            nfAddress: '',
            ceiMatricula: '',
        },
    })

    useEffect(() => {
        if (contractor && open) {
            form.reset({
                name: contractor.name,
                cnpj: contractor.cnpj || '',
                contactName: contractor.contactName || '',
                contactEmail: contractor.contactEmail || '',
                contactPhone: contractor.contactPhone || '',
                bankInfo: contractor.bankInfo || '',
                nfAddress: contractor.nfAddress || '',
                ceiMatricula: contractor.ceiMatricula || '',
            })
        }
    }, [contractor, open, form])

    async function onSubmit(data: CreateContractorInput) {
        if (!contractor) return

        setIsPending(true)
        try {
            const result = await updateContractor(contractor.id, data)
            if (result?.error) {
                const msg = typeof result.error === 'string' ? result.error : 'Verifique os dados'
                toast.error(msg)
            } else {
                toast.success('Empreiteira atualizada com sucesso!')
                onOpenChange(false)
            }
        } catch {
            toast.error('Erro ao editar empreiteira')
        } finally {
            setIsPending(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Editar Empreiteira</DialogTitle>
                    <DialogDescription>Edite as informações da empreiteira selecionada</DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem className="sm:col-span-2">
                                        <FormLabel>Razão Social</FormLabel>
                                        <FormControl>
                                            <Input {...field} placeholder="Nome da empreiteira" disabled={isPending} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="cnpj"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>CNPJ</FormLabel>
                                        <FormControl>
                                            <Input {...field} placeholder="00.000.000/0000-00" disabled={isPending} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="ceiMatricula"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Matrícula CEI</FormLabel>
                                        <FormControl>
                                            <Input {...field} placeholder="CEI da obra" disabled={isPending} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="contactName"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Responsável</FormLabel>
                                        <FormControl>
                                            <Input {...field} placeholder="Nome do contato" disabled={isPending} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="contactEmail"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>E-mail</FormLabel>
                                        <FormControl>
                                            <Input {...field} type="email" placeholder="email@empresa.com" disabled={isPending} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="contactPhone"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Telefone</FormLabel>
                                        <FormControl>
                                            <Input {...field} placeholder="(11) 99999-9999" disabled={isPending} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="nfAddress"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Endereço para envio de NF</FormLabel>
                                    <FormControl>
                                        <Textarea {...field} placeholder="Endereço ou e-mail para envio da nota fiscal" disabled={isPending} rows={2} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="bankInfo"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Dados Bancários</FormLabel>
                                    <FormControl>
                                        <Textarea {...field} placeholder="Banco, Agência, Conta, PIX..." disabled={isPending} rows={2} />
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
