import type { AnswerDepthLevel } from '@/types/questions';

export const DEPTH_ORDER: AnswerDepthLevel[] = ['quick', 'standard', 'deep_dive'];

export const DEPTH_META: Record<AnswerDepthLevel, { label: string; description: string }> = {
    quick: {
        label: 'Quick',
        description: '1–2 sentence direct answer. Available to Free tier students.',
    },
    standard: {
        label: 'Standard',
        description: 'Step-by-step explanation with reasoning. Available to Scholar tier.',
    },
    deep_dive: {
        label: 'Deep dive',
        description: 'Comprehensive explanation with examples and related concepts. Scholar Pro tier.',
    },
};
