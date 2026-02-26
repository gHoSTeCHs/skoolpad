import { Button } from '@/components/ui/button';
import type { InstitutionSearchResult, SuggestedCourse } from '@/types/onboarding';

interface ConfirmStepProps {
    institution: InstitutionSearchResult | null;
    facultyName: string;
    departmentName: string;
    level: string;
    matricNumber: string;
    admissionYear: string;
    selectedCourses: SuggestedCourse[];
    isSubmitting: boolean;
    onSubmit: () => void;
    onBack: () => void;
}

export default function ConfirmStep({
    institution,
    facultyName,
    departmentName,
    level,
    matricNumber,
    admissionYear,
    selectedCourses,
    isSubmitting,
    onSubmit,
    onBack,
}: ConfirmStepProps) {
    return (
        <div className="flex flex-col gap-6">
            <div>
                <h2 className="font-display text-xl font-bold tracking-tight">Confirm your details</h2>
                <p className="mt-1 text-sm text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                    Review your selections before completing setup.
                </p>
            </div>

            <div className="space-y-4 rounded-lg border bg-card p-4">
                <SummaryRow label="Institution" value={institution ? `${institution.name} (${institution.abbreviation})` : '—'} />
                <SummaryRow label="Faculty" value={facultyName || '—'} />
                <SummaryRow label="Department" value={departmentName || '—'} />
                <SummaryRow label="Level" value={level ? `${level} Level` : '—'} />
                {matricNumber && <SummaryRow label="Matric Number" value={matricNumber} />}
                {admissionYear && <SummaryRow label="Admission Year" value={admissionYear} />}
            </div>

            <div>
                <h3 className="mb-2 text-sm font-semibold">
                    Courses ({selectedCourses.length})
                </h3>
                <div className="max-h-48 space-y-1 overflow-y-auto rounded-lg border bg-card p-3">
                    {selectedCourses.map((course) => (
                        <div key={course.id} className="flex items-center justify-between py-1 text-sm">
                            <span className="font-medium">{course.course_code}</span>
                            <span className="text-xs text-muted-foreground">{course.course_title}</span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="flex justify-between">
                <Button variant="outline" onClick={onBack} disabled={isSubmitting}>Back</Button>
                <Button onClick={onSubmit} disabled={isSubmitting}>
                    {isSubmitting ? 'Setting up...' : 'Complete Setup'}
                </Button>
            </div>
        </div>
    );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex items-center justify-between border-b border-border/50 pb-2 last:border-0 last:pb-0">
            <span className="text-sm text-muted-foreground">{label}</span>
            <span className="text-sm font-medium">{value}</span>
        </div>
    );
}
