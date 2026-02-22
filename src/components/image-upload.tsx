'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { ImagePlus, X, Loader2 } from 'lucide-react'
import Image from 'next/image'

interface ImageUploadProps {
    value?: string | null
    onChange: (base64OrUrl: string | null) => void
    disabled?: boolean
}

/**
 * Componente amigável para selecionar uma foto.
 * Exibe o preview da imagem e retorna em Base64 o arquivo, ou limpa (null).
 */
export function ImageUpload({ value, onChange, disabled }: ImageUploadProps) {
    const [isHovering, setIsHovering] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        const reader = new FileReader()
        reader.onloadend = () => {
            const base64String = reader.result as string
            onChange(base64String)
        }
        reader.readAsDataURL(file)
    }

    const triggerSelect = () => {
        if (!disabled) fileInputRef.current?.click()
    }

    const clearImage = (e: React.MouseEvent) => {
        e.stopPropagation() // Não dar trigger no seleto se clicar em remover
        if (!disabled) {
            onChange(null)
            if (fileInputRef.current) fileInputRef.current.value = ''
        }
    }

    return (
        <div className="flex flex-col items-start gap-4">
            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/jpeg, image/png, image/webp"
                onChange={handleFileChange}
                disabled={disabled}
            />

            <div
                className={`group relative flex h-40 w-full cursor-pointer flex-col items-center justify-center overflow-hidden rounded-xl border-2 border-dashed transition-all
                    ${disabled ? 'cursor-not-allowed opacity-60' : 'hover:border-primary'}
                    ${value ? 'border-primary/50' : 'border-muted-foreground/25 bg-muted/20'}
                `}
                onClick={triggerSelect}
                onMouseEnter={() => setIsHovering(true)}
                onMouseLeave={() => setIsHovering(false)}
            >
                {value ? (
                    <>
                        {/* Imagem */}
                        <Image
                            src={value}
                            alt="Capa da Obra"
                            fill
                            sizes="(max-width: 768px) 100vw, 300px"
                            className="object-cover transition-transform group-hover:scale-105"
                        />
                        {/* Overlay e botão de remover */}
                        <div className={`absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity ${isHovering ? 'opacity-100' : 'opacity-0'}`}>
                            <p className="text-white text-sm font-medium mr-2">Trocar</p>
                        </div>

                        <Button
                            type="button"
                            size="icon"
                            variant="destructive"
                            className="absolute right-2 top-2 h-7 w-7 rounded-full opacity-80 hover:opacity-100"
                            onClick={clearImage}
                            disabled={disabled}
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </>
                ) : (
                    <div className="flex flex-col items-center justify-center text-muted-foreground transition-colors group-hover:text-primary">
                        <ImagePlus className="mb-2 h-8 w-8" />
                        <span className="text-sm font-medium">Adicionar capa</span>
                        <span className="text-xs opacity-70 mt-1">JPEG, PNG ou WEBP</span>
                    </div>
                )}
            </div>
        </div>
    )
}
