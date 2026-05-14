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
import { CompositeEditor, type EditorTab } from '@/components/admin/question-builder/composite-editor';
import { DraftModeContext } from '@/components/admin/question-builder/draft-mode-context';
import { buildDraftQuestion } from '@/components/admin/question-builder/lib/draft-question';
import { locateInPool, firstQuestionInPool } from '@/components/admin/question-builder/lib/locate-question';
import { QuestionBuilderProvider, useBuilderStore } from '@/components/admin/question-builder/store/provider';
import QuestionLibraryController from '@/actions/App/Http/Controllers/Admin/QuestionLibraryController';
import type { QuestionEnumOptions } from '@/types/questions';
import type { PoolContainer } from '@/types/question-library';

interface Props {
    pool: PoolContainer;
    enum_options: QuestionEnumOptions;
}

export default function CoursePoolBuild({ pool, enum_options }: Props) {
    const initialQuestion = firstQuestionInPool(pool);

    return (
        <QuestionBuilderProvider
            initialSelectedNode={initialQuestion ? { type: 'question', id: initialQuestion.id } : null}
        >
            <PoolShell pool={pool} enumOptions={enum_options} />
        </QuestionBuilderProvider>
    );
}

function PoolShell({ pool, enumOptions }: { pool: PoolContainer; enumOptions: QuestionEnumOptions }) {
    const selectedNode = useBuilderStore((s) => s.selectedNode);
    const activeTab = useBuilderStore((s) => s.activeTab);
    const pendingDepth = useBuilderStore((s) => s.pendingDepth);
    const pendingNav = useBuilderStore((s) => s.pendingNav);
    const answersDirty = useBuilderStore((s) => s.dirtyRegistry.answers ?? false);
    const requestSelection = useBuilderStore((s) => s.requestSelection);
    const requestTabChange = useBuilderStore((s) => s.requestTabChange);
    const confirmDiscard = useBuilderStore((s) => s.confirmDiscard);
    const cancelDiscard = useBuilderStore((s) => s.cancelDiscard);
    const registerDirty = useBuilderStore((s) => s.registerDirty);
    const selectChildDepth = useBuilderStore((s) => s.selectChildDepth);
    const consumeInitialDepth = useBuilderStore((s) => s.consumeInitialDepth);

    const draftNode = selectedNode?.type === 'draft' ? selectedNode : null;
    const located = selectedNode?.type === 'question' ? locateInPool(pool, selectedNode.id) : null;

    function handleCreated(newQuestionId: string) {
        requestSelection({ type: 'question', id: newQuestionId });
    }

    /**
     * Bridge: surfaces still reporting dirtiness via the legacy onDirtyChange
     * callback are registered into the store here. Surfaces migrated to
     * useDirtyRegistration register themselves directly.
     */
    function handleTabDirtyChange(tab: EditorTab, dirty: boolean) {
        registerDirty(tab, dirty, () => {});
    }

    const breadcrumbs = [
        { title: 'Question Library', href: QuestionLibraryController.index.url() },
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
                                    enumOptions={enumOptions}
                                    activeTab="question"
                                    isDraft
                                    onTabChange={() => {}}
                                    onTabDirtyChange={handleTabDirtyChange}
                                    initialDepth={null}
                                    onInitialDepthConsumed={consumeInitialDepth}
                                    onSelectChildDepth={selectChildDepth}
                                    answersDirty={false}
                                />
                            </DraftModeContext.Provider>
                        ) : located ? (
                            <CompositeEditor
                                key={located.question.id}
                                container={{ kind: 'pool', pool, topic: located.topic }}
                                question={located.question}
                                enumOptions={enumOptions}
                                activeTab={activeTab}
                                onTabChange={requestTabChange}
                                onTabDirtyChange={handleTabDirtyChange}
                                initialDepth={pendingDepth}
                                onInitialDepthConsumed={consumeInitialDepth}
                                onSelectChildDepth={selectChildDepth}
                                answersDirty={answersDirty}
                            />
                        ) : (
                            <EmptyState />
                        )}
                    </div>
                </div>
            </div>

            <AlertDialog open={pendingNav !== null} onOpenChange={(open) => !open && cancelDiscard()}>
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
