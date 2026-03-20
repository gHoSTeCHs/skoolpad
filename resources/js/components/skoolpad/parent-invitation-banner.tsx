import { router } from '@inertiajs/react';
import { Flame, ShieldCheck, Star, Target, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { ParentInviteTrigger } from '@/types/parent';

interface ParentInvitationBannerProps {
    style: 'prominent' | 'subtle';
    trigger?: ParentInviteTrigger;
    dismissUrl: string;
}

type TriggerConfig = {
    heading: string;
    description: string;
    subtleText: string;
    icon: typeof Star;
};

const triggerMessages: Record<ParentInviteTrigger, TriggerConfig> = {
    first_practice_above_60: {
        heading: 'Great first session!',
        description:
            "You're off to a strong start. Invite a parent or guardian so they can follow your progress and cheer you on.",
        subtleText: 'Nice score! Invite a parent to see your progress',
        icon: Star,
    },
    high_score: {
        heading: 'Impressive score!',
        description:
            "You scored above 80% — that's worth sharing! Let a parent or guardian see how well you're doing.",
        subtleText: 'You scored 80%+! Share your achievement with a parent',
        icon: Target,
    },
    three_day_streak: {
        heading: "You're on a streak!",
        description:
            "Three days of consistent study — your parent or guardian would love to know. Invite them to track your streak.",
        subtleText: '3-day streak! Invite a parent to follow your progress',
        icon: Flame,
    },
    consistent_first_week: {
        heading: 'A week of great habits',
        description:
            "You've been studying consistently all week. Invite a parent or guardian so they can see the effort you're putting in.",
        subtleText: 'Consistent study this week! Invite a parent to see',
        icon: Star,
    },
};

const defaultTrigger: TriggerConfig = {
    heading: 'Invite a parent or guardian',
    description:
        "Help your parent or guardian stay updated on your learning progress. They'll receive a link to create their own account.",
    subtleText: 'Invite a parent or guardian to track your progress',
    icon: ShieldCheck,
};

export function ParentInvitationBanner({ style, trigger, dismissUrl }: ParentInvitationBannerProps) {
    const config = (trigger && triggerMessages[trigger]) || defaultTrigger;
    const Icon = config.icon;

    function handleDismiss() {
        router.post(dismissUrl, {}, { preserveScroll: true });
    }

    if (style === 'prominent') {
        return (
            <div className="relative rounded-lg border-2 border-primary/20 bg-primary/5 p-5">
                <button
                    type="button"
                    onClick={handleDismiss}
                    aria-label="Dismiss invitation"
                    className="absolute top-3 right-3 rounded-md p-1 text-muted-foreground hover:text-foreground"
                >
                    <X className="size-4" />
                </button>
                <div className="flex items-start gap-4">
                    <div className="rounded-full bg-primary/10 p-3">
                        <Icon className="size-6 text-primary" />
                    </div>
                    <div className="flex-1">
                        <h3 className="font-display text-base font-semibold">{config.heading}</h3>
                        <p className="mt-1 text-sm text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                            {config.description}
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex items-center justify-between rounded-lg border bg-card p-3">
            <div className="flex items-center gap-2">
                <Icon className="size-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                    {config.subtleText}
                </span>
            </div>
            <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={handleDismiss}>
                    Dismiss
                </Button>
            </div>
        </div>
    );
}
