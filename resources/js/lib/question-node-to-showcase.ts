import type { ShowcaseQuestion } from '@/components/skoolpad/questions';
import type { QuestionNode } from '@/types/questions';

/**
 * Converts a QuestionNode from server data into the ShowcaseQuestion shape
 * expected by the QuestionRenderer component.
 */
export function nodeToShowcase(node: QuestionNode): ShowcaseQuestion {
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
