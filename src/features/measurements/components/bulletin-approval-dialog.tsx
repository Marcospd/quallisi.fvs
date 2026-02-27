'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'

import { approveBulletin } from '../actions'

const stageLabels: Record<string, string> = {
    PLANNING: 'Planejamento',
    MANAGEMENT: 'Gerência',
    CONTRACTOR: 'Empreiteira',
}

interface BulletinApprovalDialogProps {
    bulletinId: string
    stage: string
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function BulletinApprovalDialog({ bulletinId, stage, open, onOpenChange }: BulletinApprovalDialogProps) {
    const router = useRouter()
    const [isPending, startTransition] = useTransition()
    const [notes, setNotes] = useState('')

    function handleAction(action: 'APPROVED' | 'REJECTED') {
        startTransition(async () => {
            const result = await approveBulletin(bulletinId, { stage, action, notes })
            if (result?.error) {
                toast.error(typeof result.error === 'string' ? result.error : 'Erro ao processar')
            } else {
                const label = action === 'APPROVED' ? 'aprovado' : 'rejeitado'
                toast.success(`Boletim ${label} com sucesso!`)
                router.refresh()
            }
            onOpenChange(false)
            setNotes('')
        })
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Aprovação — {stageLabels[stage] ?? stage}</DialogTitle>
                    <DialogDescription>
                        Aprovar ou rejeitar o boletim de medição na etapa de {(stageLabels[stage] ?? stage).toLowerCase()}.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-3">
                    <div className="space-y-2">
                        <Label>Observações (opcional)</Label>
                        <Textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Motivo da aprovação/rejeição..."
                            rows={3}
                        />
                    </div>
                </div>

                <DialogFooter className="gap-2">
                    <Button
                        variant="destructive"
                        onClick={() => handleAction('REJECTED')}
                        disabled={isPending}
                    >
                        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Rejeitar
                    </Button>
                    <Button
                        onClick={() => handleAction('APPROVED')}
                        disabled={isPending}
                    >
                        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Aprovar
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
