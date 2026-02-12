import { Head, Link, usePage } from '@inertiajs/react';
import { BookOpen, Flame, TrendingUp } from 'lucide-react';
import { dashboard, login, register } from '@/routes';
import type { SharedData } from '@/types';

export default function Welcome({
    canRegister = true,
}: {
    canRegister?: boolean;
}) {
    const { auth } = usePage<SharedData>().props;

    return (
        <>
            <Head title="Skoolpad" />

            <div className="flex min-h-dvh flex-col bg-background text-foreground">
                <header className="fixed inset-x-0 top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-sm">
                    <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
                        <Link href="/" className="flex items-center gap-2.5">
                            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[var(--canopy-400)] to-[var(--canopy-600)] reader:from-[#3EBD93] reader:to-[#199473]">
                                <span className="font-display text-[14px] font-[800] leading-none text-white reader:text-[#0A1929]">
                                    S
                                </span>
                            </div>
                            <span className="font-display text-[16px] font-bold tracking-[-0.02em]">
                                Skoolpad
                            </span>
                        </Link>

                        <nav className="flex items-center gap-3">
                            {auth.user ? (
                                <Link
                                    href={dashboard()}
                                    className="rounded-[var(--radius)] px-4 py-2 text-sm font-medium transition-colors"
                                    style={{
                                        background: 'var(--btn-primary-bg)',
                                        color: 'var(--btn-primary-fg)',
                                        boxShadow: 'var(--btn-primary-shadow)',
                                    }}
                                >
                                    Dashboard
                                </Link>
                            ) : (
                                <>
                                    <Link
                                        href={login()}
                                        className="rounded-[var(--radius)] px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                                    >
                                        Log in
                                    </Link>
                                    {canRegister && (
                                        <Link
                                            href={register()}
                                            className="rounded-[var(--radius)] px-4 py-2 text-sm font-medium transition-colors"
                                            style={{
                                                background: 'var(--btn-primary-bg)',
                                                color: 'var(--btn-primary-fg)',
                                                boxShadow: 'var(--btn-primary-shadow)',
                                            }}
                                        >
                                            Sign up
                                        </Link>
                                    )}
                                </>
                            )}
                        </nav>
                    </div>
                </header>

                <section className="relative flex min-h-dvh items-center justify-center overflow-hidden pt-16" style={{ background: 'var(--bg-hero)' }}>
                    <div
                        className="pointer-events-none absolute bottom-0 left-0 h-[80%] w-[70%] opacity-[0.08] reader:opacity-[0.05]"
                        style={{ background: 'radial-gradient(circle at 25% 75%, var(--canopy-400) 0%, transparent 55%)' }}
                    />
                    <div
                        className="pointer-events-none absolute top-[10%] right-[5%] h-[50%] w-[40%] opacity-[0.05] reader:opacity-[0.03]"
                        style={{ background: 'radial-gradient(circle at 70% 30%, var(--canopy-300) 0%, transparent 50%)' }}
                    />

                    <div className="relative z-10 mx-auto max-w-4xl px-6 py-24 text-center md:py-32">
                        <h1
                            className="font-display text-[clamp(2.5rem,7vw,4.5rem)] font-extrabold leading-[1.05] tracking-tight text-white"
                            style={{
                                animation: 'fade-up 0.6s ease-out both',
                            }}
                        >
                            Learn smarter,
                            <br />
                            not harder.
                        </h1>

                        <p
                            className="mx-auto mt-6 max-w-lg text-[clamp(1rem,2vw,1.125rem)] leading-relaxed text-white/50"
                            style={{
                                fontFamily: 'var(--font-body)',
                                animation: 'fade-up 0.6s ease-out 0.15s both',
                            }}
                        >
                            The all-in-one study platform for Nigerian students. Practice past questions, track your progress, and ace WAEC, JAMB &amp; more.
                        </p>

                        <div
                            className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center"
                            style={{ animation: 'fade-up 0.6s ease-out 0.3s both' }}
                        >
                            <Link
                                href={auth.user ? dashboard() : register()}
                                className="rounded-[var(--radius)] px-8 py-3 text-sm font-semibold transition-all duration-200 hover:opacity-90"
                                style={{
                                    background: 'var(--btn-primary-bg)',
                                    color: 'var(--btn-primary-fg)',
                                    boxShadow: 'var(--btn-primary-shadow), var(--btn-glow)',
                                }}
                            >
                                {auth.user ? 'Go to Dashboard' : 'Get Started Free'}
                            </Link>
                            <a
                                href="#features"
                                className="rounded-[var(--radius)] border px-8 py-3 text-sm font-semibold text-white/70 transition-colors duration-200 hover:bg-white/5 hover:text-white"
                                style={{ borderColor: 'rgba(255,255,255,0.12)' }}
                            >
                                Learn More
                            </a>
                        </div>
                    </div>

                    <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, var(--canopy-400), transparent)' }} />
                </section>

                <section id="features" className="bg-background py-24 md:py-32">
                    <div className="mx-auto max-w-6xl px-6">
                        <div className="mb-16 text-center">
                            <h2 className="font-display text-3xl font-bold tracking-tight md:text-4xl">
                                Why Choose Skoolpad?
                            </h2>
                            <p className="mx-auto mt-3 max-w-md text-sm text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                                Everything you need to prepare for your exams, all in one place.
                            </p>
                        </div>

                        <div className="grid gap-6 md:grid-cols-3">
                            <FeatureCard
                                icon={BookOpen}
                                title="Comprehensive Content"
                                description="Thousands of past questions from WAEC, JAMB, NECO and more, organized by topic for targeted practice."
                                variant="canopy"
                            />
                            <FeatureCard
                                icon={TrendingUp}
                                title="Track Your Progress"
                                description="See how you improve over time with detailed analytics, performance history and smart recommendations."
                                variant="ember"
                            />
                            <FeatureCard
                                icon={Flame}
                                title="Stay Motivated"
                                description="Build study streaks, earn badges, and compete with classmates to stay on track for exam day."
                                variant="honey"
                            />
                        </div>
                    </div>
                </section>

                <footer className="border-t border-border py-8" style={{ background: 'var(--bg-raised)' }}>
                    <div className="mx-auto max-w-6xl px-6 text-center">
                        <p className="text-xs" style={{ color: 'var(--text-3)', fontFamily: 'var(--font-body)' }}>
                            &copy; {new Date().getFullYear()} Skoolpad. Built for Nigerian students.
                        </p>
                    </div>
                </footer>
            </div>
        </>
    );
}

const iconContainerColors = {
    canopy: 'bg-[var(--badge-primary-bg)]',
    ember: 'bg-[var(--badge-danger-bg)]',
    honey: 'bg-[var(--badge-reward-bg)]',
} as const;

const iconColors = {
    canopy: 'text-[var(--badge-primary-fg)]',
    ember: 'text-[var(--badge-danger-fg)]',
    honey: 'text-[var(--badge-reward-fg)]',
} as const;

function FeatureCard({
    icon: Icon,
    title,
    description,
    variant,
}: {
    icon: React.ElementType;
    title: string;
    description: string;
    variant: 'canopy' | 'ember' | 'honey';
}) {
    return (
        <div
            className="group border border-border bg-card p-8 transition-all duration-300 hover:-translate-y-1"
            style={{
                borderRadius: 'var(--card-radius)',
            }}
        >
            <div
                className={`mb-5 flex size-11 items-center justify-center rounded-xl ${iconContainerColors[variant]}`}
            >
                <Icon className={`size-5 ${iconColors[variant]}`} strokeWidth={1.8} />
            </div>
            <h3 className="font-display text-lg font-semibold tracking-tight">
                {title}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                {description}
            </p>
        </div>
    );
}
