import { useState, useRef, useEffect } from 'react';
import { router } from '@inertiajs/react';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import SpBadge from '@/components/skoolpad/sp-badge';
import QuestionPaperController from '@/actions/App/Http/Controllers/Admin/QuestionPaperController';
import type { QuestionPaper } from '@/types/questions';

interface PaperHeaderProps {
    paper: QuestionPaper;
}

export function PaperHeader({ paper }: PaperHeaderProps) {
    const [editingTitle, setEditingTitle] = useState(false);
    const [title, setTitle] = useState(paper.title);
    const [year, setYear] = useState(paper.year?.toString() ?? '');
    const [totalMarks, setTotalMarks] = useState(paper.total_marks?.toString() ?? '');
    const [duration, setDuration] = useState(paper.duration_minutes?.toString() ?? '');
    const titleInputRef = useRef<HTMLInputElement>(null);
    const saveTimeoutRef = useRef<ReturnType<typeof setTimeout>>(null);

    useEffect(() => {
        setTitle(paper.title);
        setYear(paper.year?.toString() ?? '');
        setTotalMarks(paper.total_marks?.toString() ?? '');
        setDuration(paper.duration_minutes?.toString() ?? '');
    }, [paper]);

    useEffect(() => {
        if (editingTitle && titleInputRef.current) {
            titleInputRef.current.focus();
            titleInputRef.current.select();
        }
    }, [editingTitle]);

    function savePaper(data: Record<string, unknown>) {
        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
        }

        saveTimeoutRef.current = setTimeout(() => {
            router.put(QuestionPaperController.update.url(paper.id), {
                title: title,
                year: year ? parseInt(year) : null,
                total_marks: totalMarks ? parseInt(totalMarks) : null,
                duration_minutes: duration ? parseInt(duration) : null,
                ...data,
            }, {
                preserveScroll: true,
                only: ['paper'],
            });
        }, 500);
    }

    function handleTitleBlur() {
        setEditingTitle(false);
        if (title !== paper.title) {
            savePaper({ title });
        }
    }

    function handleTitleKeyDown(e: React.KeyboardEvent) {
        if (e.key === 'Enter') {
            (e.target as HTMLInputElement).blur();
        }
        if (e.key === 'Escape') {
            setTitle(paper.title);
            setEditingTitle(false);
        }
    }

    function handleFieldBlur(field: string, value: string, original: string | undefined) {
        if (value !== (original ?? '')) {
            savePaper({ [field]: value ? parseInt(value) : null });
        }
    }

    function handlePublishToggle(checked: boolean) {
        router.put(QuestionPaperController.update.url(paper.id), {
            title: paper.title,
            is_published: checked,
        }, {
            preserveScroll: true,
            only: ['paper'],
        });
    }

    return (
        <div className="flex items-center gap-4 border-b border-border bg-card px-4 py-3">
            <div className="min-w-0 flex-1">
                {editingTitle ? (
                    <Input
                        ref={titleInputRef}
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        onBlur={handleTitleBlur}
                        onKeyDown={handleTitleKeyDown}
                        className="h-8 text-lg font-bold"
                    />
                ) : (
                    <h1
                        className="cursor-pointer truncate text-lg font-bold transition-colors hover:text-primary"
                        onClick={() => setEditingTitle(true)}
                        title="Click to edit title"
                    >
                        {paper.title}
                    </h1>
                )}

                <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                    {paper.institution_course && (
                        <span>{paper.institution_course.course_code}</span>
                    )}
                    {paper.assessment_type && (
                        <>
                            <span className="text-border">|</span>
                            <span>{paper.assessment_type.name}</span>
                        </>
                    )}
                    {paper.academic_session && (
                        <>
                            <span className="text-border">|</span>
                            <span>{paper.academic_session}</span>
                        </>
                    )}
                </div>
            </div>

            <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                    <Label htmlFor="header-year" className="text-xs text-muted-foreground">Year</Label>
                    <Input
                        id="header-year"
                        type="number"
                        value={year}
                        onChange={(e) => setYear(e.target.value)}
                        onBlur={() => handleFieldBlur('year', year, paper.year?.toString())}
                        className="h-7 w-20 text-xs"
                        placeholder="Year"
                    />
                </div>

                <div className="flex items-center gap-1.5">
                    <Label htmlFor="header-marks" className="text-xs text-muted-foreground">Marks</Label>
                    <Input
                        id="header-marks"
                        type="number"
                        value={totalMarks}
                        onChange={(e) => setTotalMarks(e.target.value)}
                        onBlur={() => handleFieldBlur('total_marks', totalMarks, paper.total_marks?.toString())}
                        className="h-7 w-20 text-xs"
                        placeholder="Total"
                    />
                </div>

                <div className="flex items-center gap-1.5">
                    <Label htmlFor="header-duration" className="text-xs text-muted-foreground">Mins</Label>
                    <Input
                        id="header-duration"
                        type="number"
                        value={duration}
                        onChange={(e) => setDuration(e.target.value)}
                        onBlur={() => handleFieldBlur('duration_minutes', duration, paper.duration_minutes?.toString())}
                        className="h-7 w-20 text-xs"
                        placeholder="Duration"
                    />
                </div>

                <div className="flex items-center gap-2 border-l border-border pl-3">
                    <Switch
                        id="header-published"
                        size="sm"
                        checked={paper.is_published}
                        onCheckedChange={handlePublishToggle}
                    />
                    <SpBadge variant={paper.is_published ? 'primary' : 'neutral'} className="text-[9px]">
                        {paper.is_published ? 'Published' : 'Draft'}
                    </SpBadge>
                </div>
            </div>
        </div>
    );
}
