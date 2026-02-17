import { Head } from '@inertiajs/react';
import { useState } from 'react';
import CourseCard from '@/components/skoolpad/course-card';
import EmptyState from '@/components/skoolpad/empty-state';
import QuestionCard from '@/components/skoolpad/question-card';
import SpBadge from '@/components/skoolpad/sp-badge';
import StatCard from '@/components/skoolpad/stat-card';
import StreakWidget from '@/components/skoolpad/streak-widget';
import { Skeleton, SkeletonText } from '@/components/ui/skeleton';
import { useAppearance } from '@/hooks/use-appearance';

const COURSES = [
    { code: 'CSC 201', name: 'Data Structures & Algorithms', progress: 68, questionCount: 142, variant: 'canopy' as const },
    { code: 'MCE 201', name: 'Thermodynamics I', progress: 23, questionCount: 87, variant: 'ember' as const },
    { code: 'ENG 202', name: 'Literary Criticism', progress: 91, questionCount: 56, variant: 'honey' as const },
];

const STATS = [
    { label: 'Questions Today', value: '47', change: '\u2191 12%', trend: 'up' as const },
    { label: 'Accuracy', value: '82%', change: '\u2191 3%', trend: 'up' as const },
    { label: 'Time Spent', value: '2h 14m', change: '\u2014 average', trend: 'neutral' as const },
    { label: 'Weak Topics', value: '3', change: '\u2193 needs work', trend: 'down' as const },
];

const STREAK_DAYS = [
    { label: 'M', state: 'completed' as const },
    { label: 'T', state: 'completed' as const },
    { label: 'W', state: 'completed' as const },
    { label: 'T', state: 'completed' as const },
    { label: 'F', state: 'completed' as const },
    { label: 'S', state: 'completed' as const },
    { label: 'S', state: 'today' as const },
];

const QUESTION_OPTIONS = [
    { label: 'A', text: 'O(n)' },
    { label: 'B', text: 'O(log n)', state: 'correct' as const },
    { label: 'C', text: 'O(n log n)' },
    { label: 'D', text: 'O(n\u00B2)', state: 'wrong' as const },
];

function SectionLabel({ children }: { children: React.ReactNode }) {
    return (
        <div className="mb-[6px] flex items-center gap-[10px]">
            <span
                className="text-[10px] font-semibold uppercase tracking-[0.1em] text-primary"
                style={{ fontFamily: 'var(--font-body)' }}
            >
                {children}
            </span>
            <span className="h-px flex-1 bg-gradient-to-r from-primary/30 to-transparent" />
        </div>
    );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
    return (
        <h2
            className="mb-8 text-[28px] font-bold tracking-tight"
            style={{ fontFamily: 'var(--font-display)', letterSpacing: '-0.02em' }}
        >
            {children}
        </h2>
    );
}

