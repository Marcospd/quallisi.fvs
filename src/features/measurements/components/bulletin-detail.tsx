'use client'

import { useState, useTransition, useMemo } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { Edit2, Send, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'

import { BulletinStatusBadge } from './bulletin-status-badge'
import { BulletinApprovalDialog } from './bulletin-approval-dialog'
import { ExportBulletinPdfButton } from './export-bulletin-pdf-button'
import { submitBulletin } from '../actions'

interface BulletinItem {
    id: string
    contractItemId: string
    quantityThisPeriod: string
    itemNumber: string
    serviceName: string
    unit: string
    unitPrice: string
    contractedQuantity: string
}

interface BulletinAdditive {
    id: string
    itemNumber: string
    serviceName: string
    unit: string
    unitPrice: string
    contractedQuantity: string
    quantityThisPeriod: string
    sortOrder: number
}

interface BulletinApproval {
    id: string
    stage: string
    action: string
    userId: string | null
    notes: string | null
    createdAt: Date | null
}

interface BulletinData {
    id: string
    contractId: string
    contractNumber: string
    contractorName: string
    projectName: string
    technicalRetentionPct: string
    bmNumber: number
    sheetNumber: number
    periodStart: string
    periodEnd: string
    dueDate: string | null
    discountValue: string
    observations: string | null
    status: string
    createdBy: string | null
    createdAt: Date | null
    items: BulletinItem[]
    additives: BulletinAdditive[]
    approvals: BulletinApproval[]
    accumulated: Record<string, string>
}

interface BulletinDetailProps {
    bulletin: BulletinData
}

const unitLabels: Record<string, string> = {
    M2: 'm²', M3: 'm³', ML: 'ml', KG: 'kg', VB: 'vb',
    DIA: 'dia', UNID: 'un', M: 'm', TON: 'ton', L: 'L',
}

const stageLabels: Record<string, string> = {
    PLANNING: 'Planejamento',
    MANAGEMENT: 'Gerência',
    CONTRACTOR: 'Empreiteira',
}

const actionLabels: Record<string, string> = {
    APPROVED: 'Aprovado',
    REJECTED: 'Rejeitado',
}

function formatDate(dateStr: string) {
    const [y, m, d] = dateStr.split('-')
    return `${d}/${m}/${y}`
}

function formatCurrency(value: number) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

function formatNumber(value: number, decimals = 4) {
    return new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: decimals }).format(value)
}

