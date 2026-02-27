'use client'

import { useState } from 'react'
import { FileDown, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

interface BulletinItem {
    itemNumber: string
    serviceName: string
    unit: string
    unitPrice: number
    contractedQty: number
    acumAnt: number
    noMes: number
    acumAtual: number
    pctExec: number
    noMesR$: number
    [key: string]: unknown
}

interface AdditiveCalc {
    itemNumber: string
    serviceName: string
    unit: string
    unitPriceNum: number
    qtyNum: number
    noMesR$: number
    [key: string]: unknown
}

interface Calculations {
    itemCalcs: BulletinItem[]
    addCalcs: AdditiveCalc[]
    totalBrutoItems: number
    totalBrutoAdditives: number
    totalBruto: number
    totalLiquido: number
    retencao: number
    valorNF: number
}

interface BulletinPdfData {
    contractNumber: string
    contractorName: string
    projectName: string
    bmNumber: number
    sheetNumber: number
    periodStart: string
    periodEnd: string
    dueDate: string | null
    discountValue: string
    observations: string | null
    status: string
}

interface ExportBulletinPdfButtonProps {
    bulletin: BulletinPdfData
    calculations: Calculations
    retentionPct: number
}

const unitLabels: Record<string, string> = {
    M2: 'm²', M3: 'm³', ML: 'ml', KG: 'kg', VB: 'vb',
    DIA: 'dia', UNID: 'un', M: 'm', TON: 'ton', L: 'L',
}

function formatDate(dateStr: string) {
    const [y, m, d] = dateStr.split('-')
    return `${d}/${m}/${y}`
}

function fmtCurrency(value: number) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

function fmtNum(value: number, dec = 4) {
    return new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: dec }).format(value)
}

