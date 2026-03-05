import { router } from '@inertiajs/react';
import { Clock, FileText, Hash } from 'lucide-react';
import { useState } from 'react';

import { start as examPrepStart } from '@/actions/App/Http/Controllers/Student/ExamPrepController';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { MockPaperData } from '@/types/practice';

interface MockPaperCardProps {
    paper: MockPaperData;
}

export function MockPaperCard({ paper }: MockPaperCardProps) {
    const [loading, setLoading] = useState(false);

    function handleStartMock() {
        setLoading(true);
        router.post(examPrepStart.url(), { question_paper_id: paper.id }, {
            onFinish: () => setLoading(false),
        });
    }

    return (
        <div className="group flex items-center justify-between gap-4 rounded-xl border bg-card p-4 transition-shadow hover:shadow-sm">
            <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                    <FileText className="size-4 shrink-0 text-muted-foreground" />
                    <h4 className="truncate text-sm font-semibold" style={{ fontFamily: 'var(--font-body)' }}>
                        {paper.title}
                    </h4>
                    {paper.year && (
                        <Badge variant="secondary" className="shrink-0 text-[10px]">
                            {paper.year}
                        </Badge>
                    )}
                </div>

                <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                    <span className="flex items-center gap-1">
                        <Clock className="size-3" />
                        {paper.duration_minutes} min
                    </span>
                    <span className="flex items-center gap-1">
                        <Hash className="size-3" />
                        {paper.question_count} questions
                    </span>
                    <span className="tabular-nums">{paper.total_marks} marks</span>
                </div>
            </div>

            <Button
                size="sm"
                variant="outline"
                onClick={handleStartMock}
                disabled={loading}
                className="shrink-0"
            >
                {loading ? 'Starting...' : 'Start Mock'}
            </Button>
        </div>
    );
}
