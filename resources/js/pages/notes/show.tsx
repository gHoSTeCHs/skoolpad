import { Head, Link, router, useForm } from '@inertiajs/react';
import { BookOpen, Check, Loader2, Pencil, Pin, Trash2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { destroy, index, update } from '@/actions/App/Http/Controllers/Student/NoteController';
import SpBadge from '@/components/skoolpad/sp-badge';
import { TiptapRenderer } from '@/components/shared/tiptap-renderer';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { getRelativeTime } from '@/lib/date';
import AppLayout from '@/layouts/app-layout';
import { NoteForm } from '@/pages/notes/partials/note-form';
import type { BreadcrumbItem } from '@/types';
import type { NoteShowProps } from '@/types/notes';
import type { TiptapJSON } from '@/types/tiptap';

type SaveStatus = 'idle' | 'saving' | 'saved';
type ViewMode = 'read' | 'edit';

export default function NoteShow({ note, enrolledCourses }: NoteShowProps) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Notes', href: index.url() },
        { title: note.title.length > 30 ? note.title.substring(0, 30) + '...' : note.title, href: '#' },
    ];

    const [mode, setMode] = useState<ViewMode>('read');

    const form = useForm({
        title: note.title,
        content: note.content as TiptapJSON | null,
        is_pinned: note.is_pinned,
        canonical_topic_id: note.canonical_topic?.id ?? null,
        institution_course_id: note.institution_course?.id ?? null,
    });

    const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
    const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
    const hasMounted = useRef(false);
    const saveStatusTimeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);

    useEffect(() => {
        if (!hasMounted.current) {
            hasMounted.current = true;
            return;
        }

        setSaveStatus('idle');
        clearTimeout(debounceRef.current);

        debounceRef.current = setTimeout(() => {
            setSaveStatus('saving');
            form.put(update.url(note.id), {
                preserveScroll: true,
                onSuccess: () => {
                    setSaveStatus('saved');
                    clearTimeout(saveStatusTimeoutRef.current);
                    saveStatusTimeoutRef.current = setTimeout(() => setSaveStatus('idle'), 2000);
                },
                onError: () => setSaveStatus('idle'),
            });
        }, 2500);

        return () => clearTimeout(debounceRef.current);
    }, [form.data.title, form.data.content, form.data.is_pinned, form.data.institution_course_id, form.data.canonical_topic_id]);

    useEffect(() => {
        return () => {
            clearTimeout(debounceRef.current);
            clearTimeout(saveStatusTimeoutRef.current);
        };
    }, []);

    function handleDelete() {
        router.delete(destroy.url(note.id));
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={note.title} />

            <div className="flex flex-col gap-6 p-4 md:p-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-2">
                        {note.is_pinned && (
                            <Pin className="size-4 text-primary" />
                        )}
                        <div className="flex flex-wrap items-center gap-2">
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
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <SaveIndicator status={saveStatus} />

                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setMode(mode === 'read' ? 'edit' : 'read')}
                        >
                            {mode === 'read' ? (
                                <>
                                    <Pencil className="size-4" />
                                    <span className="hidden sm:inline">Edit</span>
                                </>
                            ) : (
                                <>
                                    <BookOpen className="size-4" />
                                    <span className="hidden sm:inline">Read</span>
                                </>
                            )}
                        </Button>

                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
                                    <Trash2 className="size-4" />
                                    <span className="hidden sm:inline">Delete</span>
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Delete note?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        This will permanently delete &quot;{note.title}&quot;. This action cannot be undone.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                        Delete
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>

                        <Button variant="outline" size="sm" asChild>
                            <Link href={index.url()}>Back to Notes</Link>
                        </Button>
                    </div>
                </div>

                {mode === 'read' ? (
                    <NoteReader
                        title={form.data.title}
                        content={form.data.content}
                        updatedAt={note.updated_at}
                    />
                ) : (
                    <div className="max-w-2xl">
                        <Card>
                            <CardContent className="space-y-6 pt-6">
                                <NoteForm
                                    data={form.data}
                                    errors={form.errors}
                                    enrolledCourses={enrolledCourses}
                                    topicLabel={note.canonical_topic?.title}
                                    onFieldChange={(field, value) => form.setData(field, value as never)}
                                />
                            </CardContent>
                        </Card>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}

interface NoteReaderProps {
    title: string;
    content: TiptapJSON | null;
    updatedAt: string;
}

function NoteReader({ title, content, updatedAt }: NoteReaderProps) {
    const timeAgo = getRelativeTime(new Date(updatedAt));

    return (
        <article className="mx-auto w-full max-w-2xl">
            <div className="mb-6">
                <h1
                    className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl"
                    style={{ fontFamily: 'var(--font-display)' }}
                >
                    {title}
                </h1>
                <p
                    className="mt-2 text-[12px] text-muted-foreground"
                    style={{ fontFamily: 'var(--font-body)' }}
                >
                    Last edited {timeAgo}
                </p>
            </div>

            {content ? (
                <TiptapRenderer content={content} />
            ) : (
                <p
                    className="py-12 text-center text-[13px] text-muted-foreground"
                    style={{ fontFamily: 'var(--font-body)' }}
                >
                    This note has no content yet. Switch to edit mode to start writing.
                </p>
            )}
        </article>
    );
}

function SaveIndicator({ status }: { status: SaveStatus }) {
    if (status === 'idle') return null;

    return (
        <span
            className="flex items-center gap-1.5 text-[12px] text-muted-foreground"
            style={{ fontFamily: 'var(--font-body)' }}
        >
            {status === 'saving' && (
                <>
                    <Loader2 className="size-3 animate-spin" />
                    Saving...
                </>
            )}
            {status === 'saved' && (
                <>
                    <Check className="size-3 text-primary" />
                    Saved
                </>
            )}
        </span>
    );
}
