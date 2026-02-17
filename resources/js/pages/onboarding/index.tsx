import { Head } from '@inertiajs/react';
import OnboardingLayout from '@/layouts/onboarding-layout';

export default function Onboarding() {
    return (
        <OnboardingLayout currentStep={1} totalSteps={3}>
            <Head title="Onboarding" />
            <div className="flex flex-col gap-4">
                <div>
                    <h1 className="font-display text-2xl font-bold tracking-tight">Welcome to Skoolpad</h1>
                    <p className="mt-1 text-sm text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                        Let&apos;s set up your profile to personalize your learning experience.
                    </p>
                </div>
            </div>
        </OnboardingLayout>
    );
}
