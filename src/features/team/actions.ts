'use server'

import { eq, and } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { getAuthContext } from '@/features/auth/actions'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendEmail } from '@/lib/email/resend'
import { memberInviteEmail } from '@/lib/email/templates'
import { inviteMemberSchema, updateMemberRoleSchema } from './schemas'
import { logger } from '@/lib/logger'
import { inviteLimiter } from '@/lib/rate-limit'

/**
 * Lista membros da equipe do tenant atual.
 */
export async function listTeamMembers() {
    const { tenant } = await getAuthContext()

    try {
        const result = await db
            .select()
            .from(users)
            .where(eq(users.tenantId, tenant.id))
            .orderBy(users.name)

        return { data: result }
    } catch (err) {
        logger.error({ err, tenantId: tenant.id }, 'Erro ao listar equipe')
        return { error: 'Erro ao carregar equipe' }
    }
}

/**
 * Convida um novo membro para a equipe.
 * Cria o auth user no Supabase e o registro na tabela users.
 * Envia e-mail com link de acesso.
 * Somente admins podem convidar.
 */
export async function inviteTeamMember(input: unknown) {
    const { user, tenant } = await getAuthContext()

    if (user.role !== 'admin') {
        return { error: 'Apenas administradores podem convidar membros' }
    }

    // Rate limiting: 10 convites por minuto por IP
    const limit = await inviteLimiter.check()
    if (!limit.success) {
        return { error: 'Muitos convites enviados. Tente novamente em breve.' }
    }

    const parsed = inviteMemberSchema.safeParse(input)
    if (!parsed.success) {
        return { error: parsed.error.flatten() }
    }

    const { name, email, role } = parsed.data

    try {
        // Verificar se já existe no tenant
        const [existing] = await db
            .select()
            .from(users)
            .where(and(eq(users.email, email), eq(users.tenantId, tenant.id)))
            .limit(1)

        if (existing) {
            return { error: 'Este e-mail já está cadastrado na equipe' }
        }

        // Criar usuário no Supabase Auth
        const admin = createAdminClient()
        const tempPassword = crypto.randomUUID().slice(0, 12)

        const { data: authData, error: authError } = await admin.auth.admin.createUser({
            email,
            password: tempPassword,
            email_confirm: true,
        })

        if (authError || !authData.user) {
            // Se o auth user já existe (e.g. em outro tenant), buscar o id
            if (authError?.message?.includes('already been registered')) {
                const { data: listData } = await admin.auth.admin.listUsers()
                const existingAuth = listData?.users?.find((u) => u.email === email)

                if (!existingAuth) {
                    return { error: 'Erro ao localizar usuário existente' }
                }

                // Criar registro na tabela users vinculado ao auth existente
                const [newUser] = await db
                    .insert(users)
                    .values({
                        authId: existingAuth.id,
                        tenantId: tenant.id,
                        name,
                        email,
                        role,
                    })
                    .returning()

                logger.info(
                    { userId: newUser.id, tenantId: tenant.id, action: 'team.invite_existing' },
                    'Membro existente adicionado à equipe'
                )

                revalidatePath(`/${tenant.slug}/team`)
                return { data: newUser }
            }

            logger.error({ err: authError }, 'Erro ao criar auth user')
            return { error: 'Erro ao criar usuário' }
        }

        // Criar registro na tabela users
        const [newUser] = await db
            .insert(users)
            .values({
                authId: authData.user.id,
                tenantId: tenant.id,
                name,
                email,
                role,
            })
            .returning()

        // Enviar e-mail de convite (fire-and-forget)
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
        const emailContent = memberInviteEmail({
            name,
            tenantName: tenant.name,
            role,
            email,
            tempPassword,
            link: `${appUrl}/login`,
        })
        sendEmail({ to: email, ...emailContent }).catch(() => { })

        logger.info(
            { userId: newUser.id, tenantId: tenant.id, invitedBy: user.id, action: 'team.invite' },
            'Membro convidado para equipe'
        )

        revalidatePath(`/${tenant.slug}/team`)
        return { data: newUser }
    } catch (err) {
        logger.error({ err, tenantId: tenant.id }, 'Erro ao convidar membro')
        return { error: 'Erro ao convidar membro' }
    }
}

/**
 * Atualiza o role de um membro da equipe.
 * Somente admins podem alterar roles.
 * Um admin não pode rebaixar a si mesmo (segurança).
 */
export async function updateMemberRole(input: unknown) {
    const { user, tenant } = await getAuthContext()

    if (user.role !== 'admin') {
        return { error: 'Sem permissão' }
    }

    const parsed = updateMemberRoleSchema.safeParse(input)
    if (!parsed.success) {
        return { error: parsed.error.flatten() }
    }

    if (parsed.data.userId === user.id) {
        return { error: 'Você não pode alterar seu próprio perfil' }
    }

    try {
        const [updated] = await db
            .update(users)
            .set({ role: parsed.data.role, updatedAt: new Date() })
            .where(and(eq(users.id, parsed.data.userId), eq(users.tenantId, tenant.id)))
            .returning()

        if (!updated) return { error: 'Membro não encontrado' }

        logger.info(
            { targetId: parsed.data.userId, newRole: parsed.data.role, action: 'team.role_updated' },
            'Role de membro atualizado'
        )

        revalidatePath(`/${tenant.slug}/team`)
        return { data: updated }
    } catch (err) {
        logger.error({ err }, 'Erro ao atualizar role')
        return { error: 'Erro ao atualizar perfil' }
    }
}

/**
 * Ativa/desativa um membro da equipe.
 * Somente admins. Não pode desativar a si mesmo.
 */
export async function toggleMemberActive(userId: string) {
    const { user, tenant } = await getAuthContext()

    if (user.role !== 'admin') {
        return { error: 'Sem permissão' }
    }

    if (userId === user.id) {
        return { error: 'Você não pode desativar a si mesmo' }
    }

    try {
        const [member] = await db
            .select()
            .from(users)
            .where(and(eq(users.id, userId), eq(users.tenantId, tenant.id)))
            .limit(1)

        if (!member) return { error: 'Membro não encontrado' }

        const [updated] = await db
            .update(users)
            .set({ active: !member.active, updatedAt: new Date() })
            .where(eq(users.id, userId))
            .returning()

        logger.info(
            { targetId: userId, active: updated.active, action: 'team.toggle_active' },
            'Status de membro alterado'
        )

        revalidatePath(`/${tenant.slug}/team`)
        return { data: updated }
    } catch (err) {
        logger.error({ err }, 'Erro ao alterar status do membro')
        return { error: 'Erro ao alterar status' }
    }
}
