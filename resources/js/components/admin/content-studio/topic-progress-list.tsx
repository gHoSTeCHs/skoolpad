import { Check, Circle, Loader2, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

interface TopicEntry {
    key: string;
    title: string;
    status: 'pending' | 'generated' | 'approved';
}

interface TopicProgressListProps {
    topics: TopicEntry[];
    selectedKey: string | null;
    onSelect: (key: string) => void;
    onGenerate?: (key: string) => void;
    generatingKey: string | null;
}

const STATUS_ICON: Record<string, React.ReactNode> = {
    pending: <Circle className="size-3.5 text-muted-foreground/40" />,
    generated: <div className="size-3.5 rounded-full border-2 border-blue-400 bg-blue-400/20 dark:border-blue-500 dark:bg-blue-500/20 reader:border-blue-500 reader:bg-blue-500/20" />,
    approved: <Check className="size-3.5 text-[var(--badge-primary-fg)] dark:text-emerald-400 reader:text-emerald-400" />,
};

const STATUS_BADGE_STYLES: Record<string, string> = {
    pending: 'bg-[var(--badge-neutral-bg)] text-[var(--badge-neutral-fg)]',
    generated: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 reader:bg-blue-900/40 reader:text-blue-300',
    approved: 'bg-[var(--badge-primary-bg)] text-[var(--badge-primary-fg)]',
};

export function TopicProgressList({
    topics,
    selectedKey,
    onSelect,
    onGenerate,
    generatingKey,
}: TopicProgressListProps) {
    const approvedCount = topics.filter((t) => t.status === 'approved').length;
    const progressPercent = topics.length > 0 ? (approvedCount / topics.length) * 100 : 0;
    const nextPending = topics.find((t) => t.status === 'pending');

    return (
        <div className="flex flex-col gap-3">
            <div>
                <div className="mb-1 flex items-baseline justify-between">
                    <span className="text-xs font-medium text-muted-foreground">
                        {approvedCount}/{topics.length} approved
                    </span>
                    <span className="text-[10px] text-muted-foreground/60">
                        {Math.round(progressPercent)}%
                    </span>
                </div>
                <Progress value={progressPercent} />
            </div>

            {nextPending && onGenerate && (
                <Button
                    size="sm"
                    variant="outline"
                    className="w-full"
                    onClick={() => onGenerate(nextPending.key)}
                    disabled={!!generatingKey}
                >
                    {generatingKey === nextPending.key ? (
                        <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                        <Sparkles className="size-3.5" />
                    )}
                    Generate Next
                </Button>
            )}

            <div className="space-y-0.5">
                {topics.map((topic) => {
                    const isSelected = selectedKey === topic.key;
                    const isGenerating = generatingKey === topic.key;

                    return (
                        <button
                            key={topic.key}
                            type="button"
                            onClick={() => onSelect(topic.key)}
                            className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs transition-colors ${
                                isSelected
                                    ? 'border border-primary/30 bg-primary/5'
                                    : 'border border-transparent hover:bg-muted/50'
                            }`}
                        >
                            <span className="shrink-0">
                                {isGenerating ? (
                                    <Loader2 className="size-3.5 animate-spin text-primary" />
                                ) : (
                                    STATUS_ICON[topic.status]
                                )}
                            </span>
                            <span className="min-w-0 flex-1 truncate">{topic.title}</span>
                            <Badge variant="secondary" className={`shrink-0 px-1 py-0 text-[9px] leading-tight ${STATUS_BADGE_STYLES[topic.status]}`}>
                                {topic.status === 'pending' ? 'Pen' : topic.status === 'generated' ? 'Gen' : 'OK'}
                            </Badge>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
