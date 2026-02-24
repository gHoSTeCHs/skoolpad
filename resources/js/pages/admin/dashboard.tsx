import { Head } from '@inertiajs/react';
import { Activity, BookOpen, GraduationCap, MessageSquareMore, Sparkles, Users } from 'lucide-react';
import {
    Area,
    AreaChart,
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';
import { EmptyChart } from '@/components/admin/empty-chart';
import { PageHeader } from '@/components/admin/page-header';
import { StatCard } from '@/components/admin/stat-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AdminLayout from '@/layouts/admin-layout';
import type { ActiveUserMetrics, ContentMetrics, PracticeMetrics, UserMetrics } from '@/types/dashboard';

interface Props {
    user_metrics: UserMetrics;
    content_metrics: ContentMetrics;
    active_users: ActiveUserMetrics;
    practice_metrics: PracticeMetrics;
}

const breadcrumbs = [{ title: 'Dashboard', href: '/admin' }];

const tooltipStyle = {
    backgroundColor: 'var(--card)',
    border: '1px solid var(--border)',
    borderRadius: 10,
    fontSize: 13,
    fontFamily: 'var(--font-body)',
    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
};

function useChartColors() {
    if (typeof window === 'undefined') {
        return { primary: '#0D9668', primaryBg: 'rgba(13, 150, 104, 0.1)', reward: '#B07920', neutral: '#998A79', grid: 'rgba(0,0,0,0.04)' };
    }
    const style = getComputedStyle(document.documentElement);
    return {
        primary: style.getPropertyValue('--badge-primary-fg').trim() || '#0D9668',
        primaryBg: style.getPropertyValue('--badge-primary-bg').trim() || 'rgba(13, 150, 104, 0.1)',
        reward: style.getPropertyValue('--badge-reward-fg').trim() || '#B07920',
        neutral: style.getPropertyValue('--badge-neutral-fg').trim() || '#998A79',
        grid: style.getPropertyValue('--border').trim() || 'rgba(0,0,0,0.04)',
    };
}

function SectionLabel({ children }: { children: React.ReactNode }) {
    return (
        <p className="text-xs font-semibold tracking-widest uppercase" style={{ color: 'var(--text-3)' }}>
            {children}
        </p>
    );
}

export default function AdminDashboard({ user_metrics, content_metrics, active_users, practice_metrics }: Props) {
    const colors = useChartColors();
    const hasTrendData = user_metrics.registrations_trend.some((d) => d.count > 0);
    const hasUsersByInstitution = user_metrics.users_by_institution.length > 0;
    const totalStatusQuestions = content_metrics.published_questions + content_metrics.draft_questions + content_metrics.in_review_questions;
    const hasQuestionsByInstitution = content_metrics.questions_by_institution.length > 0;
    const coursesCoverage = content_metrics.total_courses > 0 ? (content_metrics.courses_with_questions / content_metrics.total_courses) * 100 : 0;

    const questionStatusData = [
        { name: 'Draft', value: content_metrics.draft_questions, color: colors.neutral },
        { name: 'In Review', value: content_metrics.in_review_questions, color: colors.reward },
        { name: 'Published', value: content_metrics.published_questions, color: colors.primary },
    ];

    return (
        <AdminLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />
            <div className="flex flex-col gap-8 p-4 md:p-6">
                <PageHeader title="Dashboard" description="Platform overview and analytics." />

                <section className="space-y-3">
                    <SectionLabel>Overview</SectionLabel>
                    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                        <StatCard
                            title="Total Users"
                            value={user_metrics.total_users}
                            icon={Users}
                            iconBg="var(--badge-primary-bg)"
                            iconFg="var(--badge-primary-fg)"
                        />
                        <StatCard
                            title="Published Questions"
                            value={content_metrics.published_questions}
                            icon={MessageSquareMore}
                            iconBg="var(--badge-reward-bg)"
                            iconFg="var(--badge-reward-fg)"
                        />
                        <StatCard
                            title="Published Topics"
                            value={content_metrics.published_topics}
                            icon={BookOpen}
                            iconBg="var(--badge-primary-bg)"
                            iconFg="var(--badge-primary-fg)"
                        />
                        <StatCard
                            title="Total Courses"
                            value={content_metrics.total_courses}
                            icon={GraduationCap}
                            iconBg="var(--badge-neutral-bg)"
                            iconFg="var(--badge-neutral-fg)"
                        />
                    </div>
                </section>

                <section className="space-y-3">
                    <SectionLabel>Active Users</SectionLabel>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                        <StatCard
                            title="Daily Active"
                            value={active_users.dau}
                            description="Logged in today"
                            icon={Activity}
                            iconBg="var(--badge-primary-bg)"
                            iconFg="var(--badge-primary-fg)"
                        />
                        <StatCard
                            title="Weekly Active"
                            value={active_users.wau}
                            description="Last 7 days"
                            icon={Activity}
                            iconBg="var(--badge-reward-bg)"
                            iconFg="var(--badge-reward-fg)"
                        />
                        <StatCard
                            title="Monthly Active"
                            value={active_users.mau}
                            description="Last 30 days"
                            icon={Activity}
                            iconBg="var(--badge-neutral-bg)"
                            iconFg="var(--badge-neutral-fg)"
                        />
                    </div>
                </section>

                <section className="space-y-3">
                    <SectionLabel>Growth &amp; Distribution</SectionLabel>
                    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                        <Card>
                            <CardHeader className="flex-row items-center justify-between">
                                <CardTitle className="font-display text-base font-semibold">Registrations</CardTitle>
                                <span className="text-xs text-muted-foreground">Last 14 days</span>
                            </CardHeader>
                            <CardContent>
                                {hasTrendData ? (
                                    <ResponsiveContainer width="100%" height={260}>
                                        <AreaChart data={user_metrics.registrations_trend} margin={{ top: 4, right: 4, bottom: 0, left: -12 }}>
                                            <defs>
                                                <linearGradient id="regGradient" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="0%" stopColor={colors.primary} stopOpacity={0.2} />
                                                    <stop offset="95%" stopColor={colors.primary} stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid stroke={colors.grid} strokeDasharray="3 3" vertical={false} opacity={0.5} />
                                            <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} dy={8} />
                                            <YAxis allowDecimals={false} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={32} />
                                            <Tooltip contentStyle={tooltipStyle} />
                                            <Area
                                                type="monotone"
                                                dataKey="count"
                                                stroke={colors.primary}
                                                fill="url(#regGradient)"
                                                strokeWidth={2.5}
                                                dot={false}
                                                activeDot={{ r: 5, strokeWidth: 2, fill: 'var(--card)' }}
                                                name="Registrations"
                                            />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <EmptyChart title="Registrations" message="No registrations in the last 14 days" height={260} />
                                )}
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex-row items-center justify-between">
                                <CardTitle className="font-display text-base font-semibold">Users by Institution</CardTitle>
                                <span className="text-xs text-muted-foreground">Top 5</span>
                            </CardHeader>
                            <CardContent>
                                {hasUsersByInstitution ? (
                                    <ResponsiveContainer width="100%" height={260}>
                                        <BarChart data={user_metrics.users_by_institution} layout="vertical" margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                                            <CartesianGrid stroke={colors.grid} strokeDasharray="3 3" horizontal={false} opacity={0.5} />
                                            <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                                            <YAxis
                                                type="category"
                                                dataKey="abbreviation"
                                                tick={{ fontSize: 11 }}
                                                tickLine={false}
                                                axisLine={false}
                                                width={64}
                                            />
                                            <Tooltip
                                                contentStyle={tooltipStyle}
                                                formatter={(value: number | undefined) => [value ?? 0, 'Students']}
                                                labelFormatter={(label: unknown) => {
                                                    const labelStr = String(label);
                                                    const inst = user_metrics.users_by_institution.find((i) => i.abbreviation === labelStr);
                                                    return inst ? inst.name : labelStr;
                                                }}
                                            />
                                            <Bar dataKey="count" fill={colors.primary} radius={[0, 6, 6, 0]} barSize={20} name="Students" />
                                        </BarChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <EmptyChart title="Users by Institution" height={260} />
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </section>

                <section className="space-y-3">
                    <SectionLabel>Content</SectionLabel>
                    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                        <Card>
                            <CardHeader className="flex-row items-center justify-between">
                                <CardTitle className="font-display text-base font-semibold">Question Status</CardTitle>
                                <span className="text-xs text-muted-foreground">{totalStatusQuestions} total</span>
                            </CardHeader>
                            <CardContent>
                                {totalStatusQuestions > 0 ? (
                                    <div className="flex flex-col items-center gap-4 sm:flex-row sm:gap-6">
                                        <ResponsiveContainer width="100%" height={220} className="max-w-[220px] shrink-0">
                                            <PieChart>
                                                <Pie
                                                    data={questionStatusData}
                                                    cx="50%"
                                                    cy="50%"
                                                    innerRadius={55}
                                                    outerRadius={90}
                                                    paddingAngle={4}
                                                    dataKey="value"
                                                    nameKey="name"
                                                    strokeWidth={0}
                                                >
                                                    {questionStatusData.map((entry) => (
                                                        <Cell key={entry.name} fill={entry.color} />
                                                    ))}
                                                </Pie>
                                                <Tooltip contentStyle={tooltipStyle} />
                                            </PieChart>
                                        </ResponsiveContainer>
                                        <div className="flex flex-row gap-4 sm:flex-col sm:gap-3">
                                            {questionStatusData.map((entry) => (
                                                <div key={entry.name} className="flex items-center gap-2.5">
                                                    <span className="size-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
                                                    <div>
                                                        <p className="text-xs text-muted-foreground">{entry.name}</p>
                                                        <p className="font-display text-lg font-bold leading-tight">{entry.value}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <EmptyChart title="Question Status" message="No questions created yet" height={220} />
                                )}
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex-row items-center justify-between">
                                <CardTitle className="font-display text-base font-semibold">Questions by Institution</CardTitle>
                                <span className="text-xs text-muted-foreground">Top 5</span>
                            </CardHeader>
                            <CardContent>
                                {hasQuestionsByInstitution ? (
                                    <ResponsiveContainer width="100%" height={260}>
                                        <BarChart data={content_metrics.questions_by_institution} layout="vertical" margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                                            <CartesianGrid stroke={colors.grid} strokeDasharray="3 3" horizontal={false} opacity={0.5} />
                                            <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                                            <YAxis
                                                type="category"
                                                dataKey="abbreviation"
                                                tick={{ fontSize: 11 }}
                                                tickLine={false}
                                                axisLine={false}
                                                width={64}
                                            />
                                            <Tooltip
                                                contentStyle={tooltipStyle}
                                                formatter={(value: number | undefined) => [value ?? 0, 'Questions']}
                                                labelFormatter={(label: unknown) => {
                                                    const labelStr = String(label);
                                                    const inst = content_metrics.questions_by_institution.find((i) => i.abbreviation === labelStr);
                                                    return inst ? inst.name : labelStr;
                                                }}
                                            />
                                            <Bar dataKey="count" fill={colors.reward} radius={[0, 6, 6, 0]} barSize={20} name="Questions" />
                                        </BarChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <EmptyChart title="Questions by Institution" height={260} />
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </section>

                <section className="space-y-3">
                    <SectionLabel>Coverage &amp; Practice</SectionLabel>
                    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                        <Card>
                            <CardHeader>
                                <CardTitle className="font-display text-base font-semibold">Content Coverage</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-5">
                                <div>
                                    <div className="mb-2 flex items-baseline justify-between">
                                        <span className="text-sm">Courses with questions</span>
                                        <span className="font-display text-sm font-bold">
                                            {content_metrics.courses_with_questions}
                                            <span className="font-sans font-normal text-muted-foreground"> of {content_metrics.total_courses}</span>
                                        </span>
                                    </div>
                                    <div
                                        className="h-2.5 overflow-hidden rounded-full"
                                        style={{ backgroundColor: 'var(--badge-neutral-bg)' }}
                                    >
                                        <div
                                            className="h-full rounded-full transition-all duration-500 ease-out"
                                            style={{
                                                width: `${Math.max(coursesCoverage, coursesCoverage > 0 ? 2 : 0)}%`,
                                                backgroundColor: 'var(--badge-primary-fg)',
                                            }}
                                        />
                                    </div>
                                </div>
                                <div className="flex items-baseline justify-between border-t pt-4" style={{ borderColor: 'var(--border)' }}>
                                    <span className="text-sm">Published topics</span>
                                    <span className="font-display text-sm font-bold">
                                        {content_metrics.published_topics}
                                        <span className="font-sans font-normal text-muted-foreground"> / {content_metrics.total_topics}</span>
                                    </span>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="font-display text-base font-semibold">Practice Sessions</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div
                                    className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed py-10"
                                    style={{ borderColor: 'var(--border)', color: 'var(--text-3)' }}
                                >
                                    <Sparkles className="size-6 opacity-40" />
                                    <p className="text-sm">
                                        {practice_metrics.total_sessions === 0
                                            ? 'Practice analytics will appear here once sessions begin.'
                                            : `${practice_metrics.total_sessions} sessions completed`}
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </section>
            </div>
        </AdminLayout>
    );
}
