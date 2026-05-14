import { router } from '@inertiajs/react';
import QuestionLibraryController from '@/actions/App/Http/Controllers/Admin/QuestionLibraryController';
import { ContainerCard, toneForIndex } from '../container-card';
import type { CoursePool } from '@/types/question-library';

interface CoursePoolsTabProps {
    pools: CoursePool[];
}

export function CoursePoolsTab({ pools }: CoursePoolsTabProps) {
    if (pools.length === 0) {
        return (
            <div className="px-[30px] py-16 text-center">
                <p
                    className="text-[14px] text-muted-foreground"
                    style={{ fontFamily: 'var(--font-body)' }}
                >
                    No course pools yet. Add a question to a course (without a paper) to start a pool.
                </p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 gap-[18px] px-[30px] pt-6 pb-8 md:grid-cols-2">
            {pools.map((pool, idx) => (
                <ContainerCard
                    key={pool.id}
                    tone={toneForIndex(idx + 2)}
                    code={pool.course_code}
                    title={pool.course_title}
                    pills={['course pool', pool.institution_abbreviation?.toLowerCase() ?? 'inst']}
                    onOpen={() => router.visit(QuestionLibraryController.showCourse.url({ course: pool.id }))}
                    footerLeft={pool.institution_name ?? '—'}
                    footerRight="open pool"
                >
                    <div className="flex items-baseline justify-between">
                        <div
                            className="text-[16px] font-semibold text-foreground"
                            style={{ fontFamily: 'var(--font-display)' }}
                        >
                            {pool.pool_questions_count}
                            <em className="ml-1.5 text-[12.5px] font-medium not-italic text-muted-foreground">
                                pool {pool.pool_questions_count === 1 ? 'question' : 'questions'}
                            </em>
                        </div>
                        <div
                            className="text-[10px] uppercase tracking-[0.06em] text-[var(--fg-subtle)]"
                            style={{ fontFamily: 'var(--font-mono)' }}
                        >
                            no paper · topic-grouped
                        </div>
                    </div>
                </ContainerCard>
            ))}
        </div>
    );
}
