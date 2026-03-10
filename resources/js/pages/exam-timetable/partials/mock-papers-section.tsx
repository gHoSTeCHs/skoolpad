import { useForm } from '@inertiajs/react';
import { Clock, FileText } from 'lucide-react';
import { startMock } from '@/actions/App/Http/Controllers/Student/ExamTimetableController';
import { Button } from '@/components/ui/button';
import type { MockPaperData } from '@/types/practice';

interface MockPapersSectionProps {
    papers: MockPaperData[];
    entryId: string;
}

export function MockPapersSection({ papers, entryId }: MockPapersSectionProps) {
    if (papers.length === 0) return null;

    return (
        <div className="rounded-lg border">
            <div className="px-3 py-2.5">
                <h4 className="text-xs font-semibold">Mock Papers</h4>
            </div>
            <div className="border-t divide-y">
                {papers.map((paper) => (
                    <MockPaperRow key={paper.id} paper={paper} entryId={entryId} />
                ))}
            </div>
        </div>
    );
}

function MockPaperRow({ paper, entryId }: { paper: MockPaperData; entryId: string }) {
    const form = useForm({ question_paper_id: paper.id });

    function handleStart() {
        form.submit(startMock({ entry: entryId }));
    }

    return (
        <div className="flex items-center justify-between gap-3 px-3 py-2">
            <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                    <FileText className="size-3 shrink-0 text-muted-foreground" />
                    <span className="truncate text-xs font-medium">{paper.title}</span>
                    {paper.year && (
                        <span className="shrink-0 text-[10px] text-muted-foreground">({paper.year})</span>
                    )}
                </div>
                <div className="mt-0.5 flex items-center gap-2 text-[10px] text-muted-foreground">
                    {paper.duration_minutes && (
                        <span className="flex items-center gap-0.5">
                            <Clock className="size-2.5" />
                            {paper.duration_minutes}m
                        </span>
                    )}
                    <span>{paper.question_count} Qs</span>
                </div>
            </div>
            <Button
                size="sm"
                variant="outline"
                onClick={handleStart}
                disabled={form.processing}
                className="shrink-0 text-xs h-7 px-2"
            >
                Start Mock
            </Button>
        </div>
    );
}
