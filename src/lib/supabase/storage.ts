import { createClient } from './client'
import { logger } from '@/lib/logger'

const BUCKET = 'inspection-photos'

/** Extensões de imagem permitidas */
const ALLOWED_EXTENSIONS = new Set(['jpg', 'jpeg', 'png', 'webp', 'heic', 'heif'])
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

/**
 * Faz upload de uma foto de inspeção para o Supabase Storage.
 * Retorna a URL pública da imagem.
 * Valida tipo de arquivo e tamanho.
 *
 * Path: inspection-photos/{inspectionId}/{itemId}_{timestamp}.{ext}
 */
export async function uploadInspectionPhoto(
    file: File,
    inspectionId: string,
    itemId: string
): Promise<{ url: string } | { error: string }> {
    // Validar tamanho
    if (file.size > MAX_FILE_SIZE) {
        return { error: 'Arquivo muito grande. Máximo 10MB.' }
    }

    // Extrair e validar extensão
    const rawExt = file.name.split('.').pop()?.toLowerCase() || ''
    const ext = rawExt.replace(/[^a-z0-9]/g, '') // sanitizar
    if (!ALLOWED_EXTENSIONS.has(ext)) {
        return { error: 'Tipo de arquivo não permitido. Use JPG, PNG ou WebP.' }
    }

    // Validar MIME type
    if (!file.type.startsWith('image/')) {
        return { error: 'Apenas imagens são permitidas.' }
    }

    const supabase = createClient()
    const path = `${inspectionId}/${itemId}_${Date.now()}.${ext}`

    const { error } = await supabase.storage
        .from(BUCKET)
        .upload(path, file, {
            cacheControl: '3600',
            upsert: false,
        })

    if (error) {
        logger.error({ error, inspectionId, itemId }, 'Upload error')
        return { error: 'Erro ao enviar foto' }
    }

    const { data: urlData } = supabase.storage
        .from(BUCKET)
        .getPublicUrl(path)

    return { url: urlData.publicUrl }
}

/**
 * Remove uma foto do Supabase Storage pelo path extraído da URL.
 * Valida que o path pertence ao bucket esperado.
 */
export async function deleteInspectionPhoto(photoUrl: string): Promise<{ error?: string }> {
    const supabase = createClient()

    // Extrair path da URL pública
    const bucketUrl = `/storage/v1/object/public/${BUCKET}/`
    const idx = photoUrl.indexOf(bucketUrl)
    if (idx === -1) return { error: 'URL inválida' }

    const path = photoUrl.slice(idx + bucketUrl.length)

    // Validar que o path não contém traversal
    if (path.includes('..') || path.startsWith('/')) {
        return { error: 'URL inválida' }
    }

    const { error } = await supabase.storage
        .from(BUCKET)
        .remove([path])

    if (error) {
        logger.error({ error, path }, 'Delete error')
        return { error: 'Erro ao remover foto' }
    }

    return {}
}
