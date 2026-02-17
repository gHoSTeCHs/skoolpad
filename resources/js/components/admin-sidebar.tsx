import { Link } from '@inertiajs/react';
import {
    BookOpen,
    Building2,
    FileDown,
    GraduationCap,
    LayoutGrid,
    ListChecks,
    MessageSquareMore,
    Settings,
    Users,
} from 'lucide-react';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import type { NavGroup } from '@/types';

const navGroups: NavGroup[] = [
    {
        label: 'Overview',
        items: [
            { title: 'Dashboard', href: '/admin', icon: LayoutGrid },
        ],
    },
    {
        label: 'Content',
        items: [
            { title: 'Topics', href: '/admin/topics', icon: BookOpen },
            { title: 'Questions', href: '/admin/questions', icon: MessageSquareMore },
            { title: 'Courses', href: '/admin/courses', icon: GraduationCap },
            { title: 'Review Queue', href: '/admin/review-queue', icon: ListChecks },
            { title: 'Imports', href: '/admin/imports', icon: FileDown },
        ],
    },
    {
        label: 'Platform',
        items: [
            { title: 'Institutions', href: '/admin/institutions', icon: Building2 },
            { title: 'Users', href: '/admin/users', icon: Users },
            { title: 'Settings', href: '/admin/settings', icon: Settings },
        ],
    },
];

export function AdminSidebar() {
    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href="/admin" prefetch>
                                <div className="flex size-[30px] shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[var(--canopy-400)] to-[var(--canopy-600)]">
                                    <span className="font-display text-[14px] font-[800] leading-none text-white">
                                        S
                                    </span>
                                </div>
                                <div className="ml-1 grid flex-1 text-left">
                                    <span className="truncate font-display text-[16px] font-bold leading-tight tracking-[-0.02em] text-white">
                                        Skoolpad
                                    </span>
                                    <span className="truncate text-[10px] font-medium uppercase tracking-[0.08em] text-white/40">
                                        Admin
                                    </span>
                                </div>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain groups={navGroups} />
            </SidebarContent>

            <SidebarFooter>
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
