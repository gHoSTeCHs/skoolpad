import { useState } from 'react';
import { Link } from '@inertiajs/react';
import { Check, ChevronDown, Dumbbell, ExternalLink, Info, X } from 'lucide-react';
import SpBadge from '@/components/skoolpad/sp-badge';
import { QuestionTypeBadge } from '@/components/skoolpad/questions';
import { DifficultyBadge } from '@/components/skoolpad/block-tree';
import { TiptapRenderer } from '@/components/shared/tiptap-renderer';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { show as topicShow } from '@/actions/App/Http/Controllers/Student/TopicController';
import type { CourseQuestion } from '@/types/student-courses';
import type { AnswerDepthLevel } from '@/types/questions';
import type { TiptapJSON } from '@/types/tiptap';

interface QuestionCardExpandableProps {
    question: CourseQuestion;
    showCourseBadge?: boolean;
    courseCode?: string;
    institutionAbbreviation?: string;
}

const ALL_DEPTHS: { key: AnswerDepthLevel; label: string }[] = [
    { key: 'quick', label: 'Quick' },
    { key: 'standard', label: 'Standard' },
    { key: 'deep_dive', label: 'Deep Dive' },
];

export function QuestionCardExpandable({
    question,
    showCourseBadge = false,
    courseCode,
    institutionAbbreviation,
}: QuestionCardExpandableProps) {
    const [isExpanded, setIsExpanded] = useState(false);

    const publishedAnswers = question.answers.filter((a) => a.is_published);
    const publishedDepths = new Set(publishedAnswers.map((a) => a.depth_level));
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
                        <>
                            <p
                                className="line-clamp-2 text-[13px] leading-relaxed"
                                style={{ fontFamily: 'var(--font-body)', color: 'var(--text-2)' }}
                            >
                                {contentPreview}{contentPreview.length >= 150 ? '...' : ''}
                            </p>
                            <div className="flex flex-wrap items-center gap-2">
                                {ALL_DEPTHS.map(({ key, label }) => (
                                    <span
                                        key={key}
                                        className={cn(
                                            'flex items-center gap-0.5 text-[10px]',
                                            publishedDepths.has(key) ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground/60',
                                        )}
                                    >
                                        {publishedDepths.has(key) ? <Check className="size-2.5" /> : <X className="size-2.5" />}
                                        {label}
                                    </span>
                                ))}
                            </div>
                        </>
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

                    <div className="mt-4">
                        <Tabs defaultValue={publishedAnswers.length > 0 ? publishedAnswers[0].depth_level : 'quick'}>
                            <TabsList variant="line">
                                {ALL_DEPTHS.map(({ key, label }) => (
                                    <TabsTrigger key={key} value={key}>
                                        {label}
                                    </TabsTrigger>
                                ))}
                            </TabsList>
                            {ALL_DEPTHS.map(({ key }) => {
                                const answer = publishedAnswers.find((a) => a.depth_level === key);
                                return (
                                    <TabsContent key={key} value={key}>
                                        {answer ? (
                                            <div className="mt-3 rounded-lg border border-border bg-[var(--bg-raised)] p-4">
                                                <TiptapRenderer content={answer.content as TiptapJSON} />
                                            </div>
                                        ) : (
                                            <div className="mt-3 flex items-center gap-2 rounded-lg border border-dashed border-border p-4 text-muted-foreground">
                                                <Info className="size-4 shrink-0" />
                                                <span className="text-[13px]" style={{ fontFamily: 'var(--font-body)' }}>
                                                    Explanation coming soon
                                                </span>
                                            </div>
                                        )}
                                    </TabsContent>
                                );
                            })}
                        </Tabs>
                    </div>

                    <div className="mt-4 flex flex-wrap items-center gap-3">
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button variant="outline" size="sm" disabled className="gap-1.5 opacity-60">
                                        <Dumbbell className="size-3.5" />
                                        Practice this
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>Available in a future update</TooltipContent>
                            </Tooltip>
                        </TooltipProvider>

                        {primaryTopic && (
                            <Link
                                href={topicShow.url(primaryTopic.id)}
                                className="flex items-center gap-1 text-[12px] font-medium text-primary hover:underline"
                                style={{ fontFamily: 'var(--font-body)' }}
                            >
                                View topic: {primaryTopic.title}
                                <ExternalLink className="size-3" />
                            </Link>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
