import { usePage } from '@inertiajs/react';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import type { QuestionEnumOptions } from '@/types/questions';
import type { QuestionFormBridge } from './question-form';

interface MetadataFormProps {
    form: QuestionFormBridge;
}

export function MetadataForm({ form }: MetadataFormProps) {
    const enumOptions = usePage<{ enum_options: QuestionEnumOptions }>().props.enum_options;
    const difficulties = enumOptions.difficulties ?? [];
    const blooms = enumOptions.bloom_levels ?? [];

    return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Field label="Marks" htmlFor="meta-marks" error={form.errors.marks}>
                <input
                    id="meta-marks"
                    type="number"
                    inputMode="numeric"
                    min={0}
                    step={1}
                    value={form.data.marks}
                    onChange={(e) =>
                        form.setField(
                            'marks',
                            e.target.value === '' ? '' : Number(e.target.value),
                        )
                    }
                    className="h-9 w-full rounded-md border border-border bg-background px-3 text-[13px] text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
            </Field>

            <Field label="Difficulty" htmlFor="meta-diff" error={form.errors.difficulty_level}>
                <Select
                    value={form.data.difficulty_level || ''}
                    onValueChange={(v) => form.setField('difficulty_level', v)}
                >
                    <SelectTrigger id="meta-diff" className="h-9">
                        <SelectValue placeholder="Select difficulty" />
                    </SelectTrigger>
                    <SelectContent>
                        {difficulties.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                                {opt.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </Field>

            <Field label="Bloom level" htmlFor="meta-bloom" error={form.errors.bloom_level}>
                <Select
                    value={form.data.bloom_level || ''}
                    onValueChange={(v) => form.setField('bloom_level', v)}
                >
                    <SelectTrigger id="meta-bloom" className="h-9">
                        <SelectValue placeholder="Select bloom level" />
                    </SelectTrigger>
                    <SelectContent>
                        {blooms.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                                {opt.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </Field>
        </div>
    );
}

function Field({
    label,
    htmlFor,
    error,
    children,
}: {
    label: string;
    htmlFor: string;
    error?: string;
    children: React.ReactNode;
}) {
    return (
        <div className="space-y-1.5">
            <Label
                htmlFor={htmlFor}
                className="font-mono text-[10px] tracking-[0.16em] text-[var(--fg-subtle)] uppercase"
            >
                {label}
            </Label>
            {children}
            {error && <p className="text-[11.5px] text-destructive">{error}</p>}
        </div>
    );
}
