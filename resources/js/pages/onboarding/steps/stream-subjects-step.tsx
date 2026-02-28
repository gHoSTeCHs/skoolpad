import { Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import type { LevelSubjectResult, StreamResult } from '@/types/onboarding';

interface StreamSubjectsStepProps {
    streamValue: string;
    streams: StreamResult[];
    subjects: LevelSubjectResult[];
    loading: boolean;
    onStreamSelect: (streamId: string) => void;
    onNext: () => void;
    onBack: () => void;
}

export default function StreamSubjectsStep({
    streamValue,
    streams,
    subjects,
    loading,
    onStreamSelect,
    onNext,
    onBack,
}: StreamSubjectsStepProps) {
    const hasStreams = streams.length > 0;

    return (
        <div className="flex flex-col gap-6">
            <div>
                <h2 className="font-display text-xl font-bold tracking-tight">
                    {hasStreams ? 'Select your stream & subjects' : 'Your subjects'}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                    {hasStreams
                        ? 'Choose your study track. Compulsory subjects are pre-selected.'
                        : 'These are the subjects for your class level.'}
                </p>
            </div>

            {hasStreams && (
                <div>
                    <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Stream</h3>
                    <div className="grid gap-3 sm:grid-cols-3">
                        {streams.map((stream) => (
                            <button
                                key={stream.id}
                                type="button"
                                onClick={() => onStreamSelect(stream.id)}
                                className={cn(
                                    'rounded-lg border-2 p-3 text-center text-sm font-medium transition-colors',
                                    streamValue === stream.id
                                        ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                                        : 'border-border hover:border-muted-foreground/30',
                                )}
                            >
                                {stream.name}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {loading ? (
                <div className="space-y-3">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="h-12 animate-pulse rounded-lg bg-muted" />
                    ))}
                </div>
            ) : subjects.length === 0 ? (
                <p className="py-4 text-center text-sm text-muted-foreground">
                    {hasStreams && !streamValue
                        ? 'Select a stream to see your subjects.'
                        : 'No subjects found for this level.'}
                </p>
            ) : (
                <div className="max-h-64 space-y-2 overflow-y-auto">
                    {subjects.map((subject) => (
                        <label
                            key={subject.id}
                            className="flex cursor-default items-center gap-3 rounded-lg border p-3 transition-colors"
                        >
                            <Checkbox
                                checked={true}
                                disabled={subject.is_compulsory}
                            />
                            <div className="flex min-w-0 flex-1 items-center gap-2">
                                <span className="text-sm font-medium">{subject.curriculum_subject.name}</span>
                                {subject.is_compulsory && (
                                    <Badge variant="secondary" className="text-[10px]">Compulsory</Badge>
                                )}
                            </div>
                        </label>
                    ))}
                </div>
            )}

            <div className="flex justify-between">
                <Button variant="outline" onClick={onBack}>Back</Button>
                <Button onClick={onNext} disabled={loading}>Continue</Button>
            </div>
        </div>
    );
}
