'use no memo';

import { useState, useEffect } from 'react';
import { router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import QuestionEditor from './question-editor';
import QuestionTypeSelector from './question-type-selector';
import ContextPicker from './context-picker';
import { FormField } from '@/components/ui/form-field';
import SpBadge from '@/components/skoolpad/sp-badge';
import QuestionController from '@/actions/App/Http/Controllers/Admin/QuestionController';
import type {
    QuestionPaper,
    QuestionNode,
    QuestionType,
    ResponseConfig,
    QuestionEnumOptions,
    QuestionContextData,
} from '@/types/questions';
import type { TiptapJSON } from '@/types/tiptap';

/**
 * Resolves linked contexts from a question node, handling both the
 * API resource format (context_links) and the raw Eloquent serialization
 * format (question_context_links).
 */
function getLinkedContexts(question: QuestionNode, contexts: QuestionContextData[]): QuestionContextData[] {
    if (question.context_links?.length) {
        return question.context_links
            .map((cl) => contexts.find((c) => c.id === cl.context_id))
            .filter(Boolean) as QuestionContextData[];
    }
    if (question.question_context_links?.length) {
        return question.question_context_links
            .map((cl) => contexts.find((c) => c.id === cl.question_context_id))
            .filter(Boolean) as QuestionContextData[];
    }
    return [];
}

export interface DraftSeed {
    sectionId: string;
    parentId?: string;
    defaultType: QuestionType;
}

function hydrateDocFromPlain(plain: string | undefined | null): TiptapJSON | null {
    if (!plain || plain.trim().length === 0) return null;
    return {
        type: 'doc',
        content: plain.split(/\n{2,}/).map((paragraph) => ({
            type: 'paragraph',
            content: paragraph.length > 0 ? [{ type: 'text', text: paragraph }] : [],
        })),
    };
}

interface QuestionEditorPanelProps {
    paper: QuestionPaper;
    question?: QuestionNode;
    draft?: DraftSeed;
    enumOptions: QuestionEnumOptions;
    onCreated?: (newQuestionId: string) => void;
    onDirtyChange?: (dirty: boolean) => void;
}

export function QuestionEditorPanel({
    paper,
    question,
    draft,
    enumOptions,
    onCreated,
    onDirtyChange,
}: QuestionEditorPanelProps) {
    const isNew = !question && !!draft;
    const initialType = question?.question_type ?? draft?.defaultType ?? 'mcq';

    const [questionType, setQuestionType] = useState<QuestionType>(initialType);
    const [content, setContent] = useState(question?.content ?? '');
    const [contentDoc, setContentDoc] = useState<TiptapJSON | null>(
        question?.content_doc ?? hydrateDocFromPlain(question?.content),
    );
    const [marks, setMarks] = useState<number | null>(question?.marks ?? null);
    const [difficulty, setDifficulty] = useState(question?.difficulty_level ?? '');
    const [bloomLevel, setBloomLevel] = useState(question?.bloom_level ?? '');
    const [responseConfig, setResponseConfig] = useState<ResponseConfig>(question?.response_config ?? null);
    const [saving, setSaving] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [contextPickerOpen, setContextPickerOpen] = useState(false);

    useEffect(() => {
        if (question) {
            setQuestionType(question.question_type);
            setContent(question.content);
            setContentDoc(question.content_doc ?? hydrateDocFromPlain(question.content));
            setMarks(question.marks);
            setDifficulty(question.difficulty_level ?? '');
            setBloomLevel(question.bloom_level ?? '');
            setResponseConfig(question.response_config);
        } else if (draft) {
            setQuestionType(draft.defaultType);
            setContent('');
            setContentDoc(null);
            setMarks(null);
            setDifficulty('');
            setBloomLevel('');
            setResponseConfig(null);
        }
        setErrors({});
        onDirtyChange?.(false);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [question?.id, draft?.sectionId, draft?.parentId]);

    function markDirty() {
        if (isNew) onDirtyChange?.(true);
    }

    function handleContentChange(plain: string, doc: TiptapJSON | null) {
        setContent(plain);
        setContentDoc(doc);
        if (isNew) onDirtyChange?.(plain.trim().length > 0);
    }

    function handleTypeChange(t: QuestionType) {
        if (t !== questionType) {
            setResponseConfig(null);
        }
        setQuestionType(t);
        markDirty();
    }

    function handleMarksChange(m: number | null) {
        setMarks(m);
        markDirty();
    }

    function handleDifficultyChange(d: string) {
        setDifficulty(d);
        markDirty();
    }

    function handleBloomChange(b: string) {
        setBloomLevel(b);
        markDirty();
    }

    function handleResponseConfigChange(c: ResponseConfig) {
        setResponseConfig(c);
        markDirty();
    }

    function handleSave() {
        setSaving(true);

        if (isNew && draft) {
            router.post(
                QuestionController.store.url(),
                {
                    question_paper_id: paper.id,
                    question_section_id: draft.sectionId || undefined,
                    parent_question_id: draft.parentId,
                    institution_course_id: paper.institution_course_id,
                    question_type: questionType,
                    content,
                    content_doc: contentDoc,
                    marks: marks ?? undefined,
                    difficulty_level: difficulty || undefined,
                    bloom_level: bloomLevel || undefined,
                    response_config: responseConfig as unknown as string,
                    source: 'manual',
                    status: 'draft',
                    from_paper_builder: true,
                },
                {
                    preserveScroll: true,
                    onSuccess: (page) => {
                        setSaving(false);
                        setErrors({});
                        onDirtyChange?.(false);
                        const flash = (page.props as { flash?: { created_question_id?: string } }).flash;
                        const newId = flash?.created_question_id;
                        if (newId && onCreated) onCreated(newId);
                    },
                    onError: (errs) => {
                        setSaving(false);
                        setErrors(errs as Record<string, string>);
                    },
                },
            );
            return;
        }

        if (!question) return;

        router.put(
            QuestionController.update.url(question.id),
            {
                question_type: questionType,
                content,
                content_doc: contentDoc,
                marks: marks ?? undefined,
                difficulty_level: difficulty || undefined,
                bloom_level: bloomLevel || undefined,
                response_config: responseConfig as unknown as string,
                source: 'manual',
                status: question.status || 'draft',
            },
            {
                preserveScroll: true,
                only: ['paper'],
                onSuccess: () => {
                    setSaving(false);
                    setErrors({});
                },
                onError: (errs) => {
                    setSaving(false);
                    setErrors(errs as Record<string, string>);
                },
            },
        );
    }

    const linkedContexts = question ? getLinkedContexts(question, paper.contexts) : [];
    const headerLabel = isNew
        ? draft?.parentId
            ? 'New Sub-question'
            : 'New Question'
        : 'Edit Question';
    const cta = isNew
        ? draft?.parentId
            ? 'Create sub-question'
            : 'Create question'
        : 'Save changes';

    return (
        <div className="space-y-6 p-4">
            <div>
                <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold">{headerLabel}</h3>
                    {!isNew && question && (
                        <Button
                            variant="outline"
                            size="sm"
                            className="text-xs"
                            onClick={() => setContextPickerOpen(true)}
                        >
                            Link Context
                        </Button>
                    )}
                </div>
                {isNew && (
                    <p className="mt-1 text-xs italic text-muted-foreground">
                        Not saved yet — fill in content and click {cta}.
                    </p>
                )}
            </div>

            {linkedContexts.length > 0 && (
                <div className="space-y-1">
                    <span className="text-xs font-medium text-muted-foreground">Linked Contexts:</span>
                    <div className="flex flex-wrap gap-1">
                        {linkedContexts.map((ctx) => (
                            <SpBadge key={ctx.id} variant="neutral" className="text-[9px]">
                                {ctx.title || ctx.context_type.replace('_', ' ')}
                            </SpBadge>
                        ))}
                    </div>
                </div>
            )}

            <FormField label="Question Type" name="question_type" error={errors.question_type} required>
                <QuestionTypeSelector
                    value={questionType}
                    onChange={handleTypeChange}
                    options={enumOptions.question_types}
                />
            </FormField>

            <QuestionEditor
                questionType={questionType}
                content={content}
                contentDoc={contentDoc}
                marks={marks}
                difficultyLevel={difficulty}
                bloomLevel={bloomLevel}
                responseConfig={responseConfig}
                onContentChange={handleContentChange}
                onMarksChange={handleMarksChange}
                onDifficultyChange={handleDifficultyChange}
                onBloomChange={handleBloomChange}
                onResponseConfigChange={handleResponseConfigChange}
                enumOptions={{
                    difficulties: enumOptions.difficulties,
                    bloom_levels: enumOptions.bloom_levels,
                }}
                errors={errors}
            />

            <Button onClick={handleSave} disabled={saving || !content.trim()} className="w-full">
                {saving ? 'Saving…' : cta}
            </Button>

            {!isNew && question && (
                <ContextPicker
                    open={contextPickerOpen}
                    onOpenChange={setContextPickerOpen}
                    contexts={paper.contexts}
                    question={question}
                />
            )}
        </div>
    );
}
