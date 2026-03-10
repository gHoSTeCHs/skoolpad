import { useForm } from '@inertiajs/react';
import { useEffect, useMemo } from 'react';
import { store, update } from '@/actions/App/Http/Controllers/Student/ExamTimetableController';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import type { EnrolledCourse, EnrolledSubject } from '@/types/practice';
import type { ExamTimetableEntry } from '@/types/exam-timetable';
import AocTopicPicker from './aoc-topic-picker';

interface ExamEntryModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    entry?: ExamTimetableEntry | null;
    initialDate?: string;
    enrolledCourses: EnrolledCourse[];
    enrolledSubjects: EnrolledSubject[];
    assessmentTypes: { id: string; name: string }[];
    isSecondary: boolean;
}

export default function ExamEntryModal({
    open,
    onOpenChange,
    entry,
    initialDate,
    enrolledCourses,
    enrolledSubjects,
    assessmentTypes,
    isSecondary,
}: ExamEntryModalProps) {
    const isEditing = !!entry;

    const form = useForm({
        institution_course_id: entry?.institution_course?.id ?? '',
        level_subject_id: entry?.level_subject?.id ?? '',
        assessment_type_id: entry?.assessment_type?.id ?? '',
        label: entry?.label ?? '',
        exam_date: entry?.exam_date?.split('T')[0] ?? initialDate ?? '',
        exam_time: entry?.exam_time ?? '',
        notes: entry?.notes ?? '',
        aoc_topic_ids: entry?.aoc_topics?.map((t) => t.id) ?? ([] as string[]),
    });

    useEffect(() => {
        if (open) {
            form.setData({
                institution_course_id: entry?.institution_course?.id ?? '',
                level_subject_id: entry?.level_subject?.id ?? '',
                assessment_type_id: entry?.assessment_type?.id ?? '',
                label: entry?.label ?? '',
                exam_date: entry?.exam_date?.split('T')[0] ?? initialDate ?? '',
                exam_time: entry?.exam_time ?? '',
                notes: entry?.notes ?? '',
                aoc_topic_ids: entry?.aoc_topics?.map((t) => t.id) ?? [],
            });
            form.clearErrors();
        }
    }, [open, entry?.id, initialDate]);

    const selectedSourceId = isSecondary ? form.data.level_subject_id : form.data.institution_course_id;

    const availableTopics = useMemo(() => {
        if (isSecondary) {
            const subject = enrolledSubjects.find((s) => s.id === form.data.level_subject_id);
            return subject?.topics ?? [];
        }
        const course = enrolledCourses.find((c) => c.id === form.data.institution_course_id);
        return course?.topics ?? [];
    }, [isSecondary, form.data.institution_course_id, form.data.level_subject_id, enrolledCourses, enrolledSubjects]);

    function handleSourceChange(value: string) {
        if (isSecondary) {
            form.setData((prev) => ({
                ...prev,
                level_subject_id: value,
                institution_course_id: '',
                aoc_topic_ids: [],
            }));
            const subject = enrolledSubjects.find((s) => s.id === value);
            if (subject && !form.data.label) {
                form.setData('label', `${subject.subject_name} Exam`);
            }
        } else {
            form.setData((prev) => ({
                ...prev,
                institution_course_id: value,
                level_subject_id: '',
                aoc_topic_ids: [],
            }));
            const course = enrolledCourses.find((c) => c.id === value);
            if (course && !form.data.label) {
                form.setData('label', `${course.course_title} Exam`);
            }
        }
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();

        form.transform((data) => ({
            ...data,
            institution_course_id: data.institution_course_id || null,
            level_subject_id: data.level_subject_id || null,
            assessment_type_id: data.assessment_type_id || null,
            exam_time: data.exam_time || null,
            notes: data.notes || null,
        }));

        const options = {
            preserveScroll: true,
            onSuccess: () => onOpenChange(false),
        };

        if (isEditing && entry) {
            form.put(update.url(entry.id), options);
        } else {
            form.post(store.url(), options);
        }
    }

    const sourceItems = isSecondary ? enrolledSubjects : enrolledCourses;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>{isEditing ? 'Edit Exam' : 'Add Exam'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <FormField
                        label={isSecondary ? 'Subject' : 'Course'}
                        name={isSecondary ? 'level_subject_id' : 'institution_course_id'}
                        error={isSecondary ? form.errors.level_subject_id : form.errors.institution_course_id}
                        required
                    >
                        <Select value={selectedSourceId} onValueChange={handleSourceChange}>
                            <SelectTrigger>
                                <SelectValue placeholder={isSecondary ? 'Select subject...' : 'Select course...'} />
                            </SelectTrigger>
                            <SelectContent>
                                {isSecondary
                                    ? enrolledSubjects.map((s) => (
                                        <SelectItem key={s.id} value={s.id}>{s.subject_name}</SelectItem>
                                    ))
                                    : enrolledCourses.map((c) => (
                                        <SelectItem key={c.id} value={c.id}>{c.course_code} — {c.course_title}</SelectItem>
                                    ))
                                }
                            </SelectContent>
                        </Select>
                    </FormField>

                    <FormField label="Label" name="label" error={form.errors.label} required>
                        <Input
                            id="label"
                            value={form.data.label}
                            onChange={(e) => form.setData('label', e.target.value)}
                            placeholder="e.g. Midterm Exam"
                        />
                    </FormField>

                    {isSecondary && assessmentTypes.length > 0 && (
                        <FormField label="Assessment Type" name="assessment_type_id" error={form.errors.assessment_type_id}>
                            <Select
                                value={form.data.assessment_type_id}
                                onValueChange={(v) => form.setData('assessment_type_id', v === 'none' ? '' : v)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select type (optional)..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">None</SelectItem>
                                    {assessmentTypes.map((t) => (
                                        <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </FormField>
                    )}

                    <div className="grid grid-cols-2 gap-3">
                        <FormField label="Date" name="exam_date" error={form.errors.exam_date} required>
                            <Input
                                id="exam_date"
                                type="date"
                                value={form.data.exam_date}
                                onChange={(e) => form.setData('exam_date', e.target.value)}
                            />
                        </FormField>
                        <FormField label="Time" name="exam_time" error={form.errors.exam_time}>
                            <Input
                                id="exam_time"
                                type="time"
                                value={form.data.exam_time}
                                onChange={(e) => form.setData('exam_time', e.target.value)}
                            />
                        </FormField>
                    </div>

                    <AocTopicPicker
                        topics={availableTopics}
                        selectedIds={form.data.aoc_topic_ids}
                        onChange={(ids) => form.setData('aoc_topic_ids', ids)}
                    />

                    <FormField label="Notes" name="notes" error={form.errors.notes}>
                        <Textarea
                            id="notes"
                            value={form.data.notes}
                            onChange={(e) => form.setData('notes', e.target.value)}
                            placeholder="Any notes about this exam..."
                            rows={2}
                        />
                    </FormField>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                        <Button type="submit" disabled={form.processing}>
                            {isEditing ? 'Update' : 'Add Exam'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
