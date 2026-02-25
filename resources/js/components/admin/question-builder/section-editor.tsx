import { useState, useEffect } from 'react';
import { router } from '@inertiajs/react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { FormField } from '@/components/ui/form-field';
import QuestionSectionController from '@/actions/App/Http/Controllers/Admin/QuestionSectionController';
import type { QuestionPaper, QuestionSection } from '@/types/questions';

interface SectionEditorProps {
    paper: QuestionPaper;
    section: QuestionSection;
}

export default function SectionEditor({ paper, section }: SectionEditorProps) {
    const [label, setLabel] = useState(section.label);
    const [instruction, setInstruction] = useState(section.instruction ?? '');
    const [marks, setMarks] = useState(section.marks?.toString() ?? '');
    const [requiredCount, setRequiredCount] = useState(section.required_count?.toString() ?? '');
    const [saving, setSaving] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        setLabel(section.label);
        setInstruction(section.instruction ?? '');
        setMarks(section.marks?.toString() ?? '');
        setRequiredCount(section.required_count?.toString() ?? '');
        setErrors({});
    }, [section.id]);

    function handleSave() {
        setSaving(true);
        router.put(
            QuestionSectionController.update.url({
                questionPaper: paper.id,
                questionSection: section.id,
            }),
            {
                label,
                instruction: instruction || null,
                marks: marks ? parseInt(marks) : null,
                required_count: requiredCount ? parseInt(requiredCount) : null,
            },
            {
                preserveScroll: true,
                only: ['paper'],
                onSuccess: () => {
                    setSaving(false);
                    setErrors({});
                },
                onError: (errs) => {
                    setSaving(false);
                    setErrors(errs as Record<string, string>);
                },
            }
        );
    }

    function handleDelete() {
        if (!confirm('Delete this section? All questions in this section will be removed.')) {
            return;
        }
        router.delete(
            QuestionSectionController.destroy.url({
                questionPaper: paper.id,
                questionSection: section.id,
            }),
            {
                preserveScroll: true,
                onSuccess: () => router.reload({ only: ['paper'] }),
            }
        );
    }

    return (
        <div className="space-y-6 p-4">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">Edit Section</h3>
                <Button variant="ghost" size="sm" className="text-xs text-destructive hover:text-destructive" onClick={handleDelete}>
                    Delete
                </Button>
            </div>

            <FormField label="Label" name="label" error={errors.label} required>
                <Input
                    id="label"
                    value={label}
                    onChange={(e) => setLabel(e.target.value)}
                    placeholder="e.g. Section A"
                />
            </FormField>

            <FormField label="Instruction" name="instruction" error={errors.instruction}>
                <Textarea
                    id="instruction"
                    value={instruction}
                    onChange={(e) => setInstruction(e.target.value)}
                    rows={3}
                    placeholder="Instructions for this section..."
                />
            </FormField>

            <div className="grid grid-cols-2 gap-4">
                <FormField label="Section Marks" name="marks" error={errors.marks}>
                    <Input
                        id="marks"
                        type="number"
                        min={1}
                        value={marks}
                        onChange={(e) => setMarks(e.target.value)}
                        placeholder="e.g. 30"
                    />
                </FormField>

                <FormField
                    label="Required Count"
                    name="required_count"
                    error={errors.required_count}
                    description={requiredCount ? `Answer ${requiredCount} of ${section.questions.length} questions` : undefined}
                >
                    <Input
                        id="required_count"
                        type="number"
                        min={1}
                        value={requiredCount}
                        onChange={(e) => setRequiredCount(e.target.value)}
                        placeholder="All"
                    />
                </FormField>
            </div>

            <Button onClick={handleSave} disabled={saving || !label.trim()} className="w-full">
                {saving ? 'Saving...' : 'Save Section'}
            </Button>
        </div>
    );
}
