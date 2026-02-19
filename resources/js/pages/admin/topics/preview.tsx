import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, Clock, Info } from 'lucide-react';
import CanonicalTopicController from '@/actions/App/Http/Controllers/Admin/CanonicalTopicController';
import { TiptapRenderer } from '@/components/shared/tiptap-renderer';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import AdminLayout from '@/layouts/admin-layout';
import type { TiptapJSON } from '@/types/tiptap';
import type { TopicDifficulty } from '@/types/topics';

interface Props {
    topic: {
        title: string;
        content: TiptapJSON | null;
        summary: string | null;
        difficulty_level: TopicDifficulty;
        estimated_read_minutes: number | null;
    };
}

const breadcrumbs = [
    { title: 'Topics', href: '/admin/topics' },
    { title: 'Preview', href: '#' },
];

const difficultyLabels: Record<string, string> = {
    foundational: 'Foundational',
    intermediate: 'Intermediate',
    advanced: 'Advanced',
};

const difficultyStyles: Record<string, string> = {
    foundational: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 reader:bg-blue-900/30 reader:text-blue-400',
    intermediate: 'bg-[var(--badge-reward-bg)] text-[var(--badge-reward-fg)]',
    advanced: 'bg-[var(--badge-danger-bg)] text-[var(--badge-danger-fg)]',
};

export default function AdminTopicsPreview({ topic }: Props) {
    return (
        <AdminLayout breadcrumbs={breadcrumbs}>
            <Head title={`Preview: ${topic.title}`} />
            <div className="flex flex-col gap-6 p-4 md:p-6">
                <Alert>
                    <Info className="size-4" />
                    <AlertDescription>
                        This is an admin preview of how the topic content will appear to students.
                    </AlertDescription>
                </Alert>

                <div>
                    <Link
                        href={CanonicalTopicController.index.url()}
                        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
                    >
                        <ArrowLeft className="size-4" />
                        Back to Topics
                    </Link>
                </div>

                <article className="mx-auto w-full max-w-3xl">
                    <h1 className="font-display text-3xl font-bold tracking-tight md:text-4xl">
                        {topic.title}
                    </h1>

                    <div className="mt-4 flex flex-wrap items-center gap-3">
                        <Badge
                            variant="secondary"
                            className={difficultyStyles[topic.difficulty_level] ?? ''}
                        >
                            {difficultyLabels[topic.difficulty_level] ?? topic.difficulty_level}
                        </Badge>
                        {topic.estimated_read_minutes && (
                            <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                                <Clock className="size-3.5" />
                                {topic.estimated_read_minutes} min read
                            </span>
                        )}
                    </div>

                    {topic.summary && (
                        <p className="mt-6 text-lg italic text-muted-foreground">
                            {topic.summary}
                        </p>
                    )}

                    <hr className="my-6 border-border" />

                    <TiptapRenderer content={topic.content} />
                </article>
            </div>
        </AdminLayout>
    );
}
