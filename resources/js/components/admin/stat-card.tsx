import type { LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface StatCardProps {
    title: string;
    value: number | string;
    description?: string;
    icon?: LucideIcon;
    iconBg?: string;
    iconFg?: string;
}

export function StatCard({ title, value, description, icon: Icon, iconBg, iconFg }: StatCardProps) {
    return (
        <Card className="group relative overflow-hidden transition-shadow duration-200 hover:shadow-md">
            <div
                className="absolute top-0 left-0 h-full w-1 rounded-l-xl opacity-60 transition-opacity duration-200 group-hover:opacity-100"
                style={{ backgroundColor: iconFg }}
            />
            <CardContent className="flex items-center gap-4 pt-6 pl-7">
                {Icon && (
                    <div
                        className="flex size-11 shrink-0 items-center justify-center rounded-xl"
                        style={{ backgroundColor: iconBg }}
                    >
                        <Icon className="size-5" style={{ color: iconFg }} />
                    </div>
                )}
                <div className="min-w-0">
                    <p className="font-display text-2xl font-bold tracking-tight">{value}</p>
                    <p className="truncate text-sm text-muted-foreground">{title}</p>
                    {description && (
                        <p className="mt-0.5 text-xs" style={{ color: 'var(--text-3)' }}>
                            {description}
                        </p>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
