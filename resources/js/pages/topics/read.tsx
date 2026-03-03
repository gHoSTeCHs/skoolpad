import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, BookOpen, CheckCircle2, ChevronDown, Clock, List, Sparkles } from 'lucide-react';
import { ContentRenderer } from '@/components/shared/content-renderer';
import { DifficultyBadge } from '@/components/skoolpad/block-tree';
import SpBadge from '@/components/skoolpad/sp-badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import AppLayout from '@/layouts/app-layout';
import { show as topicShow } from '@/actions/App/Http/Controllers/Student/TopicController';
import { show as courseShow } from '@/actions/App/Http/Controllers/Student/CourseController';
import { cn } from '@/lib/utils';
import type { BreadcrumbItem } from '@/types';
import type { TopicBlock, TopicReadProps } from '@/types/student-topics';
import type { RenderableContent } from '@/types/tiptap';

interface TocEntry {
    id: string;
    title: string;
    path: string;
    depth: number;
    isContainer: boolean;
}

function buildTocEntries(blocks: TopicBlock[], depth = 0): TocEntry[] {
    const entries: TocEntry[] = [];
    for (const block of blocks) {
        entries.push({
            id: block.id,
            title: block.title,
            path: block.path,
            depth,
            isContainer: block.isContainer,
        });
        if (block.children.length) {
            entries.push(...buildTocEntries(block.children, depth + 1));
        }
    }
    return entries;
}

function hasSimplifiedContent(blocks: TopicBlock[]): boolean {
    for (const block of blocks) {
        if (block.simplifiedContent) return true;
        if (hasSimplifiedContent(block.children)) return true;
    }
    return false;
}

function depthToHeading(depth: number): 'h2' | 'h3' | 'h4' | 'h5' {
    if (depth === 0) return 'h2';
    if (depth === 1) return 'h3';
    if (depth === 2) return 'h4';
    return 'h5';
}

function BlockSection({
    block,
    depth,
    completedBlockIds,
    simpleMode,
}: {
    block: TopicBlock;
    depth: number;
    completedBlockIds: string[];
    simpleMode: boolean;
}) {
    const HeadingTag = depthToHeading(depth);
    const isCompleted = completedBlockIds.includes(block.id);
    const content = simpleMode && block.simplifiedContent ? block.simplifiedContent : block.content;

    const headingSizes: Record<string, string> = {
        h2: 'text-2xl',
        h3: 'text-xl',
        h4: 'text-lg',
        h5: 'text-base',
    };

    return (
        <section id={`block-${block.id}`} className="scroll-mt-24">
            <div className="flex items-start gap-2">
                {isCompleted && (
                    <CheckCircle2 className="mt-1 size-4 shrink-0 text-green-500" />
                )}
                <HeadingTag
                    className={cn(
                        'font-semibold tracking-tight',
                        headingSizes[HeadingTag],
                    )}
                    style={{ fontFamily: 'var(--font-display)' }}
                >
                    {block.path && (
                        <span className="mr-2 text-muted-foreground">{block.path}</span>
                    )}
                    {block.title}
                </HeadingTag>
            </div>

            {content && (
                <div className="mt-3">
                    <ContentRenderer content={content as RenderableContent} />
                </div>
            )}

            {block.children.length > 0 && (
                <div className="mt-6 space-y-8">
                    {block.children.map((child) => (
                        <BlockSection
                            key={child.id}
                            block={child}
                            depth={depth + 1}
                            completedBlockIds={completedBlockIds}
                            simpleMode={simpleMode}
                        />
                    ))}
                </div>
            )}
        </section>
    );
}

