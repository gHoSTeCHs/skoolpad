import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import type { QuestionEnumOptions, QuestionPaper, QuestionSection, QuestionNode, AnswerDepthLevel } from '@/types/questions';
import type { PoolContainer, PoolTopic } from '@/types/question-library';
import { QuestionHeader } from './question-header';
import { QuestionTab } from './tabs/question-tab';
import { AnswersTab } from './tabs/answers-tab';
import { LinksTab } from './tabs/links-tab';
import { ContextsTab } from './tabs/contexts-tab';
import { aggregateGroupCounts, fillStateFor } from './tabs/answers-tab/_shared/answer-fill-utils';
import { DEPTH_ORDER } from './tabs/answers-tab/_shared/depth-meta';

export type EditorTab = 'question' | 'answers' | 'links' | 'contexts';

export type EditorContainer =
    | { kind: 'paper'; paper: QuestionPaper; section: QuestionSection }
    | { kind: 'pool'; pool: PoolContainer; topic: PoolTopic };

interface CompositeEditorProps {
    container: EditorContainer;
    question: QuestionNode;
    enumOptions: QuestionEnumOptions;
    activeTab: EditorTab;
    onTabChange: (tab: EditorTab) => void;
    onTabDirtyChange: (tab: EditorTab, dirty: boolean) => void;
    initialDepth: AnswerDepthLevel | null;
    onInitialDepthConsumed: () => void;
    onSelectChildDepth: (childId: string, depth: AnswerDepthLevel) => void;
    answersDirty: boolean;
}

interface AnswerCount {
    filled: number;
    total: number;
}

function answerCountFor(question: QuestionNode): AnswerCount {
    if (question.question_type === 'group') {
        const counts = aggregateGroupCounts(question);
        return { filled: counts.filled, total: counts.total };
    }
    const filled = DEPTH_ORDER.filter((d) => fillStateFor(question, d) !== 'empty').length;
    return { filled, total: 3 };
}

function contextCount(question: QuestionNode): number {
    return question.question_context_links?.length ?? question.context_links?.length ?? 0;
}

function linkCount(question: QuestionNode): number {
    return (question.topic_links?.length ?? 0) + (question.question_block_links?.length ?? 0);
}

export function CompositeEditor({
    container,
    question,
    enumOptions,
    activeTab,
    onTabChange,
    onTabDirtyChange,
    initialDepth,
    onInitialDepthConsumed,
    onSelectChildDepth,
    answersDirty,
}: CompositeEditorProps) {
    const isGroup = question.question_type === 'group';
    const answerCount = answerCountFor(question);
    const ctxN = contextCount(question);
    const linkN = linkCount(question);
    const isPool = container.kind === 'pool';

    return (
        <div className="flex h-full flex-col bg-background">
            <QuestionHeader container={container} question={question} />

            <Tabs
                value={activeTab}
                onValueChange={(v) => {
                    if (v === 'contexts' && isPool) return;
                    onTabChange(v as EditorTab);
                }}
                className="flex min-h-0 flex-1 flex-col"
            >
                <TabsList className="h-auto justify-start rounded-none border-b border-[var(--border-2)] bg-card px-7 py-0">
                    <TabsTrigger value="question" className="gap-2 px-4 py-3">
                        Question
                    </TabsTrigger>
                    <TabsTrigger
                        value="answers"
                        className={cn('gap-2 px-4 py-3', answersDirty && 'qb-answer-tab--warn')}
                    >
                        {isGroup ? "Children's answers" : 'Answers'}
                        <span className="qb-tab-badge rounded-full bg-[var(--bg-raised)] px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
                            {answerCount.filled}/{answerCount.total}
                        </span>
                    </TabsTrigger>
                    <TabsTrigger value="links" className="gap-2 px-4 py-3">
                        Links
                        {linkN > 0 && (
                            <span className="rounded-full bg-[var(--bg-raised)] px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
                                {linkN}
                            </span>
                        )}
                    </TabsTrigger>
                    <TabsTrigger
                        value="contexts"
                        disabled={isPool}
                        className={cn('gap-2 px-4 py-3', isPool && 'cursor-not-allowed opacity-50')}
                        title={isPool ? 'Contexts live on papers — pools rarely use them' : undefined}
                    >
                        Contexts
                        {isPool ? (
                            <span
                                className="ml-1 font-mono text-[10px] text-[var(--fg-subtle)]"
                            >
                                — pools rarely use
                            </span>
                        ) : (
                            ctxN > 0 && (
                                <span className="rounded-full bg-[var(--bg-raised)] px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
                                    {ctxN}
                                </span>
                            )
                        )}
                    </TabsTrigger>
                </TabsList>

                <div className="min-h-0 flex-1 overflow-y-auto px-7 py-6 pb-16">
                    <TabsContent value="question" className="mt-0">
                        <QuestionTab
                            question={question}
                            enumOptions={enumOptions}
                            onDirtyChange={(d) => onTabDirtyChange('question', d)}
                        />
                    </TabsContent>
                    <TabsContent value="answers" className="mt-0">
                        <AnswersTab
                            question={question}
                            initialDepth={initialDepth}
                            onInitialDepthConsumed={onInitialDepthConsumed}
                            onSelectChildDepth={onSelectChildDepth}
                            onEditOnQuestionTab={() => onTabChange('question')}
                            onDirtyChange={(d) => onTabDirtyChange('answers', d)}
                        />
                    </TabsContent>
                    <TabsContent value="links" className="mt-0">
                        <LinksTab
                            question={question}
                            onDirtyChange={(d) => onTabDirtyChange('links', d)}
                        />
                    </TabsContent>
                    {container.kind === 'paper' && (
                        <TabsContent value="contexts" className="mt-0">
                            <ContextsTab paper={container.paper} question={question} />
                        </TabsContent>
                    )}
                </div>
            </Tabs>
        </div>
    );
}
