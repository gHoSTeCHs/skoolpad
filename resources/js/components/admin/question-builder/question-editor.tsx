'use no memo';

import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FormField } from '@/components/ui/form-field';
import { TiptapEditor } from '@/components/shared/tiptap-editor';
import {
    McqBuilder,
    MultiSelectMcqBuilder,
    TrueFalseBuilder,
    FillBlankBuilder,
    ClozeBuilder,
    MatchingBuilder,
    MatrixMatchingBuilder,
    OrderingBuilder,
    DiagramLabelBuilder,
    CalculationBuilder,
    NumericEntryBuilder,
    AssertionReasonBuilder,
} from './type-specific';
import { GroupQuestionBuilder } from './group-question-builder';
import type {
    AssertionReasonConfig,
    CalculationConfig,
    ChoiceGroup,
    ClozeConfig,
    DiagramLabelConfig,
    EnumOption,
    FillBlankConfig,
    MatchingConfig,
    MatrixMatchingConfig,
    McqConfig,
    MultiSelectMcqConfig,
    NumericEntryConfig,
    OrderingConfig,
    QuestionType,
    ResponseConfig,
    SubQuestionFormData,
    TrueFalseConfig,
} from '@/types/questions';
import type { TiptapJSON } from '@/types/tiptap';

interface QuestionEditorProps {
    questionType: QuestionType;
    content: string;
    contentDoc: TiptapJSON | null;
    marks: number | null;
    difficultyLevel: string;
    bloomLevel: string;
    responseConfig: ResponseConfig;
    subQuestions?: SubQuestionFormData[];
    choiceGroup?: ChoiceGroup | null;
    onContentChange: (content: string, doc: TiptapJSON | null) => void;
    onMarksChange: (marks: number | null) => void;
    onDifficultyChange: (level: string) => void;
    onBloomChange: (level: string) => void;
    onResponseConfigChange: (config: ResponseConfig) => void;
    onSubQuestionsChange?: (next: SubQuestionFormData[]) => void;
    onChoiceGroupChange?: (next: ChoiceGroup | null) => void;
    enumOptions: {
        difficulties: EnumOption[];
        bloom_levels?: EnumOption[];
        question_types?: EnumOption<QuestionType>[];
    };
    errors?: Record<string, string>;
}

const RICH_TYPES: QuestionType[] = ['theory', 'short_answer', 'essay', 'assertion_reason'];
const WRITTEN_TYPES: QuestionType[] = ['theory', 'short_answer', 'essay'];
const NO_CONFIG_TYPES: QuestionType[] = ['theory', 'short_answer', 'essay', 'group'];

function getTypeBuilder(type: QuestionType, config: ResponseConfig, onChange: (c: ResponseConfig) => void) {
    switch (type) {
        case 'mcq':
            return <McqBuilder value={config as McqConfig} onChange={onChange} />;
        case 'multi_select_mcq':
            return <MultiSelectMcqBuilder value={config as MultiSelectMcqConfig} onChange={onChange} />;
        case 'true_false':
            return <TrueFalseBuilder value={config as TrueFalseConfig} onChange={onChange} />;
        case 'fill_blank':
            return <FillBlankBuilder value={config as FillBlankConfig} onChange={onChange} />;
        case 'cloze':
            return <ClozeBuilder value={config as ClozeConfig} onChange={onChange} />;
        case 'matching':
            return <MatchingBuilder value={config as MatchingConfig} onChange={onChange} />;
        case 'matrix_matching':
            return <MatrixMatchingBuilder value={config as MatrixMatchingConfig} onChange={onChange} />;
        case 'ordering':
            return <OrderingBuilder value={config as OrderingConfig} onChange={onChange} />;
        case 'diagram_label':
            return <DiagramLabelBuilder value={config as DiagramLabelConfig} onChange={onChange} />;
        case 'calculation':
            return <CalculationBuilder value={config as CalculationConfig} onChange={onChange} />;
        case 'numeric_entry':
            return <NumericEntryBuilder value={config as NumericEntryConfig} onChange={onChange} />;
        case 'assertion_reason':
            return <AssertionReasonBuilder value={config as AssertionReasonConfig} onChange={onChange} />;
        default:
            return null;
    }
}

