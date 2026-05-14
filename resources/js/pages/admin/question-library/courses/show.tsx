import { useCallback, useMemo, useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import AdminLayout from '@/layouts/admin-layout';
import { PoolTree } from '@/components/admin/question-builder/pool-tree';
import type { SelectedNode } from '@/components/admin/question-builder/paper-tree';
import { CompositeEditor, type EditorTab } from '@/components/admin/question-builder/composite-editor';
import { DraftModeContext } from '@/components/admin/question-builder/draft-mode-context';
import { buildDraftQuestion } from '@/components/admin/question-builder/lib/draft-question';
import QuestionLibraryController from '@/actions/App/Http/Controllers/Admin/QuestionLibraryController';
import type { AnswerDepthLevel, QuestionEnumOptions, QuestionNode } from '@/types/questions';
import type { PoolContainer, PoolTopic } from '@/types/question-library';

interface Props {
    pool: PoolContainer;
    enum_options: QuestionEnumOptions;
}

interface Located {
    topic: PoolTopic;
    question: QuestionNode;
}

function locateInTree(nodes: QuestionNode[], id: string): QuestionNode | null {
    for (const node of nodes) {
        if (node.id === id) return node;
        const child = locateInTree(node.children, id);
        if (child) return child;
    }
    return null;
}

function locateQuestion(pool: PoolContainer, questionId: string): Located | null {
    for (const topic of pool.topics) {
        const found = locateInTree(topic.questions, questionId);
        if (found) return { topic, question: found };
    }
    return null;
}

function firstQuestion(pool: PoolContainer): QuestionNode | null {
    for (const topic of pool.topics) {
        if (topic.questions.length > 0) return topic.questions[0];
    }
    return null;
}

const TAB_ORDER: EditorTab[] = ['question', 'answers', 'links', 'contexts'];

type PendingNav =
    | { kind: 'selection'; target: SelectedNode | null }
    | { kind: 'tab'; target: EditorTab };

function isSameSelection(a: SelectedNode | null, b: SelectedNode | null): boolean {
    if (a === b) return true;
    if (a === null || b === null) return false;
    if (a.type !== b.type) return false;
    if (a.type === 'draft' || b.type === 'draft') return false;
    return a.id === b.id;
}

export default function CoursePoolBuild({ pool, enum_options }: Props) {
    const initialQuestion = useMemo(() => firstQuestion(pool), [pool]);

    const [selectedNode, setSelectedNode] = useState<SelectedNode | null>(
        initialQuestion ? { type: 'question', id: initialQuestion.id } : null,
    );
    const [activeTab, setActiveTab] = useState<EditorTab>('question');
    const [pendingDepth, setPendingDepth] = useState<AnswerDepthLevel | null>(null);
    const [dirtyMap, setDirtyMap] = useState<Record<EditorTab, boolean>>({
        question: false,
        answers: false,
        links: false,
        contexts: false,
    });
    const [pending, setPending] = useState<PendingNav | null>(null);

    const isAnyDirty = TAB_ORDER.some((t) => dirtyMap[t]);

    const draftNode = selectedNode?.type === 'draft' ? selectedNode : null;

    function handleCreated(newQuestionId: string) {
        setSelectedNode({ type: 'question', id: newQuestionId });
    }

    function requestSelection(next: SelectedNode | null) {
        if (isSameSelection(next, selectedNode)) return;
        if (isAnyDirty) {
            setPending({ kind: 'selection', target: next });
            return;
        }
        if (next?.type === 'draft') setActiveTab('question');
        setSelectedNode(next);
    }

    function requestTabChange(next: EditorTab) {
        if (next === activeTab) return;
        if (isAnyDirty) {
            setPending({ kind: 'tab', target: next });
            return;
        }
        setActiveTab(next);
    }

    function handleSelectChildDepth(childId: string, depth: AnswerDepthLevel) {
        setSelectedNode({ type: 'question', id: childId });
        setActiveTab('answers');
        setPendingDepth(depth);
    }

    const handleInitialDepthConsumed = useCallback(() => {
        setPendingDepth(null);
    }, []);

    function confirmDiscard() {
        setDirtyMap({ question: false, answers: false, links: false, contexts: false });
        if (pending?.kind === 'selection') {
            if (pending.target?.type === 'draft') setActiveTab('question');
            setSelectedNode(pending.target);
        }
        if (pending?.kind === 'tab') setActiveTab(pending.target);
        setPending(null);
    }

    function cancelDiscard() {
        setPending(null);
    }

    function handleTabDirtyChange(tab: EditorTab, dirty: boolean) {
        setDirtyMap((prev) => (prev[tab] === dirty ? prev : { ...prev, [tab]: dirty }));
    }

    const located = selectedNode?.type === 'question' ? locateQuestion(pool, selectedNode.id) : null;

    const breadcrumbs = [
        { title: 'Question Library · preview', href: QuestionLibraryController.index.url() },
        { title: pool.course_code, href: '#' },
        { title: 'Pool builder', href: '#' },
    ];

    return (
        <AdminLayout breadcrumbs={breadcrumbs}>
            <Head title={`Pool: ${pool.course_code}`} />

            <div className="flex h-[calc(100vh-4rem)] flex-col">
                <PoolPageHeader pool={pool} />

                <div className="flex min-h-0 flex-1">
                    <div className="w-[340px] shrink-0 overflow-hidden">
                        <PoolTree pool={pool} selectedNode={selectedNode} onSelectNode={requestSelection} />
                    </div>

                    <div className="min-w-0 flex-1 overflow-hidden">
                        {draftNode ? (
                            <DraftModeContext.Provider
                                value={{
                                    institutionCourseId: pool.id,
                                    parentId: draftNode.parentId,
                                    onCreated: handleCreated,
                                }}
                            >
                                <CompositeEditor
                                    key={`draft-${draftNode.topicId ?? 'root'}-${draftNode.parentId ?? 'root'}`}
                                    container={{
                                        kind: 'pool',
                                        pool,
                                        topic:
                                            pool.topics.find((t) => t.id === draftNode.topicId)
                                            ?? pool.topics[0]
                                            ?? { id: 'untagged', title: 'Untagged', questions: [] },
                                    }}
                                    question={buildDraftQuestion(draftNode.defaultType)}
                                    enumOptions={enum_options}
                                    activeTab="question"
                                    isDraft
                                    onTabChange={() => {}}
                                    onTabDirtyChange={handleTabDirtyChange}
                                    initialDepth={null}
                                    onInitialDepthConsumed={handleInitialDepthConsumed}
                                    onSelectChildDepth={handleSelectChildDepth}
                                    answersDirty={false}
                                />
                            </DraftModeContext.Provider>
                        ) : located ? (
                            <CompositeEditor
                                key={located.question.id}
                                container={{ kind: 'pool', pool, topic: located.topic }}
                                question={located.question}
                                enumOptions={enum_options}
                                activeTab={activeTab}
                                onTabChange={requestTabChange}
                                onTabDirtyChange={handleTabDirtyChange}
                                initialDepth={pendingDepth}
                                onInitialDepthConsumed={handleInitialDepthConsumed}
                                onSelectChildDepth={handleSelectChildDepth}
                                answersDirty={dirtyMap.answers}
                            />
                        ) : (
                            <EmptyState />
                        )}
                    </div>
                </div>
            </div>

            <AlertDialog open={pending !== null} onOpenChange={(open) => !open && cancelDiscard()}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Unsaved changes</AlertDialogTitle>
                        <AlertDialogDescription>
                            You have unsaved edits on this question. Discard them and continue, or stay and save first?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={cancelDiscard}>Stay and save</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDiscard}>Discard and continue</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </AdminLayout>
    );
}

