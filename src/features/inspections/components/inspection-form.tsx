'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check, X, Minus, Loader2, CheckCircle2, AlertTriangle, Send, Camera, Trash2 } from 'lucide-react'
import { evaluateItem, completeInspection, updateItemPhoto } from '../actions'
import { uploadInspectionPhoto } from '@/lib/supabase/storage'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { toast } from 'sonner'

interface CriterionItem {
    item: {
        id: string
        inspectionId: string
        criterionId: string
        evaluation: string | null
        notes: string | null
        photoUrl: string | null
        createdAt: Date | null
    }
    criterion: {
        id: string
        serviceId: string
        description: string
        sortOrder: number
        active: boolean
        createdAt: Date | null
    }
}

interface InspectionData {
    inspection: {
        id: string
        status: string
        result: string | null
        referenceMonth: string
        notes: string | null
        completedAt: Date | null
    }
    project: { id: string; name: string }
    service: { id: string; name: string }
    location: { id: string; name: string }
    inspector: { id: string; name: string }
    items: CriterionItem[]
}

type Evaluation = 'C' | 'NC' | 'NA'

const evaluationConfig: Record<Evaluation, { label: string; color: string; icon: React.ElementType }> = {
    C: { label: 'Conforme', color: 'bg-emerald-500 hover:bg-emerald-600 text-white', icon: Check },
    NC: { label: 'Não Conforme', color: 'bg-red-500 hover:bg-red-600 text-white', icon: X },
    NA: { label: 'N/A', color: 'bg-gray-400 hover:bg-gray-500 text-white', icon: Minus },
}

interface InspectionFormProps {
    data: InspectionData
    tenantSlug: string
}

/**
 * Formulário de avaliação FVS.
 * Inspetor marca cada critério como C (Conforme), NC (Não Conforme) ou NA (Não Aplicável).
 */
