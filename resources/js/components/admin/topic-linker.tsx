import { Loader2, Search, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import InputError from '@/components/input-error';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import type { TopicLink, TopicSearchResult } from '@/types/questions';

interface TopicLinkerProps {
    selectedTopics: TopicLink[];
    onChange: (topics: TopicLink[]) => void;
    onPrimaryChange: (topicId: string) => void;
    primaryTopicId: string;
    errors?: Record<string, string>;
}

export function TopicLinker({ selectedTopics, onChange, onPrimaryChange, primaryTopicId, errors }: TopicLinkerProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [results, setResults] = useState<TopicSearchResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [open, setOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!searchTerm.trim()) {
            setResults([]);
            setOpen(false);
            return;
        }

        const controller = new AbortController();
        const timeout = setTimeout(async () => {
            setLoading(true);
            try {
                const response = await fetch(
                    `/admin/api/topics/search?q=${encodeURIComponent(searchTerm.trim())}`,
                    { signal: controller.signal },
                );
                const data: TopicSearchResult[] = await response.json();
                const selectedIds = new Set(selectedTopics.map((t) => t.id));
                setResults(data.filter((t) => !selectedIds.has(t.id)));
                setOpen(true);
            } catch {
                /* aborted or network error — no action needed */
            } finally {
                setLoading(false);
            }
        }, 300);

        return () => {
            clearTimeout(timeout);
            controller.abort();
        };
    }, [searchTerm, selectedTopics]);

    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    function addTopic(topic: TopicSearchResult) {
        const isFirst = selectedTopics.length === 0;
        const newTopic: TopicLink = { id: topic.id, title: topic.title, is_primary: isFirst };
        onChange([...selectedTopics, newTopic]);
        if (isFirst) {
            onPrimaryChange(topic.id);
        }
        setSearchTerm('');
        setResults([]);
        setOpen(false);
    }

    function removeTopic(topicId: string) {
        if (topicId === primaryTopicId && selectedTopics.length > 1) return;

        const updated = selectedTopics.filter((t) => t.id !== topicId);
        onChange(updated);

        if (topicId === primaryTopicId && updated.length > 0) {
            onPrimaryChange(updated[0].id);
            updated[0] = { ...updated[0], is_primary: true };
            onChange(updated);
        } else if (updated.length === 0) {
            onPrimaryChange('');
        }
    }

    function setPrimary(topicId: string) {
        onPrimaryChange(topicId);
        const updated = selectedTopics.map((t) => ({ ...t, is_primary: t.id === topicId }));
        onChange(updated);
    }

    return (
        <div className="space-y-3">
            <div ref={containerRef} className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                {loading && (
                    <Loader2 className="absolute right-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-muted-foreground" />
                )}
                <Input
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onFocus={() => results.length > 0 && setOpen(true)}
                    placeholder="Search published topics..."
                    className="pl-9"
                />

                {open && results.length > 0 && (
                    <div className="absolute z-50 mt-1 max-h-48 w-full overflow-y-auto rounded-md border border-input bg-popover shadow-md">
                        {results.map((topic) => (
                            <button
                                key={topic.id}
                                type="button"
                                onClick={() => addTopic(topic)}
                                className="flex w-full items-center px-3 py-2 text-left text-sm transition-colors hover:bg-accent hover:text-accent-foreground"
                            >
                                {topic.title}
                            </button>
                        ))}
                    </div>
                )}

                {open && searchTerm.trim() && !loading && results.length === 0 && (
                    <div className="absolute z-50 mt-1 w-full rounded-md border border-input bg-popover px-3 py-3 shadow-md">
                        <p className="text-sm text-muted-foreground">No topics found</p>
                    </div>
                )}
            </div>

            {selectedTopics.length > 0 && (
                <div className="space-y-2">
                    {selectedTopics.map((topic) => {
                        const isPrimary = topic.id === primaryTopicId;
                        const canRemove = !isPrimary || selectedTopics.length <= 1;

                        return (
                            <div key={topic.id} className="flex items-center gap-3">
                                <label
                                    className={cn(
                                        'flex h-8 shrink-0 cursor-pointer items-center gap-2 rounded-md border px-2.5 transition-colors',
                                        isPrimary
                                            ? 'border-primary/40 bg-primary/5 text-primary'
                                            : 'border-input bg-background text-muted-foreground hover:border-ring/40',
                                    )}
                                >
                                    <input
                                        type="radio"
                                        name="primary_topic"
                                        checked={isPrimary}
                                        onChange={() => setPrimary(topic.id)}
                                        className="accent-primary size-3.5"
                                    />
                                    <span className="text-xs font-medium">
                                        {isPrimary ? 'Primary' : 'Set primary'}
                                    </span>
                                </label>

                                <Badge variant="secondary" className="min-w-0 shrink truncate">
                                    {topic.title}
                                </Badge>

                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="ml-auto size-8 shrink-0 text-muted-foreground hover:text-destructive"
                                    onClick={() => removeTopic(topic.id)}
                                    disabled={!canRemove}
                                >
                                    <X className="size-4" />
                                    <span className="sr-only">Remove {topic.title}</span>
                                </Button>
                            </div>
                        );
                    })}
                </div>
            )}

            <InputError message={errors?.topic_ids} />
            <InputError message={errors?.primary_topic_id} />
        </div>
    );
}
