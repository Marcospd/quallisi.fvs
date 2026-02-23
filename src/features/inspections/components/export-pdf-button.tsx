'use client'

import { useState } from 'react'
import { FileDown, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

interface CriterionItem {
    item: {
        id: string
        evaluation: string | null
        notes: string | null
        photoUrl?: string | null
    }
    criterion: {
        description: string
        sortOrder: number
    }
}

interface InspectionData {
    inspection: {
        id: string
        status: string
        result: string | null
        referenceMonth: string
        completedAt: Date | null
        createdAt: Date | null
    }
    service: { name: string }
    location: { name: string }
    inspector: { name: string }
    items: CriterionItem[]
}

interface ExportPdfButtonProps {
    data: InspectionData
}

const evalLabels: Record<string, string> = {
    C: 'Conforme',
    NC: 'Não Conforme',
    NA: 'N/A',
}

/**
 * Botão que gera e baixa o PDF da inspeção FVS.
 * Usa jspdf + jspdf-autotable no client-side.
 */
export function ExportPdfButton({ data }: ExportPdfButtonProps) {
    const [generating, setGenerating] = useState(false)

    async function handleExport() {
        setGenerating(true)
        try {
            // Import dinâmico para manter bundle pequeno
            const { default: jsPDF } = await import('jspdf')
            const { default: autoTable } = await import('jspdf-autotable')

            const doc = new jsPDF()

            // Cabeçalho
            doc.setFontSize(18)
            doc.setFont('helvetica', 'bold')
            doc.text('Ficha de Verificação de Serviço (FVS)', 14, 22)

            doc.setFontSize(10)
            doc.setFont('helvetica', 'normal')
            doc.setTextColor(100)
            doc.text('Quallisy FVS — Controle de Qualidade', 14, 30)

            // Linha separadora
            doc.setDrawColor(200)
            doc.line(14, 34, 196, 34)

            // Informações da inspeção
            doc.setFontSize(11)
            doc.setTextColor(0)

            const infoY = 42
            const col1 = 14
            const col2 = 110

            doc.setFont('helvetica', 'bold')
            doc.text('Serviço:', col1, infoY)
            doc.setFont('helvetica', 'normal')
            doc.text(data.service.name, col1 + 25, infoY)

            doc.setFont('helvetica', 'bold')
            doc.text('Local:', col2, infoY)
            doc.setFont('helvetica', 'normal')
            doc.text(data.location.name, col2 + 20, infoY)

            doc.setFont('helvetica', 'bold')
            doc.text('Inspetor:', col1, infoY + 8)
            doc.setFont('helvetica', 'normal')
            doc.text(data.inspector.name, col1 + 28, infoY + 8)

            doc.setFont('helvetica', 'bold')
            doc.text('Mês Ref.:', col2, infoY + 8)
            doc.setFont('helvetica', 'normal')
            doc.text(data.inspection.referenceMonth, col2 + 25, infoY + 8)

            doc.setFont('helvetica', 'bold')
            doc.text('Status:', col1, infoY + 16)
            doc.setFont('helvetica', 'normal')
            doc.text(data.inspection.status, col1 + 22, infoY + 16)

            if (data.inspection.result) {
                doc.setFont('helvetica', 'bold')
                doc.text('Resultado:', col2, infoY + 16)
                doc.setFont('helvetica', 'normal')
                const resultLabel = data.inspection.result === 'APPROVED'
                    ? 'APROVADA'
                    : data.inspection.result === 'APPROVED_WITH_RESTRICTIONS'
                        ? 'COM PENDÊNCIAS'
                        : 'REPROVADA'
                doc.text(resultLabel, col2 + 30, infoY + 16)
            }

            if (data.inspection.completedAt) {
                const dateStr = new Intl.DateTimeFormat('pt-BR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                }).format(new Date(data.inspection.completedAt))
                doc.setFont('helvetica', 'bold')
                doc.text('Concluída em:', col1, infoY + 24)
                doc.setFont('helvetica', 'normal')
                doc.text(dateStr, col1 + 40, infoY + 24)
            }

            // Tabela de critérios
            const tableData = data.items.map((item, index) => [
                String(index + 1),
                item.criterion.description,
                item.item.evaluation ? evalLabels[item.item.evaluation] || item.item.evaluation : '—',
                item.item.notes || '',
            ])

            autoTable(doc, {
                startY: infoY + 32,
                head: [['#', 'Critério de Verificação', 'Avaliação', 'Observações']],
                body: tableData,
                styles: {
                    fontSize: 9,
                    cellPadding: 4,
                },
                headStyles: {
                    fillColor: [24, 24, 27],
                    textColor: [255, 255, 255],
                    fontStyle: 'bold',
                },
                columnStyles: {
                    0: { cellWidth: 10, halign: 'center' },
                    1: { cellWidth: 85 },
                    2: { cellWidth: 30, halign: 'center' },
                    3: { cellWidth: 55 },
                },
                bodyStyles: {
                    lineWidth: 0.1,
                },
                alternateRowStyles: {
                    fillColor: [245, 245, 245],
                },
                didParseCell: (hookData) => {
                    // Colorir célula de avaliação
                    if (hookData.section === 'body' && hookData.column.index === 2) {
                        const val = hookData.cell.raw as string
                        if (val === 'Conforme') {
                            hookData.cell.styles.textColor = [22, 163, 74]
                            hookData.cell.styles.fontStyle = 'bold'
                        } else if (val === 'Não Conforme') {
                            hookData.cell.styles.textColor = [220, 38, 38]
                            hookData.cell.styles.fontStyle = 'bold'
                        } else if (val === 'N/A') {
                            hookData.cell.styles.textColor = [150, 150, 150]
                        }
                    }
                },
            })

            // Resumo
            const finalY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 12
            const totalC = data.items.filter((i) => i.item.evaluation === 'C').length
            const totalNC = data.items.filter((i) => i.item.evaluation === 'NC').length
            const totalNA = data.items.filter((i) => i.item.evaluation === 'NA').length

            doc.setFontSize(10)
            doc.setFont('helvetica', 'bold')
            doc.text('Resumo:', col1, finalY)
            doc.setFont('helvetica', 'normal')
            doc.text(`Conforme: ${totalC}  |  Não Conforme: ${totalNC}  |  N/A: ${totalNA}  |  Total: ${data.items.length}`, col1 + 22, finalY)

            // Rodapé
            const pageHeight = doc.internal.pageSize.height
            doc.setFontSize(8)
            doc.setTextColor(150)
            doc.text(
                `Gerado em ${new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date())} — Quallisy FVS`,
                14,
                pageHeight - 10,
            )

            // Download
            const fileName = `FVS_${data.service.name.replace(/\s+/g, '_')}_${data.location.name.replace(/\s+/g, '_')}_${data.inspection.referenceMonth}.pdf`
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
