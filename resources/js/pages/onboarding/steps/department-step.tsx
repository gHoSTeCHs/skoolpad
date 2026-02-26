import { Button } from '@/components/ui/button';
import { FormField } from '@/components/ui/form-field';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import type { DepartmentResult } from '@/types/onboarding';

interface DepartmentStepProps {
    value: string;
    departments: DepartmentResult[];
    loading: boolean;
    onSelect: (departmentId: string) => void;
    onNext: () => void;
    onBack: () => void;
}

export default function DepartmentStep({ value, departments, loading, onSelect, onNext, onBack }: DepartmentStepProps) {
    return (
        <div className="flex flex-col gap-6">
            <div>
                <h2 className="font-display text-xl font-bold tracking-tight">Select your department</h2>
                <p className="mt-1 text-sm text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                    Choose your academic department.
                </p>
            </div>

            <FormField label="Department" name="department_id" required>
                <Select value={value} onValueChange={onSelect} disabled={loading}>
                    <SelectTrigger id="department_id">
                        <SelectValue placeholder={loading ? 'Loading departments...' : 'Select department'} />
                    </SelectTrigger>
                    <SelectContent>
                        {departments.map((d) => (
                            <SelectItem key={d.id} value={d.id}>
                                {d.name}
                                {d.abbreviation && ` (${d.abbreviation})`}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </FormField>

            <div className="flex justify-between">
                <Button variant="outline" onClick={onBack}>Back</Button>
                <Button onClick={onNext} disabled={!value}>Continue</Button>
            </div>
        </div>
    );
}
