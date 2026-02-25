import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { QuestionTypeBadge } from '@/components/skoolpad/questions';
import type { QuestionType, EnumOption } from '@/types/questions';

interface Props {
    value: QuestionType;
    onChange: (type: QuestionType) => void;
    options: EnumOption<QuestionType>[];
    disabled?: boolean;
}

export default function QuestionTypeSelector({ value, onChange, options, disabled }: Props) {
    return (
        <Select value={value} onValueChange={(v) => onChange(v as QuestionType)} disabled={disabled}>
            <SelectTrigger>
                <SelectValue placeholder="Select question type">
                    <div className="flex items-center gap-2">
                        <QuestionTypeBadge type={value} />
                        <span>{options.find((o) => o.value === value)?.label ?? value}</span>
                    </div>
                </SelectValue>
            </SelectTrigger>
            <SelectContent>
                {options.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                        <div className="flex items-center gap-2">
                            <QuestionTypeBadge type={option.value} />
                            <span>{option.label}</span>
                        </div>
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
}
