'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'
import { TableHead } from '@/components/ui/table'
import { cn } from '@/lib/utils'

interface DataTableSortHeaderProps {
    column: string
    children: React.ReactNode
    className?: string
}

/**
 * Cabeçalho de tabela clicável para ordenação via URL params.
 * Cicla entre: asc → desc → sem ordenação.
 */
export function DataTableSortHeader({ column, children, className }: DataTableSortHeaderProps) {
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()

    const currentSort = searchParams.get('sort')
    const currentOrder = searchParams.get('order') || 'asc'
    const isActive = currentSort === column

    function handleSort() {
        const params = new URLSearchParams(searchParams.toString())

        if (isActive && currentOrder === 'asc') {
            params.set('sort', column)
            params.set('order', 'desc')
        } else if (isActive && currentOrder === 'desc') {
            params.delete('sort')
            params.delete('order')
        } else {
            params.set('sort', column)
            params.set('order', 'asc')
        }

        params.set('page', '1')
        router.push(`${pathname}?${params.toString()}`)
    }

    return (
        <TableHead className={className}>
            <button
                type="button"
                onClick={handleSort}
                className={cn(
                    'flex items-center gap-1 rounded px-1 py-0.5 -ml-1 transition-colors hover:text-foreground',
                    isActive && 'text-foreground'
                )}
            >
                {children}
                {isActive ? (
                    currentOrder === 'asc'
                        ? <ArrowUp className="h-3.5 w-3.5" />
                        : <ArrowDown className="h-3.5 w-3.5" />
                ) : (
                    <ArrowUpDown className="h-3.5 w-3.5 opacity-40" />
                )}
            </button>
        </TableHead>
    )
}
