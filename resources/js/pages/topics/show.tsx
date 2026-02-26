import { Head, router } from '@inertiajs/react';
import { CheckCircle2, Circle } from 'lucide-react';
import { TiptapRenderer } from '@/components/shared/tiptap-renderer';
import { DifficultyBadge } from '@/components/skoolpad/block-tree';
import SpBadge from '@/components/skoolpad/sp-badge';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { QuestionCardExpandable } from '@/pages/courses/partials/question-card-expandable';
import { BlockReader } from '@/pages/topics/partials/block-reader';
import { NotesPanel } from '@/pages/topics/partials/notes-panel';
import { PrerequisiteBanner } from '@/pages/topics/partials/prerequisite-banner';
import { TopicNavigation } from '@/pages/topics/partials/topic-navigation';
import { show as courseShow } from '@/actions/App/Http/Controllers/Student/CourseController';
import { toggleComplete } from '@/actions/App/Http/Controllers/Student/TopicController';
import type { BreadcrumbItem } from '@/types';
import type { TopicShowProps } from '@/types/student-topics';
import type { TiptapJSON } from '@/types/tiptap';

export default function TopicShow({
    topic,
    hasBlocks,
    blockTree,
    completedBlockIds,
    isTopicCompleted,
    prerequisiteStatus,
    courseContext,
    prevTopic,
    nextTopic,
    relatedQuestions,
    crossInstitutionCount,
}: TopicShowProps) {
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
        router.post(toggleComplete.url(topic.id), {}, { preserveState: true, preserveScroll: true });
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
                        </div>
                    </div>

                    {!hasBlocks && (
                        <Button
                            variant={isTopicCompleted ? 'default' : 'outline'}
                            size="sm"
                            onClick={handleToggleComplete}
                            className="shrink-0 gap-1.5"
                        >
                            {isTopicCompleted ? (
                                <><CheckCircle2 className="size-4" /> Completed</>
                            ) : (
                                <><Circle className="size-4" /> Mark as completed</>
                            )}
                        </Button>
                    )}
                </div>

                {hasBlocks && blockTree ? (
                    <BlockReader blocks={blockTree} completedBlockIds={completedBlockIds} />
                ) : (
                    topic.content && (
                        <div className="rounded-lg border border-border bg-card p-6" style={{ borderRadius: 'var(--card-radius)' }}>
                            <TiptapRenderer content={topic.content as TiptapJSON} />
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
                            <p className="mt-3 text-[12px] text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                                {crossInstitutionCount} questions across all institutions cover this topic.
                            </p>
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
