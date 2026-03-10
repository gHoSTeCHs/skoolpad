import { router } from '@inertiajs/react';
import { Search } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

interface CourseResult {
    id: string;
    course_code: string;
    course_title: string;
}

interface QuickEnrollModalProps {
    open: boolean;
    onClose: () => void;
    onEnrolled: () => void;
    searchUrl: string;
    enrollUrl: string;
}

export function QuickEnrollModal({ open, onClose, onEnrolled, searchUrl, enrollUrl }: QuickEnrollModalProps) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<CourseResult[]>([]);
    const [searching, setSearching] = useState(false);
    const [enrolling, setEnrolling] = useState<string | null>(null);

    function handleSearch(value: string) {
        setQuery(value);
        if (value.length < 2) {
            setResults([]);
            return;
        }

        setSearching(true);
        fetch(`${searchUrl}?search=${encodeURIComponent(value)}`, {
            headers: { Accept: 'application/json' },
        })
            .then((res) => res.json())
            .then((data: CourseResult[]) => {
                setResults(data);
                setSearching(false);
            })
            .catch(() => setSearching(false));
    }

    function handleEnroll(courseId: string) {
        setEnrolling(courseId);
        router.post(
            enrollUrl,
            { institution_course_id: courseId },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setEnrolling(null);
                    setQuery('');
                    setResults([]);
                    onEnrolled();
                    onClose();
                },
                onError: () => setEnrolling(null),
            },
        );
    }

    return (
        <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle className="font-display text-lg">Enrol in a Course</DialogTitle>
                </DialogHeader>

                <div className="relative">
                    <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        value={query}
                        onChange={(e) => handleSearch(e.target.value)}
                        placeholder="Search courses..."
                        className="pl-9"
                    />
                </div>

                <div className="max-h-64 overflow-y-auto">
                    {searching && (
                        <p className="py-6 text-center text-xs text-muted-foreground">Searching...</p>
                    )}
                    {!searching && results.length === 0 && query.length >= 2 && (
                        <p className="py-6 text-center text-xs text-muted-foreground">No courses found.</p>
                    )}
                    {!searching && results.length > 0 && (
                        <div className="divide-y">
                            {results.map((course) => (
                                <div key={course.id} className="flex items-center justify-between gap-3 py-2.5">
                                    <div className="min-w-0">
                                        <p className="truncate text-sm font-medium">{course.course_title}</p>
                                        <p className="text-xs text-muted-foreground">{course.course_code}</p>
                                    </div>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleEnroll(course.id)}
                                        disabled={enrolling === course.id}
                                        className="shrink-0"
                                    >
                                        {enrolling === course.id ? 'Enrolling...' : 'Enrol'}
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
