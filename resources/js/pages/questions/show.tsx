import { Head, Link } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import SpBadge from '@/components/skoolpad/sp-badge';
import { QuestionTypeBadge } from '@/components/skoolpad/questions';
import { DifficultyBadge } from '@/components/skoolpad/block-tree';
import { TiptapRenderer } from '@/components/shared/tiptap-renderer';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AppLayout from '@/layouts/app-layout';
import { index as questionsIndex } from '@/actions/App/Http/Controllers/Student/QuestionController';
import type { BreadcrumbItem } from '@/types';
import type { BrowseQuestion } from '@/types/student-questions';
import type { TiptapJSON } from '@/types/tiptap';

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
                    <div
                        className="prose prose-sm max-w-none text-[14px]"
                        style={{ fontFamily: 'var(--font-body)' }}
                        dangerouslySetInnerHTML={{ __html: question.content }}
                    />
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
                                <SpBadge variant="info">{primaryTopic.title}</SpBadge>
                            )}
                            {otherTopics.map((tl) => (
                                <SpBadge key={tl.id} variant="default">{tl.canonical_topic.title}</SpBadge>
                            ))}
                        </div>
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
                                        <TiptapRenderer content={answer.content as TiptapJSON} />
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
