export interface PlatformSettings {
    monetization_enabled: boolean;
    registration_open: boolean;
    [key: string]: unknown;
}

export interface SubscriptionPlanItem {
    id: string;
    name: string;
    display_name: string;
    plan_type: string;
    price_ngn: number;
    price_formatted: string;
    billing_period: string;
    billing_period_label: string;
    paystack_plan_code: string | null;
    features: {
        daily_ocr: number;
        daily_ai_messages: number;
        daily_gradings: number;
        answer_depths: string[];
    };
    max_children: number | null;
    max_students: number | null;
    max_lecturers: number | null;
    is_active: boolean;
    created_at: string;
}
