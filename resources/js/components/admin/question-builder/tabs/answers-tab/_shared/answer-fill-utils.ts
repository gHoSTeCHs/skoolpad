import type { AnswerDepthData, AnswerDepthLevel, QuestionNode } from '@/types/questions';
import type { TiptapJSON } from '@/types/tiptap';
import { DEPTH_META, DEPTH_ORDER } from './depth-meta';

export type FillState = 'published' | 'draft' | 'empty';

export function fillStateFor(question: QuestionNode, depth: AnswerDepthLevel): FillState {
    const a = question.answers?.find((x) => x.depth_level === depth);
    if (!a) return 'empty';
    return a.is_published ? 'published' : 'draft';
}

export function buildDepthData(question: QuestionNode, depth: AnswerDepthLevel): AnswerDepthData {
    const existing = question.answers?.find((a) => a.depth_level === depth);
    return {
        depth_level: depth,
        label: DEPTH_META[depth].label,
        description: DEPTH_META[depth].description,
        answer: existing
            ? {
                id: existing.id,
                content: (existing.content ?? null) as TiptapJSON,
                content_plain: existing.content_plain,
                is_published: existing.is_published,
            }
            : null,
    };
}

export interface GroupCounts {
    filled: number;
    drafts: number;
    total: number;
}

export function aggregateGroupCounts(parent: QuestionNode): GroupCounts {
    const children = parent.children ?? [];
    let filled = 0;
    let drafts = 0;
    let total = 0;

    for (const child of children) {
        for (const depth of DEPTH_ORDER) {
            total += 1;
            const state = fillStateFor(child, depth);
            if (state === 'published') filled += 1;
            else if (state === 'draft') drafts += 1;
        }
    }

    return { filled, drafts, total };
}

export function findQuickAnswer(question: QuestionNode): TiptapJSON | null {
    const quick = question.answers?.find((a) => a.depth_level === 'quick');
    return (quick?.content ?? null) as TiptapJSON | null;
}
