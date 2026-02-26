'use client'

import { useState } from 'react'
import { markInvoiceAsPaid, markInvoiceAsOverdue } from '../billing-actions'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { DataTableSortHeader } from '@/components/data-table-sort-header'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { MoreHorizontal, CheckCircle, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'

interface InvoiceRow {
    invoice: {
        id: string
        amountBrl: string
        dueDate: Date
        paidAt: Date | null
        status: string
        paymentMethod: string | null
        notes: string | null
    }
    tenant: { name: string; slug: string }
}

const invoiceStatusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
    PENDING: { label: 'Pendente', variant: 'outline' },
    PAID: { label: 'Pago', variant: 'default' },
    OVERDUE: { label: 'Atrasado', variant: 'destructive' },
    CANCELLED: { label: 'Cancelado', variant: 'secondary' },
}

/**
 * Tabela de faturas com ações de marcar como paga/atrasada.
 */
export function InvoicesTable({ invoices }: { invoices: InvoiceRow[] }) {
    const [pendingId, setPendingId] = useState<string | null>(null)
    const [payDialog, setPayDialog] = useState<{ invoiceId: string; tenantName: string } | null>(null)
    const [paymentMethod, setPaymentMethod] = useState('')

    function formatDate(date: Date | null) {
        if (!date) return '—'
        return new Intl.DateTimeFormat('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
        }).format(new Date(date))
    }

    function formatBrl(value: string) {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
        }).format(Number(value))
    }

    async function handlePay() {
        if (!payDialog || !paymentMethod.trim()) {
            toast.error('Informe o método de pagamento')
            return
        }

        setPendingId(payDialog.invoiceId)
        try {
            const result = await markInvoiceAsPaid(payDialog.invoiceId, paymentMethod)
            if (result?.error) {
                toast.error(typeof result.error === 'string' ? result.error : 'Erro')
            } else {
                toast.success('Pagamento registrado!')
                setPayDialog(null)
                setPaymentMethod('')
            }
        } catch {
            toast.error('Erro ao registrar pagamento')
        } finally {
            setPendingId(null)
        }
    }

    async function handleOverdue(invoiceId: string) {
        setPendingId(invoiceId)
        try {
            const result = await markInvoiceAsOverdue(invoiceId)
            if (result?.error) {
                toast.error(typeof result.error === 'string' ? result.error : 'Erro')
            } else {
                toast.success('Fatura marcada como atrasada')
            }
        } catch {
            toast.error('Erro ao alterar status')
        } finally {
            setPendingId(null)
        }
    }

    return (
        <>
            <Table>
                <TableHeader>
                    <TableRow>
                        <DataTableSortHeader column="tenant">Construtora</DataTableSortHeader>
                        <DataTableSortHeader column="amount">Valor</DataTableSortHeader>
                        <DataTableSortHeader column="dueDate">Vencimento</DataTableSortHeader>
                        <DataTableSortHeader column="status">Status</DataTableSortHeader>
                        <TableHead>Pagamento</TableHead>
                        <TableHead className="w-[70px]">Ações</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {invoices.map(({ invoice, tenant }) => {
                        const config = invoiceStatusConfig[invoice.status] ?? { label: invoice.status, variant: 'outline' as const }
                        return (
                            <TableRow key={invoice.id}>
                                <TableCell className="font-medium">{tenant.name}</TableCell>
                                <TableCell>{formatBrl(invoice.amountBrl)}</TableCell>
                                <TableCell>{formatDate(invoice.dueDate)}</TableCell>
                                <TableCell>
                                    <Badge variant={config.variant}>{config.label}</Badge>
                                </TableCell>
                                <TableCell className="text-muted-foreground">
                                    {invoice.paymentMethod ?? '—'}
                                </TableCell>
                                <TableCell>
                                    {(invoice.status === 'PENDING' || invoice.status === 'OVERDUE') && (
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" disabled={pendingId === invoice.id}>
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem
                                                    onClick={() => setPayDialog({ invoiceId: invoice.id, tenantName: tenant.name })}
                                                >
                                                    <CheckCircle className="h-4 w-4 mr-2" />
                                                    Marcar como Pago
                                                </DropdownMenuItem>
                                                {invoice.status === 'PENDING' && (
                                                    <DropdownMenuItem
                                                        className="text-destructive"
                                                        onClick={() => handleOverdue(invoice.id)}
                                                    >
                                                        <AlertTriangle className="h-4 w-4 mr-2" />
                                                        Marcar como Atrasado
                                                    </DropdownMenuItem>
                                                )}
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    )}
                                </TableCell>
                            </TableRow>
                        )
                    })}
                </TableBody>
            </Table>

            {/* Dialog para registrar pagamento */}
            <Dialog open={!!payDialog} onOpenChange={(open) => !open && setPayDialog(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Registrar Pagamento</DialogTitle>
                        <DialogDescription>
                            Confirme o pagamento de <strong>{payDialog?.tenantName}</strong>
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>Método de Pagamento</Label>
                            <Input
                                placeholder="PIX, TED, Boleto..."
                                value={paymentMethod}
                                onChange={(e) => setPaymentMethod(e.target.value)}
                            />
                        </div>
                        <Button onClick={handlePay} className="w-full" disabled={!!pendingId}>
                            Confirmar Pagamento
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    )
}
