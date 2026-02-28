import { GraduationCap, School } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { StudentType } from '@/types/enums';

interface StudentTypeStepProps {
    value: StudentType | '';
    onSelect: (type: StudentType) => void;
    onNext: () => void;
}

const options = [
    {
        value: 'tertiary' as StudentType,
        label: 'Tertiary Student',
        description: 'University, Polytechnic, or College of Education',
        icon: GraduationCap,
    },
    {
        value: 'secondary' as StudentType,
        label: 'Secondary Student',
        description: 'Junior or Senior Secondary School',
        icon: School,
    },
];

export default function StudentTypeStep({ value, onSelect, onNext }: StudentTypeStepProps) {
    return (
        <div className="flex flex-col gap-6">
            <div>
                <h2 className="font-display text-xl font-bold tracking-tight">What type of student are you?</h2>
                <p className="mt-1 text-sm text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                    This helps us tailor your learning experience.
                </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
                {options.map((option) => {
                    const Icon = option.icon;
                    return (
                        <button
                            key={option.value}
                            type="button"
                            onClick={() => onSelect(option.value)}
                            className={cn(
                                'flex flex-col items-center gap-3 rounded-lg border-2 p-6 text-center transition-colors',
                                value === option.value
                                    ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                                    : 'border-border hover:border-muted-foreground/30',
                            )}
                        >
                            <Icon className="size-10 text-primary" />
                            <span className="block text-sm font-semibold">{option.label}</span>
                            <span className="block text-xs text-muted-foreground">{option.description}</span>
                        </button>
                    );
                })}
            </div>

            <div className="flex justify-end">
                <Button onClick={onNext} disabled={!value}>Continue</Button>
            </div>
        </div>
    );
}
