'use no memo';

import { router } from '@inertiajs/react';
import { Sparkles } from 'lucide-react';
import { useCallback, useState, type ReactNode } from 'react';
import QuestionController from '@/actions/App/Http/Controllers/Admin/QuestionController';
import { BlockLinker, blockLinksFromNode, type BlockLinkDraft } from '@/components/admin/block-linker';
import { TopicLinker } from '@/components/admin/topic-linker';
import { cn } from '@/lib/utils';
import { useDirtyRegistration } from './hooks/use-dirty-registration';
import type { QuestionNode, QuestionNodeTopicLink, TopicLink } from '@/types/questions';

function topicLinksFromNode(raw: QuestionNodeTopicLink[]): TopicLink[] {
    return raw.map((link) => ({
        id: link.canonical_topic_id,
        title: link.canonical_topic.title,
        is_primary: link.is_primary,
    }));
}

interface LinksInspectorProps {
    question: QuestionNode;
}

export function LinksInspector({ question }: LinksInspectorProps) {
    const savedTopics = topicLinksFromNode(question.topic_links ?? []);
    const savedPrimaryId = savedTopics.find((t) => t.is_primary)?.id ?? '';
    const savedBlocks = blockLinksFromNode(question.question_block_links ?? []);

    const [topics, setTopics] = useState<TopicLink[]>(savedTopics);
    const [primaryTopicId, setPrimaryTopicId] = useState(savedPrimaryId);
    const [topicsDirty, setTopicsDirty] = useState(false);
    const [topicsSaving, setTopicsSaving] = useState(false);
    const [topicsErrors, setTopicsErrors] = useState<Record<string, string>>({});

    const [blocks, setBlocks] = useState<BlockLinkDraft[]>(savedBlocks);
    const [blocksDirty, setBlocksDirty] = useState(false);
    const [blocksSaving, setBlocksSaving] = useState(false);
    const [blocksErrors, setBlocksErrors] = useState<Record<string, string>>({});

    const resetTopics = useCallback(() => {
        const restored = topicLinksFromNode(question.topic_links ?? []);
        setTopics(restored);
        setPrimaryTopicId(restored.find((t) => t.is_primary)?.id ?? '');
        setTopicsErrors({});
        setTopicsDirty(false);
    }, [question]);

    const resetBlocks = useCallback(() => {
        setBlocks(blockLinksFromNode(question.question_block_links ?? []));
        setBlocksErrors({});
        setBlocksDirty(false);
    }, [question]);

    useDirtyRegistration('links:topics', topicsDirty, resetTopics);
    useDirtyRegistration('links:blocks', blocksDirty, resetBlocks);

    function handleTopicsChange(next: TopicLink[]) {
        setTopics(next);
        setTopicsDirty(true);
    }

    function handlePrimaryChange(id: string) {
        setPrimaryTopicId(id);
        setTopicsDirty(true);
    }

    function handleBlocksChange(next: BlockLinkDraft[]) {
        setBlocks(next);
        setBlocksDirty(true);
    }

    function saveTopics() {
        setTopicsSaving(true);
        setTopicsErrors({});
        router.put(
            QuestionController.update.url({ question: question.id }),
            {
                topic_ids: topics.map((t) => t.id),
                primary_topic_id: primaryTopicId || null,
            },
            {
                preserveScroll: true,
                preserveState: true,
                only: ['paper'],
                onSuccess: () => setTopicsDirty(false),
                onError: (errors) => setTopicsErrors(errors as Record<string, string>),
                onFinish: () => setTopicsSaving(false),
            },
        );
    }

    function saveBlocks() {
        setBlocksSaving(true);
        setBlocksErrors({});
        router.put(
            QuestionController.update.url({ question: question.id }),
            {
                block_links: blocks.map((b) => ({
                    content_block_id: b.content_block_id,
                    relevance: b.relevance,
                })),
            },
            {
                preserveScroll: true,
                preserveState: true,
                only: ['paper'],
                onSuccess: () => setBlocksDirty(false),
                onError: (errors) => setBlocksErrors(errors as Record<string, string>),
                onFinish: () => setBlocksSaving(false),
            },
        );
    }

    return (
        <div className="space-y-7 px-5 py-5">
            <Section title="Topics" count={topics.length}>
                {topics.length === 0 && (
                    <p className="text-[12px] italic text-muted-foreground">
                        No topics linked yet. Search above to add one.
                    </p>
                )}
                <TopicLinker
                    selectedTopics={topics}
                    onChange={handleTopicsChange}
                    onPrimaryChange={handlePrimaryChange}
                    primaryTopicId={primaryTopicId}
                    errors={topicsErrors}
                />
                <SectionSaveBar
                    dirty={topicsDirty}
                    saving={topicsSaving}
                    onSave={saveTopics}
                    onDiscard={resetTopics}
                />
            </Section>

            <Section title="Content blocks" count={blocks.length}>
                {blocks.length === 0 && (
                    <p className="text-[12px] italic text-muted-foreground">
                        {topics.length === 0
                            ? 'Link at least one topic first to scope block search.'
                            : 'No blocks linked yet. Search above to add one.'}
                    </p>
                )}
                <BlockLinker
                    selectedBlocks={blocks}
                    onChange={handleBlocksChange}
                    topicIds={topics.map((t) => t.id)}
                    errors={blocksErrors}
                />
                <SectionSaveBar
                    dirty={blocksDirty}
                    saving={blocksSaving}
                    onSave={saveBlocks}
                    onDiscard={resetBlocks}
                />
            </Section>

            <AiSuggestionsStub />
        </div>
    );
}

