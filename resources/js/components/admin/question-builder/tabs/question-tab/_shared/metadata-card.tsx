import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { EnumOption } from '@/types/questions';

interface MetadataCardProps {
    marks: number | null;
    difficulty: string;
    bloom: string;
    enumOptions: {
        difficulties: EnumOption[];
        bloom_levels?: EnumOption[];
    };
    errors: {
        marks?: string;
        difficulty_level?: string;
        bloom_level?: string;
    };
    onMarksChange: (marks: number | null) => void;
    onDifficultyChange: (level: string) => void;
    onBloomChange: (level: string) => void;
}

export function MetadataCard({
    marks,
    difficulty,
    bloom,
    enumOptions,
    errors,
    onMarksChange,
    onDifficultyChange,
    onBloomChange,
}: MetadataCardProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Metadata</CardTitle>
                <CardDescription>Marks, difficulty, and Bloom taxonomy classification.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <FormField label="Marks" name="marks" error={errors.marks}>
                        <Input
                            id="marks"
                            type="number"
                            min={0}
                            step={1}
                            value={marks ?? ''}
                            onChange={(e) => {
                                const v = e.target.value;
                                onMarksChange(v === '' ? null : Number(v));
                            }}
                        />
                    </FormField>

                    <FormField label="Difficulty" name="difficulty_level" error={errors.difficulty_level}>
                        <Select value={difficulty || undefined} onValueChange={onDifficultyChange}>
                            <SelectTrigger id="difficulty_level">
                                <SelectValue placeholder="Select difficulty" />
                            </SelectTrigger>
                            <SelectContent>
                                {enumOptions.difficulties.map((opt) => (
                                    <SelectItem key={opt.value} value={opt.value}>
                                        {opt.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </FormField>

                    <FormField label="Bloom level" name="bloom_level" error={errors.bloom_level}>
                        <Select value={bloom || undefined} onValueChange={onBloomChange}>
                            <SelectTrigger id="bloom_level">
                                <SelectValue placeholder="Select Bloom level" />
                            </SelectTrigger>
                            <SelectContent>
                                {(enumOptions.bloom_levels ?? []).map((opt) => (
                                    <SelectItem key={opt.value} value={opt.value}>
                                        {opt.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </FormField>
                </div>
            </CardContent>
        </Card>
    );
}
