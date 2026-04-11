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
    progress_data: ProgressData | null;
    ai_context: AIContext | null;
    created_at: string;
    updated_at: string;
}

export interface ProgressData {
    research_approved_at?: string;
    scheme_approved_at?: string;
    scheme_skipped?: boolean;
    scheme_skipped_at?: string;
    blocks_approved?: Record<string, { topic_id: string; approved_at: string }>;
}

export interface AIContext {
    research?: ResearchResult;
    research_failed?: { raw_response: string; validation_errors: Record<string, string[]> };
    research_approved?: ResearchTopic[];
    scheme?: SchemeResult;
    scheme_failed?: { raw_response: string; validation_errors: Record<string, string[]> };
    scheme_approved?: SchemeTerm[];
    blocks?: Record<string, BlockStructureResult>;
}

export interface ResearchResult {
    education_level: string;
    subject: string;
    total_topics_found: number;
    source_confidence: 'high' | 'medium' | 'low';
    terms: ResearchTerm[];
    lab_work_summary: string | null;
    conflicts: string[];
    missing_data: string[];
}

export interface ResearchTerm {
    term_number: number;
    term_label: string;
    topics: ResearchTopic[];
}

export interface ResearchTopic {
    sequence: number;
    title: string;
    sub_topics: string[];
    estimated_hours: number | null;
    practical_component: boolean;
    waec_alignment_note: string | null;
    term_number?: number;
}

export interface SchemeResult {
    education_level: string;
    subject: string;
    terms: SchemeTerm[];
    total_topics_allocated: number;
}

export interface SchemeTerm {
    term_number: number;
    instructional_weeks: number;
    topics: SchemeTopicAllocation[];
    total_periods?: number;
}

export interface SchemeTopicAllocation {
    title: string;
    week_start: number;
    week_end: number;
    periods: number;
    notes: string | null;
}

export interface BlockStructureResult {
    topic_title: string;
    topic_slug: string;
    topic_summary: string;
    estimated_total_minutes: number;
    blocks: BlockNode[];
    total_leaf_blocks: number;
    total_visualization_flags: number;
    split_recommendation: string[] | null;
    merge_recommendation: string | null;
}

export interface BlockNode {
    title: string;
    slug: string;
    block_type: BlockType;
    is_container: boolean;
    depth_level: number;
    parent_index: number | null;
    sort_order: number;
    estimated_read_time: number | null;
    difficulty_level: BlockDifficultyLevel | null;
    bloom_level: BloomLevel | null;
    visualization: VisualizationFlag;
    content_guidance: string;
}

export type BlockType = 'container' | 'text' | 'code' | 'diagram' | 'example' | 'exercise' | 'quiz' | 'reference' | 'comparison';

export type BlockDifficultyLevel = 'beginner' | 'intermediate' | 'advanced';

export type BloomLevel = 'remember' | 'understand' | 'apply' | 'analyze' | 'evaluate' | 'create';

export interface VisualizationFlag {
    recommended: boolean;
    priority?: 'high' | 'medium' | 'low' | null;
    primitive_type?: string | null;
    interaction_mode?: 'watch' | 'interactive' | 'challenge' | null;
    description?: string | null;
}

export interface GenerationLogEntry {
    id: string;
    prompt_type: string;
    model_used: string;
    is_valid: boolean;
    tokens_used: number;
    estimated_cost_cents: number | null;
    created_at: string;
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

export interface AIModelOption {
    id: string;
    name: string;
    model_id: string;
}

export type AIAdapterType = 'openai_compatible' | 'anthropic';

export interface AIModel {
    id: string;
    name: string;
    slug: string;
    adapter_type: AIAdapterType;
    adapter_type_label: string;
    base_url: string;
    api_key: string | null;
    model_id: string;
    max_tokens: number;
    input_cost_per_million: number;
    output_cost_per_million: number;
    is_active: boolean;
    sort_order: number;
    created_at: string;
    updated_at: string;
}

export type { EnumOption } from '@/types/questions';
