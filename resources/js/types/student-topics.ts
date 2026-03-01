import type { CourseQuestion } from '@/types/student-courses';
import type { TiptapJSON } from '@/types/tiptap';

export interface PrerequisiteItem {
    id: string;
    title: string;
    is_hard: boolean;
    status: 'completed' | 'attempted' | 'not_started';
    accuracy: number | null;
}

export interface PrerequisiteStatusResult {
    banner: 'none' | 'success' | 'warning' | 'danger';
    prerequisites: PrerequisiteItem[];
}

export interface BlockPrerequisiteItem {
    id: string;
    title: string;
    isHard: boolean;
}

export interface TopicBlock {
    id: string;
    title: string;
    path: string;
    blockType: string;
    depthLevel: number;
    estimatedReadTime: number | null;
    difficultyLevel: string | null;
    content: TiptapJSON | null;
    simplifiedContent: TiptapJSON | null;
    isContainer: boolean;
    prerequisites: BlockPrerequisiteItem[];
    children: TopicBlock[];
}

export interface TopicData {
    id: string;
    title: string;
    slug: string;
    content: TiptapJSON | null;
    simplified_content: TiptapJSON | null;
    summary: string | null;
    difficulty_level: string | null;
    estimated_read_minutes: number | null;
    discipline: { id: string; name: string } | null;
}

export interface CourseContext {
    id: string;
    course_code: string;
    course_title: string;
}

export interface TopicNavItem {
    id: string;
    title: string;
}

export interface TopicShowProps {
    topic: TopicData;
    hasBlocks: boolean;
    blockTree: TopicBlock[] | null;
    completedBlockIds: string[];
    lockedBlockIds: string[];
    isTopicCompleted: boolean;
    prerequisiteStatus: PrerequisiteStatusResult;
    courseContext: CourseContext | null;
    prevTopic: TopicNavItem | null;
    nextTopic: TopicNavItem | null;
    relatedQuestions: CourseQuestion[];
    crossInstitutionCount: number;
}
