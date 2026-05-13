import { ContainerCard, toneForIndex } from '../container-card';
import type { ExamSubjectPool } from '@/types/question-library';

interface ExamPoolsTabProps {
    pools: ExamSubjectPool[];
}

export function ExamPoolsTab({ pools }: ExamPoolsTabProps) {
    if (pools.length === 0) {
        return (
            <div className="px-[30px] py-16">
                <div
                    className="mx-auto max-w-md rounded-[var(--card-radius)] border border-dashed border-border bg-[var(--bg-raised)] px-6 py-10 text-center"
                >
                    <div
                        className="text-[10px] uppercase tracking-[0.14em] text-[var(--fg-subtle)]"
                        style={{ fontFamily: 'var(--font-display)' }}
                    >
                        Exam-subject pools
                    </div>
                    <p
                        className="mt-2 text-[14px] text-muted-foreground"
                        style={{ fontFamily: 'var(--font-body)' }}
                    >
                        No exam-subject pools yet. Add a question to an exam subject (without a paper) to create one.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 gap-[18px] px-[30px] pt-6 pb-8 md:grid-cols-2">
            {pools.map((pool, idx) => (
                <ContainerCard
                    key={pool.id}
                    tone={toneForIndex(idx + 4)}
                    code={pool.name}
                    title={`${pool.pool_questions_count} pool questions`}
                    pills={['exam-subject', 'pool']}
                    footerRight="open pool"
                >
                    <div
                        className="text-[12.5px] text-muted-foreground"
                        style={{ fontFamily: 'var(--font-body)' }}
                    >
                        Questions tagged to this exam subject without a paper assignment.
                    </div>
                </ContainerCard>
            ))}
        </div>
    );
}