function PoolPageHeader({ pool }: { pool: PoolContainer }) {
    return (
        <div
            className="border-b border-[var(--border-2)] bg-card px-7 py-4"
            style={{ background: 'linear-gradient(180deg, var(--card) 0%, var(--bg-raised) 100%)' }}
        >
            <div className="flex items-center gap-3">
                <Link
                    href={QuestionLibraryController.index.url()}
                    className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground transition-colors hover:text-foreground"
                    style={{ fontFamily: 'var(--font-display)' }}
                >
                    ← Library
                </Link>
                <span className="h-3 w-px bg-[var(--border)]" />
                <div className="flex-1">
                    <div
                        className="text-[10px] uppercase tracking-[0.14em] text-[var(--fg-subtle)]"
                        style={{ fontFamily: 'var(--font-display)' }}
                    >
                        Course pool · {pool.institution_abbreviation ?? '—'}
                    </div>
                    <h1
                        className="mt-0.5 text-[18px] font-semibold leading-tight tracking-[-0.012em] text-foreground"
                        style={{ fontFamily: 'var(--font-display)' }}
                    >
                        {pool.course_code} · {pool.course_title}
                    </h1>
                </div>
                <div
                    className="text-right text-[11px] text-muted-foreground"
                    style={{ fontFamily: 'var(--font-mono)' }}
                >
                    {pool.questions_total} {pool.questions_total === 1 ? 'question' : 'questions'}
                    <br />
                    <span className="text-[var(--fg-subtle)]">
                        {pool.topics.length} {pool.topics.length === 1 ? 'topic' : 'topics'} · no paper
                    </span>
                </div>
            </div>
        </div>
    );
}

function EmptyState() {
    return (
        <div className="flex h-full items-center justify-center p-8">
            <div className="max-w-sm text-center">
                <div
                    className="text-[10px] uppercase tracking-[0.14em] text-[var(--fg-subtle)]"
                    style={{ fontFamily: 'var(--font-display)' }}
                >
                    Empty pool
                </div>
                <p
                    className="mt-2 text-[14px] text-muted-foreground"
                    style={{ fontFamily: 'var(--font-body)' }}
                >
                    No questions in this course pool yet. Add questions to this course (without a paper) and they'll appear here grouped by primary topic.
                </p>
            </div>
        </div>
    );
}
