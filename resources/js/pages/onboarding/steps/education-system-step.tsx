import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { EducationSystemResult } from '@/types/onboarding';

interface EducationSystemStepProps {
    value: string;
    educationSystems: EducationSystemResult[];
    loading: boolean;
    onSelect: (systemId: string) => void;
    onNext: () => void;
    onBack: () => void;
}

export default function EducationSystemStep({ value, educationSystems, loading, onSelect, onNext, onBack }: EducationSystemStepProps) {
    return (
        <div className="flex flex-col gap-6">
            <div>
                <h2 className="font-display text-xl font-bold tracking-tight">What education system do you follow?</h2>
                <p className="mt-1 text-sm text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                    Select the curriculum or education system your school uses.
                </p>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-8">
                    <Loader2 className="size-6 animate-spin text-muted-foreground" />
                </div>
            ) : educationSystems.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                    No education systems found for this country.
                </p>
            ) : (
                <Select value={value} onValueChange={onSelect}>
                    <SelectTrigger>
                        <SelectValue placeholder="Select education system" />
                    </SelectTrigger>
                    <SelectContent>
                        {educationSystems.map((system) => (
                            <SelectItem key={system.id} value={system.id}>
                                {system.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            )}

            <div className="flex justify-between">
                <Button variant="outline" onClick={onBack}>Back</Button>
                <Button onClick={onNext} disabled={!value || loading}>Continue</Button>
            </div>
        </div>
    );
}
