export interface SubjectShowData {
    id: string;
    name: string;
    is_compulsory: boolean;
    education_level: string | null;
    stream: string | null;
}

export interface SubjectItem {
    id: string;
    topic_label: string;
    canonical_topic_id: string | null;
    content_block_id: string | null;
    topic_title: string | null;
    topic_slug: string | null;
    block_title: string | null;
    estimated_read_time: number | null;
    is_completed: boolean;
}

export interface SubjectWeek {
    week: number;
    items: SubjectItem[];
}

export interface SubjectTerm {
    term: number;
    weeks: SubjectWeek[];
}

export interface SubjectProgress {
    completed: number;
    total: number;
}
