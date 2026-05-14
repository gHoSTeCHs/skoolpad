import { useCallback, useMemo, useState } from 'react';
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
import type { SelectedNode } from '@/components/admin/question-builder/paper-tree';
import { CompositeEditor, type EditorTab } from '@/components/admin/question-builder/composite-editor';
import { DraftModeContext } from '@/components/admin/question-builder/draft-mode-context';
import { buildDraftQuestion } from '@/components/admin/question-builder/lib/draft-question';
import { SectionEditor } from '@/components/admin/question-builder/section-editor';
import QuestionPaperController from '@/actions/App/Http/Controllers/Admin/QuestionPaperController';
import QuestionSectionController from '@/actions/App/Http/Controllers/Admin/QuestionSectionController';
import type { AnswerDepthLevel, QuestionEnumOptions, QuestionNode, QuestionPaper, QuestionSection } from '@/types/questions';

interface Props {
    paper: QuestionPaper;
    enum_options: QuestionEnumOptions;
}

interface Located {
    section: QuestionSection;
    question: QuestionNode;
}

function locateQuestion(sections: QuestionSection[], questionId: string): Located | null {
    for (const section of sections) {
        const found = locateInTree(section.questions, questionId);
        if (found) return { section, question: found };
    }
    return null;
}

function locateInTree(nodes: QuestionNode[], id: string): QuestionNode | null {
    for (const node of nodes) {
        if (node.id === id) return node;
        const child = locateInTree(node.children, id);
        if (child) return child;
    }
    return null;
}

function firstQuestion(sections: QuestionSection[]): QuestionNode | null {
    for (const section of sections) {
        if (section.questions.length > 0) return section.questions[0];
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

export default function PreviewQuestionPapersBuild({ paper, enum_options }: Props) {
    const initialQuestion = useMemo(() => firstQuestion(paper.sections), [paper.sections]);

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

    function handleAddSection() {
        router.post(
            QuestionSectionController.store.url({ questionPaper: paper.id }),
            { label: `Section ${String.fromCharCode(65 + paper.sections.length)}` },
            { preserveScroll: true, only: ['paper'] },
        );
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

    const located = selectedNode?.type === 'question'
        ? locateQuestion(paper.sections, selectedNode.id)
        : null;

    const breadcrumbs = [
        { title: 'Question Papers', href: QuestionPaperController.index.url() },
        { title: paper.title, href: '#' },
        { title: 'Build (preview)', href: '#' },
    ];

    return (
        <AdminLayout breadcrumbs={breadcrumbs}>
            <Head title={`Build (preview): ${paper.title}`} />

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
                        {selectedNode?.type === 'section' ? (
                            (() => {
                                const section = paper.sections.find((s) => s.id === selectedNode.id);
                                return section ? (
                                    <SectionEditor key={section.id} paper={paper} section={section} />
                                ) : null;
                            })()
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
                                container={{ kind: 'paper', paper, section: located.section }}
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
