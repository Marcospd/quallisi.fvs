'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { markAsRead, markAllAsRead } from '../actions'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Bell, CheckCheck, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface Notification {
    id: string
    userId: string
    type: string
    title: string
    message: string
    read: boolean
    link: string | null
    createdAt: Date | null
}

interface NotificationsListProps {
    notifications: Notification[]
    tenantSlug: string
}

function formatTimeAgo(date: Date | null): string {
    if (!date) return ''
    const now = new Date()
    const diff = now.getTime() - new Date(date).getTime()
    const minutes = Math.floor(diff / 60000)
    if (minutes < 1) return 'agora'
    if (minutes < 60) return `${minutes}min`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h`
    const days = Math.floor(hours / 24)
    return `${days}d`
}

const typeIcons: Record<string, string> = {
    INSPECTION_COMPLETED: 'clipboard',
    ISSUE_CREATED: 'alert',
    ISSUE_RESOLVED: 'check',
}

/**
 * Lista de notificações com ações de marcar como lida.
 */
export function NotificationsList({ notifications: data, tenantSlug }: NotificationsListProps) {
    const router = useRouter()
    const [markingId, setMarkingId] = useState<string | null>(null)
    const [markingAll, setMarkingAll] = useState(false)

    const unreadCount = data.filter((n) => !n.read).length

    async function handleMarkRead(notificationId: string, link: string | null) {
        setMarkingId(notificationId)
        try {
            await markAsRead(notificationId)
            if (link) {
                router.push(`/${tenantSlug}${link.startsWith('/') ? link.replace(`/${tenantSlug}`, '') : `/${link}`}`)
            }
        } catch {
            toast.error('Erro ao marcar como lida')
        } finally {
            setMarkingId(null)
        }
    }

    async function handleMarkAllRead() {
        setMarkingAll(true)
        try {
            const result = await markAllAsRead()
            if (result.error) {
                toast.error(typeof result.error === 'string' ? result.error : 'Erro')
            } else {
                toast.success('Todas as notificações marcadas como lidas')
            }
        } catch {
            toast.error('Erro ao atualizar notificações')
        } finally {
            setMarkingAll(false)
        }
    }

    return (
        <div className="space-y-4">
            {unreadCount > 0 && (
                <div className="flex items-center justify-between">
                    <Badge variant="secondary">
                        {unreadCount} não lida{unreadCount > 1 ? 's' : ''}
                    </Badge>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleMarkAllRead}
                        disabled={markingAll}
                    >
                        {markingAll ? (
                            <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                        ) : (
                            <CheckCheck className="mr-2 h-3.5 w-3.5" />
                        )}
                        Marcar todas como lidas
                    </Button>
                </div>
            )}

            <div className="space-y-2">
                {data.map((notification) => (
                    <Card
                        key={notification.id}
                        className={`cursor-pointer transition-colors hover:bg-muted/50 ${
                            !notification.read ? 'border-primary/30 bg-primary/5' : ''
                        }`}
                        onClick={() => handleMarkRead(notification.id, notification.link)}
                    >
                        <CardContent className="py-4 flex items-start gap-3">
                            <div className={`mt-0.5 h-2 w-2 rounded-full shrink-0 ${
                                notification.read ? 'bg-transparent' : 'bg-primary'
                            }`} />
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2">
                                    <p className={`text-sm ${notification.read ? 'text-muted-foreground' : 'font-medium'}`}>
                                        {notification.title}
                                    </p>
                                    <span className="text-xs text-muted-foreground shrink-0">
                                        {formatTimeAgo(notification.createdAt)}
                                    </span>
                                </div>
                                <p className="text-xs text-muted-foreground mt-0.5 truncate">
                                    {notification.message}
                                </p>
                            </div>
                            {markingId === notification.id && (
                                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground shrink-0" />
                            )}
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    )
}
