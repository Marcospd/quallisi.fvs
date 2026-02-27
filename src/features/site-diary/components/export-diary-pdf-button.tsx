'use client'

import { useState } from 'react'
import { FileDown, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

interface DiaryPdfData {
    projectName: string
    entryDate: string
    orderNumber: string | null
    contractorName: string | null
    networkDiagramRef: string | null
    engineerName: string | null
    foremanName: string | null
    weatherCondition: string
    workSuspended: boolean
    totalHours: string | null
    status: string
    laborEntries: Array<{ role: string; quantity: number; hours: string }>
    equipmentEntries: Array<{ description: string; quantity: number; notes: string | null }>
    servicesExecuted: Array<{ description: string }>
    observations: Array<{ origin: string; text: string }>
    releases: Array<{ stage: string; signedAt: Date | null }>
}

interface ExportDiaryPdfButtonProps {
    diary: DiaryPdfData
}

const weatherLabels: Record<string, string> = {
    NONE: 'Sem chuva',
    LIGHT_RAIN: 'Chuva leve',
    HEAVY_RAIN: 'Chuva forte',
}

const originLabels: Record<string, string> = {
    CONTRACTOR: 'Prestadora',
    INSPECTION: 'Fiscalização',
    DMUA: 'DMUA',
}

function formatDate(dateStr: string) {
    const [y, m, d] = dateStr.split('-')
    return `${d}/${m}/${y}`
}

export function ExportDiaryPdfButton({ diary }: ExportDiaryPdfButtonProps) {
    const [generating, setGenerating] = useState(false)

    async function handleExport() {
        setGenerating(true)
        try {
            const { default: jsPDF } = await import('jspdf')
            const { default: autoTable } = await import('jspdf-autotable')

            const doc = new jsPDF()

            // Cabeçalho
            doc.setFontSize(16)
            doc.setFont('helvetica', 'bold')
            doc.text('DIÁRIO DE OBRA — FO.06.03', 14, 20)

            doc.setFontSize(10)
            doc.setFont('helvetica', 'normal')
            doc.setTextColor(100)
            doc.text('Quallisy — Controle de Qualidade', 14, 27)

            doc.setDrawColor(200)
            doc.line(14, 30, 196, 30)

            // Info grid
            doc.setFontSize(10)
            doc.setTextColor(0)
            const col1 = 14
            const col2 = 110
            let y = 38

            const addInfo = (label: string, value: string | null, x: number, yPos: number) => {
                doc.setFont('helvetica', 'bold')
                doc.text(`${label}:`, x, yPos)
                doc.setFont('helvetica', 'normal')
                doc.text(value || '—', x + doc.getTextWidth(`${label}: `), yPos)
            }

            addInfo('Obra', diary.projectName, col1, y)
            addInfo('Data', formatDate(diary.entryDate), col2, y)
            y += 7
            addInfo('Prestadora', diary.contractorName, col1, y)
            addInfo('OS', diary.orderNumber, col2, y)
            y += 7
            addInfo('Engenheiro', diary.engineerName, col1, y)
            addInfo('Encarregado', diary.foremanName, col2, y)
            y += 7
            addInfo('Clima', weatherLabels[diary.weatherCondition] || diary.weatherCondition, col1, y)
            addInfo('Total Horas', diary.totalHours ? `${diary.totalHours}h` : '—', col2, y)
            y += 7
            if (diary.workSuspended) {
                doc.setFont('helvetica', 'bold')
                doc.setTextColor(220, 38, 38)
                doc.text('*** TRABALHO SUSPENSO ***', col1, y)
                doc.setTextColor(0)
                y += 7
            }

            y += 4

            // Mão de obra
            if (diary.laborEntries.length > 0) {
                autoTable(doc, {
                    startY: y,
                    head: [['#', 'Função', 'Qtd', 'Horas']],
                    body: diary.laborEntries.map((e, i) => [
                        String(i + 1), e.role, String(e.quantity), `${e.hours}h`,
                    ]),
                    styles: { fontSize: 9, cellPadding: 3 },
                    headStyles: { fillColor: [24, 24, 27], textColor: [255, 255, 255], fontStyle: 'bold' },
                    columnStyles: { 0: { cellWidth: 10, halign: 'center' }, 2: { cellWidth: 15, halign: 'center' }, 3: { cellWidth: 20, halign: 'center' } },
                    alternateRowStyles: { fillColor: [245, 245, 245] },
                    didDrawPage: () => {
                        doc.setFontSize(11)
                        doc.setFont('helvetica', 'bold')
                        doc.text('Mão de Obra', 14, y - 3)
                    },
                })
                y = (doc as any).lastAutoTable.finalY + 10
            }

            // Equipamentos
            if (diary.equipmentEntries.length > 0) {
                doc.setFontSize(11)
                doc.setFont('helvetica', 'bold')
                doc.text('Equipamentos', 14, y)
                y += 4

                autoTable(doc, {
                    startY: y,
                    head: [['#', 'Descrição', 'Qtd', 'Observação']],
                    body: diary.equipmentEntries.map((e, i) => [
                        String(i + 1), e.description, String(e.quantity), e.notes || '',
                    ]),
                    styles: { fontSize: 9, cellPadding: 3 },
                    headStyles: { fillColor: [24, 24, 27], textColor: [255, 255, 255], fontStyle: 'bold' },
                    columnStyles: { 0: { cellWidth: 10, halign: 'center' }, 2: { cellWidth: 15, halign: 'center' } },
                    alternateRowStyles: { fillColor: [245, 245, 245] },
                })
                y = (doc as any).lastAutoTable.finalY + 10
            }

            // Serviços executados
            if (diary.servicesExecuted.length > 0) {
                doc.setFontSize(11)
                doc.setFont('helvetica', 'bold')
                doc.text('Serviços Executados', 14, y)
                y += 4

                autoTable(doc, {
                    startY: y,
                    head: [['#', 'Descrição do Serviço']],
                    body: diary.servicesExecuted.map((e, i) => [String(i + 1), e.description]),
                    styles: { fontSize: 9, cellPadding: 3 },
                    headStyles: { fillColor: [24, 24, 27], textColor: [255, 255, 255], fontStyle: 'bold' },
                    columnStyles: { 0: { cellWidth: 10, halign: 'center' } },
                    alternateRowStyles: { fillColor: [245, 245, 245] },
                })
                y = (doc as any).lastAutoTable.finalY + 10
            }

            // Observações
            if (diary.observations.length > 0) {
                doc.setFontSize(11)
                doc.setFont('helvetica', 'bold')
                doc.text('Observações / Recomendações', 14, y)
                y += 4

                autoTable(doc, {
                    startY: y,
                    head: [['Origem', 'Observação']],
                    body: diary.observations.map((o) => [
                        originLabels[o.origin] ?? o.origin,
                        o.text,
                    ]),
                    styles: { fontSize: 9, cellPadding: 3 },
                    headStyles: { fillColor: [24, 24, 27], textColor: [255, 255, 255], fontStyle: 'bold' },
                    columnStyles: { 0: { cellWidth: 30 } },
                    alternateRowStyles: { fillColor: [245, 245, 245] },
                })
                y = (doc as any).lastAutoTable.finalY + 10
            }

            // Assinaturas
            if (diary.releases.length > 0) {
                doc.setFontSize(11)
                doc.setFont('helvetica', 'bold')
                doc.text('Liberações / Assinaturas', 14, y)
                y += 6

                diary.releases.forEach((r) => {
                    const label = r.stage === 'CONTRACTOR' ? 'Prestadora' : 'Fiscalização'
                    const dateStr = r.signedAt
                        ? new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(r.signedAt))
                        : '—'
                    doc.setFont('helvetica', 'normal')
                    doc.setFontSize(9)
                    doc.text(`${label}: ${dateStr}`, 14, y)
                    y += 5
                })
            }

            // Rodapé
            const pageHeight = doc.internal.pageSize.height
            doc.setFontSize(8)
            doc.setTextColor(150)
            doc.text(
                `Gerado em ${new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date())} — Quallisy`,
                14,
                pageHeight - 10,
            )

            const fileName = `Diario_${diary.projectName.replace(/\s+/g, '_')}_${diary.entryDate}.pdf`
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
