export type ImportType = 'topics' | 'course_mappings' | 'course_offerings';
export type ImportStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface ImportTypeOption {
    value: ImportType;
    label: string;
}

export interface ImportLogItem {
    id: string;
    import_type: ImportType;
    original_filename: string;
    status: ImportStatus;
    total_rows: number;
    success_count: number;
    error_count: number;
    errors: string[] | null;
    processed_by: string | null;
    created_at: string;
}
