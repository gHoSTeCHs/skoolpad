import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import SpBadge from '@/components/skoolpad/sp-badge';
import { QuestionTypeBadge } from '@/components/skoolpad/questions';
import { DifficultyBadge } from '@/components/skoolpad/block-tree';
import { TiptapRenderer } from '@/components/shared/tiptap-renderer';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import type { CourseQuestion } from '@/types/student-courses';
import type { TiptapJSON } from '@/types/tiptap';

interface QuestionCardExpandableProps {
    question: CourseQuestion;
    showCourseBadge?: boolean;
    courseCode?: string;
    institutionAbbreviation?: string;
}

export function QuestionCardExpandable({
    question,
    showCourseBadge = false,
    courseCode,
    institutionAbbreviation,
}: QuestionCardExpandableProps) {
    const [isExpanded, setIsExpanded] = useState(false);

    const publishedAnswers = question.answers.filter((a) => a.is_published);
    const primaryTopic = question.topic_links?.find((tl) => tl.is_primary)?.canonical_topic;

    const contentPreview = question.content
        ? question.content.replace(/<[^>]*>/g, '').slice(0, 150)
        : '';

    return (
        <div
            className="overflow-hidden border border-border bg-card transition-all"
            style={{ borderRadius: 'var(--card-radius)' }}
        >
            <button
                type="button"
                onClick={() => setIsExpanded(!isExpanded)}
                className="flex w-full cursor-pointer items-start gap-3 p-4 text-left transition-colors hover:bg-accent/30"
            >
                <div className="flex-1 space-y-2">
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
                        {showCourseBadge && courseCode && (
                            <SpBadge variant="reward">{courseCode}</SpBadge>
                        )}
                        {showCourseBadge && institutionAbbreviation && (
                            <span className="text-[11px] text-muted-foreground">{institutionAbbreviation}</span>
                        )}
                    </div>

                    {!isExpanded && (
                        <p
                            className="line-clamp-2 text-[13px] leading-relaxed"
                            style={{ fontFamily: 'var(--font-body)', color: 'var(--text-2)' }}
                        >
                            {contentPreview}{contentPreview.length >= 150 ? '...' : ''}
                        </p>
                    )}

                    {primaryTopic && (
                        <div className="text-[11px] text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                            {primaryTopic.title}
                        </div>
                    )}
                </div>

                <ChevronDown
                    className={cn(
                        'mt-1 size-4 shrink-0 text-muted-foreground transition-transform duration-200',
                        isExpanded && 'rotate-180',
                    )}
                />
            </button>

            {isExpanded && (
                <div className="border-t border-border px-4 pb-4 pt-3">
                    <div
                        className="prose prose-sm max-w-none text-[13px]"
                        style={{ fontFamily: 'var(--font-body)' }}
                        dangerouslySetInnerHTML={{ __html: question.content }}
                    />

                    {publishedAnswers.length > 0 && (
                        <div className="mt-4">
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
                                        <div className="mt-3 rounded-lg border border-border bg-[var(--bg-raised)] p-4">
                                            <TiptapRenderer content={answer.content as TiptapJSON} />
                                        </div>
                                    </TabsContent>
                                ))}
                            </Tabs>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
