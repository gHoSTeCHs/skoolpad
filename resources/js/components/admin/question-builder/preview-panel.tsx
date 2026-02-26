import { QuestionRenderer, ContextCard } from '@/components/skoolpad/questions';
import type { ContextCardData } from '@/components/skoolpad/questions/context-card';
import { nodeToShowcase } from '@/lib/question-node-to-showcase';
import type { QuestionPaper, QuestionSection, QuestionNode, QuestionContextData } from '@/types/questions';
import type { SelectedNode } from './paper-tree';

interface PreviewPanelProps {
    paper: QuestionPaper;
    selectedNode: SelectedNode | null;
}

function contextToCardData(ctx: QuestionContextData): ContextCardData {
    return {
        id: ctx.id,
        contextType: ctx.context_type,
        title: ctx.title,
        content: ctx.content,
        mediaUrl: ctx.media_url,
        tableData: ctx.table_data,
        wordBank: ctx.word_bank,
    };
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

function SectionPreview({ section }: { section: QuestionSection }) {
    return (
        <div className="space-y-3">
            <h4 className="text-sm font-bold">{section.label}</h4>
            {section.instruction && (
                <p className="text-xs italic text-muted-foreground">{section.instruction}</p>
            )}
            <div className="grid grid-cols-2 gap-2 text-xs">
                {section.marks !== null && section.marks !== undefined && (
                    <div className="rounded-md bg-muted/50 px-2 py-1">
                        <span className="text-muted-foreground">Marks: </span>
                        <span className="font-semibold">{section.marks}</span>
                    </div>
                )}
                <div className="rounded-md bg-muted/50 px-2 py-1">
                    <span className="text-muted-foreground">Questions: </span>
                    <span className="font-semibold">{section.questions.length}</span>
                </div>
                {section.required_count && (
                    <div className="col-span-2 rounded-md bg-muted/50 px-2 py-1">
                        <span className="text-muted-foreground">Required: </span>
                        <span className="font-semibold">Answer {section.required_count} of {section.questions.length}</span>
                    </div>
                )}
            </div>
        </div>
    );
}

export default function PreviewPanel({ paper, selectedNode }: PreviewPanelProps) {
    if (!selectedNode) {
        return (
            <div className="flex h-full items-center justify-center p-6">
                <p className="text-center text-sm text-muted-foreground">
                    Select a section, question, or context to preview.
                </p>
            </div>
        );
    }

    if (selectedNode.type === 'section') {
        const section = paper.sections.find((s) => s.id === selectedNode.id);
        if (!section) return null;
        return (
            <div className="p-4">
                <SectionPreview section={section} />
            </div>
        );
    }

    if (selectedNode.type === 'question') {
        const question = findQuestion(paper.sections, selectedNode.id);
        if (!question) return null;
        const showcase = nodeToShowcase(question);
        return (
            <div className="p-4">
                <QuestionRenderer q={showcase} />
            </div>
        );
    }

    if (selectedNode.type === 'context') {
        const ctx = paper.contexts.find((c) => c.id === selectedNode.id);
        if (!ctx) return null;
        return (
            <div className="p-4">
                <ContextCard context={contextToCardData(ctx)} />
            </div>
        );
    }

    return null;
}
