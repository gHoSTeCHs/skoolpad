import { cn } from '@/lib/utils';
import { StatusPill, type PillTone } from './status-pill';
import type { TopicWithBlocks } from '@/types/content-studio';

interface TopicsColumnProps {
    topics: TopicWithBlocks[];
    activeTopicId: string | null;
    onTopicClick: (topicId: string) => void;
}

interface TopicSummary {
    approved: number;
    total: number;
    isPublished: boolean;
}

function summarize(topic: TopicWithBlocks): TopicSummary {
    const leaves = topic.blocks.filter((b) => !b.is_container);
    const approved = leaves.filter((b) => b.generation_status === 'approved').length;
    return { approved, total: leaves.length, isPublished: topic.is_published };
}

function pillFor(summary: TopicSummary): { tone: PillTone; label: string } | null {
    if (summary.isPublished) return { tone: 'success', label: 'Published' };
    if (summary.total > 0 && summary.approved === summary.total) return { tone: 'warning', label: 'Ready' };
    if (summary.approved > 0) return { tone: 'warning', label: `${summary.approved} / ${summary.total}` };
    return { tone: 'neutral', label: 'Not started' };
}

export function TopicsColumn({ topics, activeTopicId, onTopicClick }: TopicsColumnProps) {
    return (
        <div className="flex h-full flex-col border-r border-border bg-card">
            <div className="flex h-11 items-center justify-between border-b border-border px-4">
                <div className="flex items-center gap-2">
                    <span className="section-label">Topics</span>
                    <span className="tech">{topics.length}</span>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto">
                {topics.map((topic) => {
                    const summary = summarize(topic);
                    const pill = pillFor(summary);
                    const isActive = topic.id === activeTopicId;

                    return (
                        <button
                            key={topic.id}
                            type="button"
                            onClick={() => onTopicClick(topic.id)}
                            aria-current={isActive ? 'true' : undefined}
                            className={cn(
                                'relative w-full border-b border-border px-4 py-3 text-left transition-colors',
                                isActive ? 'bg-background' : 'hover:bg-muted/50',
                            )}
                        >
                            {isActive && (
                                <span className="absolute left-0 top-2 bottom-2 w-0.5 rounded-r-sm bg-foreground" />
                            )}
                            <div className={cn('text-[13.5px] leading-snug', isActive ? 'font-semibold' : 'font-medium')}>
                                {topic.title}
                            </div>
                            <div className="mt-1.5 flex items-center gap-2">
                                {pill && <StatusPill tone={pill.tone}>{pill.label}</StatusPill>}
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