export function QuestionEditor({
    questionType,
    content,
    contentDoc,
    marks,
    difficultyLevel,
    bloomLevel,
    responseConfig,
    subQuestions,
    choiceGroup,
    onContentChange,
    onMarksChange,
    onDifficultyChange,
    onBloomChange,
    onResponseConfigChange,
    onSubQuestionsChange,
    onChoiceGroupChange,
    enumOptions,
    errors,
}: QuestionEditorProps) {
    const isWritten = WRITTEN_TYPES.includes(questionType);
    const isGroup = questionType === 'group';
    const isRich = RICH_TYPES.includes(questionType);
    const hasConfig = !NO_CONFIG_TYPES.includes(questionType);

    return (
        <div className="space-y-6">
            <FormField label="Question Content" name="content" error={errors?.content} required>
                {isRich ? (
                    <TiptapEditor
                        value={contentDoc}
                        onChange={(json, plain) => onContentChange(plain, json)}
                        placeholder="Enter the question text. Use formatting, math, code, and lists as needed."
                        className="min-h-0 [&>div:last-of-type]:min-h-[200px]"
                    />
                ) : (
                    <Textarea
                        id="content"
                        value={content}
                        onChange={(e) => onContentChange(e.target.value, null)}
                        rows={isWritten || isGroup ? 6 : 3}
                        placeholder={
                            isGroup
                                ? 'Enter the parent stem (e.g. "Answer ALL parts of this question. Each part carries equal marks.")'
                                : 'Enter the question text...'
                        }
                    />
                )}
            </FormField>

            <div className="grid grid-cols-3 gap-4">
                <FormField label="Marks" name="marks" error={errors?.marks}>
                    <Input
                        id="marks"
                        type="number"
                        min={0}
                        value={marks ?? ''}
                        onChange={(e) => onMarksChange(e.target.value ? Number(e.target.value) : null)}
                        placeholder={isGroup ? 'Optional (sum of parts)' : 'e.g. 5'}
                    />
                </FormField>

                <FormField label="Difficulty" name="difficulty_level" error={errors?.difficulty_level}>
                    <Select value={difficultyLevel || 'none'} onValueChange={(v) => onDifficultyChange(v === 'none' ? '' : v)}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select difficulty" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="none">Not set</SelectItem>
                            {enumOptions.difficulties.map((d) => (
                                <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </FormField>

                {enumOptions.bloom_levels && enumOptions.bloom_levels.length > 0 && (
                    <FormField label="Bloom Level" name="bloom_level" error={errors?.bloom_level}>
                        <Select value={bloomLevel || 'none'} onValueChange={(v) => onBloomChange(v === 'none' ? '' : v)}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select bloom level" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none">Not set</SelectItem>
                                {enumOptions.bloom_levels.map((b) => (
                                    <SelectItem key={b.value} value={b.value}>{b.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </FormField>
                )}
            </div>

            {hasConfig && (
                <div className="rounded-lg border border-border bg-card p-4">
                    <h4 className="mb-4 text-sm font-semibold">Answer Configuration</h4>
                    {getTypeBuilder(questionType, responseConfig, onResponseConfigChange)}
                </div>
            )}

            {isGroup && onSubQuestionsChange && onChoiceGroupChange && enumOptions.question_types ? (
                <GroupQuestionBuilder
                    subQuestions={subQuestions ?? []}
                    choiceGroup={choiceGroup ?? null}
                    onSubQuestionsChange={onSubQuestionsChange}
                    onChoiceGroupChange={onChoiceGroupChange}
                    questionTypeOptions={enumOptions.question_types}
                    errors={errors}
                />
            ) : isGroup ? (
                <div className="rounded-lg border border-dashed border-border bg-muted/30 p-6 text-center">
                    <p className="text-sm text-muted-foreground">
                        Group questions contain sub-questions. Edit them on the dedicated question page.
                    </p>
                </div>
            ) : null}
        </div>
    );
}
