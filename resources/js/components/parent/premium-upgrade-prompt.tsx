import { Link } from '@inertiajs/react';
import { Crown } from 'lucide-react';

interface PremiumUpgradePromptProps {
    feature: string;
    description: string;
}

export function PremiumUpgradePrompt({ feature, description }: PremiumUpgradePromptProps) {
    return (
        <div className="rounded-xl border-2 border-dashed border-[var(--canopy-300)] bg-[var(--canopy-50)]/30 p-6 text-center dark:border-[var(--canopy-700)] dark:bg-[var(--canopy-950)]/20">
            <div className="mx-auto flex size-10 items-center justify-center rounded-full bg-[var(--canopy-100)] dark:bg-[var(--canopy-900)]">
                <Crown className="size-5 text-[var(--canopy-600)]" />
            </div>
            <h3 className="font-display mt-3 text-base font-semibold text-foreground">{feature}</h3>
            <p className="mx-auto mt-1.5 max-w-xs text-sm text-muted-foreground">{description}</p>
            <Link
                href="/parent/settings"
                className="mt-4 inline-flex items-center rounded-lg bg-[var(--canopy-600)] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[var(--canopy-700)]"
            >
                Upgrade to Scholar
            </Link>
        </div>
    );
}
