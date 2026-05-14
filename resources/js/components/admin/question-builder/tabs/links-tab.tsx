'use no memo';

import { router } from '@inertiajs/react';
import { useCallback, useState } from 'react';
import QuestionController from '@/actions/App/Http/Controllers/Admin/QuestionController';
import { BlockLinker, blockLinksFromNode } from '@/components/admin/block-linker';
import { TopicLinker } from '@/components/admin/topic-linker';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import type { BlockLinkDraft } from '@/components/admin/block-linker';
import type { QuestionNode, QuestionNodeTopicLink, TopicLink } from '@/types/questions';
import { useDirtyRegistration } from '../hooks/use-dirty-registration';

function topicLinksFromNode(raw: QuestionNodeTopicLink[]): TopicLink[] {
    return raw.map((link) => ({
        id: link.canonical_topic_id,
        title: link.canonical_topic.title,
        is_primary: link.is_primary,
    }));
}

interface LinksTabProps {
    question: QuestionNode;
}

export function LinksTab({ question }: LinksTabProps) {
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
            QuestionController.update.url(question.id),
            {
                topic_ids: topics.map((t) => t.id),
                primary_topic_id: primaryTopicId || null,
            },
            {
                preserveScroll: true,
                only: ['paper'],
                onSuccess: () => setTopicsDirty(false),
                onError: (errors) => setTopicsErrors(errors),
                onFinish: () => setTopicsSaving(false),
            },
        );
    }

    function saveBlocks() {
        setBlocksSaving(true);
        setBlocksErrors({});
        router.put(
            QuestionController.update.url(question.id),
            {
                block_links: blocks.map((b) => ({
                    content_block_id: b.content_block_id,
                    relevance: b.relevance,
                })),
            },
            {
                preserveScroll: true,
                only: ['paper'],
                onSuccess: () => setBlocksDirty(false),
                onError: (errors) => setBlocksErrors(errors),
                onFinish: () => setBlocksSaving(false),
            },
        );
    }

    const savedTopicIds = (question.topic_links ?? []).map((l) => l.canonical_topic_id);

    return (
        <div className="space-y-5">
            <Card>
                <CardHeader>
                    <CardTitle>Topic links</CardTitle>
                </CardHeader>
                <CardContent>
                    <TopicLinker
                        selectedTopics={topics}
                        onChange={handleTopicsChange}
                        onPrimaryChange={handlePrimaryChange}
                        primaryTopicId={primaryTopicId}
                        errors={topicsErrors}
                    />
                </CardContent>
                {topicsDirty && (
                    <CardFooter className="border-t pt-4">
                        <Button size="sm" onClick={saveTopics} disabled={topicsSaving}>
                            {topicsSaving ? 'Saving…' : 'Save topic links'}
                        </Button>
                    </CardFooter>
                )}
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Content block links</CardTitle>
                </CardHeader>
                <CardContent>
                    <BlockLinker
                        selectedBlocks={blocks}
                        onChange={handleBlocksChange}
                        topicIds={savedTopicIds}
                        errors={blocksErrors}
                    />
                </CardContent>
                {blocksDirty && (
                    <CardFooter className="border-t pt-4">
                        <Button size="sm" onClick={saveBlocks} disabled={blocksSaving}>
                            {blocksSaving ? 'Saving…' : 'Save block links'}
                        </Button>
                    </CardFooter>
                )}
            </Card>
        </div>
    );
}
