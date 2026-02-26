import { Button } from '@/components/ui/button';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';

interface DetailsStepProps {
    matricNumber: string;
    admissionYear: string;
    onMatricChange: (value: string) => void;
    onYearChange: (value: string) => void;
    onNext: () => void;
    onBack: () => void;
}

export default function DetailsStep({
    matricNumber,
    admissionYear,
    onMatricChange,
    onYearChange,
    onNext,
    onBack,
}: DetailsStepProps) {
    return (
        <div className="flex flex-col gap-6">
            <div>
                <h2 className="font-display text-xl font-bold tracking-tight">Additional details</h2>
                <p className="mt-1 text-sm text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                    These are optional — you can always add them later.
                </p>
            </div>

            <FormField label="Matric Number" name="matric_number" description="Your student identification number">
                <Input
                    id="matric_number"
                    value={matricNumber}
                    onChange={(e) => onMatricChange(e.target.value)}
                    placeholder="e.g. MOUAU/22/CS/001"
                />
            </FormField>

            <FormField label="Admission Year" name="admission_year" description="The year you were admitted">
                <Input
                    id="admission_year"
                    type="number"
                    min={2000}
                    max={new Date().getFullYear() + 1}
                    value={admissionYear}
                    onChange={(e) => onYearChange(e.target.value)}
                    placeholder="e.g. 2022"
                />
            </FormField>

            <div className="flex justify-between">
                <Button variant="outline" onClick={onBack}>Back</Button>
                <div className="flex gap-2">
                    <Button variant="ghost" onClick={onNext}>Skip</Button>
                    <Button onClick={onNext}>Continue</Button>
                </div>
            </div>
        </div>
    );
}
