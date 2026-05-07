'use no memo';

import { useEffect, useRef } from 'react';
import { useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TiptapEditor } from '@/components/shared/tiptap-editor';
import InputError from '@/components/input-error';
import QuestionController from '@/actions/App/Http/Controllers/Admin/QuestionController';
import type { EnumOption, QuestionNode } from '@/types/questions';
import type { TiptapJSON } from '@/types/tiptap';

interface FreeFormAuthorProps {
    question: QuestionNode;
    enumOptions: {
        difficulties: EnumOption[];
        bloom_levels?: EnumOption[];
    };
    onDirtyChange: (dirty: boolean) => void;
}

export function FreeFormAuthor({ question, enumOptions, onDirtyChange }: FreeFormAuthorProps) {
    const initialSource = ((question as QuestionNode & { source?: string }).source) ?? 'manual';

    const form = useForm({
        question_type: question.question_type,
        content: question.content,
        content_doc: question.content_doc ?? null,
        marks: question.marks,
        difficulty_level: question.difficulty_level ?? '',
        bloom_level: question.bloom_level ?? '',
        response_config: question.response_config ?? null,
        source: initialSource,
        status: question.status ?? 'draft',
    });

    const initialDataRef = useRef(JSON.stringify(form.data));

    useEffect(() => {
        initialDataRef.current = JSON.stringify({
            question_type: question.question_type,
            content: question.content,
            content_doc: question.content_doc ?? null,
            marks: question.marks,
            difficulty_level: question.difficulty_level ?? '',
            bloom_level: question.bloom_level ?? '',
            response_config: question.response_config ?? null,
            source: initialSource,
            status: question.status ?? 'draft',
        });
    }, [question.id, initialSource, question.status]);

    const isDirty = JSON.stringify(form.data) !== initialDataRef.current;

    useEffect(() => {
        onDirtyChange(isDirty);
    }, [isDirty, onDirtyChange]);

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        form.put(QuestionController.update.url(question.id), {
            preserveScroll: true,
            preserveState: true,
            only: ['paper'],
            onSuccess: () => {
                initialDataRef.current = JSON.stringify(form.data);
                onDirtyChange(false);
            },
        });
    }

    async function handleImageUpload(_file: File): Promise<string> {
        return '/placeholder-image.png';
    }

    const typeLabel = question.question_type === 'theory'
        ? 'Theory'
        : question.question_type === 'short_answer'
            ? 'Short answer'
            : 'Essay';

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            <Card>
                <CardHeader>
                    <CardTitle>{typeLabel} stem</CardTitle>
                    <CardDescription>
                        The question prompt as the student will read it. Use the editor to add formatting, code, math, tables, or images.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        <Label htmlFor="stem">Stem</Label>
                        <TiptapEditor
                            value={form.data.content_doc}
                            onChange={(json, plain) => {
                                form.setData((prev) => ({
                                    ...prev,
                                    content: plain,
                                    content_doc: json,
                                }));
                            }}
                            onImageUpload={handleImageUpload}
                            placeholder={`Write the ${typeLabel.toLowerCase()} prompt here…`}
                        />
                        <InputError message={form.errors.content} />
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Metadata</CardTitle>
                    <CardDescription>Marks, difficulty, and Bloom taxonomy classification.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                        <FormField label="Marks" name="marks" error={form.errors.marks}>
                            <Input
                                id="marks"
                                type="number"
                                min={0}
                                step={0.5}
                                value={form.data.marks ?? ''}
                                onChange={(e) => {
                                    const v = e.target.value;
                                    form.setData('marks', v === '' ? null : Number(v));
                                }}
                            />
                        </FormField>

                        <FormField label="Difficulty" name="difficulty_level" error={form.errors.difficulty_level}>
                            <Select
                                value={form.data.difficulty_level || undefined}
                                onValueChange={(v) => form.setData('difficulty_level', v)}
                            >
                                <SelectTrigger id="difficulty_level">
                                    <SelectValue placeholder="Select difficulty" />
                                </SelectTrigger>
                                <SelectContent>
                                    {enumOptions.difficulties.map((opt) => (
                                        <SelectItem key={opt.value} value={opt.value}>
                                            {opt.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </FormField>

                        <FormField label="Bloom level" name="bloom_level" error={form.errors.bloom_level}>
                            <Select
                                value={form.data.bloom_level || undefined}
                                onValueChange={(v) => form.setData('bloom_level', v)}
                            >
                                <SelectTrigger id="bloom_level">
                                    <SelectValue placeholder="Select Bloom level" />
                                </SelectTrigger>
                                <SelectContent>
                                    {(enumOptions.bloom_levels ?? []).map((opt) => (
                                        <SelectItem key={opt.value} value={opt.value}>
                                            {opt.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </FormField>
                    </div>
                </CardContent>
            </Card>

            <div className="flex items-center justify-end gap-3 border-t border-[var(--border-2)] pt-4">
                {form.recentlySuccessful && (
                    <span className="text-xs text-muted-foreground">Saved</span>
                )}
                <Button type="submit" disabled={form.processing || !isDirty}>
                    {form.processing ? 'Saving…' : 'Save question'}
                </Button>
            </div>
        </form>
    );
}
