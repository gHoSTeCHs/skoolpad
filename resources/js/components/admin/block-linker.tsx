import { Loader2, Search, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import InputError from '@/components/input-error';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import type { BlockRelevance, BlockSearchResult, QuestionNodeBlockLink } from '@/types/questions';

export interface BlockLinkDraft {
    content_block_id: string;
    title: string;
    relevance: BlockRelevance;
}

interface BlockLinkerProps {
    selectedBlocks: BlockLinkDraft[];
    onChange: (blocks: BlockLinkDraft[]) => void;
    topicIds?: string[];
    errors?: Record<string, string>;
}

const RELEVANCE_OPTIONS: { value: BlockRelevance; label: string }[] = [
    { value: 'primary', label: 'Primary' },
    { value: 'secondary', label: 'Secondary' },
    { value: 'prerequisite', label: 'Prerequisite' },
];

export function blockLinksFromNode(raw: QuestionNodeBlockLink[]): BlockLinkDraft[] {
    return raw.map((link) => ({
        content_block_id: link.content_block_id,
        title: link.content_block.title,
        relevance: link.relevance,
    }));
}

export function BlockLinker({ selectedBlocks, onChange, topicIds, errors }: BlockLinkerProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [results, setResults] = useState<BlockSearchResult[]>([]);
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
                const params = new URLSearchParams({ q: searchTerm.trim() });
                topicIds?.forEach((id) => params.append('topic_ids[]', id));

                const response = await fetch(`/admin/api/blocks/search?${params.toString()}`, {
                    signal: controller.signal,
                });
                const data: BlockSearchResult[] = await response.json();
                const selectedIds = new Set(selectedBlocks.map((b) => b.content_block_id));
                setResults(data.filter((b) => !selectedIds.has(b.id)));
                setOpen(true);
            } catch {
                /* aborted or network error */
            } finally {
                setLoading(false);
            }
        }, 300);

        return () => {
            clearTimeout(timeout);
            controller.abort();
        };
    }, [searchTerm, selectedBlocks, topicIds]);

    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    function addBlock(block: BlockSearchResult) {
        const draft: BlockLinkDraft = {
            content_block_id: block.id,
            title: block.title,
            relevance: 'primary',
        };
        onChange([...selectedBlocks, draft]);
        setSearchTerm('');
        setResults([]);
        setOpen(false);
    }

    function removeBlock(blockId: string) {
        onChange(selectedBlocks.filter((b) => b.content_block_id !== blockId));
    }

    function setRelevance(blockId: string, relevance: BlockRelevance) {
        onChange(
            selectedBlocks.map((b) =>
                b.content_block_id === blockId ? { ...b, relevance } : b,
            ),
        );
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
                    placeholder={
                        topicIds && topicIds.length > 0
                            ? 'Search blocks linked to this question\'s topics…'
                            : 'Search all content blocks…'
                    }
                    className="pl-9"
                />

                {open && results.length > 0 && (
                    <div className="absolute z-50 mt-1 max-h-48 w-full overflow-y-auto rounded-md border border-input bg-popover shadow-md">
                        {results.map((block) => (
                            <button
                                key={block.id}
                                type="button"
                                onClick={() => addBlock(block)}
                                className="flex w-full items-center px-3 py-2 text-left text-sm transition-colors hover:bg-accent hover:text-accent-foreground"
                            >
                                {block.title}
                            </button>
                        ))}
                    </div>
                )}

                {open && searchTerm.trim() && !loading && results.length === 0 && (
                    <div className="absolute z-50 mt-1 w-full rounded-md border border-input bg-popover px-3 py-3 shadow-md">
                        <p className="text-sm text-muted-foreground">No blocks found</p>
                    </div>
                )}
            </div>

            {selectedBlocks.length > 0 && (
                <div className="space-y-2">
                    {selectedBlocks.map((block) => (
                        <div key={block.content_block_id} className="flex items-center gap-2">
                            <Badge variant="secondary" className="min-w-0 shrink truncate">
                                {block.title}
                            </Badge>

                            <Select
                                value={block.relevance}
                                onValueChange={(v) => setRelevance(block.content_block_id, v as BlockRelevance)}
                            >
                                <SelectTrigger className="h-8 w-32 shrink-0 text-xs">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {RELEVANCE_OPTIONS.map((opt) => (
                                        <SelectItem key={opt.value} value={opt.value} className="text-xs">
                                            {opt.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="ml-auto size-8 shrink-0 text-muted-foreground hover:text-destructive"
                                onClick={() => removeBlock(block.content_block_id)}
                            >
                                <X className="size-4" />
                                <span className="sr-only">Remove {block.title}</span>
                            </Button>
                        </div>
                    ))}
                </div>
            )}

            <InputError message={errors?.block_links} />
        </div>
    );
}
