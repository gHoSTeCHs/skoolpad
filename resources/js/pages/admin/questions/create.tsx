'use no memo';

import { Head, Link, useForm } from '@inertiajs/react';
import { Eye } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import QuestionController from '@/actions/App/Http/Controllers/Admin/QuestionController';
import { QuestionEditor } from '@/components/admin/question-builder/question-editor';
import QuestionTypeSelector from '@/components/admin/question-builder/question-type-selector';
import { TopicLinker } from '@/components/admin/topic-linker';
import { QuestionRenderer } from '@/components/skoolpad/questions';
import type { ShowcaseQuestion } from '@/components/skoolpad/questions';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AdminLayout from '@/layouts/admin-layout';
import { formDataToShowcaseQuestion } from '@/lib/question-preview';
import type {
    CourseOption,
    InstitutionOption,
    QuestionDifficulty,
    QuestionEnumOptions,
    QuestionFormData,
    QuestionSemester,
    QuestionSource,
    QuestionType,
    ResponseConfig,
    TopicLink,
} from '@/types/questions';

interface Props {
    institutions: InstitutionOption[];
    enum_options: QuestionEnumOptions;
}

const breadcrumbs = [
    { title: 'Questions', href: QuestionController.index.url() },
    { title: 'Create', href: '#' },
];

