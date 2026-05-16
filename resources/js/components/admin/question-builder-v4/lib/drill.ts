import type { QuestionNode, QuestionPaper, QuestionSection } from '@/types/questions';

export function findQuestion(paper: QuestionPaper, id: string): QuestionNode | null {
    for (const section of paper.sections) {
        const found = walk(section.questions, id);
        if (found) return found;
    }
    return null;
}

function walk(qs: QuestionNode[], id: string): QuestionNode | null {
    for (const q of qs) {
        if (q.id === id) return q;
        const child = walk(q.children ?? [], id);
        if (child) return child;
    }
    return null;
}

export function findSectionOf(paper: QuestionPaper, questionId: string): QuestionSection | null {
    for (const section of paper.sections) {
        if (containsQuestion(section.questions, questionId)) return section;
    }
    return null;
}

function containsQuestion(qs: QuestionNode[], id: string): boolean {
    for (const q of qs) {
        if (q.id === id) return true;
        if (containsQuestion(q.children ?? [], id)) return true;
    }
    return false;
}

export function currentLevelQuestions(
    paper: QuestionPaper,
    activeSectionId: string | null,
    drillPath: string[],
): QuestionNode[] {
    const section = activeSectionId ? paper.sections.find((s) => s.id === activeSectionId) : null;
    if (!section) return [];

    if (drillPath.length === 0) return section.questions;

    const deepestId = drillPath[drillPath.length - 1];
    const deepest = findQuestion(paper, deepestId);
    return deepest?.children ?? [];
}

export interface CrumbSegment {
    label: string;
    /** Drill index to pop to when clicked. Null = leaf (no click). */
    popTo: number | null;
}

export function currentBreadcrumbs(
    paper: QuestionPaper,
    activeSectionId: string | null,
    drillPath: string[],
): CrumbSegment[] {
    const section = activeSectionId ? paper.sections.find((s) => s.id === activeSectionId) : null;
    if (!section) return [];

    const segments: CrumbSegment[] = [];
    const sectionIsLeaf = drillPath.length === 0;
    segments.push({ label: section.label, popTo: sectionIsLeaf ? null : 0 });

    drillPath.forEach((qid, i) => {
        const q = findQuestion(paper, qid);
        if (!q) return;
        const isLeaf = i === drillPath.length - 1;
        segments.push({
            label: q.question_number ?? `Q${i + 1}`,
            popTo: isLeaf ? null : i + 1,
        });
    });

    return segments;
}
