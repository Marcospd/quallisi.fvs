import pino from 'pino'

/**
 * Logger estruturado com Pino.
 * Sempre incluir companyId e userId no contexto.
 * 
 * Exemplo de uso:
 *   logger.info({ companyId, userId, action: 'entidade.created' }, 'Entidade criada')
 *   logger.error({ err, companyId }, 'Falha ao criar entidade')
 * 
 * NUNCA logar: senha, token, CPF, cartão, chave de API.
 */
export const logger = pino({
    level: process.env.LOG_LEVEL || 'info',
    transport:
        process.env.NODE_ENV === 'development'
            ? {
                target: 'pino-pretty',
                options: {
                    colorize: true,
                    translateTime: 'SYS:dd/mm/yyyy HH:MM:ss',
                    ignore: 'pid,hostname',
                },
            }
            : undefined,
})