export function BulletinDetail({ bulletin }: BulletinDetailProps) {
    const params = useParams()
    const router = useRouter()
    const slug = params.slug as string
    const [isPending, startTransition] = useTransition()
    const [showSubmitConfirm, setShowSubmitConfirm] = useState(false)
    const [showApprovalDialog, setShowApprovalDialog] = useState(false)

    const retentionPct = parseFloat(bulletin.technicalRetentionPct) || 5
    const discountValue = parseFloat(bulletin.discountValue) || 0

    // Cálculos
    const calculations = useMemo(() => {
        let totalBrutoItems = 0

        const itemCalcs = bulletin.items.map((item) => {
            const unitPrice = parseFloat(item.unitPrice) || 0
            const contractedQty = parseFloat(item.contractedQuantity) || 0
            const totalItem = unitPrice * contractedQty
            const acumAnt = parseFloat(bulletin.accumulated[item.contractItemId] ?? '0')
            const noMes = parseFloat(item.quantityThisPeriod) || 0
            const acumAtual = acumAnt + noMes
            const pctExec = contractedQty > 0 ? (acumAtual / contractedQty) * 100 : 0
            const saldoFisico = contractedQty - acumAtual
            const noMesR$ = noMes * unitPrice

            totalBrutoItems += noMesR$

            return {
                ...item,
                unitPrice,
                contractedQty,
                totalItem,
                acumAnt,
                noMes,
                acumAtual,
                pctExec,
                saldoFisico,
                noMesR$,
            }
        })

        let totalBrutoAdditives = 0
        const addCalcs = bulletin.additives.map((add) => {
            const unitPrice = parseFloat(add.unitPrice) || 0
            const qty = parseFloat(add.quantityThisPeriod) || 0
            const noMesR$ = qty * unitPrice
            totalBrutoAdditives += noMesR$
            return { ...add, unitPriceNum: unitPrice, qtyNum: qty, noMesR$ }
        })

        const totalBruto = totalBrutoItems + totalBrutoAdditives
        const totalLiquido = totalBruto - discountValue
        const retencao = totalLiquido * (retentionPct / 100)
        const valorNF = totalLiquido - retencao

        return { itemCalcs, addCalcs, totalBrutoItems, totalBrutoAdditives, totalBruto, totalLiquido, retencao, valorNF }
    }, [bulletin, discountValue, retentionPct])

    function handleSubmit() {
        startTransition(async () => {
            const result = await submitBulletin(bulletin.id)
            if (result?.error) {
                toast.error(typeof result.error === 'string' ? result.error : 'Erro')
            } else {
                toast.success('Boletim submetido!')
                router.refresh()
            }
            setShowSubmitConfirm(false)
        })
    }

    // Determinar próxima etapa de aprovação
    const nextApprovalStage = (() => {
        switch (bulletin.status) {
            case 'SUBMITTED': return 'PLANNING'
            case 'PLANNING_APPROVED': return 'MANAGEMENT'
            case 'MANAGEMENT_APPROVED': return 'CONTRACTOR'
            default: return null
        }
    })()

    return (
        <div className="space-y-6">
            {/* Header com ações */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <BulletinStatusBadge status={bulletin.status} />
                    <h1 className="text-xl font-bold">
                        BM {bulletin.bmNumber} — {bulletin.contractorName}
                    </h1>
                </div>
                <div className="flex items-center gap-2">
                    <ExportBulletinPdfButton bulletin={bulletin} calculations={calculations} retentionPct={retentionPct} />

                    {(bulletin.status === 'DRAFT' || bulletin.status === 'REJECTED') && (
                        <>
                            <Button variant="outline" asChild>
                                <Link href={`/${slug}/measurements/${bulletin.id}/edit`}>
                                    <Edit2 className="mr-2 h-4 w-4" />
                                    Editar
                                </Link>
                            </Button>
                            {bulletin.status === 'DRAFT' && (
                                <Button onClick={() => setShowSubmitConfirm(true)}>
                                    <Send className="mr-2 h-4 w-4" />
                                    Submeter
                                </Button>
                            )}
                        </>
                    )}

                    {nextApprovalStage && (
                        <Button onClick={() => setShowApprovalDialog(true)}>
                            Aprovar / Rejeitar
                        </Button>
                    )}
                </div>
            </div>

            {/* Info geral */}
            <Card>
                <CardHeader>
                    <CardTitle>Informações do Boletim</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                        <InfoItem label="Contrato" value={bulletin.contractNumber} />
                        <InfoItem label="Empreiteira" value={bulletin.contractorName} />
                        <InfoItem label="Obra" value={bulletin.projectName} />
                        <InfoItem label="N. BM" value={String(bulletin.bmNumber)} />
                        <InfoItem label="Folha" value={String(bulletin.sheetNumber)} />
                        <InfoItem label="Período" value={`${formatDate(bulletin.periodStart)} a ${formatDate(bulletin.periodEnd)}`} />
                        <InfoItem label="Vencimento" value={bulletin.dueDate ? formatDate(bulletin.dueDate) : null} />
                        <InfoItem label="Retenção Técnica" value={`${retentionPct}%`} />
                    </div>
                    {bulletin.observations && (
                        <div className="mt-4 pt-4 border-t">
                            <span className="text-sm text-muted-foreground">Observações</span>
                            <p className="mt-1 text-sm">{bulletin.observations}</p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Tabela de Itens */}
            {calculations.itemCalcs.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Itens do Contrato</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Item</TableHead>
                                        <TableHead>Serviço</TableHead>
                                        <TableHead className="text-center">Und</TableHead>
                                        <TableHead className="text-right">P. Unit.</TableHead>
                                        <TableHead className="text-right">Qtd Contr.</TableHead>
                                        <TableHead className="text-right">Acum. Ant.</TableHead>
                                        <TableHead className="text-right">No Mês</TableHead>
                                        <TableHead className="text-right">Acum. Atual</TableHead>
                                        <TableHead className="text-right">%</TableHead>
                                        <TableHead className="text-right">No Mês (R$)</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {calculations.itemCalcs.map((calc) => (
                                        <TableRow key={calc.id}>
                                            <TableCell className="font-medium">{calc.itemNumber}</TableCell>
                                            <TableCell className="text-sm">{calc.serviceName}</TableCell>
                                            <TableCell className="text-center text-muted-foreground">
                                                {unitLabels[calc.unit] ?? calc.unit}
                                            </TableCell>
                                            <TableCell className="text-right text-muted-foreground">
                                                {formatCurrency(calc.unitPrice)}
                                            </TableCell>
                                            <TableCell className="text-right">{formatNumber(calc.contractedQty)}</TableCell>
                                            <TableCell className="text-right text-muted-foreground">{formatNumber(calc.acumAnt)}</TableCell>
                                            <TableCell className="text-right font-medium">{formatNumber(calc.noMes)}</TableCell>
                                            <TableCell className="text-right font-medium">{formatNumber(calc.acumAtual)}</TableCell>
                                            <TableCell className="text-right">
                                                <span className={calc.pctExec > 100 ? 'text-destructive font-bold' : ''}>
                                                    {formatNumber(calc.pctExec, 1)}%
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-right font-medium">{formatCurrency(calc.noMesR$)}</TableCell>
                                        </TableRow>
                                    ))}
                                    <TableRow className="border-t-2 font-bold">
                                        <TableCell colSpan={9} className="text-right">Subtotal Itens:</TableCell>
                                        <TableCell className="text-right">{formatCurrency(calculations.totalBrutoItems)}</TableCell>
                                    </TableRow>
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Aditivos */}
            {calculations.addCalcs.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Aditivos</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Item</TableHead>
                                    <TableHead>Serviço</TableHead>
                                    <TableHead className="text-center">Und</TableHead>
                                    <TableHead className="text-right">P. Unit.</TableHead>
                                    <TableHead className="text-right">No Mês (Qtd)</TableHead>
                                    <TableHead className="text-right">No Mês (R$)</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {calculations.addCalcs.map((add) => (
                                    <TableRow key={add.id}>
                                        <TableCell className="font-medium">{add.itemNumber}</TableCell>
                                        <TableCell>{add.serviceName}</TableCell>
                                        <TableCell className="text-center text-muted-foreground">
                                            {unitLabels[add.unit] ?? add.unit}
                                        </TableCell>
                                        <TableCell className="text-right">{formatCurrency(add.unitPriceNum)}</TableCell>
                                        <TableCell className="text-right">{formatNumber(add.qtyNum)}</TableCell>
                                        <TableCell className="text-right font-medium">{formatCurrency(add.noMesR$)}</TableCell>
                                    </TableRow>
                                ))}
                                <TableRow className="border-t-2 font-bold">
                                    <TableCell colSpan={5} className="text-right">Subtotal Aditivos:</TableCell>
                                    <TableCell className="text-right">{formatCurrency(calculations.totalBrutoAdditives)}</TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            )}

            {/* Resumo Financeiro */}
            <Card>
                <CardHeader>
                    <CardTitle>Resumo Financeiro</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="max-w-md ml-auto space-y-2 text-sm">
                        <SummaryRow label="Total Bruto" value={formatCurrency(calculations.totalBruto)} bold />
                        <SummaryRow label="Descontos" value={`- ${formatCurrency(discountValue)}`} />
                        <SummaryRow label="Total Líquido" value={formatCurrency(calculations.totalLiquido)} bold />
                        <SummaryRow label={`Retenção Técnica (${retentionPct}%)`} value={`- ${formatCurrency(calculations.retencao)}`} />
                        <div className="border-t pt-3 mt-3">
                            <SummaryRow label="Valor NF" value={formatCurrency(calculations.valorNF)} bold large />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Timeline de Aprovações */}
            {bulletin.approvals.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Histórico de Aprovações</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {bulletin.approvals.map((approval) => (
                                <div key={approval.id} className="flex items-start gap-3 text-sm">
                                    <Badge
                                        variant={approval.action === 'APPROVED' ? 'default' : 'destructive'}
                                        className={approval.action === 'APPROVED' ? 'bg-emerald-600' : undefined}
                                    >
                                        {actionLabels[approval.action] ?? approval.action}
                                    </Badge>
                                    <div>
                                        <p className="font-medium">
                                            {stageLabels[approval.stage] ?? approval.stage}
                                        </p>
                                        {approval.notes && (
                                            <p className="text-muted-foreground mt-0.5">{approval.notes}</p>
                                        )}
                                        {approval.createdAt && (
                                            <p className="text-xs text-muted-foreground mt-1">
                                                {new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(approval.createdAt))}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Submit Confirm */}
            <AlertDialog open={showSubmitConfirm} onOpenChange={setShowSubmitConfirm}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Submeter boletim de medição?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Após submeter, o boletim entrará no fluxo de aprovação e não poderá ser editado.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isPending}>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleSubmit} disabled={isPending}>
                            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Submeter
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Approval Dialog */}
            {nextApprovalStage && (
                <BulletinApprovalDialog
                    bulletinId={bulletin.id}
                    stage={nextApprovalStage}
                    open={showApprovalDialog}
                    onOpenChange={setShowApprovalDialog}
                />
            )}
        </div>
    )
}

function InfoItem({ label, value }: { label: string; value: string | null | undefined }) {
    return (
        <div>
            <span className="text-muted-foreground">{label}</span>
            <p className="mt-0.5 font-medium">{value || '—'}</p>
        </div>
    )
}

function SummaryRow({ label, value, bold, large }: { label: string; value: string; bold?: boolean; large?: boolean }) {
    return (
        <div className="flex justify-between">
            <span className={bold ? 'font-semibold' : 'text-muted-foreground'}>{label}</span>
            <span className={`${bold ? 'font-semibold' : ''} ${large ? 'text-lg text-primary' : ''}`}>{value}</span>
        </div>
    )
}
