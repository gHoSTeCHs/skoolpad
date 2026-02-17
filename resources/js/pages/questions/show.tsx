import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';

export default function QuestionShow({ question }: { question: string }) {
    const breadcrumbs = [
        { title: 'Questions', href: '/questions' },
        { title: question, href: `/questions/${question}` },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Question: ${question}`} />
            <div className="flex flex-col gap-4 p-4 md:p-6">
                <div>
                    <h1 className="font-display text-2xl font-bold tracking-tight">Question: {question}</h1>
                    <p className="mt-1 text-sm text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                        This page is coming soon.
                    </p>
                </div>
            </div>
        </AppLayout>
    );
}
