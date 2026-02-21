import { Head, Link, useForm } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import AnswerController from '@/actions/App/Http/Controllers/Admin/AnswerController';
import QuestionController from '@/actions/App/Http/Controllers/Admin/QuestionController';
import InputError from '@/components/input-error';
import { McqOptionsBuilder } from '@/components/admin/mcq-options-builder';
import { TopicLinker } from '@/components/admin/topic-linker';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import AdminLayout from '@/layouts/admin-layout';
import type {
    CourseOption,
    EnumOption,
    InstitutionOption,
    QuestionData,
    QuestionDifficulty,
    QuestionEnumOptions,
    QuestionSemester,
    QuestionSource,
    QuestionStatus,
    QuestionType,
    TopicLink,
} from '@/types/questions';

interface Props {
    question: QuestionData;
    institutions: InstitutionOption[];
    enum_options: QuestionEnumOptions & { statuses: EnumOption<QuestionStatus>[] };
}

export default function AdminQuestionsEdit({ question, institutions, enum_options }: Props) {
    const [institutionId, setInstitutionId] = useState(question.institution_id);
    const [courses, setCourses] = useState<CourseOption[]>([]);
    const [selectedTopics, setSelectedTopics] = useState<TopicLink[]>(question.topic_links);

    const form = useForm({
        institution_course_id: question.institution_course_id,
        question_type: question.question_type,
        content: question.content,
        year: question.year,
        semester: question.semester,
        marks: question.marks,
        difficulty_level: question.difficulty_level,
        source: question.source,
        status: question.status,
        options: question.options,
        topic_ids: question.topic_links.map((t) => t.id),
        primary_topic_id: question.topic_links.find((t) => t.is_primary)?.id ?? '',
    });

    useEffect(() => {
        if (question.institution_id) {
            fetch(`/admin/api/institutions/${question.institution_id}/courses`)
                .then((res) => res.json())
                .then((data: CourseOption[]) => setCourses(data))
                .catch(() => setCourses([]));
        }
    }, []);

    useEffect(() => {
        if (!institutionId) {
            setCourses([]);
            form.setData('institution_course_id', '');
            return;
        }

        if (institutionId !== question.institution_id) {
            fetch(`/admin/api/institutions/${institutionId}/courses`)
                .then((res) => res.json())
                .then((data: CourseOption[]) => setCourses(data))
                .catch(() => setCourses([]));

            form.setData('institution_course_id', '');
        }
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
        form.put(QuestionController.update.url(question.id));
    }

    const breadcrumbs = [
        { title: 'Questions', href: '/admin/questions' },
        { title: 'Edit', href: QuestionController.edit.url(question.id) },
    ];

    return (
        <AdminLayout breadcrumbs={breadcrumbs}>
            <Head title="Edit Question" />
            <div className="flex flex-col gap-4 p-4 md:p-6">
                <div className="flex items-center justify-between">
                    <h1 className="font-display text-2xl font-bold tracking-tight">Edit Question</h1>
                    <Button asChild>
                        <Link href={AnswerController.index.url(question.id)}>Manage Answers</Link>
                    </Button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
                        <div className="flex flex-col gap-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Question Content</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="grid gap-6 sm:grid-cols-2">
                                        <div className="space-y-2">
                                            <Label htmlFor="institution_id">Institution</Label>
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
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="institution_course_id">Course</Label>
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
                                            <InputError message={form.errors.institution_course_id} />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="question_type">Question Type</Label>
                                        <Select
                                            value={form.data.question_type}
                                            onValueChange={(value) => form.setData('question_type', value as QuestionType)}
                                        >
                                            <SelectTrigger id="question_type">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {enum_options.question_types.map((t) => (
                                                    <SelectItem key={t.value} value={t.value}>
                                                        {t.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <InputError message={form.errors.question_type} />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="content">Content</Label>
                                        <Textarea
                                            id="content"
                                            value={form.data.content}
                                            onChange={(e) => form.setData('content', e.target.value)}
                                            rows={6}
                                            placeholder="Enter question content..."
                                        />
                                        <InputError message={form.errors.content} />
                                    </div>
                                </CardContent>
                            </Card>

                            {form.data.question_type === 'mcq' && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle>MCQ Options</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <McqOptionsBuilder
                                            options={form.data.options}
                                            onChange={(opts) => form.setData('options', opts)}
                                            errors={form.errors}
                                        />
                                    </CardContent>
                                </Card>
                            )}

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
                        </div>

                        <div className="flex flex-col gap-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Settings</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="grid gap-6 sm:grid-cols-2">
                                        <div className="space-y-2">
                                            <Label htmlFor="year">Year</Label>
                                            <Input
                                                id="year"
                                                type="number"
                                                min={1990}
                                                max={new Date().getFullYear()}
                                                value={form.data.year}
                                                onChange={(e) => form.setData('year', e.target.value === '' ? '' : Number(e.target.value))}
                                                placeholder="e.g. 2024"
                                            />
                                            <InputError message={form.errors.year} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="semester">Semester</Label>
                                            <Select
                                                value={form.data.semester as string}
                                                onValueChange={(value) => form.setData('semester', value as QuestionSemester)}
                                            >
                                                <SelectTrigger id="semester">
                                                    <SelectValue placeholder="Select semester" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {enum_options.semesters.map((s) => (
                                                        <SelectItem key={s.value} value={s.value}>
                                                            {s.label}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <InputError message={form.errors.semester} />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="marks">Marks</Label>
                                        <Input
                                            id="marks"
                                            type="number"
                                            min={1}
                                            value={form.data.marks}
                                            onChange={(e) => form.setData('marks', e.target.value === '' ? '' : Number(e.target.value))}
                                            placeholder="e.g. 5"
                                        />
                                        <InputError message={form.errors.marks} />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="difficulty_level">Difficulty</Label>
                                        <Select
                                            value={form.data.difficulty_level as string}
                                            onValueChange={(value) => form.setData('difficulty_level', value as QuestionDifficulty)}
                                        >
                                            <SelectTrigger id="difficulty_level">
                                                <SelectValue placeholder="Select difficulty" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {enum_options.difficulties.map((d) => (
                                                    <SelectItem key={d.value} value={d.value}>
                                                        {d.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <InputError message={form.errors.difficulty_level} />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="source">Source</Label>
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
                                        <InputError message={form.errors.source} />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="status">Status</Label>
                                        <Select
                                            value={form.data.status}
                                            onValueChange={(value) => form.setData('status', value as QuestionStatus)}
                                        >
                                            <SelectTrigger id="status">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {enum_options.statuses.map((s) => (
                                                    <SelectItem key={s.value} value={s.value}>
                                                        {s.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <InputError message={form.errors.status} />
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>

                    <div className="mt-6 flex justify-end gap-3">
                        <Button variant="outline" asChild>
                            <Link href={QuestionController.index.url()}>Cancel</Link>
                        </Button>
                        <Button type="submit" disabled={form.processing}>
                            Update Question
                        </Button>
                    </div>
                </form>
            </div>
        </AdminLayout>
    );
}