export default function AdminQuestionsCreate({ institutions, enum_options }: Props) {
    const [institutionId, setInstitutionId] = useState('');
    const [courses, setCourses] = useState<CourseOption[]>([]);
    const [selectedTopics, setSelectedTopics] = useState<TopicLink[]>([]);

    const form = useForm<QuestionFormData>({
        institution_course_id: '',
        question_type: 'mcq',
        content: '',
        content_doc: null,
        year: '',
        semester: '',
        marks: '',
        difficulty_level: '',
        bloom_level: '',
        source: 'manual',
        status: 'draft',
        response_config: null,
        topic_ids: [],
        primary_topic_id: '',
        sub_questions: [],
        choice_group: null,
    });

    const previewQuestion = useMemo<ShowcaseQuestion>(
        () => formDataToShowcaseQuestion(form.data),
        [form.data],
    );

    const hasPreviewContent = Boolean(form.data.content);

    useEffect(() => {
        if (!institutionId) {
            setCourses([]);
            form.setData('institution_course_id', '');
            return;
        }

        fetch(`/admin/api/institutions/${institutionId}/courses`)
            .then((res) => res.json())
            .then((data: CourseOption[]) => setCourses(data))
            .catch(() => setCourses([]));

        form.setData('institution_course_id', '');
    }, [institutionId]);

    function handleTopicsChange(topics: TopicLink[]) {
        setSelectedTopics(topics);
        form.setData('topic_ids', topics.map((t) => t.id));
    }

    function handlePrimaryChange(topicId: string) {
        form.setData('primary_topic_id', topicId);
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        form.post(QuestionController.store.url());
    }

    return (
        <AdminLayout breadcrumbs={breadcrumbs}>
            <Head title="Create Question" />
            <div className="flex flex-col gap-4 p-4 md:p-6">
                <div>
                    <h1 className="font-display text-2xl font-bold tracking-tight">Create Question</h1>
                    <p className="mt-1 text-sm text-muted-foreground">Add a new question to the question bank.</p>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="grid gap-6 lg:grid-cols-[1fr_420px]">
                        <div className="flex flex-col gap-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Source</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="grid gap-6 sm:grid-cols-2">
                                        <FormField label="Institution" name="institution_id">
                                            <Select value={institutionId} onValueChange={setInstitutionId}>
                                                <SelectTrigger id="institution_id">
                                                    <SelectValue placeholder="Select institution" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {institutions.map((inst) => (
                                                        <SelectItem key={inst.id} value={inst.id}>
                                                            {inst.name} ({inst.abbreviation})
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </FormField>
                                        <FormField label="Course" name="institution_course_id" error={form.errors.institution_course_id} required>
                                            <Select
                                                value={form.data.institution_course_id}
                                                onValueChange={(value) => form.setData('institution_course_id', value)}
                                                disabled={!institutionId || courses.length === 0}
                                            >
                                                <SelectTrigger id="institution_course_id">
                                                    <SelectValue placeholder="Select course" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {courses.map((c) => (
                                                        <SelectItem key={c.id} value={c.id}>
                                                            {c.course_code} — {c.course_title}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </FormField>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle>Question Type</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <FormField label="Type" name="question_type" error={form.errors.question_type} required>
                                        <QuestionTypeSelector
                                            value={form.data.question_type}
                                            onChange={(type: QuestionType) => {
                                                form.setData('question_type', type);
                                                form.setData('response_config', null);
                                            }}
                                            options={enum_options.question_types}
                                        />
                                    </FormField>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle>Question Content</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <QuestionEditor
                                        questionType={form.data.question_type}
                                        content={form.data.content}
                                        contentDoc={form.data.content_doc ?? null}
                                        marks={form.data.marks === '' ? null : (form.data.marks as number)}
                                        difficultyLevel={form.data.difficulty_level}
                                        bloomLevel={form.data.bloom_level ?? ''}
                                        responseConfig={form.data.response_config}
                                        subQuestions={form.data.sub_questions}
                                        choiceGroup={form.data.choice_group}
                                        onContentChange={(content, doc) => {
                                            form.setData((prev) => ({ ...prev, content, content_doc: doc }));
                                        }}
                                        onMarksChange={(marks) => form.setData('marks', marks ?? '')}
                                        onDifficultyChange={(level) => form.setData('difficulty_level', level as QuestionDifficulty | '')}
                                        onBloomChange={(level) => form.setData('bloom_level', level)}
                                        onResponseConfigChange={(config: ResponseConfig) => form.setData('response_config', config)}
                                        onSubQuestionsChange={(next) => form.setData('sub_questions', next)}
                                        onChoiceGroupChange={(next) => form.setData('choice_group', next)}
                                        enumOptions={{
                                            difficulties: enum_options.difficulties,
                                            bloom_levels: enum_options.bloom_levels,
                                            question_types: enum_options.question_types,
                                        }}
                                        errors={form.errors}
                                    />
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle>Topic Linking</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <TopicLinker
                                        selectedTopics={selectedTopics}
                                        onChange={handleTopicsChange}
                                        onPrimaryChange={handlePrimaryChange}
                                        primaryTopicId={form.data.primary_topic_id}
                                        errors={form.errors}
                                    />
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle>Settings</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="grid gap-6 sm:grid-cols-2">
                                        <FormField label="Year" name="year" error={form.errors.year}>
                                            <Input
                                                id="year"
                                                type="number"
                                                min={1990}
                                                max={new Date().getFullYear()}
                                                value={form.data.year}
                                                onChange={(e) => form.setData('year', e.target.value === '' ? '' : Number(e.target.value))}
                                                placeholder="e.g. 2024"
                                            />
                                        </FormField>
                                        <FormField label="Semester" name="semester" error={form.errors.semester}>
                                            <Select
                                                value={form.data.semester || 'none'}
                                                onValueChange={(value) => form.setData('semester', (value === 'none' ? '' : value) as QuestionSemester | '')}
                                            >
                                                <SelectTrigger id="semester">
                                                    <SelectValue placeholder="Select semester" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="none">Not set</SelectItem>
                                                    {enum_options.semesters.map((s) => (
                                                        <SelectItem key={s.value} value={s.value}>
                                                            {s.label}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </FormField>
                                    </div>

                                    <div className="grid gap-6 sm:grid-cols-2">
                                        <FormField label="Source" name="source" error={form.errors.source}>
                                            <Select
                                                value={form.data.source}
                                                onValueChange={(value) => form.setData('source', value as QuestionSource)}
                                            >
                                                <SelectTrigger id="source">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {enum_options.sources.map((s) => (
                                                        <SelectItem key={s.value} value={s.value}>
                                                            {s.label}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </FormField>
                                        <FormField label="Status" name="status">
                                            <div className="flex h-9 items-center">
                                                <Badge
                                                    variant="secondary"
                                                    className="bg-[var(--badge-neutral-bg)] text-[var(--badge-neutral-fg)]"
                                                >
                                                    Draft
                                                </Badge>
                                            </div>
                                        </FormField>
                                    </div>
                                </CardContent>
                            </Card>

                            <div className="flex justify-end gap-3">
                                <Button variant="outline" asChild>
                                    <Link href={QuestionController.index.url()}>Cancel</Link>
                                </Button>
                                <Button type="submit" disabled={form.processing}>
                                    Create Question
                                </Button>
                            </div>
                        </div>

                        <div className="lg:sticky lg:top-6 lg:self-start">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Eye className="size-4" />
                                        Live Preview
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {hasPreviewContent ? (
                                        <QuestionRenderer q={previewQuestion} />
                                    ) : (
                                        <div className="flex flex-col items-center justify-center py-12 text-center">
                                            <div className="mb-3 rounded-full bg-muted p-3">
                                                <Eye className="size-5 text-muted-foreground" />
                                            </div>
                                            <p className="text-sm font-medium text-muted-foreground">
                                                Start typing to see a live preview
                                            </p>
                                            <p className="mt-1 text-xs text-muted-foreground/70">
                                                Your question will appear here as you build it.
                                            </p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </form>
            </div>
        </AdminLayout>
    );
}
