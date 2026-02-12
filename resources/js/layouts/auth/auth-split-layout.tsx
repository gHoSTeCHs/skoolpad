import { Link } from '@inertiajs/react';
import { home } from '@/routes';
import type { AuthLayoutProps } from '@/types';

export default function AuthSplitLayout({
    children,
    title,
    description,
}: AuthLayoutProps) {
    return (
        <div className="flex min-h-dvh">
            <div className="relative hidden w-[45%] flex-col justify-between overflow-hidden p-10 lg:flex" style={{ background: 'var(--bg-hero)' }}>
                <div
                    className="pointer-events-none absolute bottom-0 left-0 h-[70%] w-[80%] opacity-[0.07] reader:opacity-[0.05]"
                    style={{
                        background: 'radial-gradient(circle at 30% 70%, var(--canopy-400) 0%, transparent 55%)',
                    }}
                />
                <div
                    className="pointer-events-none absolute top-0 right-0 h-[40%] w-[50%] opacity-[0.04] reader:opacity-[0.03]"
                    style={{
                        background: 'radial-gradient(circle at 80% 20%, var(--canopy-300) 0%, transparent 50%)',
                    }}
                />

                <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, var(--canopy-400), transparent)' }} />

                <Link
                    href={home()}
                    className="relative z-10 flex items-center gap-3"
                >
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[var(--canopy-400)] to-[var(--canopy-600)] reader:from-[#3EBD93] reader:to-[#199473]">
                        <span className="font-display text-[16px] font-[800] leading-none text-white reader:text-[#0A1929]">
                            S
                        </span>
                    </div>
                    <span className="font-display text-lg font-bold tracking-[-0.02em] text-white">
                        Skoolpad
                    </span>
                </Link>

                <div className="relative z-10 max-w-[320px]">
                    <h2 className="font-display text-[28px] font-extrabold leading-[1.15] tracking-tight text-white">
                        Learn smarter,
                        <br />
                        not harder.
                    </h2>
                    <p className="mt-3 text-[14px] leading-relaxed text-white/50" style={{ fontFamily: 'var(--font-body)' }}>
                        Join thousands of Nigerian students preparing for WAEC, JAMB and more with interactive practice and smart progress tracking.
                    </p>
                </div>

                <div className="relative z-10 text-[12px] text-white/25" style={{ fontFamily: 'var(--font-body)' }}>
                    &copy; {new Date().getFullYear()} Skoolpad
                </div>
            </div>

            <div className="flex flex-1 items-center justify-center bg-background px-6 py-12 lg:px-12">
                <div className="w-full max-w-[400px]">
                    <Link
                        href={home()}
                        className="mb-10 flex items-center justify-center gap-2 lg:hidden"
                    >
                        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[var(--canopy-400)] to-[var(--canopy-600)] reader:from-[#3EBD93] reader:to-[#199473]">
                            <span className="font-display text-[14px] font-[800] leading-none text-white reader:text-[#0A1929]">
                                S
                            </span>
                        </div>
                        <span className="font-display text-[16px] font-bold tracking-[-0.02em] text-foreground">
                            Skoolpad
                        </span>
                    </Link>

                    <div className="mb-8">
                        <h1 className="font-display text-xl font-semibold tracking-tight text-foreground">
                            {title}
                        </h1>
                        {description && (
                            <p className="mt-1.5 text-sm text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                                {description}
                            </p>
                        )}
                    </div>

                    {children}
                </div>
            </div>
        </div>
    );
}
