'use no memo';

import { Transition } from '@headlessui/react';
import { useForm } from '@inertiajs/react';
import { CheckCircle2, Circle } from 'lucide-react';
import { useEffect } from 'react';
import AnswerController from '@/actions/App/Http/Controllers/Admin/AnswerController';
import InputError from '@/components/input-error';
import { TiptapEditor } from '@/components/shared/tiptap-editor';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import type { AnswerDepthData } from '@/types/questions';
import type { TiptapJSON } from '@/types/tiptap';

interface Props {
    questionId: string;
    depthData: AnswerDepthData;
    onDirtyChange?: (dirty: boolean) => void;
}

export function AnswerDepthPanel({ questionId, depthData, onDirtyChange }: Props) {
    const isExisting = depthData.answer !== null;

    const form = useForm({
        depth_level: depthData.depth_level,
        content: (depthData.answer?.content ?? null) as TiptapJSON | null,
        content_plain: depthData.answer?.content_plain ?? '',
        is_published: depthData.answer?.is_published ?? false,
    });

    useEffect(() => {
        onDirtyChange?.(form.isDirty);
    }, [form.isDirty, onDirtyChange]);

    async function handleImageUpload(_file: File): Promise<string> {
        return '/placeholder-image.png';
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();

        if (isExisting) {
            form.put(
                AnswerController.update.url({ question: questionId, answer: depthData.answer!.id }),
                { preserveScroll: true },
            );
        } else {
            form.post(
                AnswerController.store.url(questionId),
                { preserveScroll: true },
            );
        }
    }

    return (
        <Card data-depth={depthData.depth_level}>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                        {isExisting ? (
                            <CheckCircle2 className="size-5 shrink-0 text-green-600 dark:text-green-500 reader:text-green-500" />
                        ) : (
                            <Circle className="size-5 shrink-0 text-muted-foreground/50" />
                        )}
                        <CardTitle>{depthData.label}</CardTitle>
                    </div>
                    {isExisting && (
                        <Badge variant={form.data.is_published ? 'default' : 'secondary'}>
                            {form.data.is_published ? 'Published' : 'Draft'}
                        </Badge>
                    )}
                </div>
                <CardDescription className="ml-[30px]">{depthData.description}</CardDescription>
            </CardHeader>

            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="space-y-2">
                        <Label>Content</Label>
                        <TiptapEditor
                            value={form.data.content}
                            onChange={(json, plain) => {
                                form.setData((prev) => ({
                                    ...prev,
                                    content: json,
                                    content_plain: plain,
                                }));
                            }}
                            onImageUpload={handleImageUpload}
                            placeholder={`Write the ${depthData.label.toLowerCase()} answer here...`}
                        />
                        <InputError message={form.errors.content} />
                        <InputError message={form.errors.depth_level} />
                    </div>

                    <div className="flex items-center gap-3">
                        <Switch
                            id={`is_published_${depthData.depth_level}`}
                            checked={form.data.is_published}
                            onCheckedChange={(checked) => form.setData('is_published', checked)}
                        />
                        <Label htmlFor={`is_published_${depthData.depth_level}`}>Published</Label>
                    </div>

                    <div className="flex items-center gap-4">
                        <Button type="submit" disabled={form.processing}>
                            {isExisting ? 'Update' : 'Save'} Answer
                        </Button>

                        <Transition
                            show={form.recentlySuccessful}
                            enter="transition ease-in-out"
                            enterFrom="opacity-0"
                            leave="transition ease-in-out"
                            leaveTo="opacity-0"
                        >
                            <p className="text-sm text-muted-foreground">Saved</p>
                        </Transition>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}
