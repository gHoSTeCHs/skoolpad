import { Link } from '@inertiajs/react';
import { Pin, StickyNote } from 'lucide-react';
import { show } from '@/actions/App/Http/Controllers/Student/NoteController';
import SpBadge from '@/components/skoolpad/sp-badge';
import { getRelativeTime } from '@/lib/date';
import type { NoteListItem } from '@/types/notes';

interface NoteCardProps {
    note: NoteListItem;
}

export function NoteCard({ note }: NoteCardProps) {
    const updatedAt = new Date(note.updated_at);
    const timeAgo = getRelativeTime(updatedAt);

    return (
        <Link
            href={show.url(note.id)}
            className="group block rounded-lg border border-border bg-card p-4 transition-colors hover:border-primary/30 hover:bg-accent/50"
            style={{ borderRadius: 'var(--card-radius)' }}
        >
            <div className="flex items-start gap-3">
                <StickyNote className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                        <h3
                            className="truncate text-[14px] font-semibold text-foreground group-hover:text-primary"
                            style={{ fontFamily: 'var(--font-display)' }}
                        >
                            {note.title}
                        </h3>
                        {note.is_pinned && (
                            <Pin className="size-3 shrink-0 text-primary" />
                        )}
                    </div>

                    <div className="mt-1.5 flex flex-wrap items-center gap-2">
                        {note.institution_course && (
                            <SpBadge variant="neutral">
                                {note.institution_course.course_code}
                            </SpBadge>
                        )}
                        {note.canonical_topic && (
                            <SpBadge variant="primary">
                                {note.canonical_topic.title}
                            </SpBadge>
                        )}
                        <span
                            className="text-[12px] text-muted-foreground"
                            style={{ fontFamily: 'var(--font-body)' }}
                        >
                            {timeAgo}
                        </span>
                    </div>
                </div>
            </div>
        </Link>
    );
}
