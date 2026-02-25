'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
    LayoutDashboard,
    ClipboardCheck,
    Building,
    MapPin,
    Wrench,
    CalendarDays,
    AlertTriangle,
    Users,
} from 'lucide-react'
import { useTenant } from '@/features/tenant/components/tenant-provider'
import {
    Sidebar,
    SidebarContent,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar'

/**
 * Sidebar do Painel Tenant (construtora).
 * Menus organizados por área: Operação, Qualidade, Configuração.
 */
export function TenantSidebar() {
    const pathname = usePathname()
    const { tenant, user } = useTenant()
    const base = `/${tenant.slug}`

    const operationItems = [
        { title: 'Dashboard', href: base, icon: LayoutDashboard },
        { title: 'Inspeções', href: `${base}/inspections`, icon: ClipboardCheck },
        { title: 'Pendências', href: `${base}/issues`, icon: AlertTriangle },
        { title: 'Planejamento', href: `${base}/planning`, icon: CalendarDays },
    ]

    const configItems = [
        { title: 'Obras', href: `${base}/projects`, icon: Building },
        { title: 'Locais', href: `${base}/locations`, icon: MapPin },
        { title: 'Serviços', href: `${base}/services`, icon: Wrench },
        { title: 'Gestão de Acessos', href: `${base}/team`, icon: Users },
    ]

    const isActive = (href: string) => {
        if (href === base) return pathname === base
        return pathname.startsWith(href)
    }

    return (
        <Sidebar>
            <SidebarHeader className="border-b px-6 py-4">
                <h2 className="text-lg font-bold truncate">{tenant.name}</h2>
                <p className="text-xs text-muted-foreground truncate">
                    Painel Operacional
                </p>
            </SidebarHeader>

            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupLabel>Operação</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {operationItems.map((item) => (
                                <SidebarMenuItem key={item.href}>
                                    <SidebarMenuButton asChild isActive={isActive(item.href)}>
                                        <Link href={item.href}>
                                            <item.icon className="h-4 w-4" />
                                            <span>{item.title}</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>

                {(user.role === 'admin') && (
                    <SidebarGroup>
                        <SidebarGroupLabel>Configuração</SidebarGroupLabel>
                        <SidebarGroupContent>
                            <SidebarMenu>
                                {configItems.map((item) => (
                                    <SidebarMenuItem key={item.href}>
                                        <SidebarMenuButton asChild isActive={isActive(item.href)}>
                                            <Link href={item.href}>
                                                <item.icon className="h-4 w-4" />
                                                <span>{item.title}</span>
                                            </Link>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                ))}
                            </SidebarMenu>
                        </SidebarGroupContent>
                    </SidebarGroup>
                )}
            </SidebarContent>
        </Sidebar>
    )
}
