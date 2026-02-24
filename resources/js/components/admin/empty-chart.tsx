import { BarChart3 } from 'lucide-react';

interface EmptyChartProps {
    title: string;
    message?: string;
    height?: number;
}

export function EmptyChart({ title, message = 'No data yet', height = 200 }: EmptyChartProps) {
    return (
        <div
            className="flex flex-col items-center justify-center rounded-xl border border-dashed"
            style={{
                height,
                borderColor: 'var(--border)',
                color: 'var(--text-3)',
            }}
        >
            <div
                className="mb-3 flex size-12 items-center justify-center rounded-xl"
                style={{ backgroundColor: 'var(--badge-neutral-bg)' }}
            >
                <BarChart3 className="size-5 opacity-60" style={{ color: 'var(--badge-neutral-fg)' }} />
            </div>
            <p className="font-display text-sm font-semibold">{title}</p>
            <p className="mt-0.5 text-xs opacity-70">{message}</p>
        </div>
    );
}
