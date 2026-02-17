import { Link } from '@inertiajs/react';
import {
    BarChart3,
    BookOpen,
    Calculator,
    GraduationCap,
    LayoutGrid,
    ListChecks,
    Network,
    Search,
    StickyNote,
    Target,
    TrendingUp,
    Upload,
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
            { title: 'Review Queue', href: '/review-queue', icon: ListChecks },
        ],
    },
    {
        label: 'Study',
        items: [
            { title: 'Topics', href: '/topics/browse', icon: BookOpen },
            { title: 'Notes', href: '/notes', icon: StickyNote },
            { title: 'Knowledge Graph', href: '/knowledge-graph', icon: Network },
            { title: 'Search', href: '/search', icon: Search },
        ],
    },
    {
        label: 'Track',
        items: [
            { title: 'Progress', href: '/progress', icon: TrendingUp },
            { title: 'CGPA Simulator', href: '/cgpa-simulator', icon: Calculator },
            { title: 'Contributions', href: '/contributions', icon: BarChart3 },
        ],
    },
    {
        label: 'Share',
        items: [
            { title: 'Upload', href: '/upload', icon: Upload },
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