interface SectionProps {
    title: string;
    count: number;
    children: ReactNode;
}

function Section({ title, count, children }: SectionProps) {
    return (
        <section className="space-y-3">
            <header className="flex items-baseline justify-between gap-2 border-b border-[var(--border-2)] pb-2">
                <h3 className="font-display text-[13px] font-semibold tracking-tight text-foreground">
                    {title}
                </h3>
                <span className="font-mono text-[10.5px] text-[var(--fg-subtle)]">
                    {count} {count === 1 ? 'linked' : 'linked'}
                </span>
            </header>
            {children}
        </section>
    );
}

interface SectionSaveBarProps {
    dirty: boolean;
    saving: boolean;
    onSave: () => void;
    onDiscard: () => void;
}

function SectionSaveBar({ dirty, saving, onSave, onDiscard }: SectionSaveBarProps) {
    if (!dirty) return null;
    return (
        <div className="flex items-center justify-end gap-2 pt-1">
            <button
                type="button"
                onClick={onDiscard}
                disabled={saving}
                className="rounded-md border border-border bg-transparent px-2.5 py-1 text-[11.5px] font-medium text-muted-foreground transition-colors hover:bg-[var(--bg-raised)] hover:text-foreground disabled:opacity-50"
            >
                Discard
            </button>
            <button
                type="button"
                onClick={onSave}
                disabled={saving}
                className={cn(
                    'rounded-md bg-primary px-2.5 py-1 text-[11.5px] font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50',
                )}
            >
                {saving ? 'Saving…' : 'Save'}
            </button>
        </div>
    );
}

function AiSuggestionsStub() {
    return (
        <section className="space-y-2 rounded-md border border-dashed border-[var(--honey-line)] bg-[var(--honey-soft)]/30 p-3.5">
            <div className="flex items-center gap-2 text-[12px] font-semibold text-[var(--honey)]">
                <Sparkles className="h-3.5 w-3.5" aria-hidden />
                AI suggestions
            </div>
            <p className="text-[11.5px] text-muted-foreground">
                Suggested topic + block links based on the stem will appear here. Arrives in Checkpoint 10
                alongside the AI assist panel.
            </p>
        </section>
    );
}
