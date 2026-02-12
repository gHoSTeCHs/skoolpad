import { cn } from '@/lib/utils';
import { useAppearance } from '@/hooks/use-appearance';

type CourseVariant = 'canopy' | 'ember' | 'honey';

interface CourseCardProps {
    code: string;
    name: string;
    progress: number;
    questionCount: number;
    variant?: CourseVariant;
    className?: string;
}

const headerGradients: Record<CourseVariant, { warm: string; reader: string }> = {
    canopy: {
        warm: 'linear-gradient(135deg, var(--canopy-950), var(--canopy-900))',
        reader: 'linear-gradient(135deg, rgba(62,189,147,0.1), rgba(62,189,147,0.02))',
    },
    ember: {
        warm: 'linear-gradient(135deg, #5E2214, #7A2B16)',
        reader: 'linear-gradient(135deg, rgba(230,85,40,0.1), rgba(230,85,40,0.02))',
    },
    honey: {
        warm: 'linear-gradient(135deg, #3D280C, #5F4116)',
        reader: 'linear-gradient(135deg, rgba(255,208,20,0.08), rgba(255,208,20,0.01))',
    },
};

const codeColors: Record<CourseVariant, { warm: string; reader: string }> = {
    canopy: { warm: 'var(--canopy-300)', reader: '#3EBD93' },
    ember: { warm: 'var(--ember-300)', reader: '#FF7043' },
    honey: { warm: 'var(--honey-300)', reader: '#FFD014' },
};

const fillGradients: Record<CourseVariant, { warm: string; reader: string }> = {
    canopy: {
        warm: 'linear-gradient(90deg, var(--canopy-600), var(--canopy-400))',
        reader: 'linear-gradient(90deg, #199473, #3EBD93)',
    },
    ember: {
        warm: 'linear-gradient(90deg, var(--ember-500), var(--ember-400))',
        reader: 'linear-gradient(90deg, #C93E1B, #FF7043)',
    },
    honey: {
        warm: 'linear-gradient(90deg, var(--honey-600), var(--honey-400))',
        reader: 'linear-gradient(90deg, #B89200, #FFD014)',
    },
};

const badgeClasses: Record<CourseVariant, string> = {
    canopy: 'bg-[var(--badge-primary-bg)] text-[var(--badge-primary-fg)]',
    ember: 'bg-[var(--badge-danger-bg)] text-[var(--badge-danger-fg)]',
    honey: 'bg-[var(--badge-reward-bg)] text-[var(--badge-reward-fg)]',
};

export default function CourseCard({
    code,
    name,
    progress,
    questionCount,
    variant = 'canopy',
    className,
}: CourseCardProps) {
    const { resolvedAppearance } = useAppearance();
    const isReader = resolvedAppearance === 'reader';

    return (
        <div
            className={cn(
                'group cursor-pointer overflow-hidden border border-border bg-card transition-all duration-300',
                'hover:-translate-y-[3px] hover:border-muted-foreground',
                className,
            )}
            style={{
                borderRadius: 'var(--card-radius)',
                boxShadow: undefined,
            }}
            onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.boxShadow = 'var(--course-shadow-hover)';
            }}
            onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.boxShadow = 'none';
            }}
        >
            <div
                className="relative overflow-hidden px-[22px] pt-[18px] pb-[14px]"
                style={{ background: isReader ? headerGradients[variant].reader : headerGradients[variant].warm }}
            >
                <div
                    className="absolute -top-[30%] -right-[10%] h-[120px] w-[120px] rounded-full"
                    style={{
                        background: isReader
                            ? 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.5) 10px, rgba(255,255,255,0.5) 11px)'
                            : 'rgba(255,255,255,0.08)',
                        ...(isReader ? { inset: 0, width: 'auto', height: 'auto', borderRadius: 0, opacity: 0.06 } : {}),
                    }}
                />
                <div
                    className="relative z-[1] text-[11px] font-semibold uppercase tracking-[0.06em]"
                    style={{
                        fontFamily: 'var(--font-body)',
                        color: isReader ? codeColors[variant].reader : codeColors[variant].warm,
                    }}
                >
                    {code}
                </div>
                <div
                    className="relative z-[1] mt-1 text-[18px] font-bold text-white"
                    style={{
                        fontFamily: isReader ? 'var(--font-content)' : 'var(--font-display)',
                        fontWeight: isReader ? 600 : 700,
                    }}
                >
                    {name}
                </div>
            </div>

            <div className="flex flex-col gap-3 px-[22px] pt-[14px] pb-[18px]">
                <div
                    className="overflow-hidden rounded-full bg-[var(--bg-raised)]"
                    style={{ height: 'var(--prog-height)' }}
                >
                    <div
                        className="h-full rounded-full transition-[width] duration-600"
                        style={{
                            width: `${progress}%`,
                            background: isReader ? fillGradients[variant].reader : fillGradients[variant].warm,
                            transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
                        }}
                    />
                </div>
                <div
                    className="flex items-center justify-between text-[12px]"
                    style={{ fontFamily: 'var(--font-body)', color: 'var(--text-3)' }}
                >
                    <span>{progress}%</span>
                    <span
                        className={cn('rounded-full px-[10px] py-1 text-[10px] font-semibold', badgeClasses[variant])}
                    >
                        {questionCount} Qs
                    </span>
                </div>
            </div>
        </div>
    );
}
