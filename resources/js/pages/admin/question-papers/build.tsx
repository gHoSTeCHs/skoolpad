import { Head, router } from '@inertiajs/react';
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
import { PaperHeader } from '@/components/admin/question-builder/paper-header';
import { PaperTree } from '@/components/admin/question-builder/paper-tree';
import { CompositeEditor, type EditorTab } from '@/components/admin/question-builder/composite-editor';
import { DraftModeContext } from '@/components/admin/question-builder/draft-mode-context';
import { buildDraftQuestion } from '@/components/admin/question-builder/lib/draft-question';
import { locateInSections, firstQuestionInSections } from '@/components/admin/question-builder/lib/locate-question';
import { SectionEditor } from '@/components/admin/question-builder/section-editor';
import { QuestionBuilderProvider, useBuilderStore } from '@/components/admin/question-builder/store/provider';
import { selectIsAnyDirty } from '@/components/admin/question-builder/store/create-store';
import QuestionPaperController from '@/actions/App/Http/Controllers/Admin/QuestionPaperController';
import QuestionSectionController from '@/actions/App/Http/Controllers/Admin/QuestionSectionController';
import type { QuestionEnumOptions, QuestionPaper } from '@/types/questions';

interface Props {
    paper: QuestionPaper;
    enum_options: QuestionEnumOptions;
}

export default function QuestionPapersBuild({ paper, enum_options }: Props) {
    const initialQuestion = firstQuestionInSections(paper.sections);

    return (
        <QuestionBuilderProvider
            initialSelectedNode={initialQuestion ? { type: 'question', id: initialQuestion.id } : null}
        >
            <BuildShell paper={paper} enumOptions={enum_options} />
        </QuestionBuilderProvider>
    );
}

function BuildShell({ paper, enumOptions }: { paper: QuestionPaper; enumOptions: QuestionEnumOptions }) {
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
    const located = selectedNode?.type === 'question'
        ? locateInSections(paper.sections, selectedNode.id)
        : null;
    const selectedSection = selectedNode?.type === 'section'
        ? paper.sections.find((s) => s.id === selectedNode.id)
        : null;

    function handleCreated(newQuestionId: string) {
        requestSelection({ type: 'question', id: newQuestionId });
    }

    function handleAddSection() {
        router.post(
            QuestionSectionController.store.url({ questionPaper: paper.id }),
            { label: `Section ${String.fromCharCode(65 + paper.sections.length)}` },
            { preserveScroll: true, only: ['paper'] },
        );
    }

    /**
     * Bridge: surfaces that still report dirtiness via the legacy onDirtyChange
     * callback are registered into the store here. Surfaces migrated to
     * useDirtyRegistration register themselves directly.
     */
    function handleTabDirtyChange(tab: EditorTab, dirty: boolean) {
        registerDirty(tab, dirty, () => {});
    }

    const breadcrumbs = [
        { title: 'Question Papers', href: QuestionPaperController.index.url() },
        { title: paper.title, href: '#' },
        { title: 'Build', href: '#' },
    ];

    return (
        <AdminLayout breadcrumbs={breadcrumbs}>
            <Head title={`Build: ${paper.title}`} />

            <div className="flex h-[calc(100vh-4rem)] flex-col">
                <PaperHeader paper={paper} />

                <div className="flex min-h-0 flex-1">
                    <div className="w-[340px] shrink-0 overflow-hidden">
                        <PaperTree
                            paper={paper}
                            selectedNode={selectedNode}
                            onSelectNode={requestSelection}
                            onAddSection={handleAddSection}
                        />
                    </div>

                    <div className="min-w-0 flex-1 overflow-hidden">
                        {selectedSection ? (
                            <SectionEditor key={selectedSection.id} paper={paper} section={selectedSection} />
                        ) : draftNode ? (
                            <DraftModeContext.Provider
                                value={{
                                    paperId: paper.id,
                                    sectionId: draftNode.sectionId,
                                    institutionCourseId: paper.institution_course_id,
                                    parentId: draftNode.parentId,
                                    onCreated: handleCreated,
                                }}
                            >
                                <CompositeEditor
                                    key={`draft-${draftNode.sectionId ?? 'root'}-${draftNode.parentId ?? 'root'}`}
                                    container={{ kind: 'paper', paper, section: paper.sections.find((s) => s.id === draftNode.sectionId) ?? paper.sections[0] }}
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
                                container={{ kind: 'paper', paper, section: located.section }}
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
                            <div className="flex h-full items-center justify-center p-6">
                                <p className="text-center text-sm text-muted-foreground">
                                    {selectedNode?.type === 'context'
                                        ? 'Context editing is handled in the Contexts tab. Select a question to author it.'
                                        : 'Select a question from the tree to begin authoring.'}
                                </p>
                            </div>
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
