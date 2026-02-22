import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

/**
 * Middleware principal do Next.js.
 * Atualiza a sessão Supabase em cada request.
 */
export async function middleware(request: NextRequest) {
    return await updateSession(request)
}

export const config = {
    matcher: [
        /*
         * Aplica o middleware em todas as rotas EXCETO:
         * - _next/static (arquivos estáticos)
         * - _next/image (otimização de imagens)
         * - favicon.ico (ícone do navegador)
         * - Arquivos de imagem (.svg, .png, .jpg, etc.)
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
