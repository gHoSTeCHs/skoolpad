import type { BaseFilters } from '@/hooks/use-filter-handlers';
import type { PaginatedData } from '@/types/models';
import type { TiptapJSON } from '@/types/tiptap';

export interface NoteListItem {
    id: string;
    title: string;
    is_pinned: boolean;
    updated_at: string;
    created_at: string;
    canonical_topic: { id: string; title: string } | null;
    institution_course: { id: string; course_code: string; course_title: string } | null;
}

export interface NoteDetail {
    id: string;
    title: string;
    content: TiptapJSON | null;
    is_pinned: boolean;
    canonical_topic: { id: string; title: string } | null;
    institution_course: { id: string; course_code: string; course_title: string } | null;
    updated_at: string;
}

export interface TopicNoteItem {
    id: string;
    title: string;
    is_pinned: boolean;
    updated_at: string;
}

export interface NoteFilters extends BaseFilters {
    course_id?: string;
}

export interface EnrolledCourseOption {
    id: string;
    course_code: string;
    course_title: string;
}

export interface NoteIndexProps {
    notes: PaginatedData<NoteListItem>;
    filters: NoteFilters;
    enrolledCourses: EnrolledCourseOption[];
    isSecondary: boolean;
}

export interface NoteCreateProps {
    enrolledCourses: EnrolledCourseOption[];
    topicContext: { id: string; title: string } | null;
    courseContext: { id: string; course_code: string; course_title: string } | null;
}

export interface NoteShowProps {
    note: NoteDetail;
    enrolledCourses: EnrolledCourseOption[];
}
