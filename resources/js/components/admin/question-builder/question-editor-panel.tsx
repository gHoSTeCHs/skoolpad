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

interface QuestionEditorPanelProps {
    paper: QuestionPaper;
    question: QuestionNode;
    enumOptions: QuestionEnumOptions;
}

export default function QuestionEditorPanel({ paper, question, enumOptions }: QuestionEditorPanelProps) {
    const [questionType, setQuestionType] = useState<QuestionType>(question.question_type);
    const [content, setContent] = useState(question.content);
    const [marks, setMarks] = useState<number | null>(question.marks);
    const [difficulty, setDifficulty] = useState(question.difficulty_level ?? '');
    const [bloomLevel, setBloomLevel] = useState(question.bloom_level ?? '');
    const [responseConfig, setResponseConfig] = useState<ResponseConfig>(question.response_config);
    const [saving, setSaving] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [contextPickerOpen, setContextPickerOpen] = useState(false);

    useEffect(() => {
        setQuestionType(question.question_type);
        setContent(question.content);
        setMarks(question.marks);
        setDifficulty(question.difficulty_level ?? '');
        setBloomLevel(question.bloom_level ?? '');
        setResponseConfig(question.response_config);
        setErrors({});
    }, [question.id]);

    function handleSave() {
        setSaving(true);
        router.put(
            QuestionController.update.url(question.id),
            {
                question_type: questionType,
                content,
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
            }
        );
    }

    const linkedContexts = getLinkedContexts(question, paper.contexts);

    return (
        <div className="space-y-6 p-4">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">Edit Question</h3>
                <Button
                    variant="outline"
                    size="sm"
                    className="text-xs"
                    onClick={() => setContextPickerOpen(true)}
                >
                    Link Context
                </Button>
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
                    onChange={setQuestionType}
                    options={enumOptions.question_types}
                />
            </FormField>

            <QuestionEditor
                questionType={questionType}
                content={content}
                marks={marks}
                difficultyLevel={difficulty}
                bloomLevel={bloomLevel}
                responseConfig={responseConfig}
                onContentChange={setContent}
                onMarksChange={setMarks}
                onDifficultyChange={setDifficulty}
                onBloomChange={setBloomLevel}
                onResponseConfigChange={setResponseConfig}
                enumOptions={{
                    difficulties: enumOptions.difficulties,
                    bloom_levels: enumOptions.bloom_levels,
                }}
                errors={errors}
            />

            <Button onClick={handleSave} disabled={saving || !content.trim()} className="w-full">
                {saving ? 'Saving...' : 'Save Question'}
            </Button>

            <ContextPicker
                open={contextPickerOpen}
                onOpenChange={setContextPickerOpen}
                contexts={paper.contexts}
                question={question}
            />
        </div>
    );
}
