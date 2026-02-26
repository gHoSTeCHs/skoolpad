import { Head, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PapersTab } from '@/pages/questions/partials/papers-tab';
import { SearchQuestionsTab } from '@/pages/questions/partials/search-questions-tab';
import { index as papersIndex } from '@/actions/App/Http/Controllers/Student/QuestionPaperController';
import { index as questionsIndex } from '@/actions/App/Http/Controllers/Student/QuestionController';
import type { BreadcrumbItem } from '@/types';
import type { QuestionsPageProps } from '@/types/student-questions';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Past Questions', href: papersIndex.url() },
];

export default function QuestionsIndex(props: QuestionsPageProps) {
    function handleTabChange(value: string) {
        if (value === 'papers') {
            router.get(papersIndex.url(), {}, { preserveState: false });
        } else {
            router.get(questionsIndex.url(), {}, { preserveState: false });
        }
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Past Questions" />

            <div className="flex flex-col gap-6 p-4 md:p-6">
                <div>
                    <h1 className="font-display text-2xl font-bold tracking-tight">
                        Past Questions
                    </h1>
                    <p className="mt-1 text-sm text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                        Browse and study past examination questions from your enrolled courses.
                    </p>
                </div>

                <Tabs value={props.tab} onValueChange={handleTabChange}>
                    <TabsList>
                        <TabsTrigger value="papers">Papers</TabsTrigger>
                        <TabsTrigger value="search">Search Questions</TabsTrigger>
                    </TabsList>

                    <TabsContent value="papers">
                        {props.tab === 'papers' && (
                            <PapersTab
                                papers={props.papers}
                                paperFilterOptions={props.paperFilterOptions}
                                paperFilters={props.paperFilters}
                                paperCount={props.paperCount}
                            />
                        )}
                    </TabsContent>

                    <TabsContent value="search">
                        {props.tab === 'search' && (
                            <SearchQuestionsTab
                                questions={props.questions}
                                filterOptions={props.filterOptions}
                                appliedFilters={props.appliedFilters}
                                totalCount={props.totalCount}
                            />
                        )}
                    </TabsContent>
                </Tabs>
            </div>
        </AppLayout>
    );
}
