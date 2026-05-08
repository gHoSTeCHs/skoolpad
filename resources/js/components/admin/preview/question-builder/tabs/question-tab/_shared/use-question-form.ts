'use no memo';

import { useEffect, useRef } from 'react';
import { useForm } from '@inertiajs/react';
import QuestionController from '@/actions/App/Http/Controllers/Admin/QuestionController';
import type { QuestionNode, ResponseConfig, SubQuestionFormData } from '@/types/questions';
import type { TiptapJSON } from '@/types/tiptap';

export interface QuestionFormShape {
    question_type: QuestionNode['question_type'];
    content: string;
    content_doc: TiptapJSON | null;
    marks: number | null;
    difficulty_level: string;
    bloom_level: string;
    response_config: ResponseConfig;
    source: string;
    status: string;
    sub_questions: SubQuestionFormData[];
}

function mapChildrenToSubQuestions(children: QuestionNode[]): SubQuestionFormData[] {
    return children.map((child) => ({
        id: child.id,
        question_type: child.question_type,
        content: child.content,
        content_doc: child.content_doc ?? null,
        marks: child.marks,
        sort_order: child.sort_order,
        response_config: child.response_config ?? null,
    }));
}

function buildInitial(question: QuestionNode): QuestionFormShape {
    const runtimeQuestion = question as QuestionNode & { source?: string };
    return {
        question_type: question.question_type,
        content: question.content,
        content_doc: question.content_doc ?? null,
        marks: question.marks,
        difficulty_level: question.difficulty_level ?? '',
        bloom_level: question.bloom_level ?? '',
        response_config: question.response_config ?? null,
        source: runtimeQuestion.source ?? 'manual',
        status: question.status ?? 'draft',
        sub_questions: mapChildrenToSubQuestions(question.children ?? []),
    };
}

export function useQuestionForm(question: QuestionNode, onDirtyChange: (dirty: boolean) => void) {
    const form = useForm<QuestionFormShape>(buildInitial(question));
    const initialRef = useRef(JSON.stringify(form.data));

    useEffect(() => {
        initialRef.current = JSON.stringify(buildInitial(question));
    }, [question.id]);

    const isDirty = JSON.stringify(form.data) !== initialRef.current;

    useEffect(() => {
        onDirtyChange(isDirty);
    }, [isDirty, onDirtyChange]);

    function save(e?: React.FormEvent) {
        if (e) e.preventDefault();
        form.put(QuestionController.update.url(question.id), {
            preserveScroll: true,
            preserveState: true,
            only: ['paper'],
            onSuccess: () => {
                initialRef.current = JSON.stringify(form.data);
                onDirtyChange(false);
            },
        });
    }

    return { form, isDirty, save };
}
