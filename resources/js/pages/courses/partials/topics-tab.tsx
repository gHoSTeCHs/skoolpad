import { Link } from '@inertiajs/react';
import { BookOpen, CheckCircle2 } from 'lucide-react';
import { DifficultyBadge } from '@/components/skoolpad/block-tree';
import SpBadge from '@/components/skoolpad/sp-badge';
import EmptyState from '@/components/skoolpad/empty-state';
import { Progress } from '@/components/ui/progress';
import type { CourseTopicItem, TopicsProgress } from '@/types/student-courses';

interface TopicsTabProps {
    topics: CourseTopicItem[];
    progress: TopicsProgress;
    courseId: string;
}

export function TopicsTab({ topics, progress, courseId }: TopicsTabProps) {
    const hasBlocks = progress.total_blocks > 0;
    const progressPercent = hasBlocks
        ? (progress.total_blocks > 0 ? Math.round((progress.completed_blocks / progress.total_blocks) * 100) : 0)
        : (progress.total > 0 ? Math.round((progress.completed / progress.total) * 100) : 0);

    if (topics.length === 0) {
        return (
            <EmptyState
                icon={'\uD83D\uDCDA'}
                title="No topics mapped"
                description="This course doesn't have any topics mapped yet."
            />
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4 rounded-lg border border-border bg-card p-4" style={{ borderRadius: 'var(--card-radius)' }}>
                <div className="flex-1">
                    <div className="flex items-baseline justify-between">
                        <span className="text-[13px] font-medium" style={{ fontFamily: 'var(--font-body)' }}>
                            {hasBlocks
                                ? `${progress.completed_blocks} of ${progress.total_blocks} blocks completed`
                                : `${progress.completed} of ${progress.total} topics completed`
                            }
                        </span>
                        <span className="text-[12px] text-muted-foreground">{progressPercent}%</span>
                    </div>
                    <Progress value={progressPercent} className="mt-2 h-2" />
                </div>
            </div>

            <div className="space-y-2">
                {topics.map((topic) => (
                    <Link
                        key={topic.id}
                        href={`/topics/${topic.id}?course=${courseId}`}
                        className="flex items-center gap-4 rounded-lg border border-border bg-card p-4 transition-colors hover:bg-accent/30"
                        style={{ borderRadius: 'var(--card-radius)' }}
                        prefetch
                    >
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--bg-raised)] text-[13px] font-semibold text-muted-foreground">
                            {topic.sequence_order}
                        </div>

                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                                <span
                                    className="truncate text-[14px] font-medium"
                                    style={{ fontFamily: 'var(--font-display)' }}
                                >
                                    {topic.title}
                                </span>
                                {topic.total_blocks > 0 ? (
                                    topic.completed_blocks >= topic.total_blocks ? (
                                        <CheckCircle2 className="size-4 shrink-0 text-green-500" />
                                    ) : topic.completed_blocks > 0 ? (
                                        <span className="shrink-0 text-[11px] text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                                            {topic.completed_blocks}/{topic.total_blocks}
                                        </span>
                                    ) : null
                                ) : (
                                    topic.is_completed && (
                                        <CheckCircle2 className="size-4 shrink-0 text-green-500" />
                                    )
                                )}
                            </div>
                            <div className="mt-1 flex flex-wrap items-center gap-2">
                                {topic.difficulty_level && (
                                    <DifficultyBadge level={topic.difficulty_level} />
                                )}
                                {topic.weight && (
                                    <SpBadge variant={topic.weight === 'core' ? 'primary' : 'reward'}>
                                        {topic.weight}
                                    </SpBadge>
                                )}
                                {topic.estimated_read_minutes && (
                                    <span className="text-[11px] text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                                        {topic.estimated_read_minutes} min read
                                    </span>
                                )}
                                {topic.question_count > 0 && (
                                    <span className="flex items-center gap-1 text-[11px] text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                                        <BookOpen className="size-3" />
                                        {topic.question_count} Q{topic.question_count !== 1 ? 's' : ''}
                                    </span>
                                )}
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}
