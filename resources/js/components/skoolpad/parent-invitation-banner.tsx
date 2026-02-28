import { router } from '@inertiajs/react';
import { ShieldCheck, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ParentInvitationBannerProps {
    style: 'prominent' | 'subtle';
    dismissUrl: string;
}

export default function ParentInvitationBanner({ style, dismissUrl }: ParentInvitationBannerProps) {
    function handleDismiss() {
        router.post(dismissUrl, {}, { preserveScroll: true });
    }

    if (style === 'prominent') {
        return (
            <div className="relative rounded-lg border-2 border-primary/20 bg-primary/5 p-5">
                <button
                    type="button"
                    onClick={handleDismiss}
                    className="absolute top-3 right-3 rounded-md p-1 text-muted-foreground hover:text-foreground"
                >
                    <X className="size-4" />
                </button>
                <div className="flex items-start gap-4">
                    <div className="rounded-full bg-primary/10 p-3">
                        <ShieldCheck className="size-6 text-primary" />
                    </div>
                    <div className="flex-1">
                        <h3 className="font-display text-base font-semibold">Invite a parent or guardian</h3>
                        <p className="mt-1 text-sm text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                            Help your parent or guardian stay updated on your learning progress. They&apos;ll receive a
                            link to create their own account.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex items-center justify-between rounded-lg border bg-card p-3">
            <div className="flex items-center gap-2">
                <ShieldCheck className="size-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                    Invite a parent or guardian to track your progress
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