export function ExportBulletinPdfButton({ bulletin, calculations, retentionPct }: ExportBulletinPdfButtonProps) {
    const [generating, setGenerating] = useState(false)

    async function handleExport() {
        setGenerating(true)
        try {
            const { default: jsPDF } = await import('jspdf')
            const { default: autoTable } = await import('jspdf-autotable')

            const doc = new jsPDF({ orientation: 'landscape' })

            // Cabeçalho
            doc.setFontSize(14)
            doc.setFont('helvetica', 'bold')
            doc.text('BOLETIM DE MEDIÇÃO — FO.12-3', 14, 15)

            doc.setFontSize(9)
            doc.setFont('helvetica', 'normal')
            doc.setTextColor(100)
            doc.text('Quallisy — Controle de Qualidade', 14, 21)

            doc.setDrawColor(200)
            doc.line(14, 24, 283, 24)

            // Info grid
            doc.setFontSize(9)
            doc.setTextColor(0)
            let y = 30
            const col1 = 14
            const col2 = 80
            const col3 = 155
            const col4 = 220

            const addInfo = (label: string, value: string | null, x: number, yPos: number) => {
                doc.setFont('helvetica', 'bold')
                doc.text(`${label}:`, x, yPos)
                doc.setFont('helvetica', 'normal')
                doc.text(value || '—', x + doc.getTextWidth(`${label}: `), yPos)
            }

            addInfo('Contrato', bulletin.contractNumber, col1, y)
            addInfo('Empreiteira', bulletin.contractorName, col2, y)
            addInfo('Obra', bulletin.projectName, col3, y)
            addInfo('BM N.', String(bulletin.bmNumber), col4, y)
            y += 6
            addInfo('Período', `${formatDate(bulletin.periodStart)} a ${formatDate(bulletin.periodEnd)}`, col1, y)
            addInfo('Vencimento', bulletin.dueDate ? formatDate(bulletin.dueDate) : '—', col2, y)
            addInfo('Folha', String(bulletin.sheetNumber), col3, y)
            y += 10

            // Tabela de itens
            if (calculations.itemCalcs.length > 0) {
                doc.setFontSize(10)
                doc.setFont('helvetica', 'bold')
                doc.text('Itens do Contrato', 14, y)
                y += 3

                autoTable(doc, {
                    startY: y,
                    head: [['Item', 'Serviço', 'Und', 'P. Unit.', 'Qtd Contr.', 'Acum. Ant.', 'No Mês', 'Acum. Atual', '%', 'No Mês (R$)']],
                    body: calculations.itemCalcs.map((item) => [
                        item.itemNumber,
                        item.serviceName,
                        unitLabels[item.unit] ?? item.unit,
                        fmtCurrency(item.unitPrice),
                        fmtNum(item.contractedQty),
                        fmtNum(item.acumAnt),
                        fmtNum(item.noMes),
                        fmtNum(item.acumAtual),
                        `${fmtNum(item.pctExec, 1)}%`,
                        fmtCurrency(item.noMesR$),
                    ]),
                    foot: [['', '', '', '', '', '', '', '', 'Subtotal:', fmtCurrency(calculations.totalBrutoItems)]],
                    styles: { fontSize: 7, cellPadding: 2 },
                    headStyles: { fillColor: [24, 24, 27], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7 },
                    footStyles: { fillColor: [240, 240, 240], fontStyle: 'bold', fontSize: 7 },
                    columnStyles: {
                        0: { cellWidth: 15 },
                        1: { cellWidth: 55 },
                        2: { cellWidth: 15, halign: 'center' },
                        3: { cellWidth: 25, halign: 'right' },
                        4: { cellWidth: 22, halign: 'right' },
                        5: { cellWidth: 22, halign: 'right' },
                        6: { cellWidth: 22, halign: 'right' },
                        7: { cellWidth: 22, halign: 'right' },
                        8: { cellWidth: 15, halign: 'right' },
                        9: { cellWidth: 28, halign: 'right' },
                    },
                    alternateRowStyles: { fillColor: [248, 248, 248] },
                })
                y = (doc as any).lastAutoTable.finalY + 8
            }

            // Aditivos
            if (calculations.addCalcs.length > 0) {
                doc.setFontSize(10)
                doc.setFont('helvetica', 'bold')
                doc.text('Aditivos', 14, y)
                y += 3

                autoTable(doc, {
                    startY: y,
                    head: [['Item', 'Serviço', 'Und', 'P. Unit.', 'No Mês (Qtd)', 'No Mês (R$)']],
                    body: calculations.addCalcs.map((add) => [
                        add.itemNumber,
                        add.serviceName,
                        unitLabels[add.unit] ?? add.unit,
                        fmtCurrency(add.unitPriceNum),
                        fmtNum(add.qtyNum),
                        fmtCurrency(add.noMesR$),
                    ]),
                    foot: [['', '', '', '', 'Subtotal:', fmtCurrency(calculations.totalBrutoAdditives)]],
                    styles: { fontSize: 7, cellPadding: 2 },
                    headStyles: { fillColor: [24, 24, 27], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7 },
                    footStyles: { fillColor: [240, 240, 240], fontStyle: 'bold', fontSize: 7 },
                    alternateRowStyles: { fillColor: [248, 248, 248] },
                })
                y = (doc as any).lastAutoTable.finalY + 8
            }

            // Resumo financeiro
            const discountValue = parseFloat(bulletin.discountValue) || 0
            doc.setFontSize(10)
            doc.setFont('helvetica', 'bold')
            doc.text('Resumo Financeiro', 14, y)
            y += 3

            autoTable(doc, {
                startY: y,
                head: [['Descrição', 'Valor']],
                body: [
                    ['Total Bruto', fmtCurrency(calculations.totalBruto)],
                    ['Descontos', `- ${fmtCurrency(discountValue)}`],
                    ['Total Líquido', fmtCurrency(calculations.totalLiquido)],
                    [`Retenção Técnica (${retentionPct}%)`, `- ${fmtCurrency(calculations.retencao)}`],
                ],
                foot: [['Valor NF', fmtCurrency(calculations.valorNF)]],
                styles: { fontSize: 8, cellPadding: 3 },
                headStyles: { fillColor: [24, 24, 27], textColor: [255, 255, 255], fontStyle: 'bold' },
                footStyles: { fillColor: [240, 240, 240], fontStyle: 'bold', fontSize: 9 },
                columnStyles: { 0: { cellWidth: 60 }, 1: { cellWidth: 40, halign: 'right' } },
                tableWidth: 100,
                margin: { left: 14 },
            })
            y = (doc as any).lastAutoTable.finalY + 10

            // Observações
            if (bulletin.observations) {
                doc.setFontSize(9)
                doc.setFont('helvetica', 'bold')
                doc.text('Observações:', 14, y)
                doc.setFont('helvetica', 'normal')
                const lines = doc.splitTextToSize(bulletin.observations, 260)
                doc.text(lines, 14, y + 5)
                y += 5 + lines.length * 4 + 6
            }

            // Assinaturas
            const sigY = Math.max(y + 10, (doc as any).internal.pageSize.height - 35)
            doc.setDrawColor(0)
            doc.line(14, sigY, 90, sigY)
            doc.line(110, sigY, 186, sigY)
            doc.line(206, sigY, 282, sigY)

            doc.setFontSize(8)
            doc.setFont('helvetica', 'normal')
            doc.text('Empreiteira', 40, sigY + 5)
            doc.text('Planejamento', 136, sigY + 5)
            doc.text('Gerência', 236, sigY + 5)

            // Rodapé
            const pageH = doc.internal.pageSize.height
            doc.setFontSize(7)
            doc.setTextColor(150)
            doc.text(
                `Gerado em ${new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date())} — Quallisy`,
                14,
                pageH - 5,
            )

            const fileName = `BM_${bulletin.bmNumber}_${bulletin.contractorName.replace(/\s+/g, '_')}.pdf`
            doc.save(fileName)
            toast.success('PDF gerado com sucesso!')
        } catch (err) {
            console.error(err)
            toast.error('Erro ao gerar PDF')
        } finally {
            setGenerating(false)
        }
    }

    return (
        <Button variant="outline" onClick={handleExport} disabled={generating}>
            {generating ? (
                <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Gerando...
                </>
            ) : (
                <>
                    <FileDown className="mr-2 h-4 w-4" />
                    Exportar PDF
                </>
            )}
        </Button>
    )
}
