import { QuestionRenderer, ContextCard } from '@/components/skoolpad/questions';
import type { ShowcaseQuestion } from '@/components/skoolpad/questions';
import type { ContextCardData } from '@/components/skoolpad/questions/context-card';
import type { QuestionPaper, QuestionSection, QuestionNode, QuestionContextData } from '@/types/questions';
import type { SelectedNode } from './paper-tree';

interface PreviewPanelProps {
    paper: QuestionPaper;
    selectedNode: SelectedNode | null;
}

/**
 * Converts a QuestionNode from server data into the ShowcaseQuestion shape
 * expected by the QuestionRenderer component.
 */
function nodeToShowcase(node: QuestionNode): ShowcaseQuestion {
    const mcqConfig = node.response_config as { options?: { label: string; text: string; is_correct: boolean }[] } | null;
    const matchConfig = node.response_config as { pairs?: { left: string; right: string }[]; distractors?: string[] } | null;
    const orderConfig = node.response_config as { items?: string[]; correct_order?: number[] } | null;
    const trueFalseConfig = node.response_config as { correct_answer?: boolean; requires_justification?: boolean } | null;
    const diagramConfig = node.response_config as { labels?: { label: string; answer: string }[] } | null;
    const calcConfig = node.response_config as { answer?: string; unit?: string } | null;
    const clozeConfig = node.response_config as { gaps?: { position: number; options: string[]; correct: number }[] } | null;
    const assertConfig = node.response_config as { assertion?: string; reason?: string; options?: { label: string; text: string; is_correct: boolean }[] } | null;
    const matrixConfig = node.response_config as { left?: string[]; right?: string[]; mapping?: Record<number, number[]> } | null;
    const numericConfig = node.response_config as { answer?: number; tolerance?: number; unit?: string } | null;

    return {
        number: node.question_number || node.display_label || '',
        displayLabel: node.display_label || '',
        type: node.question_type,
        content: node.content,
        marks: node.marks,
        options: mcqConfig?.options?.map((o) => ({ label: o.label, text: o.text, isCorrect: o.is_correct })),
        matchingPairs: matchConfig?.pairs,
        matchingDistractors: matchConfig?.distractors,
        orderItems: orderConfig?.items,
        correctOrder: orderConfig?.correct_order,
        trueFalseAnswer: trueFalseConfig?.correct_answer,
        requiresJustification: trueFalseConfig?.requires_justification,
        diagramLabels: diagramConfig?.labels,
        calculationAnswer: calcConfig?.answer,
        calculationUnit: calcConfig?.unit,
        gapOptions: clozeConfig?.gaps,
        assertion: assertConfig?.assertion,
        reason: assertConfig?.reason,
        matrixLeft: matrixConfig?.left,
        matrixRight: matrixConfig?.right,
        matrixMapping: matrixConfig?.mapping,
        numericAnswer: numericConfig?.answer,
        numericTolerance: numericConfig?.tolerance,
        numericUnit: numericConfig?.unit,
        choiceGroup: node.choice_group,
        children: node.children.map(nodeToShowcase),
    };
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
