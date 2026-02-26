import { Link } from '@inertiajs/react';
import { AlertTriangle, CheckCircle2, ShieldAlert, XCircle } from 'lucide-react';
import { show as topicShow } from '@/actions/App/Http/Controllers/Student/TopicController';
import type { PrerequisiteStatusResult } from '@/types/student-topics';

interface PrerequisiteBannerProps {
    status: PrerequisiteStatusResult;
    courseId?: string;
}

const bannerConfig = {
    success: {
        icon: CheckCircle2,
        className: 'border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/30',
        iconClass: 'text-green-600 dark:text-green-400',
        title: 'Prerequisites met',
        description: "You're ready to study this topic.",
    },
    warning: {
        icon: AlertTriangle,
        className: 'border-yellow-200 bg-yellow-50 dark:border-yellow-900 dark:bg-yellow-950/30',
        iconClass: 'text-yellow-600 dark:text-yellow-400',
        title: 'Some prerequisites need attention',
        description: 'Review the topics below to strengthen your foundation.',
    },
    danger: {
        icon: ShieldAlert,
        className: 'border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/30',
        iconClass: 'text-red-600 dark:text-red-400',
        title: 'Required prerequisites not met',
        description: 'Complete the required topics below before proceeding.',
    },
} as const;

const statusIcons = {
    completed: { icon: CheckCircle2, className: 'text-green-500' },
    attempted: { icon: AlertTriangle, className: 'text-yellow-500' },
    not_started: { icon: XCircle, className: 'text-muted-foreground' },
} as const;

export function PrerequisiteBanner({ status, courseId }: PrerequisiteBannerProps) {
    if (status.banner === 'none') return null;

    const config = bannerConfig[status.banner];
    const Icon = config.icon;

    return (
        <div className={`rounded-lg border p-4 ${config.className}`} style={{ borderRadius: 'var(--card-radius)' }}>
            <div className="flex items-start gap-3">
                <Icon className={`mt-0.5 size-5 shrink-0 ${config.iconClass}`} />
                <div className="flex-1">
                    <div className="text-[14px] font-semibold" style={{ fontFamily: 'var(--font-display)' }}>
                        {config.title}
                    </div>
                    <p className="mt-0.5 text-[13px] text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                        {config.description}
                    </p>

                    <div className="mt-3 space-y-2">
                        {status.prerequisites.map((prereq) => {
                            const StatusIcon = statusIcons[prereq.status].icon;
                            const statusClass = statusIcons[prereq.status].className;

                            return (
                                <div key={prereq.id} className="flex items-center gap-2">
                                    <StatusIcon className={`size-4 ${statusClass}`} />
                                    <Link
                                        href={topicShow.url(prereq.id, courseId ? { query: { course: courseId } } : undefined)}
                                        className="text-[13px] font-medium hover:underline"
                                        style={{ fontFamily: 'var(--font-body)' }}
                                    >
                                        {prereq.title}
                                    </Link>
                                    {prereq.is_hard && (
                                        <span className="rounded bg-red-100 px-1.5 py-0.5 text-[10px] font-semibold text-red-700 dark:bg-red-900/30 dark:text-red-400">
                                            Required
                                        </span>
                                    )}
                                    {prereq.accuracy !== null && (
                                        <span className="text-[11px] text-muted-foreground">
                                            ({prereq.accuracy}% accuracy)
                                        </span>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}
