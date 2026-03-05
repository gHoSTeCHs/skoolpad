import { Head, useForm } from '@inertiajs/react';
import { useCallback, useEffect, useRef, useState } from 'react';

import PracticeController from '@/actions/App/Http/Controllers/Student/PracticeController';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import type { PracticeConfigPageProps } from '@/types/practice';

const QUESTION_COUNT_OPTIONS = [10, 20, 30, 50];
const breadcrumbs = [
    { title: 'Practice', href: PracticeController.configure.url() },
    { title: 'Configure', href: '#' },
];

export default function PracticeConfigure({ enrolledCourses, modes, difficulties, questionTypes }: PracticeConfigPageProps) {
    const searchParams = new URLSearchParams(window.location.search);
    const prefilledCourseId = searchParams.get('institution_course_id') ?? '';
    const prefilledTopicIds = searchParams.getAll('topic_ids[]');

    const form = useForm({
        institution_course_id: prefilledCourseId,
        topic_ids: prefilledTopicIds,
        question_types: [] as string[],
        difficulty: 'all',
        question_count: 20,
        mode: 'untimed',
        time_limit_seconds: null as number | null,
    });

    const [availableCount, setAvailableCount] = useState<number | null>(null);
    const [customCount, setCustomCount] = useState(false);
    const abortRef = useRef<AbortController | null>(null);

    const selectedCourse = enrolledCourses.find((c) => c.id === form.data.institution_course_id);
    const courseTopics = selectedCourse?.topics ?? [];

    const fetchAvailableCount = useCallback(() => {
        if (!form.data.institution_course_id) {
            setAvailableCount(null);
            return;
        }

        abortRef.current?.abort();
        const controller = new AbortController();
        abortRef.current = controller;

        const params = new URLSearchParams();
        params.set('institution_course_id', form.data.institution_course_id);
        form.data.topic_ids.forEach((id) => params.append('topic_ids[]', id));
        form.data.question_types.forEach((t) => params.append('question_types[]', t));
        if (form.data.difficulty) params.set('difficulty', form.data.difficulty);

        fetch(`${PracticeController.availableCount.url()}?${params.toString()}`, {
            signal: controller.signal,
            headers: { Accept: 'application/json' },
        })
            .then((r) => r.json())
            .then((data) => setAvailableCount(data.count))
            .catch(() => {});
    }, [form.data.institution_course_id, form.data.topic_ids, form.data.question_types, form.data.difficulty]);

    useEffect(() => {
        const timer = setTimeout(fetchAvailableCount, 300);
        return () => clearTimeout(timer);
    }, [fetchAvailableCount]);

    function handleCourseChange(courseId: string) {
        form.setData((prev) => ({
            ...prev,
            institution_course_id: courseId,
            topic_ids: [],
        }));
    }

    function handleTopicToggle(topicId: string, checked: boolean) {
        form.setData('topic_ids', checked
            ? [...form.data.topic_ids, topicId]
            : form.data.topic_ids.filter((id) => id !== topicId)
        );
    }

    function handleSelectAllTopics() {
        const allSelected = form.data.topic_ids.length === courseTopics.length;
        form.setData('topic_ids', allSelected ? [] : courseTopics.map((t) => t.id));
    }

    function handleQuestionTypeToggle(typeValue: string, checked: boolean) {
        form.setData('question_types', checked
            ? [...form.data.question_types, typeValue]
            : form.data.question_types.filter((t) => t !== typeValue)
        );
    }

    function handleCountSelect(value: string) {
        if (value === 'custom') {
            setCustomCount(true);
        } else {
            setCustomCount(false);
            form.setData('question_count', parseInt(value));
        }
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();

        const topicIds = form.data.topic_ids.length > 0 ? form.data.topic_ids : courseTopics.map((t) => t.id);
        form.transform((data) => ({ ...data, topic_ids: topicIds }));
        form.post(PracticeController.start.url());
    }

    const canStart = form.data.institution_course_id && !form.processing;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Configure Practice" />
            <div className="flex flex-col gap-4 p-4 md:p-6">
                <div>
                    <h1 className="font-display text-2xl font-bold tracking-tight">Practice</h1>
                    <p className="mt-1 text-sm text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                        Configure your practice session and start answering questions.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="max-w-2xl">
                    <Card>
                        <CardHeader>
                            <CardTitle>Session Settings</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <FormField label="Course" name="institution_course_id" error={form.errors.institution_course_id} required>
                                <Select value={form.data.institution_course_id} onValueChange={handleCourseChange}>
                                    <SelectTrigger id="institution_course_id">
                                        <SelectValue placeholder="Select a course" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {enrolledCourses.map((c) => (
                                            <SelectItem key={c.id} value={c.id}>
                                                {c.course_code} — {c.course_title}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </FormField>

                            {courseTopics.length > 0 && (
                                <FormField label="Topics" name="topic_ids" error={form.errors.topic_ids} description="Leave empty to include all topics">
                                    <div className="space-y-2 rounded-md border border-border p-3">
                                        <div className="flex items-center justify-between border-b border-border pb-2">
                                            <button type="button" onClick={handleSelectAllTopics} className="text-xs font-medium text-primary hover:underline">
                                                {form.data.topic_ids.length === courseTopics.length ? 'Deselect all' : 'Select all'}
                                            </button>
                                            <span className="text-xs text-muted-foreground">{form.data.topic_ids.length}/{courseTopics.length} selected</span>
                                        </div>
                                        <div className="max-h-48 space-y-1.5 overflow-y-auto">
                                            {courseTopics.map((t) => (
                                                <label key={t.id} className="flex items-center gap-2 rounded px-1 py-0.5 hover:bg-accent">
                                                    <Checkbox
                                                        checked={form.data.topic_ids.includes(t.id)}
                                                        onCheckedChange={(checked) => handleTopicToggle(t.id, !!checked)}
                                                    />
                                                    <span className="text-sm">{t.title}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                </FormField>
                            )}

                            <FormField label="Mode" name="mode" error={form.errors.mode} required>
                                <Select value={form.data.mode} onValueChange={(v) => form.setData('mode', v)}>
                                    <SelectTrigger id="mode">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {modes.map((m) => (
                                            <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </FormField>

                            {form.data.mode === 'timed' && (
                                <FormField label="Time Limit (minutes)" name="time_limit_seconds" error={form.errors.time_limit_seconds} required>
                                    <Input
                                        id="time_limit_seconds"
                                        type="number"
                                        min={1}
                                        value={form.data.time_limit_seconds ? form.data.time_limit_seconds / 60 : ''}
                                        onChange={(e) => form.setData('time_limit_seconds', e.target.value ? parseInt(e.target.value) * 60 : null)}
                                        placeholder="e.g. 30"
                                    />
                                </FormField>
                            )}

                            <FormField label="Difficulty" name="difficulty" error={form.errors.difficulty}>
                                <Select value={form.data.difficulty} onValueChange={(v) => form.setData('difficulty', v)}>
                                    <SelectTrigger id="difficulty">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {difficulties.map((d) => (
                                            <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </FormField>

                            <FormField label="Question Types" name="question_types" error={form.errors.question_types} description="Leave empty for all types">
                                <div className="flex flex-wrap gap-2">
                                    {questionTypes.map((qt) => (
                                        <label key={qt.value} className="flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-sm hover:bg-accent">
                                            <Checkbox
                                                checked={form.data.question_types.includes(qt.value)}
                                                onCheckedChange={(checked) => handleQuestionTypeToggle(qt.value, !!checked)}
                                            />
                                            {qt.label}
                                        </label>
                                    ))}
                                </div>
                            </FormField>

                            <FormField label="Number of Questions" name="question_count" error={form.errors.question_count} required>
                                <div className="flex flex-wrap gap-2">
                                    {QUESTION_COUNT_OPTIONS.map((n) => (
                                        <button
                                            key={n}
                                            type="button"
                                            onClick={() => handleCountSelect(String(n))}
                                            className={`rounded-md border px-4 py-2 text-sm font-medium transition-colors ${
                                                !customCount && form.data.question_count === n
                                                    ? 'border-primary bg-primary text-primary-foreground'
                                                    : 'border-border bg-background hover:bg-accent'
                                            }`}
                                        >
                                            {n}
                                        </button>
                                    ))}
                                    <button
                                        type="button"
                                        onClick={() => handleCountSelect('custom')}
                                        className={`rounded-md border px-4 py-2 text-sm font-medium transition-colors ${
                                            customCount
                                                ? 'border-primary bg-primary text-primary-foreground'
                                                : 'border-border bg-background hover:bg-accent'
                                        }`}
                                    >
                                        Custom
                                    </button>
                                </div>
                                {customCount && (
                                    <Input
                                        type="number"
                                        min={1}
                                        max={100}
                                        value={form.data.question_count}
                                        onChange={(e) => form.setData('question_count', parseInt(e.target.value) || 1)}
                                        className="mt-2 w-32"
                                    />
                                )}
                            </FormField>

                            {availableCount !== null && (
                                <div className="flex items-center gap-2 rounded-md bg-muted/50 px-3 py-2">
                                    <span className="text-sm text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                                        <span className="font-semibold text-foreground">{availableCount}</span> questions match your criteria
                                    </span>
                                </div>
                            )}
                        </CardContent>
                        <CardFooter className="justify-end gap-3">
                            <Button type="submit" disabled={!canStart}>
                                {form.processing ? 'Starting...' : 'Start Practice'}
                            </Button>
                        </CardFooter>
                    </Card>
                </form>
            </div>
        </AppLayout>
    );
}
