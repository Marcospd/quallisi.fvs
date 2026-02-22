import { Resend } from 'resend'
import { logger } from '@/lib/logger'

let resend: Resend | null = null

function getResend(): Resend | null {
    if (!process.env.RESEND_API_KEY) return null
    if (!resend) {
        resend = new Resend(process.env.RESEND_API_KEY)
    }
    return resend
}

const FROM_EMAIL = 'Quallisy FVS <noreply@quallisy.com>'

interface SendEmailParams {
    to: string
    subject: string
    html: string
}

/**
 * Envia e-mail via Resend.
 * Se RESEND_API_KEY não estiver configurada, loga e retorna sem erro.
 */
export async function sendEmail({ to, subject, html }: SendEmailParams) {
    const client = getResend()
    if (!client) {
        logger.warn({ to, subject }, 'RESEND_API_KEY não configurada — e-mail não enviado')
        return { data: null }
    }

    try {
        const result = await client.emails.send({
            from: FROM_EMAIL,
            to,
            subject,
            html,
        })

        logger.info({ to, subject, id: result.data?.id }, 'E-mail enviado')
        return { data: result.data }
    } catch (err) {
        logger.error({ err, to, subject }, 'Erro ao enviar e-mail')
        return { error: 'Erro ao enviar e-mail' }
    }
}
