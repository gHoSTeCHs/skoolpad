export type ContentProjectMode = 'secondary' | 'tertiary';

export type ContentProjectStatus = 'draft' | 'research' | 'structuring' | 'generating' | 'reviewing' | 'complete';

export interface ContentProject {
    id: string;
    mode: ContentProjectMode;
    mode_label: string;
    status: ContentProjectStatus;
    status_label: string;
    education_level_id: string | null;
    curriculum_subject_id: string | null;
    discipline_id: string | null;
    education_level_name: string | null;
    curriculum_subject_name: string | null;
    discipline_name: string | null;
    created_by: string;
    created_by_name: string | null;
    progress_data: Record<string, number> | null;
    created_at: string;
    updated_at: string;
}

export interface EducationLevelOption {
    id: string;
    name: string;
    display_name: string | null;
}

export interface CurriculumSubjectOption {
    id: string;
    name: string;
    slug: string;
}

export interface DisciplineOption {
    id: string;
    name: string;
    slug: string;
}

export type { EnumOption } from '@/types/questions';
