import { useMemo, useState } from 'react';
import { Head } from '@inertiajs/react';
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
import PaperHeader from '@/components/admin/question-builder/paper-header';
import PaperTree from '@/components/admin/preview/question-builder/paper-tree';
import type { SelectedNode } from '@/components/admin/preview/question-builder/paper-tree';
import { CompositeEditor, type EditorTab } from '@/components/admin/preview/question-builder/composite-editor';
import QuestionPaperController from '@/actions/App/Http/Controllers/Admin/QuestionPaperController';
import type { QuestionEnumOptions, QuestionNode, QuestionPaper, QuestionSection } from '@/types/questions';

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

export default function PreviewQuestionPapersBuild({ paper, enum_options }: Props) {
    const initialQuestion = useMemo(() => firstQuestion(paper.sections), [paper.sections]);

    const [selectedNode, setSelectedNode] = useState<SelectedNode | null>(
        initialQuestion ? { type: 'question', id: initialQuestion.id } : null,
    );
    const [activeTab, setActiveTab] = useState<EditorTab>('question');
    const [dirtyMap, setDirtyMap] = useState<Record<EditorTab, boolean>>({
        question: false,
        answers: false,
        links: false,
        contexts: false,
    });
    const [pendingNode, setPendingNode] = useState<SelectedNode | null>(null);

    const isAnyDirty = TAB_ORDER.some((t) => dirtyMap[t]);

    function requestSelection(next: SelectedNode | null) {
        if (isAnyDirty && next?.type === 'question' && (selectedNode?.type !== 'question' || selectedNode.id !== next.id)) {
            setPendingNode(next);
            return;
        }
        setSelectedNode(next);
    }

    function confirmDiscard() {
        setDirtyMap({ question: false, answers: false, links: false, contexts: false });
        setSelectedNode(pendingNode);
        setPendingNode(null);
    }

    function cancelDiscard() {
        setPendingNode(null);
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
                        />
                    </div>

                    <div className="min-w-0 flex-1 overflow-hidden">
                        {located ? (
                            <CompositeEditor
                                key={located.question.id}
                                paper={paper}
                                section={located.section}
                                question={located.question}
                                enumOptions={enum_options}
                                activeTab={activeTab}
                                onTabChange={setActiveTab}
                                onTabDirtyChange={handleTabDirtyChange}
                            />
                        ) : (
                            <div className="flex h-full items-center justify-center p-6">
                                <p className="text-center text-sm text-muted-foreground">
                                    {selectedNode?.type === 'section'
                                        ? 'Section editing isn\'t part of the 4.B preview slice. Select a question to author it.'
                                        : selectedNode?.type === 'context'
                                            ? 'Context editing lands in 4.F. Select a question to author it.'
                                            : 'Select a question from the tree to begin authoring.'}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <AlertDialog open={pendingNode !== null} onOpenChange={(open) => !open && cancelDiscard()}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Unsaved changes</AlertDialogTitle>
                        <AlertDialogDescription>
                            You have unsaved edits on this question. Discard them and switch, or stay and save first?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={cancelDiscard}>Stay and save</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDiscard}>Discard and switch</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </AdminLayout>
    );
}
