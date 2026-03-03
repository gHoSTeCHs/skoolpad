import type { PaginatedData } from '@/types/models';
import type { AnswerDepthLevel, QuestionDifficulty, QuestionSemester, QuestionType } from '@/types/questions';
import type { QuestionContextData } from '@/types/student-questions';

export interface CourseWithProgress {
    id: string;
    course_code: string;
    course_title: string;
    level: number | null;
    semester: string | null;
    institution: {
        id: string;
        name: string;
        abbreviation: string;
    } | null;
    topics_count: number;
    questions_count: number;
    completed_topics_count: number;
}

export interface CourseTopicItem {
    id: string;
    sequence_order: number;
    weight: string | null;
    title: string;
    slug: string;
    difficulty_level: string | null;
    estimated_read_minutes: number | null;
    is_completed: boolean;
    question_count: number;
    total_blocks: number;
    completed_blocks: number;
}

export interface TopicsProgress {
    completed: number;
    total: number;
    total_blocks: number;
    completed_blocks: number;
}

export interface CourseQuestionAnswer {
    id: string;
    depth_level: AnswerDepthLevel;
    content: Record<string, unknown> | null;
    content_plain: string | null;
    is_published: boolean;
}

export interface CourseQuestionBlockLink {
    content_block_id: string;
    relevance: 'primary' | 'secondary' | 'prerequisite';
    content_block: {
        id: string;
        title: string;
        canonical_topic_id: string;
    };
}

export interface CourseQuestionTopicLink {
    id: string;
    canonical_topic_id: string;
    is_primary: boolean;
    canonical_topic: {
        id: string;
        title: string;
    };
}

export interface CourseQuestion {
    id: string;
    content: string;
    question_type: QuestionType;
    year: number | null;
    semester: QuestionSemester | null;
    difficulty_level: QuestionDifficulty | null;
    marks: number | null;
    topic_links: CourseQuestionTopicLink[];
    question_block_links: CourseQuestionBlockLink[];
    answers: CourseQuestionAnswer[];
    contexts: QuestionContextData[];
    children: CourseQuestion[];
}

export interface CourseFilterOptions {
    topics: { id: string; title: string }[];
    years: number[];
}

export interface AppliedFilters {
    year: string | null;
    semester: string | null;
    topic: string | null;
    difficulty: string | null;
    type: string | null;
}

export interface CourseShowData {
    id: string;
    course_code: string;
    course_title: string;
    level: number | null;
    semester: string | null;
    institution: {
        id: string;
        name: string;
        abbreviation: string;
    } | null;
}

export interface CourseShowProps {
    course: CourseShowData;
    activeTab: string;
    topics?: CourseTopicItem[];
    topicsProgress?: TopicsProgress;
    questions?: PaginatedData<CourseQuestion>;
    filterOptions?: CourseFilterOptions;
    appliedFilters?: AppliedFilters;
}
