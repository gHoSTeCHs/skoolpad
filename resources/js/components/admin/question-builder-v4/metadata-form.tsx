'use no memo';

import { useForm, usePage } from '@inertiajs/react';
import { useCallback, useEffect, useRef } from 'react';
import QuestionController from '@/actions/App/Http/Controllers/Admin/QuestionController';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useDirtyRegistration } from './hooks/use-dirty-registration';
import { useBuilderV4Store } from './store/provider';
import type { QuestionEnumOptions, QuestionNode } from '@/types/questions';

interface MetadataFormProps {
    question: QuestionNode;
}

interface MetadataData {
    marks: number | '';
    difficulty_level: string;
    bloom_level: string;
    [key: string]: string | number;
}

function buildInitial(q: QuestionNode): MetadataData {
    return {
        marks: q.marks ?? '',
        difficulty_level: q.difficulty_level ?? '',
        bloom_level: q.bloom_level ?? '',
    };
}

export function MetadataForm({ question }: MetadataFormProps) {
    const enumOptions = usePage<{ enum_options: QuestionEnumOptions }>().props.enum_options;
    const saveNonce = useBuilderV4Store((s) => s.saveRequestNonce);
    const initial = buildInitial(question);

    const form = useForm<MetadataData>(initial);

    const reset = useCallback(() => form.reset(), [form]);
    useDirtyRegistration('metadata', form.isDirty, reset);

    const lastHandled = useRef<number>(saveNonce);

    const submit = useCallback(() => {
        form.put(QuestionController.update.url({ question: question.id }), {
            preserveScroll: true,
            preserveState: true,
            only: ['paper'],
            onSuccess: () => form.setDefaults(),
        });
    }, [form, question.id]);

    useEffect(() => {
        if (saveNonce !== lastHandled.current) {
            lastHandled.current = saveNonce;
            if (form.isDirty) submit();
        }
    }, [saveNonce, form.isDirty, submit]);

    const difficulties = enumOptions.difficulties ?? [];
    const blooms = enumOptions.bloom_levels ?? [];

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (form.isDirty) submit();
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
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
                            form.setData(
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
                        onValueChange={(v) => form.setData('difficulty_level', v)}
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
                        onValueChange={(v) => form.setData('bloom_level', v)}
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
        </form>
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