export default function TopicRead({
    topic,
    blockTree,
    completedBlockIds,
    courseContext,
    totalReadTime,
}: TopicReadProps) {
    const [simpleMode, setSimpleMode] = useState(false);
    const [activeId, setActiveId] = useState<string | null>(null);
    const [tocOpen, setTocOpen] = useState(false);
    const observerRef = useRef<IntersectionObserver | null>(null);

    const tocEntries = useMemo(
        () => (blockTree ? buildTocEntries(blockTree) : []),
        [blockTree],
    );

    const showEli12Toggle = useMemo(() => {
        if (topic.simplified_content) return true;
        return blockTree ? hasSimplifiedContent(blockTree) : false;
    }, [topic, blockTree]);

    const backUrl = useMemo(() => {
        if (courseContext) {
            return topicShow.url(topic.id, { query: { course: courseContext.id } });
        }
        return topicShow.url(topic.id);
    }, [topic.id, courseContext]);

    const setupObserver = useCallback(() => {
        if (observerRef.current) {
            observerRef.current.disconnect();
        }

        const sectionElements = tocEntries.map(
            (entry) => document.getElementById(`block-${entry.id}`),
        ).filter(Boolean) as HTMLElement[];

        if (!sectionElements.length) return;

        observerRef.current = new IntersectionObserver(
            (entries) => {
                const visible = entries.filter((e) => e.isIntersecting);
                if (visible.length > 0) {
                    const topmost = visible.reduce((prev, curr) =>
                        prev.boundingClientRect.top < curr.boundingClientRect.top ? prev : curr,
                    );
                    const id = topmost.target.id.replace('block-', '');
                    setActiveId(id);
                }
            },
            { rootMargin: '-80px 0px -60% 0px', threshold: 0 },
        );

        for (const el of sectionElements) {
            observerRef.current.observe(el);
        }
    }, [tocEntries]);

    useEffect(() => {
        const timer = setTimeout(setupObserver, 100);
        return () => {
            clearTimeout(timer);
            observerRef.current?.disconnect();
        };
    }, [setupObserver]);

    const breadcrumbs: BreadcrumbItem[] = [];
    if (courseContext) {
        breadcrumbs.push(
            { title: 'Courses', href: '/courses' },
            { title: courseContext.course_code, href: courseShow.url(courseContext.id) },
            { title: topic.title, href: backUrl },
            { title: 'Read', href: '#' },
        );
    } else {
        breadcrumbs.push(
            { title: topic.title, href: backUrl },
            { title: 'Read', href: '#' },
        );
    }

    const readTimeDisplay = totalReadTime > 0
        ? `${totalReadTime} min`
        : topic.estimated_read_minutes
            ? `${topic.estimated_read_minutes} min`
            : null;

    function scrollToBlock(id: string) {
        const el = document.getElementById(`block-${id}`);
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
            setTocOpen(false);
        }
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`${topic.title} — Read`} />

            <div className="flex flex-col gap-6 p-4 md:p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                        <Link
                            href={backUrl}
                            className="mb-2 inline-flex items-center gap-1.5 text-[12px] font-medium text-muted-foreground transition-colors hover:text-foreground"
                            style={{ fontFamily: 'var(--font-body)' }}
                        >
                            <ArrowLeft className="size-3.5" />
                            Back to topic
                        </Link>
                        <h1 className="font-display text-2xl font-bold tracking-tight">
                            {topic.title}
                        </h1>
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                            {topic.difficulty_level && (
                                <DifficultyBadge level={topic.difficulty_level} />
                            )}
                            {readTimeDisplay && (
                                <span
                                    className="inline-flex items-center gap-1 text-[12px] text-muted-foreground"
                                    style={{ fontFamily: 'var(--font-body)' }}
                                >
                                    <Clock className="size-3" />
                                    {readTimeDisplay} read
                                </span>
                            )}
                            {topic.discipline && (
                                <SpBadge variant="primary">{topic.discipline.name}</SpBadge>
                            )}
                        </div>
                    </div>

                    {showEli12Toggle && (
                        <Button
                            variant={simpleMode ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setSimpleMode(!simpleMode)}
                            className="gap-1.5"
                        >
                            <Sparkles className="size-3.5" />
                            {simpleMode ? 'Simple Mode' : 'ELI12'}
                        </Button>
                    )}
                </div>

                {simpleMode && (
                    <div
                        className="flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/5 px-3 py-2"
                        style={{ borderRadius: 'var(--card-radius)' }}
                    >
                        <Sparkles className="size-4 text-primary" />
                        <span
                            className="text-[12px] font-medium text-primary"
                            style={{ fontFamily: 'var(--font-body)' }}
                        >
                            Simple Mode is on — all content is shown in simplified form where available.
                        </span>
                    </div>
                )}

                {blockTree && blockTree.length > 0 ? (
                    <div className="grid gap-6 lg:grid-cols-[1fr_240px]">
                        <div>
                            <div className="lg:hidden">
                                <Collapsible open={tocOpen} onOpenChange={setTocOpen}>
                                    <CollapsibleTrigger asChild>
                                        <Button variant="outline" size="sm" className="mb-4 w-full justify-between gap-2">
                                            <span className="flex items-center gap-2">
                                                <List className="size-4" />
                                                Table of Contents
                                            </span>
                                            <ChevronDown className={cn(
                                                'size-4 transition-transform',
                                                tocOpen && 'rotate-180',
                                            )} />
                                        </Button>
                                    </CollapsibleTrigger>
                                    <CollapsibleContent>
                                        <nav
                                            className="mb-6 rounded-lg border border-border bg-card p-3"
                                            style={{ borderRadius: 'var(--card-radius)' }}
                                        >
                                            <ul className="space-y-0.5">
                                                {tocEntries.map((entry) => (
                                                    <li key={entry.id}>
                                                        <button
                                                            onClick={() => scrollToBlock(entry.id)}
                                                            className={cn(
                                                                'w-full rounded-md px-2 py-1.5 text-left text-[13px] transition-colors hover:bg-accent',
                                                                activeId === entry.id && 'bg-accent font-medium text-accent-foreground',
                                                                activeId !== entry.id && 'text-muted-foreground',
                                                            )}
                                                            style={{
                                                                paddingLeft: `${(entry.depth * 12) + 8}px`,
                                                                fontFamily: 'var(--font-body)',
                                                            }}
                                                        >
                                                            {entry.path && (
                                                                <span className="mr-1.5 text-[11px] opacity-60">{entry.path}</span>
                                                            )}
                                                            {entry.title}
                                                        </button>
                                                    </li>
                                                ))}
                                            </ul>
                                        </nav>
                                    </CollapsibleContent>
                                </Collapsible>
                            </div>

                            <article className="mx-auto max-w-3xl space-y-10">
                                {topic.content && !blockTree.length && (
                                    <div>
                                        <ContentRenderer content={
                                            (simpleMode && topic.simplified_content
                                                ? topic.simplified_content
                                                : topic.content) as RenderableContent
                                        } />
                                    </div>
                                )}

                                {blockTree.map((block, index) => (
                                    <div key={block.id}>
                                        {index > 0 && (
                                            <hr className="mb-10 border-border" />
                                        )}
                                        <BlockSection
                                            block={block}
                                            depth={0}
                                            completedBlockIds={completedBlockIds}
                                            simpleMode={simpleMode}
                                        />
                                    </div>
                                ))}
                            </article>

                            <div className="mx-auto mt-10 max-w-3xl border-t border-border pt-6">
                                <Link
                                    href={backUrl}
                                    className="inline-flex items-center gap-2 text-[13px] font-medium text-primary transition-colors hover:text-primary/80"
                                    style={{ fontFamily: 'var(--font-body)' }}
                                >
                                    <ArrowLeft className="size-4" />
                                    Back to interactive view
                                </Link>
                            </div>
                        </div>

                        <aside className="hidden lg:block">
                            <nav
                                className="sticky top-24 rounded-lg border border-border bg-card p-3"
                                style={{ borderRadius: 'var(--card-radius)' }}
                            >
                                <div className="mb-2 flex items-center gap-2 px-2">
                                    <BookOpen className="size-3.5 text-muted-foreground" />
                                    <span
                                        className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground"
                                        style={{ fontFamily: 'var(--font-body)' }}
                                    >
                                        Contents
                                    </span>
                                </div>
                                <ul className="max-h-[60vh] space-y-0.5 overflow-y-auto">
                                    {tocEntries.map((entry) => (
                                        <li key={entry.id}>
                                            <button
                                                onClick={() => scrollToBlock(entry.id)}
                                                className={cn(
                                                    'w-full rounded-md px-2 py-1.5 text-left text-[12px] transition-colors hover:bg-accent',
                                                    activeId === entry.id && 'bg-accent font-medium text-accent-foreground',
                                                    activeId !== entry.id && 'text-muted-foreground',
                                                )}
                                                style={{
                                                    paddingLeft: `${(entry.depth * 10) + 8}px`,
                                                    fontFamily: 'var(--font-body)',
                                                }}
                                            >
                                                {entry.path && (
                                                    <span className="mr-1 text-[10px] opacity-60">{entry.path}</span>
                                                )}
                                                <span className="line-clamp-2">{entry.title}</span>
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            </nav>
                        </aside>
                    </div>
                ) : topic.content ? (
                    <article className="mx-auto max-w-3xl">
                        <ContentRenderer content={
                            (simpleMode && topic.simplified_content
                                ? topic.simplified_content
                                : topic.content) as RenderableContent
                        } />
                        <div className="mt-10 border-t border-border pt-6">
                            <Link
                                href={backUrl}
                                className="inline-flex items-center gap-2 text-[13px] font-medium text-primary transition-colors hover:text-primary/80"
                                style={{ fontFamily: 'var(--font-body)' }}
                            >
                                <ArrowLeft className="size-4" />
                                Back to interactive view
                            </Link>
                        </div>
                    </article>
                ) : (
                    <div
                        className="flex flex-col items-center justify-center gap-3 rounded-lg border border-border bg-card py-16"
                        style={{ borderRadius: 'var(--card-radius)' }}
                    >
                        <BookOpen className="size-8 text-muted-foreground" />
                        <p
                            className="text-sm text-muted-foreground"
                            style={{ fontFamily: 'var(--font-body)' }}
                        >
                            No content available for this topic yet.
                        </p>
                        <Link
                            href={backUrl}
                            className="mt-2 inline-flex items-center gap-1.5 text-[13px] font-medium text-primary hover:text-primary/80"
                            style={{ fontFamily: 'var(--font-body)' }}
                        >
                            <ArrowLeft className="size-3.5" />
                            Back to topic
                        </Link>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