export function InspectionForm({ data, tenantSlug }: InspectionFormProps) {
    const router = useRouter()
    const [items, setItems] = useState(data.items)
    const [evaluatingId, setEvaluatingId] = useState<string | null>(null)
    const [completing, setCompleting] = useState(false)
    const [notesMap, setNotesMap] = useState<Record<string, string>>(
        Object.fromEntries(data.items.map((i) => [i.item.id, i.item.notes || '']))
    )
    const [uploadingId, setUploadingId] = useState<string | null>(null)

    const isCompleted = data.inspection.status === 'COMPLETED'
    const evaluatedCount = items.filter((i) => i.item.evaluation).length
    const totalCount = items.length
    const ncCount = items.filter((i) => i.item.evaluation === 'NC').length
    const progress = totalCount > 0 ? Math.round((evaluatedCount / totalCount) * 100) : 0

    async function handleEvaluate(itemId: string, evaluation: Evaluation) {
        setEvaluatingId(itemId)
        try {
            const result = await evaluateItem(itemId, evaluation, notesMap[itemId] || undefined)
            if (result.error) {
                toast.error(typeof result.error === 'string' ? result.error : 'Erro')
            } else {
                setItems((prev) =>
                    prev.map((i) =>
                        i.item.id === itemId
                            ? { ...i, item: { ...i.item, evaluation, notes: notesMap[itemId] || null } }
                            : i
                    )
                )
            }
        } catch {
            toast.error('Erro ao registrar avaliação')
        } finally {
            setEvaluatingId(null)
        }
    }

    async function handlePhotoUpload(itemId: string, file: File) {
        setUploadingId(itemId)
        try {
            const result = await uploadInspectionPhoto(file, data.inspection.id, itemId)
            if ('error' in result) {
                toast.error(result.error)
                return
            }

            const saveResult = await updateItemPhoto(itemId, result.url)
            if (saveResult.error) {
                toast.error(typeof saveResult.error === 'string' ? saveResult.error : 'Erro')
                return
            }

            setItems((prev) =>
                prev.map((i) =>
                    i.item.id === itemId
                        ? { ...i, item: { ...i.item, photoUrl: result.url } }
                        : i
                )
            )
            toast.success('Foto anexada')
        } catch {
            toast.error('Erro ao enviar foto')
        } finally {
            setUploadingId(null)
        }
    }

    async function handlePhotoRemove(itemId: string) {
        setUploadingId(itemId)
        try {
            const saveResult = await updateItemPhoto(itemId, null)
            if (saveResult.error) {
                toast.error(typeof saveResult.error === 'string' ? saveResult.error : 'Erro')
                return
            }

            setItems((prev) =>
                prev.map((i) =>
                    i.item.id === itemId
                        ? { ...i, item: { ...i.item, photoUrl: null } }
                        : i
                )
            )
            toast.success('Foto removida')
        } catch {
            toast.error('Erro ao remover foto')
        } finally {
            setUploadingId(null)
        }
    }

    async function handleComplete() {
        setCompleting(true)
        try {
            const result = await completeInspection(data.inspection.id)
            if (result.error) {
                toast.error(typeof result.error === 'string' ? result.error : 'Erro')
            } else {
                toast.success(
                    result.data?.result === 'APPROVED'
                        ? 'Inspeção aprovada!'
                        : `Inspeção concluída — ${ncCount} pendência${ncCount > 1 ? 's' : ''} criada${ncCount > 1 ? 's' : ''} automaticamente`
                )
                router.refresh()
            }
        } catch {
            toast.error('Erro ao finalizar inspeção')
        } finally {
            setCompleting(false)
        }
    }

    return (
        <div className="space-y-6">
            {/* Cabeçalho da inspeção */}
            <Card>
                <CardContent className="pt-6">
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        <div>
                            <p className="text-xs text-muted-foreground">Obra</p>
                            <p className="font-semibold">{data.project.name}</p>
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground">Serviço</p>
                            <p className="font-medium">{data.service.name}</p>
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground">Local</p>
                            <p className="font-medium">{data.location.name}</p>
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground">Inspetor</p>
                            <p className="font-medium">{data.inspector.name}</p>
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground">Mês Ref.</p>
                            <p className="font-medium">{data.inspection.referenceMonth}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Barra de progresso */}
            <Card>
                <CardContent className="pt-6">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">
                            Progresso: {evaluatedCount}/{totalCount} critérios avaliados
                        </span>
                        <div className="flex items-center gap-2">
                            {ncCount > 0 && (
                                <Badge variant="destructive" className="text-xs">
                                    <AlertTriangle className="mr-1 h-3 w-3" />
                                    {ncCount} NC
                                </Badge>
                            )}
                            <span className="text-sm text-muted-foreground">{progress}%</span>
                        </div>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2.5">
                        <div
                            className={`h-2.5 rounded-full transition-all duration-300 ${progress === 100
                                    ? ncCount > 0
                                        ? 'bg-red-500'
                                        : 'bg-emerald-500'
                                    : 'bg-primary'
                                }`}
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Lista de critérios para avaliação */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Critérios de Verificação</CardTitle>
                </CardHeader>
                <Separator />
                <CardContent className="pt-4 space-y-3">
                    {items.map((item, index) => {
                        const isEvaluating = evaluatingId === item.item.id
                        const currentEval = item.item.evaluation as Evaluation | null

                        return (
                            <div
                                key={item.item.id}
                                className={`rounded-lg border p-4 transition-colors ${currentEval === 'NC'
                                        ? 'border-red-200 bg-red-50/50 dark:border-red-900 dark:bg-red-950/20'
                                        : currentEval === 'C'
                                            ? 'border-emerald-200 bg-emerald-50/50 dark:border-emerald-900 dark:bg-emerald-950/20'
                                            : currentEval === 'NA'
                                                ? 'border-gray-200 bg-gray-50/50 dark:border-gray-800 dark:bg-gray-900/20'
                                                : 'border-border'
                                    }`}
                            >
                                <div className="flex items-start gap-3">
                                    <span className="text-sm font-bold text-muted-foreground mt-0.5 w-6 shrink-0">
                                        {index + 1}.
                                    </span>
                                    <div className="flex-1 space-y-3">
                                        <p className="text-sm font-medium">{item.criterion.description}</p>

                                        {/* Botões de avaliação */}
                                        <div className="flex items-center gap-2">
                                            {(Object.entries(evaluationConfig) as [Evaluation, typeof evaluationConfig['C']][]).map(
                                                ([evalKey, config]) => {
                                                    const Icon = config.icon
                                                    const isActive = currentEval === evalKey

                                                    return (
                                                        <Button
                                                            key={evalKey}
                                                            variant={isActive ? 'default' : 'outline'}
                                                            size="sm"
                                                            disabled={isEvaluating || isCompleted}
                                                            className={isActive ? config.color : ''}
                                                            onClick={() => handleEvaluate(item.item.id, evalKey)}
                                                        >
                                                            {isEvaluating ? (
                                                                <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
                                                            ) : (
                                                                <Icon className="mr-1 h-3.5 w-3.5" />
                                                            )}
                                                            {config.label}
                                                        </Button>
                                                    )
                                                }
                                            )}
                                        </div>

                                        {/* Campo de observação */}
                                        {(currentEval === 'NC' || notesMap[item.item.id]) && (
                                            <Input
                                                placeholder="Observação (obrigatório para NC)"
                                                value={notesMap[item.item.id] || ''}
                                                onChange={(e) =>
                                                    setNotesMap((prev) => ({
                                                        ...prev,
                                                        [item.item.id]: e.target.value,
                                                    }))
                                                }
                                                disabled={isCompleted}
                                                className="text-sm"
                                            />
                                        )}

                                        {/* Foto */}
                                        <div className="flex items-center gap-2">
                                            {item.item.photoUrl ? (
                                                <div className="flex items-center gap-2">
                                                    <a
                                                        href={item.item.photoUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-xs text-primary hover:underline flex items-center gap-1"
                                                    >
                                                        <Camera className="h-3.5 w-3.5" />
                                                        Ver foto
                                                    </a>
                                                    {!isCompleted && (
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-7 px-2 text-xs text-destructive"
                                                            disabled={uploadingId === item.item.id}
                                                            onClick={() => handlePhotoRemove(item.item.id)}
                                                        >
                                                            <Trash2 className="h-3 w-3 mr-1" />
                                                            Remover
                                                        </Button>
                                                    )}
                                                </div>
                                            ) : !isCompleted && (
                                                <label className="cursor-pointer">
                                                    <input
                                                        type="file"
                                                        accept="image/*"
                                                        capture="environment"
                                                        className="hidden"
                                                        disabled={uploadingId === item.item.id}
                                                        onChange={(e) => {
                                                            const file = e.target.files?.[0]
                                                            if (file) handlePhotoUpload(item.item.id, file)
                                                            e.target.value = ''
                                                        }}
                                                    />
                                                    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors">
                                                        {uploadingId === item.item.id ? (
                                                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                                        ) : (
                                                            <Camera className="h-3.5 w-3.5" />
                                                        )}
                                                        {uploadingId === item.item.id ? 'Enviando...' : 'Anexar foto'}
                                                    </span>
                                                </label>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </CardContent>
            </Card>

            {/* Botão de finalizar */}
            {!isCompleted && (
                <div className="flex justify-end">
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button
                                size="lg"
                                disabled={evaluatedCount < totalCount || completing}
                            >
                                {completing ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Finalizando...
                                    </>
                                ) : (
                                    <>
                                        <Send className="mr-2 h-4 w-4" />
                                        Finalizar Inspeção
                                    </>
                                )}
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Finalizar inspeção?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    {ncCount > 0
                                        ? `${ncCount} critério${ncCount > 1 ? 's' : ''} não conforme${ncCount > 1 ? 's' : ''} — ${ncCount > 1 ? 'serão geradas pendências' : 'será gerada uma pendência'} automaticamente para acompanhamento. Esta ação não pode ser desfeita.`
                                        : 'Todos os critérios estão conformes. A inspeção será marcada como APROVADA. Esta ação não pode ser desfeita.'
                                    }
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={handleComplete}>
                                    <CheckCircle2 className="mr-2 h-4 w-4" />
                                    Confirmar
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
            )}

            {/* Resultado final */}
            {isCompleted && data.inspection.result && (
                <Card className={
                    data.inspection.result === 'APPROVED'
                        ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20'
                        : 'border-amber-500 bg-amber-50/50 dark:bg-amber-950/20'
                }>
                    <CardContent className="pt-6 flex items-center gap-3">
                        {data.inspection.result === 'APPROVED' ? (
                            <CheckCircle2 className="h-8 w-8 text-emerald-600" />
                        ) : (
                            <AlertTriangle className="h-8 w-8 text-amber-600" />
                        )}
                        <div>
                            <p className="font-bold text-lg">
                                {data.inspection.result === 'APPROVED'
                                    ? 'Inspeção Aprovada'
                                    : 'Inspeção Concluída com Pendências'
                                }
                            </p>
                            <p className="text-sm text-muted-foreground">
                                {data.inspection.result === 'APPROVED'
                                    ? 'Todos os critérios foram avaliados como conformes'
                                    : `${ncCount} pendência${ncCount > 1 ? 's' : ''} ${ncCount > 1 ? 'foram criadas' : 'foi criada'} automaticamente para resolução`
                                }
                            </p>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
