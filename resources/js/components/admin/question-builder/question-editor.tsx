import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FormField } from '@/components/ui/form-field';
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
import type { QuestionType, ResponseConfig, EnumOption } from '@/types/questions';

interface QuestionEditorProps {
    questionType: QuestionType;
    content: string;
    marks: number | null;
    difficultyLevel: string;
    bloomLevel: string;
    responseConfig: ResponseConfig;
    onContentChange: (content: string) => void;
    onMarksChange: (marks: number | null) => void;
    onDifficultyChange: (level: string) => void;
    onBloomChange: (level: string) => void;
    onResponseConfigChange: (config: ResponseConfig) => void;
    enumOptions: { difficulties: EnumOption[]; bloom_levels?: EnumOption[] };
    errors?: Record<string, string>;
}

const WRITTEN_TYPES: QuestionType[] = ['theory', 'short_answer', 'essay'];
const NO_CONFIG_TYPES: QuestionType[] = ['theory', 'short_answer', 'essay', 'group'];

function getTypeBuilder(type: QuestionType, config: ResponseConfig, onChange: (c: ResponseConfig) => void) {
    switch (type) {
        case 'mcq':
            return <McqBuilder value={config as any} onChange={onChange} />;
        case 'multi_select_mcq':
            return <MultiSelectMcqBuilder value={config as any} onChange={onChange} />;
        case 'true_false':
            return <TrueFalseBuilder value={config as any} onChange={onChange} />;
        case 'fill_blank':
            return <FillBlankBuilder value={config as any} onChange={onChange} />;
        case 'cloze':
            return <ClozeBuilder value={config as any} onChange={onChange} />;
        case 'matching':
            return <MatchingBuilder value={config as any} onChange={onChange} />;
        case 'matrix_matching':
            return <MatrixMatchingBuilder value={config as any} onChange={onChange} />;
        case 'ordering':
            return <OrderingBuilder value={config as any} onChange={onChange} />;
        case 'diagram_label':
            return <DiagramLabelBuilder value={config as any} onChange={onChange} />;
        case 'calculation':
            return <CalculationBuilder value={config as any} onChange={onChange} />;
        case 'numeric_entry':
            return <NumericEntryBuilder value={config as any} onChange={onChange} />;
        case 'assertion_reason':
            return <AssertionReasonBuilder value={config as any} onChange={onChange} />;
        default:
            return null;
    }
}

export default function QuestionEditor({
    questionType,
    content,
    marks,
    difficultyLevel,
    bloomLevel,
    responseConfig,
    onContentChange,
    onMarksChange,
    onDifficultyChange,
    onBloomChange,
    onResponseConfigChange,
    enumOptions,
    errors,
}: QuestionEditorProps) {
    const isWritten = WRITTEN_TYPES.includes(questionType);
    const hasConfig = !NO_CONFIG_TYPES.includes(questionType);

    return (
        <div className="space-y-6">
            <FormField label="Question Content" name="content" error={errors?.content} required>
                <Textarea
                    id="content"
                    value={content}
                    onChange={(e) => onContentChange(e.target.value)}
                    rows={isWritten ? 6 : 3}
                    placeholder="Enter the question text..."
                />
            </FormField>

            <div className="grid grid-cols-3 gap-4">
                <FormField label="Marks" name="marks" error={errors?.marks}>
                    <Input
                        id="marks"
                        type="number"
                        min={1}
                        value={marks ?? ''}
                        onChange={(e) => onMarksChange(e.target.value ? Number(e.target.value) : null)}
                        placeholder="e.g. 5"
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

            {!hasConfig && questionType === 'group' && (
                <div className="rounded-lg border border-dashed border-border bg-muted/30 p-6 text-center">
                    <p className="text-sm text-muted-foreground">
                        Group questions contain sub-questions. Add sub-questions after creating this question.
                    </p>
                </div>
            )}
        </div>
    );
}
