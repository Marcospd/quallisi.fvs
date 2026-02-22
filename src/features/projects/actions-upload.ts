'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { getAuthContext } from '@/features/auth/actions'
import { logger } from '@/lib/logger'

/**
 * Faz upload de uma imagem pública para o bucket `project-covers`.
 * Retorna a URL pública do arquivo recém salvo.
 */
export async function uploadProjectCover(fileData: string, fileName: string, contentType: string) {
    const { user, tenant } = await getAuthContext()

    if (user.role !== 'admin') {
        return { error: 'Sem permissão para upload' }
    }

    try {
        const admin = createAdminClient()
        // fileData expected to be base64. Convert back to Buffer to upload
        const buffer = Buffer.from(fileData.split(',')[1], 'base64')

        // Caminho único por construtora/arquivo (evitar colisões): {tenant_id}/{time}_{filename}
        const filePath = `${tenant.id}/${Date.now()}_${fileName}`

        const { data, error } = await admin.storage
            .from('project-covers')
            .upload(filePath, buffer, {
                contentType,
                upsert: true,
            })

        if (error) {
            logger.error({ err: error, tenantId: tenant.id }, 'Erro ao subir arquivo no Supabase Storage')
            return { error: 'Falha ao enviar arquivo' }
        }

        // Recuperar a URL pública gerada
        const { data: publicUrlData } = admin.storage
            .from('project-covers')
            .getPublicUrl(data.path)

        return { url: publicUrlData.publicUrl }
    } catch (err) {
        logger.error({ err, tenantId: tenant.id }, 'Erro interno no upload de capa')
        return { error: 'Erro de upload' }
    }
}
