import { Link } from '@inertiajs/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { show as topicShow } from '@/actions/App/Http/Controllers/Student/TopicController';
import type { TopicNavItem } from '@/types/student-topics';

interface TopicNavigationProps {
    prevTopic: TopicNavItem | null;
    nextTopic: TopicNavItem | null;
    courseId: string;
}

export function TopicNavigation({ prevTopic, nextTopic, courseId }: TopicNavigationProps) {
    if (!prevTopic && !nextTopic) return null;

    return (
        <div className="flex items-center justify-between gap-4 border-t border-border pt-6">
            {prevTopic ? (
                <Button variant="outline" asChild className="gap-2">
                    <Link href={topicShow.url(prevTopic.id, { query: { course: courseId } })} prefetch>
                        <ChevronLeft className="size-4" />
                        <div className="text-left">
                            <div className="text-[10px] uppercase text-muted-foreground">Previous</div>
                            <div className="max-w-[200px] truncate text-[13px]">{prevTopic.title}</div>
                        </div>
                    </Link>
                </Button>
            ) : <div />}

            {nextTopic ? (
                <Button variant="outline" asChild className="gap-2">
                    <Link href={topicShow.url(nextTopic.id, { query: { course: courseId } })} prefetch>
                        <div className="text-right">
                            <div className="text-[10px] uppercase text-muted-foreground">Next</div>
                            <div className="max-w-[200px] truncate text-[13px]">{nextTopic.title}</div>
                        </div>
                        <ChevronRight className="size-4" />
                    </Link>
                </Button>
            ) : <div />}
        </div>
    );
}
