export interface ParentFeatureMatrix {
    full_dashboard: boolean;
    verification: boolean;
    read_together: boolean;
    study_as_child: boolean;
    weekly_report: boolean;
    exam_alerts: boolean;
    topic_coverage: boolean;
    study_duration_override: boolean;
    full_check_in: boolean;
    check_in_topic_limit: number | null;
    max_children: number;
}

export function isFeatureAvailable(
    features: ParentFeatureMatrix,
    feature: keyof Omit<ParentFeatureMatrix, 'check_in_topic_limit' | 'max_children'>,
): boolean {
    return features[feature];
}

export function getCheckInTopicLimit(features: ParentFeatureMatrix): number {
    return features.check_in_topic_limit ?? Infinity;
}

export function getMaxChildren(features: ParentFeatureMatrix): number {
    return features.max_children;
}
