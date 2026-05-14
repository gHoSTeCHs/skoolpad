import { ArrowUpRight } from 'lucide-react';

export type CardTone = 'ink' | 'canopy' | 'ember' | 'honey' | 'dust' | 'warn';

const TONE_GRADIENTS: Record<CardTone, string> = {
    ink: 'linear-gradient(135deg, #1F1A12 0%, #3A3225 100%)',
    canopy: 'linear-gradient(135deg, #1A6B4F 0%, #0C7B56 100%)',
    ember: 'linear-gradient(135deg, #B8411F 0%, #D4542B 100%)',
    honey: 'linear-gradient(135deg, #B07920 0%, #D4952A 100%)',
    dust: 'linear-gradient(135deg, #6B5E47 0%, #9C8E73 100%)',
    warn: 'repeating-linear-gradient(135deg, #B07920 0 12px, #D4952A 12px 24px)',
};

const ROTATION: CardTone[] = ['ink', 'canopy', 'dust', 'ember', 'honey'];

export function toneForIndex(index: number): CardTone {
    return ROTATION[index % ROTATION.length];
}

interface ContainerCardProps {
    tone: CardTone;
    code: string;
    title: string;
    pills?: string[];
    onOpen?: () => void;
    children: React.ReactNode;
    footerLeft?: React.ReactNode;
    footerRight?: React.ReactNode;
}

export function ContainerCard({
    tone,
    code,
    title,
    pills = [],
    onOpen,
    children,
    footerLeft,
    footerRight,
}: ContainerCardProps) {
    return (
        <article
            onClick={onOpen}
            className="group cursor-pointer overflow-hidden rounded-[var(--card-radius)] border border-border bg-card transition-all duration-200 hover:-translate-y-[3px] hover:shadow-lg"
        >
            <div
                className="relative px-[22px] pt-5 pb-4 text-white"
                style={{ background: TONE_GRADIENTS[tone] }}
            >
                <div
                    className="text-[22px] font-bold tracking-[-0.012em]"
                    style={{ fontFamily: 'var(--font-display)' }}
                >
                    {code}
                </div>
                <div
                    className="mt-0.5 text-[12.5px] leading-[1.4] text-white/[0.78]"
                    style={{ fontFamily: 'var(--font-body)' }}
                >
                    {title}
                </div>
                {pills.length > 0 && (
                    <div className="absolute top-[18px] right-5 flex gap-1.5">
                        {pills.map((pill) => (
                            <span
                                key={pill}
                                className="rounded-full border border-white/20 bg-white/15 px-2 py-[2px] text-[10px] text-white/[0.92] backdrop-blur-sm"
                                style={{ fontFamily: 'var(--font-mono)' }}
                            >
                                {pill}
                            </span>
                        ))}
                    </div>
                )}
            </div>

            <div className="px-[22px] py-4">{children}</div>

            {(footerLeft || footerRight) && (
                <div
                    className="flex items-center justify-between border-t border-[var(--border-2)] bg-card px-[22px] py-2.5 text-[10.5px] text-[var(--fg-subtle)]"
                    style={{ fontFamily: 'var(--font-mono)' }}
                >
                    <span>{footerLeft}</span>
                    <span
                        className="flex items-center gap-1 font-medium text-muted-foreground transition-transform group-hover:translate-x-0.5"
                        style={{ fontFamily: 'var(--font-body)' }}
                    >
                        {footerRight}
                        <ArrowUpRight className="size-3" />
                    </span>
                </div>
            )}
        </article>
    );
}
