import type { EnrolledCourse, EnrolledSubject, MockPaperData } from '@/types/practice';
import type { DailyStudyPlan, ExamSummary, TopicReadiness } from '@/types/study-planner';

export interface ExamTimetableEntry {
    id: string;
    label: string;
    exam_date: string;
    exam_time: string | null;
    notes: string | null;
    is_completed: boolean;
    completed_at: string | null;
    is_past: boolean;
    days_remaining: number;
    is_imminent: boolean;
    is_upcoming: boolean;
    subject_name: string | null;
    has_aoc: boolean;
    institution_course: { id: string; course_code: string; course_title: string } | null;
    level_subject: { id: string; subject_name: string } | null;
    assessment_type: { id: string; name: string } | null;
    aoc_topics: { id: string; title: string }[];
}

export interface ExamTimetablePageProps {
    entries: ExamTimetableEntry[];
    enrolledCourses: EnrolledCourse[];
    enrolledSubjects: EnrolledSubject[];
    assessmentTypes: { id: string; name: string }[];
    isSecondary: boolean;
    dailyPlan: DailyStudyPlan | null;
    examSummary: ExamSummary | null;
    topicReadiness: Record<string, TopicReadiness[]>;
    mockPapers: Record<string, MockPaperData[]>;
}
