import { Button } from '@/components/ui/button';
import { FormField } from '@/components/ui/form-field';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import type { FacultyResult } from '@/types/onboarding';

interface FacultyStepProps {
    value: string;
    faculties: FacultyResult[];
    loading: boolean;
    onSelect: (facultyId: string) => void;
    onNext: () => void;
    onBack: () => void;
}

export default function FacultyStep({ value, faculties, loading, onSelect, onNext, onBack }: FacultyStepProps) {
    return (
        <div className="flex flex-col gap-6">
            <div>
                <h2 className="font-display text-xl font-bold tracking-tight">Select your faculty</h2>
                <p className="mt-1 text-sm text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                    Choose the faculty you belong to.
                </p>
            </div>

            <FormField label="Faculty" name="faculty_id" required>
                <Select value={value} onValueChange={onSelect} disabled={loading}>
                    <SelectTrigger id="faculty_id">
                        <SelectValue placeholder={loading ? 'Loading faculties...' : 'Select faculty'} />
                    </SelectTrigger>
                    <SelectContent>
                        {faculties.map((f) => (
                            <SelectItem key={f.id} value={f.id}>
                                {f.name}
                                {f.abbreviation && ` (${f.abbreviation})`}
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
