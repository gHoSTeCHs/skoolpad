import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, Dumbbell, ExternalLink } from 'lucide-react';
import PracticeController from '@/actions/App/Http/Controllers/Student/PracticeController';
import { Button } from '@/components/ui/button';
import SpBadge from '@/components/skoolpad/sp-badge';
import { QuestionTypeBadge } from '@/components/skoolpad/questions';
import { DifficultyBadge } from '@/components/skoolpad/block-tree';
import { ContentRenderer } from '@/components/shared/content-renderer';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AppLayout from '@/layouts/app-layout';
import { index as questionsIndex } from '@/actions/App/Http/Controllers/Student/QuestionController';
import { read as topicRead } from '@/actions/App/Http/Controllers/Student/TopicController';
import type { BreadcrumbItem } from '@/types';
import type { BrowseQuestion } from '@/types/student-questions';
import type { RenderableContent } from '@/types/tiptap';

interface QuestionShowProps {
    question: BrowseQuestion;
}

export default function QuestionShow({ question }: QuestionShowProps) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Past Questions', href: questionsIndex.url() },
        { title: `Question`, href: '#' },
    ];

    const publishedAnswers = question.answers.filter((a) => a.is_published);
    const primaryTopic = question.topic_links?.find((tl) => tl.is_primary)?.canonical_topic;
    const otherTopics = question.topic_links?.filter((tl) => !tl.is_primary) ?? [];
    const primaryBlock = question.question_block_links?.find((bl) => bl.relevance === 'primary');

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Question Detail" />

            <div className="flex flex-col gap-6 p-4 md:p-6">
                <div>
                    <Link
                        href={questionsIndex.url()}
                        className="mb-3 inline-flex items-center gap-1.5 text-[13px] text-muted-foreground transition-colors hover:text-foreground"
                        style={{ fontFamily: 'var(--font-body)' }}
                    >
                        <ArrowLeft className="size-3.5" />
                        Back to questions
                    </Link>

                    <div className="flex flex-wrap items-center gap-2">
                        <QuestionTypeBadge type={question.question_type} />
                        {question.difficulty_level && (
                            <DifficultyBadge level={question.difficulty_level} />
                        )}
                        {question.year && (
                            <SpBadge variant="primary">{question.year}</SpBadge>
                        )}
                        {question.semester && (
                            <SpBadge variant="primary">{question.semester === 'first' ? '1st' : '2nd'} Sem</SpBadge>
                        )}
                        {question.marks && (
                            <span className="text-[11px] text-muted-foreground">{question.marks} mark{question.marks !== 1 ? 's' : ''}</span>
                        )}
                        <Button
                            variant="outline"
                            size="sm"
                            className="gap-1.5"
                            onClick={() => router.post(PracticeController.start.url(), {
                                question_id: question.id,
                                mode: 'untimed',
                            })}
                        >
                            <Dumbbell className="size-3.5" />
                            Practice this
                        </Button>
                    </div>

                    {question.institution_course && (
                        <div className="mt-2 flex items-center gap-2 text-[12px] text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                            <SpBadge variant="reward">{question.institution_course.course_code}</SpBadge>
                            {question.institution_course.institution && (
                                <span>{question.institution_course.institution.abbreviation}</span>
                            )}
                        </div>
                    )}
                </div>

                <div
                    className="rounded-lg border border-border bg-card p-5"
                    style={{ borderRadius: 'var(--card-radius)' }}
                >
                    <ContentRenderer content={question.content} className="text-[14px]" />
                </div>

                {(primaryTopic || otherTopics.length > 0) && (
                    <div>
                        <h3
                            className="mb-2 text-[12px] font-medium uppercase tracking-wider text-muted-foreground"
                            style={{ fontFamily: 'var(--font-body)' }}
                        >
                            Topics
                        </h3>
                        <div className="flex flex-wrap gap-2">
                            {primaryTopic && (
                                <SpBadge variant="neutral">{primaryTopic.title}</SpBadge>
                            )}
                            {otherTopics.map((tl) => (
                                <SpBadge key={tl.id} variant="neutral">{tl.canonical_topic.title}</SpBadge>
                            ))}
                        </div>
                    </div>
                )}

                {primaryBlock && (
                    <div>
                        <h3
                            className="mb-2 text-[12px] font-medium uppercase tracking-wider text-muted-foreground"
                            style={{ fontFamily: 'var(--font-body)' }}
                        >
                            Relevant Block
                        </h3>
                        <Link
                            href={`${topicRead.url(primaryBlock.content_block.canonical_topic_id)}#block-${primaryBlock.content_block_id}`}
                            className="inline-flex items-center gap-1.5 text-[13px] font-medium text-primary hover:underline"
                            style={{ fontFamily: 'var(--font-body)' }}
                        >
                            {primaryBlock.content_block.title}
                            <ExternalLink className="size-3" />
                        </Link>
                    </div>
                )}

                {publishedAnswers.length > 0 && (
                    <div>
                        <h3
                            className="mb-3 text-[12px] font-medium uppercase tracking-wider text-muted-foreground"
                            style={{ fontFamily: 'var(--font-body)' }}
                        >
                            Answers
                        </h3>
                        <Tabs defaultValue={publishedAnswers[0].depth_level}>
                            <TabsList variant="line">
                                {publishedAnswers.map((answer) => (
                                    <TabsTrigger key={answer.depth_level} value={answer.depth_level}>
                                        {answer.depth_level === 'quick' && 'Quick'}
                                        {answer.depth_level === 'standard' && 'Standard'}
                                        {answer.depth_level === 'deep_dive' && 'Deep Dive'}
                                    </TabsTrigger>
                                ))}
                            </TabsList>
                            {publishedAnswers.map((answer) => (
                                <TabsContent key={answer.depth_level} value={answer.depth_level}>
                                    <div
                                        className="mt-3 rounded-lg border border-border bg-[var(--bg-raised)] p-5"
                                        style={{ borderRadius: 'var(--card-radius)' }}
                                    >
                                        <ContentRenderer content={answer.content as RenderableContent} />
                                    </div>
                                </TabsContent>
                            ))}
                        </Tabs>
                    </div>
                )}

                {publishedAnswers.length === 0 && (
                    <div
                        className="rounded-lg border border-dashed border-border p-6 text-center"
                        style={{ borderRadius: 'var(--card-radius)' }}
                    >
                        <p className="text-[13px] text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                            No answers have been published for this question yet.
                        </p>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
