import { useState } from 'react';
import { Head } from '@inertiajs/react';
import AdminLayout from '@/layouts/admin-layout';
import PaperHeader from '@/components/admin/question-builder/paper-header';
import PaperTree from '@/components/admin/question-builder/paper-tree';
import type { SelectedNode } from '@/components/admin/question-builder/paper-tree';
import SectionEditor from '@/components/admin/question-builder/section-editor';
import ContextEditor from '@/components/admin/question-builder/context-editor';
import QuestionEditorPanel from '@/components/admin/question-builder/question-editor-panel';
import PreviewPanel from '@/components/admin/question-builder/preview-panel';
import QuestionPaperController from '@/actions/App/Http/Controllers/Admin/QuestionPaperController';
import type { QuestionPaper, QuestionEnumOptions, QuestionSection, QuestionNode } from '@/types/questions';

interface Props {
    paper: QuestionPaper;
    enum_options: QuestionEnumOptions;
}

function findQuestion(sections: QuestionSection[], questionId: string): QuestionNode | null {
    for (const section of sections) {
        const found = findInTree(section.questions, questionId);
        if (found) return found;
    }
    return null;
}

function findInTree(nodes: QuestionNode[], id: string): QuestionNode | null {
    for (const node of nodes) {
        if (node.id === id) return node;
        const childResult = findInTree(node.children, id);
        if (childResult) return childResult;
    }
    return null;
}

function EditorPanel({
    paper,
    selectedNode,
    enumOptions,
}: {
    paper: QuestionPaper;
    selectedNode: SelectedNode | null;
    enumOptions: QuestionEnumOptions;
}) {
    if (!selectedNode) {
        return (
            <div className="flex h-full items-center justify-center p-6">
                <p className="text-center text-sm text-muted-foreground">
                    Select an item from the tree to edit it here.
                </p>
            </div>
        );
    }

    if (selectedNode.type === 'section') {
        const section = paper.sections.find((s) => s.id === selectedNode.id);
        if (!section) return null;
        return <SectionEditor key={section.id} paper={paper} section={section} />;
    }

    if (selectedNode.type === 'question') {
        const question = findQuestion(paper.sections, selectedNode.id);
        if (!question) return null;
        return (
            <QuestionEditorPanel
                key={question.id}
                paper={paper}
                question={question}
                enumOptions={enumOptions}
            />
        );
    }

    if (selectedNode.type === 'context') {
        const ctx = paper.contexts.find((c) => c.id === selectedNode.id);
        if (!ctx) return null;
        return (
            <ContextEditor
                key={ctx.id}
                paper={paper}
                context={ctx}
                contextTypeOptions={enumOptions.context_types ?? []}
            />
        );
    }

    return null;
}

export default function QuestionPapersBuild({ paper, enum_options }: Props) {
    const [selectedNode, setSelectedNode] = useState<SelectedNode | null>(null);

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
                    <div className="w-64 shrink-0 overflow-y-auto">
                        <PaperTree
                            paper={paper}
                            selectedNode={selectedNode}
                            onSelectNode={setSelectedNode}
                        />
                    </div>

                    <div className="min-w-0 flex-1 overflow-y-auto border-r border-border">
                        <EditorPanel
                            paper={paper}
                            selectedNode={selectedNode}
                            enumOptions={enum_options}
                        />
                    </div>

                    <div className="w-80 shrink-0 overflow-y-auto bg-muted/30">
                        <div className="border-b border-border px-3 py-2">
                            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                Preview
                            </h3>
                        </div>
                        <PreviewPanel paper={paper} selectedNode={selectedNode} />
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
