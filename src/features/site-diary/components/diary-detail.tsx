'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import {
    Cloud,
    CloudDrizzle,
    CloudRain,
    Edit2,
    Send,
    PenTool,
    Loader2,
} from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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

import { DiaryStatusBadge } from './diary-status-badge'
import { ExportDiaryPdfButton } from './export-diary-pdf-button'
import { submitDiary, signDiary } from '../actions'

interface DiaryData {
    id: string
    projectId: string
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
    createdBy: string | null
    createdAt: Date | null
    laborEntries: Array<{ id: string; role: string; quantity: number; hours: string; sortOrder: number }>
    equipmentEntries: Array<{ id: string; description: string; quantity: number; notes: string | null; sortOrder: number }>
    servicesExecuted: Array<{ id: string; description: string; serviceId: string | null; sortOrder: number }>
    observations: Array<{ id: string; origin: string; text: string; createdBy: string | null; createdAt: Date | null }>
    releases: Array<{ id: string; stage: string; signedBy: string | null; signedAt: Date | null }>
}

interface DiaryDetailProps {
    diary: DiaryData
}

const weatherLabels: Record<string, { label: string; icon: typeof Cloud }> = {
    NONE: { label: 'Sem chuva', icon: Cloud },
    LIGHT_RAIN: { label: 'Chuva leve', icon: CloudDrizzle },
    HEAVY_RAIN: { label: 'Chuva forte', icon: CloudRain },
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

export function DiaryDetail({ diary }: DiaryDetailProps) {
    const params = useParams()
    const router = useRouter()
    const slug = params.slug as string
    const [isPending, startTransition] = useTransition()
    const [confirmAction, setConfirmAction] = useState<'submit' | 'sign_contractor' | 'sign_inspection' | null>(null)

    const weather = weatherLabels[diary.weatherCondition] ?? weatherLabels.NONE
    const WeatherIcon = weather.icon

    function handleAction() {
        if (!confirmAction) return
        startTransition(async () => {
            let result
            if (confirmAction === 'submit') {
                result = await submitDiary(diary.id)
            } else if (confirmAction === 'sign_contractor') {
                result = await signDiary(diary.id, 'CONTRACTOR')
            } else {
                result = await signDiary(diary.id, 'INSPECTION')
            }

            if (result?.error) {
                toast.error(typeof result.error === 'string' ? result.error : 'Erro')
            } else {
                const msg = confirmAction === 'submit' ? 'Diário submetido!' : 'Diário assinado!'
                toast.success(msg)
                router.refresh()
            }
            setConfirmAction(null)
        })
    }

    const actionLabels = {
        submit: { title: 'Submeter diário?', desc: 'Após submeter, o diário não poderá mais ser editado.', btn: 'Submeter' },
        sign_contractor: { title: 'Assinar como Prestadora?', desc: 'Confirma a assinatura da prestadora neste diário.', btn: 'Assinar' },
        sign_inspection: { title: 'Assinar como Fiscalização?', desc: 'Confirma a assinatura da fiscalização neste diário.', btn: 'Assinar' },
    }

    return (
        <div className="space-y-6">
            {/* Header com ações */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <DiaryStatusBadge status={diary.status} />
                    <h1 className="text-xl font-bold">
                        Diário de Obra — {formatDate(diary.entryDate)}
                    </h1>
                </div>
                <div className="flex items-center gap-2">
                    <ExportDiaryPdfButton diary={diary} />

                    {diary.status === 'DRAFT' && (
                        <>
                            <Button variant="outline" asChild>
                                <Link href={`/${slug}/site-diary/${diary.id}/edit`}>
                                    <Edit2 className="mr-2 h-4 w-4" />
                                    Editar
                                </Link>
                            </Button>
                            <Button onClick={() => setConfirmAction('submit')}>
                                <Send className="mr-2 h-4 w-4" />
                                Submeter
                            </Button>
                        </>
                    )}

                    {diary.status === 'SUBMITTED' && (
                        <Button onClick={() => setConfirmAction('sign_contractor')}>
                            <PenTool className="mr-2 h-4 w-4" />
                            Assinar Prestadora
                        </Button>
                    )}

                    {diary.status === 'CONTRACTOR_SIGNED' && (
                        <Button onClick={() => setConfirmAction('sign_inspection')}>
                            <PenTool className="mr-2 h-4 w-4" />
                            Assinar Fiscalização
                        </Button>
                    )}
                </div>
            </div>

            {/* Info geral */}
            <Card>
                <CardHeader>
                    <CardTitle>Informações Gerais</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                        <InfoItem label="Obra" value={diary.projectName} />
                        <InfoItem label="Data" value={formatDate(diary.entryDate)} />
                        <InfoItem label="N. Ordem de Serviço" value={diary.orderNumber} />
                        <InfoItem label="Prestadora" value={diary.contractorName} />
                        <InfoItem label="Ref. Diagrama de Rede" value={diary.networkDiagramRef} />
                        <InfoItem label="Engenheiro" value={diary.engineerName} />
                        <InfoItem label="Encarregado" value={diary.foremanName} />
                        <div>
                            <span className="text-muted-foreground">Clima</span>
                            <div className="flex items-center gap-1.5 mt-0.5">
                                <WeatherIcon className="h-4 w-4" />
                                <span>{weather.label}</span>
                            </div>
                        </div>
                        <InfoItem label="Total de Horas" value={diary.totalHours ? `${diary.totalHours}h` : null} />
                        {diary.workSuspended && (
                            <div>
                                <Badge variant="destructive">Trabalho Suspenso</Badge>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Mão de Obra */}
            {diary.laborEntries.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Mão de Obra</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>#</TableHead>
                                    <TableHead>Função</TableHead>
                                    <TableHead className="text-center">Quantidade</TableHead>
                                    <TableHead className="text-center">Horas</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {diary.laborEntries.map((e, i) => (
                                    <TableRow key={e.id}>
                                        <TableCell className="text-muted-foreground">{i + 1}</TableCell>
                                        <TableCell>{e.role}</TableCell>
                                        <TableCell className="text-center">{e.quantity}</TableCell>
                                        <TableCell className="text-center">{e.hours}h</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            )}

            {/* Equipamentos */}
            {diary.equipmentEntries.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Equipamentos</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>#</TableHead>
                                    <TableHead>Descrição</TableHead>
                                    <TableHead className="text-center">Quantidade</TableHead>
                                    <TableHead>Observação</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {diary.equipmentEntries.map((e, i) => (
                                    <TableRow key={e.id}>
                                        <TableCell className="text-muted-foreground">{i + 1}</TableCell>
                                        <TableCell>{e.description}</TableCell>
                                        <TableCell className="text-center">{e.quantity}</TableCell>
                                        <TableCell className="text-muted-foreground">{e.notes || '—'}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            )}

            {/* Serviços Executados */}
            {diary.servicesExecuted.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Serviços Executados</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>#</TableHead>
                                    <TableHead>Descrição</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {diary.servicesExecuted.map((e, i) => (
                                    <TableRow key={e.id}>
                                        <TableCell className="text-muted-foreground">{i + 1}</TableCell>
                                        <TableCell>{e.description}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            )}

            {/* Observações */}
            {diary.observations.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Observações / Recomendações</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {diary.observations.map((obs) => (
                            <div key={obs.id} className="flex gap-3 items-start">
                                <Badge variant="outline" className="shrink-0 mt-0.5">
                                    {originLabels[obs.origin] ?? obs.origin}
                                </Badge>
                                <p className="text-sm">{obs.text}</p>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            )}

            {/* Liberações / Assinaturas */}
            {diary.releases.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Liberações</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Etapa</TableHead>
                                    <TableHead>Data</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {diary.releases.map((r) => (
                                    <TableRow key={r.id}>
                                        <TableCell>
                                            <Badge variant="default">
                                                {r.stage === 'CONTRACTOR' ? 'Prestadora' : 'Fiscalização'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            {r.signedAt
                                                ? new Intl.DateTimeFormat('pt-BR', {
                                                      dateStyle: 'short',
                                                      timeStyle: 'short',
                                                  }).format(new Date(r.signedAt))
                                                : '—'}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            )}

            {/* Confirm dialog */}
            <AlertDialog open={!!confirmAction} onOpenChange={(open) => !open && setConfirmAction(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            {confirmAction && actionLabels[confirmAction].title}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            {confirmAction && actionLabels[confirmAction].desc}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isPending}>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleAction} disabled={isPending}>
                            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {confirmAction && actionLabels[confirmAction].btn}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
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
