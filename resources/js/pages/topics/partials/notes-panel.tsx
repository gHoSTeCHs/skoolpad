import { Link } from '@inertiajs/react';
import { Pin, Plus, StickyNote } from 'lucide-react';
import { create, index, show } from '@/actions/App/Http/Controllers/Student/NoteController';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import type { TopicNoteItem } from '@/types/notes';

interface NotesPanelProps {
    topicNotes: TopicNoteItem[];
    topicId: string;
    courseId?: string;
    isSecondary: boolean;
}

export function NotesPanel({ topicNotes, topicId, courseId, isSecondary }: NotesPanelProps) {
    if (isSecondary) return null;

    const createUrl = create.url({
        query: {
            topic_id: topicId,
            ...(courseId ? { course_id: courseId } : {}),
        },
    });

    if (topicNotes.length === 0) {
        return (
            <div
                className="rounded-lg border border-dashed bg-card/50 p-6 text-center"
                style={{ borderRadius: 'var(--card-radius)' }}
            >
                <StickyNote className="mx-auto mb-2 size-8 text-muted-foreground" />
                <h4
                    className="text-[14px] font-semibold"
                    style={{ fontFamily: 'var(--font-display)' }}
                >
                    Notes
                </h4>
                <p
                    className="mt-1 text-[13px] text-muted-foreground"
                    style={{ fontFamily: 'var(--font-body)' }}
                >
                    Capture what you learn about this topic.
                </p>
                <Button size="sm" className="mt-3" asChild>
                    <Link href={createUrl}>
                        <Plus className="size-3.5" />
                        New Note
                    </Link>
                </Button>
            </div>
        );
    }

    const displayNotes = topicNotes.slice(0, 3);
    const hasMore = topicNotes.length > 3;

    return (
        <Collapsible defaultOpen>
            <div
                className="rounded-lg border border-border bg-card"
                style={{ borderRadius: 'var(--card-radius)' }}
            >
                <CollapsibleTrigger className="flex w-full items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-2">
                        <StickyNote className="size-4 text-muted-foreground" />
                        <span
                            className="text-[14px] font-semibold"
                            style={{ fontFamily: 'var(--font-display)' }}
                        >
                            Notes ({topicNotes.length})
                        </span>
                    </div>
                </CollapsibleTrigger>

                <CollapsibleContent>
                    <div className="border-t border-border px-4 py-3">
                        <div className="space-y-2">
                            {displayNotes.map((note) => (
                                <Link
                                    key={note.id}
                                    href={show.url(note.id)}
                                    className="flex items-center gap-2 rounded-md px-2 py-1.5 text-[13px] transition-colors hover:bg-accent"
                                    style={{ fontFamily: 'var(--font-body)' }}
                                >
                                    {note.is_pinned && <Pin className="size-3 shrink-0 text-primary" />}
                                    <span className="truncate text-foreground">{note.title}</span>
                                </Link>
                            ))}
                        </div>

                        <div className="mt-3 flex items-center gap-2">
                            <Button variant="outline" size="sm" asChild>
                                <Link href={createUrl}>
                                    <Plus className="size-3.5" />
                                    New Note
                                </Link>
                            </Button>
                            {hasMore && (
                                <Button variant="ghost" size="sm" asChild>
                                    <Link href={index.url()}>See all notes</Link>
                                </Button>
                            )}
                        </div>
                    </div>
                </CollapsibleContent>
            </div>
        </Collapsible>
    );
}
