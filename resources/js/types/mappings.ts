import type { TopicDifficulty } from '@/types/topics';

export type TopicWeight = 'core' | 'supplementary' | 'optional';

export interface AvailableMappingTopic {
    id: string;
    title: string;
    difficulty_level: TopicDifficulty;
}

export interface MappedTopic {
    id: string;
    canonical_topic_id: string;
    title: string;
    difficulty_level: TopicDifficulty;
    sequence_order: number;
    weight: TopicWeight;
}

export interface WeightOption {
    value: TopicWeight;
    label: string;
}

export interface MappingPayload {
    [key: string]: string | number;
    canonical_topic_id: string;
    sequence_order: number;
    weight: string;
}
