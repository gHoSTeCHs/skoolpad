import { Head, Link } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import QuestionController from '@/actions/App/Http/Controllers/Admin/QuestionController';
import { AnswerDepthPanel } from '@/components/admin/answer-depth-panel';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AdminLayout from '@/layouts/admin-layout';
import type { AnswerDepthData, QuestionType } from '@/types/questions';

interface Props {
    question: {
        id: string;
        content: string;
        question_type: QuestionType;
        course_code: string | null;
    };
    answers: AnswerDepthData[];
}

const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
    mcq: 'MCQ',
    theory: 'Theory',
    fill_in_blank: 'Fill in Blank',
};

export default function AdminQuestionsAnswers({ question, answers }: Props) {
    const breadcrumbs = [
        { title: 'Questions', href: QuestionController.index.url() },
        { title: 'Edit', href: QuestionController.edit.url(question.id) },
        { title: 'Answers', href: '#' },
    ];

    return (
        <AdminLayout breadcrumbs={breadcrumbs}>
            <Head title="Question Answers" />
            <div className="flex flex-col gap-6 p-4 md:p-6">
                <div className="flex items-center justify-between">
                    <h1 className="font-display text-2xl font-bold tracking-tight">
                        Question Answers
                    </h1>
                    <Button variant="outline" size="sm" asChild>
                        <Link href={QuestionController.edit.url(question.id)}>
                            <ArrowLeft className="size-4" />
                            Back to Edit
                        </Link>
                    </Button>
                </div>

                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <CardTitle>Question</CardTitle>
                            <Badge variant="outline">{QUESTION_TYPE_LABELS[question.question_type]}</Badge>
                            {question.course_code && (
                                <Badge variant="secondary">{question.course_code}</Badge>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent>
                        <p className="whitespace-pre-wrap text-sm" style={{ fontFamily: 'var(--font-body)' }}>
                            {question.content}
                        </p>
                    </CardContent>
                </Card>

                {answers.map((depthData) => (
                    <AnswerDepthPanel
                        key={depthData.depth_level}
                        questionId={question.id}
                        depthData={depthData}
                    />
                ))}
            </div>
        </AdminLayout>
    );
}
