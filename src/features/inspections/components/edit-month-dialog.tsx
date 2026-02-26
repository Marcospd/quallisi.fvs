'use client'

import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { updateInspectionMonth } from '../actions'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'

interface EditMonthDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    inspectionId: string
    currentMonth: string
    onSuccess: () => void
}

/**
 * Dialog para editar o mês de vigência de uma inspeção agendada.
 */
export function EditMonthDialog({
    open,
    onOpenChange,
    inspectionId,
    currentMonth,
    onSuccess,
}: EditMonthDialogProps) {
    const [month, setMonth] = useState(currentMonth)
    const [isPending, setIsPending] = useState(false)

    async function handleSave() {
        if (!month) {
            toast.error('Selecione um mês')
            return
        }

        setIsPending(true)
        try {
            const result = await updateInspectionMonth(inspectionId, month)
            if (result.error) {
                toast.error(result.error)
            } else {
                toast.success('Vigência atualizada')
                onOpenChange(false)
                onSuccess()
            }
        } catch {
            toast.error('Erro ao atualizar vigência')
        } finally {
            setIsPending(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Editar Vigência</DialogTitle>
                    <DialogDescription>
                        Altere o mês/ano em que esta inspeção deve ser realizada
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label>Mês de Vigência</Label>
                        <Input
                            type="month"
                            value={month}
                            onChange={(e) => setMonth(e.target.value)}
                        />
                    </div>

                    <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => onOpenChange(false)}>
                            Cancelar
                        </Button>
                        <Button onClick={handleSave} disabled={isPending || !month}>
                            {isPending ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Salvando...
                                </>
                            ) : (
                                'Salvar'
                            )}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
