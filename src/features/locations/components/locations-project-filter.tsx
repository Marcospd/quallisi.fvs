'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { X, Building2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface LocationsProjectFilterProps {
    projectName: string
}

export function LocationsProjectFilter({ projectName }: LocationsProjectFilterProps) {
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()

    function handleClear() {
        const params = new URLSearchParams(searchParams.toString())
        params.delete('projectId')
        params.delete('page')
        router.push(`${pathname}?${params.toString()}`)
    }

    return (
        <div className="flex items-center gap-2">
            <Badge variant="secondary" className="gap-1.5 py-1.5 px-3 text-sm">
                <Building2 className="h-3.5 w-3.5" />
                Filtrando por: {projectName}
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-4 w-4 ml-1 hover:bg-transparent"
                    onClick={handleClear}
                    title="Remover filtro"
                >
                    <X className="h-3 w-3" />
                </Button>
            </Badge>
        </div>
    )
}
