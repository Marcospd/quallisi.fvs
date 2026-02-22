'use client'

import { Search, X } from 'lucide-react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'

import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

export function DataTableSearch({ placeholder = 'Buscar resultados...' }: { placeholder?: string }) {
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()

    const initialQuery = searchParams.get('q') || ''
    const [query, setQuery] = useState(initialQuery)

    // Debounce effect para não fazer push de router em todo typer keystroke
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            const params = new URLSearchParams(searchParams.toString())
            if (query) {
                params.set('q', query)
                params.set('page', '1') // reseta paginacao apos buscar algo
            } else {
                params.delete('q')
            }
            router.push(`${pathname}?${params.toString()}`)
        }, 300)

        return () => clearTimeout(timeoutId)
    }, [query, pathname, router, searchParams])


    return (
        <div className="relative w-full max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
                placeholder={placeholder}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-8 pr-10"
            />
            {query && (
                <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-9 w-9 text-muted-foreground hover:text-foreground"
                    onClick={() => setQuery('')}
                >
                    <X className="h-4 w-4" />
                    <span className="sr-only">Limpar busca</span>
                </Button>
            )}
        </div>
    )
}
