import { router } from '@inertiajs/react';
import { BookOpen, CheckCircle2, Clock, RotateCcw, Target, X } from 'lucide-react';
import { useState } from 'react';
import StudyPreferenceController from '@/actions/App/Http/Controllers/Student/StudyPreferenceController';
import { show as topicShow } from '@/actions/App/Http/Controllers/Student/TopicController';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { GuidedStudyPlan, StudyPlanItem, StudyPlanItemType } from '@/types/guided-study';

interface GuidedStudyCardProps {
    plan: GuidedStudyPlan;
    dismissUrl: string;
}

const typeConfig: Record<StudyPlanItemType, { icon: typeof BookOpen; label: string }> = {
    study: { icon: BookOpen, label: 'Study' },
    review: { icon: RotateCcw, label: 'Review' },
    practice: { icon: Target, label: 'Practice' },
};

function StudyPlanItemRow({ item }: { item: StudyPlanItem }) {
    const config = typeConfig[item.type];
    const Icon = config.icon;
    const rowClass = 'flex items-center gap-3 rounded-lg border bg-card p-3 transition-colors hover:bg-accent/50';

    const content = (
        <>
            <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary/10">
                <Icon className="size-4 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{item.topic_label}</p>
                <div className="mt-0.5 flex items-center gap-2">
                    <Badge variant="secondary" className="text-[10px]">{item.subject_name}</Badge>
                    <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                        <Clock className="size-3" />
                        {item.estimated_minutes} min
                    </span>
                </div>
            </div>
            {item.is_completed && (
                <CheckCircle2 className="size-5 shrink-0 text-primary" />
            )}
        </>
    );

    if (item.canonical_topic_id) {
        return (
            <a href={topicShow.url(item.canonical_topic_id)} className={`block ${rowClass}`}>
                {content}
            </a>
        );
    }

    return <div className={rowClass}>{content}</div>;
}

export default function GuidedStudyCard({ plan, dismissUrl }: GuidedStudyCardProps) {
    const [selectedSubject, setSelectedSubject] = useState<string>('all');

    const subjectNames = [...new Set(plan.items.map((i) => i.subject_name))];

    const visibleItems = selectedSubject === 'all'
        ? plan.items
        : plan.items.filter((i) => i.subject_name === selectedSubject);

    const completedMinutes = plan.completed_minutes;

    const progressPercent = plan.daily_goal_minutes > 0
        ? Math.min(Math.round((completedMinutes / plan.daily_goal_minutes) * 100), 100)
        : 0;

    const firstUncompleted = plan.items.find((item) => !item.is_completed && item.canonical_topic_id);

    function handleGoalChange(value: string) {
        router.patch(StudyPreferenceController.url(), {
            daily_goal_minutes: parseInt(value, 10),
        }, { preserveScroll: true });
    }

    function handleDismiss() {
        router.post(dismissUrl, {}, { preserveScroll: true });
    }

    return (
        <div className="rounded-lg border bg-card">
            <div className="flex flex-col gap-4 border-b p-5 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-start gap-3">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                        <BookOpen className="size-5 text-primary" />
                    </div>
                    <div>
                        <h3 className="font-display text-base font-semibold">Today&apos;s Study Plan</h3>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                            Term {plan.current_term}, Week {plan.current_week}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Select
                        value={String(plan.daily_goal_minutes)}
                        onValueChange={handleGoalChange}
                    >
                        <SelectTrigger className="w-[140px]">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="15">15 minutes</SelectItem>
                            <SelectItem value="30">30 minutes</SelectItem>
                            <SelectItem value="45">45 minutes</SelectItem>
                            <SelectItem value="60">60 minutes</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleDismiss}
                        aria-label="Dismiss study plan"
                        className="shrink-0"
                    >
                        <X className="size-4" />
                    </Button>
                </div>
            </div>

            <div className="px-5 pt-4">
                <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
                    <span>{completedMinutes} / {plan.daily_goal_minutes} min</span>
                    <span>{progressPercent}%</span>
                </div>
                <Progress value={progressPercent} className="h-2" />
            </div>

            {subjectNames.length >= 2 && (
                <div className="flex flex-wrap gap-2 px-5 pt-4">
                    <button
                        onClick={() => setSelectedSubject('all')}
                        className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                            selectedSubject === 'all'
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                        }`}
                    >
                        All
                    </button>
                    {subjectNames.map((name) => (
                        <button
                            key={name}
                            onClick={() => setSelectedSubject(name)}
                            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                                selectedSubject === name
                                    ? 'bg-primary text-primary-foreground'
                                    : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                            }`}
                        >
                            {name}
                        </button>
                    ))}
                </div>
            )}

            <div className="p-5">
                {plan.items.length === 0 ? (
                    <div className="py-6 text-center">
                        <CheckCircle2 className="mx-auto size-8 text-muted-foreground/50" />
                        <p className="mt-3 text-sm font-medium">You&apos;re all caught up!</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                            No lessons are scheduled for this week. Explore your subjects above or check back next week.
                        </p>
                    </div>
                ) : (
                    <div className="flex flex-col gap-2">
                        {visibleItems.map((item, index) => (
                            <StudyPlanItemRow key={`${item.level_subject_id}-${index}`} item={item} />
                        ))}
                    </div>
                )}
            </div>

            {firstUncompleted && (
                <div className="border-t px-5 py-4">
                    <Button asChild className="w-full">
                        <a href={topicShow.url(firstUncompleted.canonical_topic_id!)}>
                            Start Studying
                        </a>
                    </Button>
                </div>
            )}
        </div>
    );
}
