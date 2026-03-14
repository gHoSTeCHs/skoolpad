import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { SemesterData } from '@/types/cgpa';
import { BarChart2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

interface SemesterGpaChartProps {
    semesters: SemesterData[];
    scaleMax: number;
}

function useChartColors() {
    const [colors, setColors] = useState({
        primary: '#1A6B4F',
        grid: '#e5e5e5',
        card: '#ffffff',
        border: '#e5e5e5',
    });

    useEffect(() => {
        if (typeof window === 'undefined') return;
        const style = getComputedStyle(document.documentElement);
        setColors({
            primary: style.getPropertyValue('--badge-primary-fg').trim() || '#1A6B4F',
            grid: style.getPropertyValue('--border').trim() || '#e5e5e5',
            card: style.getPropertyValue('--card').trim() || '#ffffff',
            border: style.getPropertyValue('--border').trim() || '#e5e5e5',
        });
    }, []);

    return colors;
}

export function SemesterGpaChart({ semesters, scaleMax }: SemesterGpaChartProps) {
    const colors = useChartColors();

    if (semesters.length === 0 || !semesters.some((s) => s.gpa !== undefined)) {
        return null;
    }

    const chartData = semesters
        .filter((s) => s.gpa !== undefined)
        .map((s) => ({
            name: `${s.level} ${s.semester}`,
            gpa: s.gpa,
        }));

    const tooltipStyle = {
        backgroundColor: `hsl(${colors.card})`,
        border: `1px solid hsl(${colors.border})`,
        borderRadius: 10,
        fontSize: 13,
        fontFamily: 'var(--font-body)',
        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
    };

    return (
        <Card>
            <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                    <BarChart2 className="size-4 text-muted-foreground" />
                    Semester GPA Trend
                </CardTitle>
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: -12 }}>
                        <CartesianGrid
                            stroke={`hsl(${colors.grid})`}
                            strokeDasharray="3 3"
                            vertical={false}
                            opacity={0.5}
                        />
                        <XAxis
                            dataKey="name"
                            tick={{ fontSize: 11 }}
                            tickLine={false}
                            axisLine={false}
                            dy={8}
                        />
                        <YAxis
                            domain={[0, scaleMax]}
                            tick={{ fontSize: 11 }}
                            tickLine={false}
                            axisLine={false}
                            width={32}
                        />
                        <Tooltip contentStyle={tooltipStyle} />
                        <Bar
                            dataKey="gpa"
                            fill={`hsl(${colors.primary})`}
                            radius={[4, 4, 0, 0]}
                            maxBarSize={40}
                        />
                    </BarChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}
