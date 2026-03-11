import { Pin } from 'lucide-react';
import { TiptapEditor } from '@/components/shared/tiptap-editor';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import type { EnrolledCourseOption } from '@/types/notes';
import type { TiptapJSON } from '@/types/tiptap';

interface NoteFormData {
    title: string;
    content: TiptapJSON | null;
    is_pinned: boolean;
    canonical_topic_id: string | null;
    institution_course_id: string | null;
}

interface NoteFormProps {
    data: NoteFormData;
    errors: Partial<Record<keyof NoteFormData, string>>;
    enrolledCourses: EnrolledCourseOption[];
    topicLabel?: string;
    onFieldChange: <K extends keyof NoteFormData>(field: K, value: NoteFormData[K]) => void;
}

export function NoteForm({
    data,
    errors,
    enrolledCourses,
    topicLabel,
    onFieldChange,
}: NoteFormProps) {
    return (
        <div className="space-y-6">
            <FormField label="Title" name="title" error={errors.title} required>
                <Input
                    id="title"
                    value={data.title}
                    onChange={(e) => onFieldChange('title', e.target.value)}
                    placeholder="Give your note a title..."
                    autoFocus
                />
            </FormField>

            {enrolledCourses.length > 0 && (
                <FormField
                    label="Course"
                    name="institution_course_id"
                    error={errors.institution_course_id}
                    description="Attach this note to a course (optional)"
                >
                    <Select
                        value={data.institution_course_id ?? 'none'}
                        onValueChange={(value) =>
                            onFieldChange('institution_course_id', value === 'none' ? null : value)
                        }
                    >
                        <SelectTrigger id="institution_course_id">
                            <SelectValue placeholder="No course" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="none">No course</SelectItem>
                            {enrolledCourses.map((course) => (
                                <SelectItem key={course.id} value={course.id}>
                                    {course.course_code} — {course.course_title}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </FormField>
            )}

            {topicLabel && (
                <div className="space-y-2">
                    <Label className="text-muted-foreground">Topic</Label>
                    <p
                        className="text-[13px] text-foreground"
                        style={{ fontFamily: 'var(--font-body)' }}
                    >
                        {topicLabel}
                    </p>
                </div>
            )}

            <div className="flex items-center gap-3">
                <Switch
                    id="is_pinned"
                    checked={data.is_pinned}
                    onCheckedChange={(checked) => onFieldChange('is_pinned', checked === true)}
                />
                <Label htmlFor="is_pinned" className="flex items-center gap-1.5 text-[13px]">
                    <Pin className="size-3.5" />
                    Pin to top
                </Label>
            </div>

            <div className="space-y-2">
                <Label>Content</Label>
                <TiptapEditor
                    value={data.content}
                    onChange={(json) => onFieldChange('content', json)}
                    placeholder="Start writing your notes..."
                    className="min-h-0 [&>div:last-of-type]:min-h-[300px]"
                />
                {errors.content && (
                    <p className="text-[0.8rem] font-medium text-destructive">{errors.content}</p>
                )}
            </div>
        </div>
    );
}
