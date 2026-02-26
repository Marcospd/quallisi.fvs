/**
 * Templates de e-mail em HTML simples.
 * Sem dependência de libs de template — HTML inline para máxima compatibilidade.
 */

function baseTemplate(content: string): string {
    return `
<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f4f4f5; padding: 20px;">
    <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; padding: 32px; border: 1px solid #e4e4e7;">
        ${content}
        <hr style="border: none; border-top: 1px solid #e4e4e7; margin: 24px 0;">
        <p style="font-size: 12px; color: #71717a; text-align: center;">
            Quallisy FVS — Controle de Qualidade
        </p>
    </div>
</body>
</html>`
}

export function inspectionCompletedEmail(params: {
    inspectorName: string
    serviceName: string
    locationName: string
    result: string
    link: string
}): { subject: string; html: string } {
    const isApproved = params.result === 'APPROVED'
    const hasRestrictions = params.result === 'APPROVED_WITH_RESTRICTIONS'
    const resultLabel = isApproved ? 'APROVADA' : hasRestrictions ? 'COM PENDÊNCIAS' : 'REPROVADA'
    const color = isApproved ? '#16a34a' : hasRestrictions ? '#d97706' : '#dc2626'

    return {
        subject: `Inspeção ${resultLabel}: ${params.serviceName} — ${params.locationName}`,
        html: baseTemplate(`
            <h2 style="color: #09090b; margin: 0 0 16px;">Inspeção Finalizada</h2>
            <p style="color: #3f3f46; line-height: 1.6;">
                O inspetor <strong>${params.inspectorName}</strong> finalizou a inspeção do serviço
                <strong>${params.serviceName}</strong> no local <strong>${params.locationName}</strong>.
            </p>
            <div style="background: ${color}15; border: 1px solid ${color}30; border-radius: 8px; padding: 16px; margin: 16px 0; text-align: center;">
                <p style="margin: 0; font-size: 18px; font-weight: bold; color: ${color};">
                    Resultado: ${resultLabel}
                </p>
            </div>
            <a href="${params.link}" style="display: inline-block; background: #18181b; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 500;">
                Ver Inspeção
            </a>
        `),
    }
}

export function issueCreatedEmail(params: {
    serviceName: string
    locationName: string
    description: string
    link: string
}): { subject: string; html: string } {
    return {
        subject: `Nova pendência: ${params.serviceName} — ${params.locationName}`,
        html: baseTemplate(`
            <h2 style="color: #09090b; margin: 0 0 16px;">Nova Pendência Registrada</h2>
            <p style="color: #3f3f46; line-height: 1.6;">
                Uma não-conformidade foi identificada na inspeção do serviço
                <strong>${params.serviceName}</strong> no local <strong>${params.locationName}</strong>.
            </p>
            <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 16px; margin: 16px 0;">
                <p style="margin: 0; color: #991b1b;">${params.description}</p>
            </div>
            <a href="${params.link}" style="display: inline-block; background: #18181b; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 500;">
                Ver Pendências
            </a>
        `),
    }
}

export function memberInviteEmail(params: {
    name: string
    tenantName: string
    role: string
    email: string
    tempPassword: string
    link: string
}): { subject: string; html: string } {
    const roleLabel: Record<string, string> = {
        admin: 'Administrador',
        supervisor: 'Supervisor',
        inspetor: 'Inspetor',
    }

    return {
        subject: `Convite para ${params.tenantName} — Quallisy FVS`,
        html: baseTemplate(`
            <h2 style="color: #09090b; margin: 0 0 16px;">Bem-vindo(a) à equipe!</h2>
            <p style="color: #3f3f46; line-height: 1.6;">
                Olá <strong>${params.name}</strong>, você foi convidado(a) para fazer parte da equipe
                <strong>${params.tenantName}</strong> no Quallisy FVS como <strong>${roleLabel[params.role] || params.role}</strong>.
            </p>
            <div style="background: #f4f4f5; border-radius: 8px; padding: 16px; margin: 16px 0;">
                <p style="margin: 0 0 8px; color: #3f3f46; font-size: 14px;"><strong>Seus dados de acesso:</strong></p>
                <p style="margin: 0; color: #3f3f46; font-size: 14px;">E-mail: <strong>${params.email}</strong></p>
                <p style="margin: 4px 0 0; color: #3f3f46; font-size: 14px;">Senha temporária: <strong>${params.tempPassword}</strong></p>
            </div>
            <p style="color: #71717a; font-size: 13px;">
                Recomendamos que altere sua senha no primeiro acesso.
            </p>
            <a href="${params.link}" style="display: inline-block; background: #18181b; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 500;">
                Acessar Quallisy FVS
            </a>
        `),
    }
}

export function inspectionAssignedEmail(params: {
    inspectorName: string
    serviceName: string
    locationName: string
    referenceMonth: string
    assignedBy: string
    link: string
}): { subject: string; html: string } {
    return {
        subject: `Nova inspeção atribuída: ${params.serviceName} — ${params.locationName}`,
        html: baseTemplate(`
            <h2 style="color: #09090b; margin: 0 0 16px;">Nova Inspeção Atribuída</h2>
            <p style="color: #3f3f46; line-height: 1.6;">
                Olá <strong>${params.inspectorName}</strong>, uma nova inspeção foi agendada para você por <strong>${params.assignedBy}</strong>.
            </p>
            <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 16px; margin: 16px 0;">
                <p style="margin: 0 0 8px; color: #1e40af; font-weight: bold;">Detalhes da Inspeção</p>
                <p style="margin: 0 0 4px; color: #1e3a5f; font-size: 14px;">Serviço: <strong>${params.serviceName}</strong></p>
                <p style="margin: 0 0 4px; color: #1e3a5f; font-size: 14px;">Local: <strong>${params.locationName}</strong></p>
                <p style="margin: 0; color: #1e3a5f; font-size: 14px;">Vigência: <strong>${params.referenceMonth}</strong></p>
            </div>
            <p style="color: #71717a; font-size: 13px;">
                O botão Iniciar ficará disponível quando o mês de vigência chegar.
            </p>
            <a href="${params.link}" style="display: inline-block; background: #18181b; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 500;">
                Ver Inspeções
            </a>
        `),
    }
}

export function issueResolvedEmail(params: {
    serviceName: string
    locationName: string
    description: string
    link: string
}): { subject: string; html: string } {
    return {
        subject: `Pendência resolvida: ${params.serviceName}`,
        html: baseTemplate(`
            <h2 style="color: #09090b; margin: 0 0 16px;">Pendência Resolvida</h2>
            <p style="color: #3f3f46; line-height: 1.6;">
                A pendência no serviço <strong>${params.serviceName}</strong>
                (local: <strong>${params.locationName}</strong>) foi resolvida.
            </p>
            <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 16px; margin: 16px 0;">
                <p style="margin: 0; color: #166534;">${params.description}</p>
            </div>
            <a href="${params.link}" style="display: inline-block; background: #18181b; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 500;">
                Ver Pendências
            </a>
        `),
    }
}
