import type { TiptapJSON } from '@/types/tiptap';

export type TopicDifficulty = 'foundational' | 'intermediate' | 'advanced';

export interface Discipline {
    id: string;
    name: string;
}

export interface DifficultyOption {
    value: TopicDifficulty;
    label: string;
}

export interface TopicListItem {
    id: string;
    title: string;
    slug: string;
    discipline: { id: string; name: string } | null;
    parent: { id: string; title: string } | null;
    difficulty_level: TopicDifficulty;
    is_published: boolean;
    estimated_read_minutes: number | null;
    created_at: string;
}

export interface TopicPrerequisite {
    id: string;
    title: string;
    is_hard_prerequisite: boolean;
}

export interface AvailableTopic {
    id: string;
    title: string;
}

export interface TopicFormData {
    title: string;
    slug: string;
    discipline_id: string;
    parent_topic_id: string | null;
    difficulty_level: TopicDifficulty | '';
    summary: string;
    content: TiptapJSON | null;
    content_plain: string;
    estimated_read_minutes: number | '';
    is_published: boolean;
    prerequisites: TopicPrerequisite[];
}
