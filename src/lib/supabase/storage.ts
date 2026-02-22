import { createClient } from './client'

const BUCKET = 'inspection-photos'

/**
 * Faz upload de uma foto de inspeção para o Supabase Storage.
 * Retorna a URL pública da imagem.
 *
 * Path: inspection-photos/{inspectionId}/{itemId}_{timestamp}.{ext}
 */
export async function uploadInspectionPhoto(
    file: File,
    inspectionId: string,
    itemId: string
): Promise<{ url: string } | { error: string }> {
    const supabase = createClient()

    const ext = file.name.split('.').pop() || 'jpg'
    const path = `${inspectionId}/${itemId}_${Date.now()}.${ext}`

    const { error } = await supabase.storage
        .from(BUCKET)
        .upload(path, file, {
            cacheControl: '3600',
            upsert: false,
        })

    if (error) {
        console.error('Upload error:', error)
        return { error: 'Erro ao enviar foto' }
    }

    const { data: urlData } = supabase.storage
        .from(BUCKET)
        .getPublicUrl(path)

    return { url: urlData.publicUrl }
}

/**
 * Remove uma foto do Supabase Storage pelo path extraído da URL.
 */
export async function deleteInspectionPhoto(photoUrl: string): Promise<{ error?: string }> {
    const supabase = createClient()

    // Extrair path da URL pública
    const bucketUrl = `/storage/v1/object/public/${BUCKET}/`
    const idx = photoUrl.indexOf(bucketUrl)
    if (idx === -1) return { error: 'URL inválida' }

    const path = photoUrl.slice(idx + bucketUrl.length)

    const { error } = await supabase.storage
        .from(BUCKET)
        .remove([path])

    if (error) {
        console.error('Delete error:', error)
        return { error: 'Erro ao remover foto' }
    }

    return {}
}
