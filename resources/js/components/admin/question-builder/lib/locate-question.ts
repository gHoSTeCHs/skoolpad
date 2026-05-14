import type { QuestionNode, QuestionSection } from '@/types/questions';
import type { PoolContainer, PoolTopic } from '@/types/question-library';

/** Depth-first search for a question (including nested children) by id. */
export function locateInTree(nodes: QuestionNode[], id: string): QuestionNode | null {
    for (const node of nodes) {
        if (node.id === id) return node;
        const child = locateInTree(node.children, id);
        if (child) return child;
    }
    return null;
}

export function locateInSections(
    sections: QuestionSection[],
    id: string,
): { section: QuestionSection; question: QuestionNode } | null {
    for (const section of sections) {
        const found = locateInTree(section.questions, id);
        if (found) return { section, question: found };
    }
    return null;
}

export function locateInPool(
    pool: PoolContainer,
    id: string,
): { topic: PoolTopic; question: QuestionNode } | null {
    for (const topic of pool.topics) {
        const found = locateInTree(topic.questions, id);
        if (found) return { topic, question: found };
    }
    return null;
}

export function firstQuestionInSections(sections: QuestionSection[]): QuestionNode | null {
    for (const section of sections) {
        if (section.questions.length > 0) return section.questions[0];
    }
    return null;
}

export function firstQuestionInPool(pool: PoolContainer): QuestionNode | null {
    for (const topic of pool.topics) {
        if (topic.questions.length > 0) return topic.questions[0];
    }
    return null;
}
