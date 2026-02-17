import { Link, usePage } from '@inertiajs/react';
import { ErrorBoundary } from '@/components/error-boundary';
import { LayoutErrorFallback } from '@/components/error-boundary/layout-error-fallback';
import type { OnboardingLayoutProps } from '@/types';

function StepIndicator({ currentStep, totalSteps }: { currentStep: number; totalSteps: number }) {
    return (
        <div className="flex items-center gap-2">
            {Array.from({ length: totalSteps }, (_, i) => {
                const step = i + 1;
                const isCompleted = step < currentStep;
                const isCurrent = step === currentStep;

                return (
                    <div
                        key={step}
                        className={[
                            'h-1.5 rounded-full transition-all duration-500',
                            isCurrent && 'w-8 bg-primary shadow-[0_0_10px_var(--primary)]',
                            isCompleted && 'w-5 bg-primary/60',
                            !isCurrent && !isCompleted && 'w-5 bg-muted',
                        ].filter(Boolean).join(' ')}
                    />
                );
            })}
        </div>
    );
}

export default function OnboardingLayout({
    children,
    currentStep,
    totalSteps,
}: OnboardingLayoutProps) {
    const { url } = usePage();
    const showProgress = currentStep !== undefined && totalSteps !== undefined;

    return (
        <div className="relative flex min-h-dvh flex-col bg-background text-foreground">
            <div
                className="pointer-events-none absolute inset-0 opacity-[0.03]"
                style={{
                    background: 'radial-gradient(circle at 25% 10%, var(--canopy-400) 0%, transparent 40%), radial-gradient(circle at 80% 90%, var(--canopy-300) 0%, transparent 35%)',
                }}
            />

            <header className="relative z-10 flex items-center justify-between px-6 pt-8 pb-4 sm:px-10">
                <Link href="/" className="flex items-center gap-2.5">
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[var(--canopy-400)] to-[var(--canopy-600)] reader:from-[#3EBD93] reader:to-[#199473]">
                        <span className="font-display text-[14px] font-[800] leading-none text-white reader:text-[#0A1929]">
                            S
                        </span>
                    </div>
                    <span className="font-display text-[16px] font-bold tracking-[-0.02em] text-foreground">
                        Skoolpad
                    </span>
                </Link>

                {showProgress && (
                    <div className="flex items-center gap-3">
                        <span className="text-xs font-medium text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                            Step {currentStep} of {totalSteps}
                        </span>
                        <StepIndicator currentStep={currentStep} totalSteps={totalSteps} />
                    </div>
                )}
            </header>

            <main className="relative z-10 flex flex-1 flex-col items-center px-6 pt-8 pb-16 sm:px-10 sm:pt-16">
                <div className="w-full max-w-2xl">
                    <ErrorBoundary
                        resetKey={url}
                        fallback={(props) => <LayoutErrorFallback {...props} dashboardUrl="/dashboard" />}
                    >
                        {children}
                    </ErrorBoundary>
                </div>
            </main>
        </div>
    );
}