export default function DesignShowcase() {
    const { appearance, updateAppearance } = useAppearance();
    const [activeTab, setActiveTab] = useState('All');

    const modes = [
        { key: 'light' as const, label: 'Light', desc: 'Warm Editorial' },
        { key: 'dark' as const, label: 'Dark', desc: 'Warm Editorial' },
        { key: 'reader' as const, label: 'Reader', desc: 'Midnight Scholar' },
    ];

    return (
        <>
            <Head title="Design System Showcase" />

            <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
                {/* ================================================================
                    FIXED THEME SWITCHER
                   ================================================================ */}
                <div className="fixed top-4 right-4 z-50 flex gap-[2px] rounded-xl border border-border bg-card p-[3px] shadow-lg backdrop-blur-xl">
                    {modes.map((m) => (
                        <button
                            key={m.key}
                            onClick={() => updateAppearance(m.key)}
                            className={
                                'cursor-pointer rounded-[9px] px-[14px] py-[7px] text-[12px] font-semibold transition-all duration-200'
                                + (appearance === m.key
                                    ? ' bg-primary text-primary-foreground shadow-sm'
                                    : ' text-muted-foreground hover:text-foreground')
                            }
                            style={{ fontFamily: 'var(--font-body)' }}
                            title={m.desc}
                        >
                            {m.label}
                        </button>
                    ))}
                </div>

                {/* ================================================================
                    HERO
                   ================================================================ */}
                <section
                    className="relative overflow-hidden px-10 pt-[72px] pb-[52px] max-md:px-4 max-md:pt-12 max-md:pb-9"
                    style={{ background: 'var(--bg-hero)' }}
                >
                    <div
                        className="absolute inset-0 reader:hidden"
                        style={{
                            background: 'repeating-linear-gradient(-45deg, transparent, transparent 40px, rgba(255,255,255,0.012) 40px, rgba(255,255,255,0.012) 41px)',
                        }}
                    />
                    <div
                        className="pointer-events-none absolute -top-[200px] left-1/2 hidden h-[600px] w-[800px] -translate-x-1/2 rounded-full reader:block"
                        style={{
                            background: 'radial-gradient(circle, rgba(62,189,147,0.08) 0%, transparent 70%)',
                            animation: 'glow-pulse 6s ease-in-out infinite',
                        }}
                    />
                    <div
                        className="pointer-events-none absolute -top-1/2 -right-[20%] h-[600px] w-[600px] rounded-full reader:hidden"
                        style={{
                            background: 'radial-gradient(circle, rgba(212,149,42,0.12) 0%, transparent 70%)',
                        }}
                    />

                    <div className="relative z-[1] mx-auto max-w-[1200px]">
                        <div
                            className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.08] px-[14px] py-[5px] text-[11px] font-semibold uppercase tracking-[0.06em] reader:border-[rgba(62,189,147,0.2)] reader:bg-[rgba(62,189,147,0.1)] reader:text-[#3EBD93]"
                            style={{
                                color: 'var(--canopy-300)',
                                fontFamily: 'var(--font-body)',
                                animation: 'fade-up 0.5s cubic-bezier(0.16, 1, 0.3, 1) 0.1s both',
                            }}
                        >
                            <span
                                className="h-[6px] w-[6px] rounded-full reader:shadow-[0_0_12px_#3EBD93]"
                                style={{
                                    background: 'var(--primary)',
                                    boxShadow: undefined,
                                }}
                            />
                            Design System Showcase
                        </div>

                        <h1
                            className="text-white reader:font-black"
                            style={{
                                fontFamily: 'var(--font-display)',
                                fontSize: 'clamp(44px, 7vw, 80px)',
                                fontWeight: 800,
                                lineHeight: 0.95,
                                letterSpacing: '-0.03em',
                                animation: 'fade-up 0.5s cubic-bezier(0.16, 1, 0.3, 1) 0.15s both',
                            }}
                        >
                            Skool
                            <span className="italic text-[var(--honey-400)] reader:bg-gradient-to-br reader:from-[#3EBD93] reader:to-[#65D6AD] reader:bg-clip-text reader:not-italic reader:text-transparent">
                                pad
                            </span>
                        </h1>

                        <p
                            className="mt-4 max-w-[520px] text-white/45 reader:italic"
                            style={{
                                fontFamily: 'var(--font-body)',
                                fontSize: '16px',
                                lineHeight: 1.6,
                                animation: 'fade-up 0.5s cubic-bezier(0.16, 1, 0.3, 1) 0.25s both',
                            }}
                        >
                            Three modes, one token architecture. Every component below uses
                            identical markup &#8212; only the CSS custom properties change.
                            <strong className="font-medium text-white/70"> Switch themes above to see the system in action.</strong>
                        </p>
                    </div>
                </section>

                <div className="mx-auto max-w-[1200px] px-10 max-md:px-4">
                    {/* ================================================================
                        BADGES
                       ================================================================ */}
                    <section className="border-b border-[var(--border-2)] py-14">
                        <SectionLabel>Atoms</SectionLabel>
                        <SectionTitle>Badges & Tabs</SectionTitle>

                        <div className="flex flex-wrap gap-3">
                            <SpBadge variant="primary">{'\u2713'} Completed</SpBadge>
                            <SpBadge variant="danger">{'\u25CF'} Live</SpBadge>
                            <SpBadge variant="reward">{'\u2605'} Top Scorer</SpBadge>
                            <SpBadge variant="neutral">200 Level</SpBadge>
                            <SpBadge variant="solid">JAMB</SpBadge>
                        </div>

                        <div className="mt-8">
                            <div
                                className="inline-flex gap-[2px] rounded-xl border-0 bg-[var(--bg-raised)] p-[3px] reader:border reader:border-border reader:bg-card"
                            >
                                {['All', 'Objectives', 'Theory', 'Practicals'].map((tab) => (
                                    <button
                                        key={tab}
                                        onClick={() => setActiveTab(tab)}
                                        className="cursor-pointer rounded-[9px] border-none bg-transparent px-4 py-[7px] text-[12px] font-medium text-muted-foreground transition-all duration-200 hover:text-foreground"
                                        style={{
                                            fontFamily: 'var(--font-body)',
                                            ...(activeTab === tab
                                                ? {
                                                    background: 'var(--tab-active-bg)',
                                                    color: 'var(--tab-active-fg)',
                                                    boxShadow: 'var(--tab-active-shadow)',
                                                    fontWeight: 600,
                                                }
                                                : {}),
                                        }}
                                    >
                                        {tab}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Buttons row */}
                        <div className="mt-8">
                            <p
                                className="mb-3 text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground"
                                style={{ fontFamily: 'var(--font-body)' }}
                            >
                                Buttons
                            </p>
                            <div className="flex flex-wrap items-center gap-3">
                                <button
                                    className="inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-[10px] border-none px-[18px] text-[13px] font-semibold transition-all duration-200 hover:-translate-y-px active:scale-[0.97]"
                                    style={{
                                        fontFamily: 'var(--font-body)',
                                        background: 'var(--btn-primary-bg)',
                                        color: 'var(--btn-primary-fg)',
                                        boxShadow: 'var(--btn-primary-shadow)',
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.background = 'var(--btn-primary-hover)';
                                        e.currentTarget.style.boxShadow = `var(--btn-glow), var(--btn-primary-shadow)`;
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.background = 'var(--btn-primary-bg)';
                                        e.currentTarget.style.boxShadow = 'var(--btn-primary-shadow)';
                                    }}
                                >
                                    Start Practice
                                </button>
                                <button
                                    className="inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-[10px] border-none px-[18px] text-[13px] font-semibold transition-all duration-200 hover:-translate-y-px active:scale-[0.97]"
                                    style={{
                                        fontFamily: 'var(--font-body)',
                                        background: 'var(--btn-danger-bg)',
                                        color: 'var(--btn-danger-fg)',
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.background = 'var(--btn-danger-hover)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.background = 'var(--btn-danger-bg)';
                                    }}
                                >
                                    Submit
                                </button>
                                <button
                                    className="inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-[10px] bg-transparent px-[18px] text-[13px] font-semibold transition-all duration-200 hover:-translate-y-px active:scale-[0.97]"
                                    style={{
                                        fontFamily: 'var(--font-body)',
                                        color: 'var(--outline-btn-fg)',
                                        border: '1.5px solid var(--outline-btn-border)',
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.background = 'var(--outline-btn-hover)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.background = 'transparent';
                                    }}
                                >
                                    View Course
                                </button>
                                <button
                                    className="inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-[10px] border-none bg-transparent px-[18px] text-[13px] font-semibold transition-all duration-200 active:scale-[0.97]"
                                    style={{
                                        fontFamily: 'var(--font-body)',
                                        color: 'var(--text-2)',
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.background = 'var(--bg-raised)';
                                        e.currentTarget.style.color = 'var(--foreground)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.background = 'transparent';
                                        e.currentTarget.style.color = 'var(--text-2)';
                                    }}
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>

                        {/* Inputs row */}
                        <div className="mt-8 max-w-sm">
                            <p
                                className="mb-3 text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground"
                                style={{ fontFamily: 'var(--font-body)' }}
                            >
                                Inputs
                            </p>
                            <label
                                className="mb-[5px] block text-[12px] font-semibold"
                                style={{ fontFamily: 'var(--font-body)', color: 'var(--text-2)' }}
                            >
                                Email
                            </label>
                            <input
                                className="h-[42px] w-full rounded-[10px] border-[1.5px] border-border bg-[var(--input-bg)] px-[14px] text-[14px] text-foreground outline-none transition-all duration-200 placeholder:text-muted-foreground focus:border-[var(--opt-correct-dot)] focus:shadow-[0_0_0_3px_var(--input-focus)]"
                                style={{ fontFamily: 'var(--font-body)' }}
                                placeholder="student@mouau.edu.ng"
                            />
                        </div>

                        {/* Toasts */}
                        <div className="mt-8">
                            <p
                                className="mb-3 text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground"
                                style={{ fontFamily: 'var(--font-body)' }}
                            >
                                Toasts
                            </p>
                            <div className="flex flex-wrap gap-3">
                                <div
                                    className="inline-flex items-center gap-[10px] rounded-xl px-[18px] py-3 text-[13px] font-medium shadow-lg reader:border reader:border-border"
                                    style={{
                                        fontFamily: 'var(--font-body)',
                                        background: 'var(--toast-bg)',
                                        color: 'var(--toast-fg)',
                                    }}
                                >
                                    <span
                                        className="h-[7px] w-[7px] rounded-full reader:shadow-[0_0_8px_rgba(62,189,147,0.4)]"
                                        style={{ background: 'var(--primary)' }}
                                    />
                                    Saved &#8212; 18/24 correct
                                </div>
                            </div>
                        </div>

                        {/* Skeleton */}
                        <div className="mt-8">
                            <p
                                className="mb-3 text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground"
                                style={{ fontFamily: 'var(--font-body)' }}
                            >
                                Skeleton Loading
                            </p>
                            <div className="flex max-w-xs flex-col gap-2">
                                <SkeletonText className="h-4 w-[65%] rounded-lg" />
                                <SkeletonText className="h-3 w-full rounded-lg" />
                                <SkeletonText className="h-3 w-[80%] rounded-lg" />
                                <div className="mt-1 flex gap-[6px]">
                                    <Skeleton className="h-7 w-[72px] rounded-full" />
                                    <Skeleton className="h-7 w-[90px] rounded-full" />
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* ================================================================
                        COURSE CARDS & STATS
                       ================================================================ */}
                    <section className="border-b border-[var(--border-2)] py-14">
                        <SectionLabel>Product</SectionLabel>
                        <SectionTitle>Course Cards & Performance</SectionTitle>

                        <div className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-4">
                            {COURSES.map((course) => (
                                <CourseCard key={course.code} {...course} />
                            ))}
                        </div>

                        <div className="mt-6 grid grid-cols-[repeat(auto-fit,minmax(160px,1fr))] gap-3">
                            {STATS.map((stat) => (
                                <StatCard key={stat.label} {...stat} />
                            ))}
                        </div>

                        <div className="mt-6 max-w-[340px]">
                            <StreakWidget count={7} days={STREAK_DAYS} />
                        </div>
                    </section>

                    {/* ================================================================
                        QUESTION & ANSWER
                       ================================================================ */}
                    <section className="border-b border-[var(--border-2)] py-14">
                        <SectionLabel>Product</SectionLabel>
                        <SectionTitle>Question & Answer</SectionTitle>

                        <div className="max-w-[600px]">
                            <QuestionCard
                                institution="MOUAU"
                                courseCode="CSC 201"
                                session="2022/2023"
                                questionNumber={14}
                                totalQuestions={30}
                                questionText="What is the time complexity of binary search on a sorted array of n elements?"
                                options={QUESTION_OPTIONS}
                            />
                        </div>
                    </section>

                    {/* ================================================================
                        TYPOGRAPHY
                       ================================================================ */}
                    <section className="border-b border-[var(--border-2)] py-14">
                        <SectionLabel>Foundation</SectionLabel>
                        <SectionTitle>Typography</SectionTitle>

                        <div className="space-y-0">
                            {[
                                {
                                    label: 'Display XL',
                                    meta: 'font-display \u00B7 800',
                                    style: { fontFamily: 'var(--font-display)', fontSize: '48px', fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1 },
                                    text: 'Master your exams.',
                                },
                                {
                                    label: 'Heading',
                                    meta: 'font-display \u00B7 600',
                                    style: { fontFamily: 'var(--font-display)', fontSize: '28px', fontWeight: 600, letterSpacing: '-0.02em' },
                                    text: 'Computer Science \u2014 200 Level',
                                },
                                {
                                    label: 'Body',
                                    meta: 'font-content \u00B7 15px',
                                    style: { fontFamily: 'var(--font-content)', fontSize: '15px', lineHeight: 1.6, color: 'var(--text-2)' },
                                    text: 'Which of the following best describes the function of mitochondria in eukaryotic cells?',
                                },
                                {
                                    label: 'Caption',
                                    meta: 'font-body \u00B7 11px \u00B7 500',
                                    style: { fontFamily: 'var(--font-body)', fontSize: '11px', fontWeight: 500, color: 'var(--text-muted)', letterSpacing: '0.02em' },
                                    text: 'MOUAU \u00B7 2023/2024 \u00B7 First Semester',
                                },
                            ].map((row, i) => (
                                <div
                                    key={i}
                                    className="grid grid-cols-[160px_1fr] items-baseline gap-4 border-b border-[var(--border-2)] py-3 last:border-b-0 max-md:grid-cols-1 max-md:gap-1"
                                >
                                    <div
                                        className="text-[11px]"
                                        style={{ fontFamily: 'var(--font-body)', color: 'var(--text-muted)' }}
                                    >
                                        {row.label}
                                        <span className="mt-[2px] block text-[10px] opacity-70">{row.meta}</span>
                                    </div>
                                    <div style={row.style}>{row.text}</div>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* ================================================================
                        EMPTY STATE
                       ================================================================ */}
                    <section className="py-14">
                        <SectionLabel>Patterns</SectionLabel>
                        <SectionTitle>Empty State</SectionTitle>

                        <div className="max-w-[400px]">
                            <EmptyState
                                icon={'\uD83D\uDCDD'}
                                title="No practice sessions yet"
                                description="Start practicing past questions to see your progress here."
                                actionLabel="Start Practicing"
                            />
                        </div>
                    </section>
                </div>

                {/* ================================================================
                    FOOTER
                   ================================================================ */}
                <footer
                    className="p-9 text-center"
                    style={{ background: 'var(--bg-hero)' }}
                >
                    <div
                        className="text-[10px] font-semibold uppercase tracking-[0.06em] text-white/35"
                        style={{ fontFamily: 'var(--font-body)' }}
                    >
                        Skoolpad Design System &middot; Three Modes, One Token Architecture
                    </div>
                </footer>
            </div>
        </>
    );
}
