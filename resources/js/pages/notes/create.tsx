import { Head, Link, useForm } from '@inertiajs/react';
import { index, store } from '@/actions/App/Http/Controllers/Student/NoteController';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { NoteForm } from '@/pages/notes/partials/note-form';
import type { BreadcrumbItem } from '@/types';
import type { NoteCreateProps } from '@/types/notes';
import type { TiptapJSON } from '@/types/tiptap';

export default function NoteCreate({ enrolledCourses, topicContext, courseContext }: NoteCreateProps) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Notes', href: index.url() },
        { title: 'Create', href: '#' },
    ];

    const form = useForm({
        title: '',
        content: null as TiptapJSON | null,
        is_pinned: false,
        canonical_topic_id: topicContext?.id ?? null,
        institution_course_id: courseContext?.id ?? null,
    });

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        form.post(store.url());
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Create Note" />

            <div className="flex flex-col gap-6 p-4 md:p-6">
                <div>
                    <h1 className="font-display text-2xl font-bold tracking-tight">Create Note</h1>
                    <p
                        className="mt-1 text-[13px] text-muted-foreground"
                        style={{ fontFamily: 'var(--font-body)' }}
                    >
                        Create a new note to capture what you learn.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="max-w-2xl">
                    <Card>
                        <CardContent className="space-y-6 pt-6">
                            <NoteForm
                                data={form.data}
                                errors={form.errors}
                                enrolledCourses={enrolledCourses}
                                topicLabel={topicContext?.title}
                                onFieldChange={(field, value) => form.setData(field, value as never)}
                            />
                        </CardContent>
                        <CardFooter className="flex justify-end gap-3 border-t pt-6">
                            <Button variant="outline" type="button" asChild>
                                <Link href={index.url()}>Cancel</Link>
                            </Button>
                            <Button type="submit" disabled={form.processing}>
                                {form.processing ? 'Creating...' : 'Create Note'}
                            </Button>
                        </CardFooter>
                    </Card>
                </form>
            </div>
        </AppLayout>
    );
}
