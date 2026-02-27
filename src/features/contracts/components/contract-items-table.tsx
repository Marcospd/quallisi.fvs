'use client'

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
    itemNumber: string
    serviceName: string
    unit: string
    unitPrice: string
    contractedQuantity: string
    active: boolean
}

interface ContractItemsTableProps {
    items: ContractItemData[]
}

const unitLabels: Record<string, string> = {
    M2: 'm²', M3: 'm³', ML: 'ml', KG: 'kg', VB: 'vb',
    DIA: 'dia', UNID: 'un', M: 'm', TON: 'ton', L: 'L',
}

function formatCurrency(value: number) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

/**
 * Tabela de itens de contrato reutilizável (usada no detail e futuramente no BM).
 */
export function ContractItemsTable({ items }: ContractItemsTableProps) {
    const total = items.reduce((sum, item) => {
        return sum + parseFloat(item.unitPrice) * parseFloat(item.contractedQuantity)
    }, 0)

    return (
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
                {items.map((item) => {
                    const lineTotal = parseFloat(item.unitPrice) * parseFloat(item.contractedQuantity)
                    return (
                        <TableRow key={item.id}>
                            <TableCell className="font-medium">{item.itemNumber}</TableCell>
                            <TableCell>{item.serviceName}</TableCell>
                            <TableCell className="text-center">{unitLabels[item.unit] ?? item.unit}</TableCell>
                            <TableCell className="text-right">{formatCurrency(parseFloat(item.unitPrice))}</TableCell>
                            <TableCell className="text-right">{parseFloat(item.contractedQuantity).toLocaleString('pt-BR')}</TableCell>
                            <TableCell className="text-right font-medium">{formatCurrency(lineTotal)}</TableCell>
                        </TableRow>
                    )
                })}
            </TableBody>
            <TableFooter>
                <TableRow>
                    <TableCell colSpan={5} className="text-right font-bold">Total</TableCell>
                    <TableCell className="text-right font-bold">{formatCurrency(total)}</TableCell>
                </TableRow>
            </TableFooter>
        </Table>
    )
}
