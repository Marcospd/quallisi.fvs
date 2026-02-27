'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'

const STATUS_OPTIONS = [
    { value: 'all', label: 'Todos os status' },
    { value: 'OPEN', label: 'Abertas' },
    { value: 'IN_PROGRESS', label: 'Em andamento' },
    { value: 'RESOLVED', label: 'Resolvidas' },
    { value: 'CANCELLED', label: 'Canceladas' },
]

interface IssuesFilterProps {
    selectedStatus?: string
}

export function IssuesFilter({ selectedStatus }: IssuesFilterProps) {
    const router = useRouter()
    const searchParams = useSearchParams()

    function handleStatusChange(value: string) {
        const params = new URLSearchParams(searchParams.toString())
        if (value === 'all') {
            params.delete('status')
        } else {
            params.set('status', value)
        }
        router.push(`?${params.toString()}`)
    }

    return (
        <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">Filtrar por status:</span>
            <Select
                value={selectedStatus ?? 'all'}
                onValueChange={handleStatusChange}
            >
                <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Todos os status" />
                </SelectTrigger>
                <SelectContent>
                    {STATUS_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    )
}
