import { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { CheckCircle2, ChevronDown, Circle, Sparkles } from 'lucide-react';
import { TiptapRenderer } from '@/components/shared/tiptap-renderer';
import { DifficultyBadge } from '@/components/skoolpad/block-tree';
import SpBadge from '@/components/skoolpad/sp-badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import AppLayout from '@/layouts/app-layout';
import { QuestionCardExpandable } from '@/pages/courses/partials/question-card-expandable';
import { BlockReader } from '@/pages/topics/partials/block-reader';
import { NotesPanel } from '@/pages/topics/partials/notes-panel';
import { PrerequisiteBanner } from '@/pages/topics/partials/prerequisite-banner';
import { TopicNavigation } from '@/pages/topics/partials/topic-navigation';
import { show as courseShow } from '@/actions/App/Http/Controllers/Student/CourseController';
import { index as questionsIndex } from '@/actions/App/Http/Controllers/Student/QuestionController';
import { toggleComplete } from '@/actions/App/Http/Controllers/Student/TopicController';
import type { BreadcrumbItem } from '@/types';
import type { TopicShowProps } from '@/types/student-topics';
import type { TiptapJSON } from '@/types/tiptap';

export default function TopicShow({
    topic,
    hasBlocks,
    blockTree,
    completedBlockIds,
    lockedBlockIds,
    isTopicCompleted,
    prerequisiteStatus,
    courseContext,
    prevTopic,
    nextTopic,
    relatedQuestions,
    crossInstitutionCount,
}: TopicShowProps) {
    const [localCompleted, setLocalCompleted] = useState(isTopicCompleted);
    const [simpleMode, setSimpleMode] = useState(false);

    const breadcrumbs: BreadcrumbItem[] = [];

    if (courseContext) {
        breadcrumbs.push(
            { title: 'Courses', href: '/courses' },
            { title: courseContext.course_code, href: courseShow.url(courseContext.id) },
            { title: topic.title, href: '#' },
        );
    } else {
        breadcrumbs.push({ title: topic.title, href: '#' });
    }

    function handleToggleComplete() {
        const previous = localCompleted;
        setLocalCompleted(!previous);
        router.post(toggleComplete.url(topic.id), {}, {
            preserveState: true,
            preserveScroll: true,
            onError: () => setLocalCompleted(previous),
        });
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={topic.title} />

            <div className="flex flex-col gap-6 p-4 md:p-6">
                <PrerequisiteBanner status={prerequisiteStatus} courseId={courseContext?.id} />

                <div className="flex items-start justify-between gap-4">
                    <div>
                        <h1 className="font-display text-2xl font-bold tracking-tight">
                            {topic.title}
                        </h1>
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                            {topic.difficulty_level && (
                                <DifficultyBadge level={topic.difficulty_level} />
                            )}
                            {topic.estimated_read_minutes && (
                                <span className="text-[12px] text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                                    {topic.estimated_read_minutes} min read
                                </span>
                            )}
                            {topic.discipline && (
                                <SpBadge variant="primary">{topic.discipline.name}</SpBadge>
                            )}
                            {topic.simplified_content && (
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
                    </div>

                    {!hasBlocks && (
                        <Button
                            variant={localCompleted ? 'default' : 'outline'}
                            size="sm"
                            onClick={handleToggleComplete}
                            className="shrink-0 gap-1.5"
                        >
                            {localCompleted ? (
                                <><CheckCircle2 className="size-4" /> Completed</>
                            ) : (
                                <><Circle className="size-4" /> Mark as completed</>
                            )}
                        </Button>
                    )}
                </div>

                {hasBlocks && blockTree ? (
                    <BlockReader blocks={blockTree} completedBlockIds={completedBlockIds} lockedBlockIds={lockedBlockIds} />
                ) : (
                    topic.content && (
                        <div
                            className={`rounded-lg border p-6 ${simpleMode ? 'border-primary/30 bg-primary/5' : 'border-border bg-card'}`}
                            style={{ borderRadius: 'var(--card-radius)' }}
                        >
                            {simpleMode && (
                                <div className="mb-3 flex items-center gap-2">
                                    <Sparkles className="size-4 text-primary" />
                                    <span
                                        className="text-[11px] font-semibold uppercase tracking-wider text-primary"
                                        style={{ fontFamily: 'var(--font-body)' }}
                                    >
                                        Simple Mode
                                    </span>
                                </div>
                            )}
                            <TiptapRenderer content={
                                (simpleMode && topic.simplified_content ? topic.simplified_content : topic.content) as TiptapJSON
                            } />
                        </div>
                    )
                )}

                {relatedQuestions.length > 0 && (
                    <div>
                        <h2 className="mb-3 font-display text-lg font-semibold tracking-tight">
                            Related Questions
                        </h2>
                        <div className="space-y-3">
                            {relatedQuestions.map((question) => (
                                <QuestionCardExpandable key={question.id} question={question} />
                            ))}
                        </div>
                        {crossInstitutionCount > relatedQuestions.length && (
                            <Collapsible className="mt-3">
                                <CollapsibleTrigger className="group flex items-center gap-1.5 text-[12px] font-medium text-primary hover:underline" style={{ fontFamily: 'var(--font-body)' }}>
                                    <ChevronDown className="size-3.5 transition-transform group-data-[state=open]:rotate-180" />
                                    {crossInstitutionCount} questions from other institutions cover this topic
                                </CollapsibleTrigger>
                                <CollapsibleContent>
                                    <p className="mt-2 text-[12px] text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                                        Questions on this topic appear across multiple institutions. Browse all available questions in the{' '}
                                        <Link
                                            href={questionsIndex.url({ query: { topic_id: topic.id } })}
                                            className="font-medium text-primary hover:underline"
                                        >
                                            Past Questions browser
                                        </Link>.
                                    </p>
                                </CollapsibleContent>
                            </Collapsible>
                        )}
                    </div>
                )}

                <NotesPanel />

                {courseContext && (
                    <TopicNavigation
                        prevTopic={prevTopic}
                        nextTopic={nextTopic}
                        courseId={courseContext.id}
                    />
                )}
            </div>
        </AppLayout>
    );
}
