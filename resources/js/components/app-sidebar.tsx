import { Link } from '@inertiajs/react';
import {
    BookText,
    Calendar,
    ClipboardList,
    GraduationCap,
    LayoutGrid,
    ListChecks,
    Newspaper,
    Store,
    Target,
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
import { dashboard } from '@/routes';
import type { NavGroup } from '@/types';
import AppLogo from './app-logo';

const navGroups: NavGroup[] = [
    {
        label: 'Learn',
        items: [
            { title: 'Dashboard', href: dashboard(), icon: LayoutGrid },
            { title: 'Courses', href: '/courses', icon: GraduationCap },
            { title: 'Practice', href: '/practice', icon: Target },
            { title: 'Mock Exams', href: '/mock-exams', icon: ClipboardList },
        ],
    },
    {
        label: 'Social',
        items: [
            { title: 'Feed', href: '/feed', icon: Newspaper },
            { title: 'Study Rooms', href: '/study-rooms', icon: Users },
            { title: 'Marketplace', href: '/marketplace', icon: Store },
        ],
    },
    {
        label: 'Organise',
        items: [
            { title: 'Timetable', href: '/timetable', icon: Calendar },
            { title: 'Journal', href: '/journal', icon: BookText },
            { title: 'Todo', href: '/todo', icon: ListChecks },
        ],
    },
];

export function AppSidebar() {
    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={dashboard()} prefetch>
                                <AppLogo />
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
