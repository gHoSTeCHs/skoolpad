import { Link } from '@inertiajs/react';
import {
    BarChart3,
    BookOpen,
    Calculator,
    CalendarCheck,
    FileQuestion,
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
import { useMemo } from 'react';
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
import { useSearchContext } from '@/contexts/search-context';
import { index as coursesIndex } from '@/actions/App/Http/Controllers/Student/CourseController';
import { index as timetableIndex } from '@/actions/App/Http/Controllers/Student/ExamTimetableController';
import { index as papersIndex } from '@/actions/App/Http/Controllers/Student/QuestionPaperController';
import { browse as topicsBrowse } from '@/actions/App/Http/Controllers/Student/TopicController';
import { dashboard } from '@/routes';
import type { NavGroup } from '@/types';
import AppLogo from './app-logo';

function useNavGroups(): NavGroup[] {
    const { open } = useSearchContext();
    const isMac = typeof navigator !== 'undefined' && navigator.platform.toLowerCase().includes('mac');

    return useMemo(() => [
        {
            label: 'Learn',
            items: [
                { title: 'Dashboard', href: dashboard(), icon: LayoutGrid },
                { title: 'Courses', href: coursesIndex.url(), icon: GraduationCap },
                { title: 'Past Questions', href: papersIndex.url(), icon: FileQuestion },
                { title: 'Practice', href: '/practice', icon: Target },
                { title: 'Review Queue', href: '/review-queue', icon: ListChecks },
                { title: 'Exam Timetable', href: timetableIndex.url(), icon: CalendarCheck },
            ],
        },
        {
            label: 'Study',
            items: [
                { title: 'Topics', href: topicsBrowse.url(), icon: BookOpen },
                { title: 'Notes', href: '/notes', icon: StickyNote },
                { title: 'Knowledge Graph', href: '/knowledge-graph', icon: Network },
                { title: 'Search', href: '/search', icon: Search, onClick: open, badge: isMac ? '⌘K' : 'Ctrl+K' },
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
    ], [open, isMac]);
}

export function AppSidebar() {
    const navGroups = useNavGroups();

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
