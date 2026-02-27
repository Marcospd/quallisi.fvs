'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { Edit2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
    Table,
    TableBody,
    TableCell,
    TableFooter,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'

interface ContractItemData {
    id: string
    contractId: string
    itemNumber: string
    serviceName: string
    unit: string
    unitPrice: string
    contractedQuantity: string
    sortOrder: number
    active: boolean
    createdAt: Date | null
}

interface ContractData {
    id: string
    tenantId: string
    projectId: string
    projectName: string
    contractorId: string
    contractorName: string
    contractNumber: string
    startDate: string
    endDate: string | null
    technicalRetentionPct: string
    notes: string | null
    active: boolean
    createdAt: Date | null
    items: ContractItemData[]
}

interface ContractDetailProps {
    contract: ContractData
}

const unitLabels: Record<string, string> = {
    M2: 'm²', M3: 'm³', ML: 'ml', KG: 'kg', VB: 'vb',
    DIA: 'dia', UNID: 'un', M: 'm', TON: 'ton', L: 'L',
}

function formatDate(dateStr: string) {
    const [y, m, d] = dateStr.split('-')
    return `${d}/${m}/${y}`
}

function formatCurrency(value: number) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

export function ContractDetail({ contract }: ContractDetailProps) {
    const params = useParams()
    const slug = params.slug as string

    const totalGeral = contract.items.reduce((sum, item) => {
        return sum + parseFloat(item.unitPrice) * parseFloat(item.contractedQuantity)
    }, 0)

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <Badge variant={contract.active ? 'default' : 'secondary'}>
                        {contract.active ? 'Ativo' : 'Inativo'}
                    </Badge>
                    <h1 className="text-xl font-bold">
                        Contrato {contract.contractNumber}
                    </h1>
                </div>
                <Button variant="outline" asChild>
                    <Link href={`/${slug}/contracts/${contract.id}/edit`}>
                        <Edit2 className="mr-2 h-4 w-4" />
                        Editar
                    </Link>
                </Button>
            </div>

            {/* Info geral */}
            <Card>
                <CardHeader>
                    <CardTitle>Dados do Contrato</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                        <InfoItem label="N. Contrato" value={contract.contractNumber} />
                        <InfoItem label="Obra" value={contract.projectName} />
                        <InfoItem label="Empreiteira" value={contract.contractorName} />
                        <InfoItem label="Data Início" value={formatDate(contract.startDate)} />
                        <InfoItem label="Data Fim" value={contract.endDate ? formatDate(contract.endDate) : null} />
                        <InfoItem label="Retenção Técnica" value={`${contract.technicalRetentionPct}%`} />
                        {contract.notes && (
                            <div className="sm:col-span-2 lg:col-span-3">
                                <span className="text-muted-foreground">Observações</span>
                                <p className="mt-0.5">{contract.notes}</p>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Itens do contrato */}
            <Card>
                <CardHeader>
                    <CardTitle>Itens do Contrato ({contract.items.length})</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[60px]">Item</TableHead>
                                <TableHead>Serviço</TableHead>
                                <TableHead className="text-center">Unidade</TableHead>
                                <TableHead className="text-right">P. Unitário</TableHead>
                                <TableHead className="text-right">Qtd Contratada</TableHead>
                                <TableHead className="text-right">Total</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {contract.items.map((item) => {
                                const total = parseFloat(item.unitPrice) * parseFloat(item.contractedQuantity)
                                return (
                                    <TableRow key={item.id}>
                                        <TableCell className="font-medium">{item.itemNumber}</TableCell>
                                        <TableCell>{item.serviceName}</TableCell>
                                        <TableCell className="text-center">
                                            {unitLabels[item.unit] ?? item.unit}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {formatCurrency(parseFloat(item.unitPrice))}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {parseFloat(item.contractedQuantity).toLocaleString('pt-BR')}
                                        </TableCell>
                                        <TableCell className="text-right font-medium">
                                            {formatCurrency(total)}
                                        </TableCell>
                                    </TableRow>
                                )
                            })}
                        </TableBody>
                        <TableFooter>
                            <TableRow>
                                <TableCell colSpan={5} className="text-right font-bold">
                                    Total do Contrato
                                </TableCell>
                                <TableCell className="text-right font-bold">
                                    {formatCurrency(totalGeral)}
                                </TableCell>
                            </TableRow>
                        </TableFooter>
                    </Table>
                </CardContent>
            </Card>
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
