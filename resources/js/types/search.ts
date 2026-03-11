export type SearchEntityType = 'topic' | 'course' | 'question' | 'note';

export interface SearchResultItem {
    id: string;
    title: string;
    subtitle: string;
    description: string;
    type: SearchEntityType;
    url: string;
}

export interface SearchResponse {
    topics: SearchResultItem[];
    courses: SearchResultItem[];
    questions: SearchResultItem[];
    notes: SearchResultItem[];
    total: number;
}

export interface SearchHistoryItem {
    query: string;
    resultCount: number;
    timestamp: number;
}
