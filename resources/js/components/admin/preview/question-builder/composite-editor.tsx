import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { QuestionEnumOptions, QuestionPaper, QuestionSection, QuestionNode, AnswerDepthLevel } from '@/types/questions';
import { QuestionHeader } from './question-header';
import { QuestionTab } from './tabs/question-tab';
import { AnswersTab } from './tabs/answers-tab';
import { LinksTab } from './tabs/links-tab';
import { ContextsTab } from './tabs/contexts-tab';

export type EditorTab = 'question' | 'answers' | 'links' | 'contexts';

interface CompositeEditorProps {
    paper: QuestionPaper;
    section: QuestionSection;
    question: QuestionNode;
    enumOptions: QuestionEnumOptions;
    activeTab: EditorTab;
    onTabChange: (tab: EditorTab) => void;
    onTabDirtyChange: (tab: EditorTab, dirty: boolean) => void;
}

const ANSWER_DEPTHS: AnswerDepthLevel[] = ['quick', 'standard', 'deep_dive'];

function answersFilledCount(question: QuestionNode): number {
    if (!question.answers) return 0;
    return ANSWER_DEPTHS.filter((d) => question.answers!.some((a) => a.depth_level === d)).length;
}

function linkCount(question: QuestionNode): number {
    const topicCount = 0;
    const blockCount = 0;
    return topicCount + blockCount;
}

function contextCount(question: QuestionNode): number {
    return question.question_context_links?.length ?? question.context_links?.length ?? 0;
}

export function CompositeEditor({
    paper,
    section,
    question,
    enumOptions,
    activeTab,
    onTabChange,
    onTabDirtyChange,
}: CompositeEditorProps) {
    const answerCount = answersFilledCount(question);
    const linkN = linkCount(question);
    const ctxN = contextCount(question);

    return (
        <div className="flex h-full flex-col bg-background">
            <QuestionHeader paper={paper} section={section} question={question} />

            <Tabs
                value={activeTab}
                onValueChange={(v) => onTabChange(v as EditorTab)}
                className="flex min-h-0 flex-1 flex-col"
            >
                <TabsList className="h-auto justify-start rounded-none border-b border-[var(--border-2)] bg-card px-7 py-0">
                    <TabsTrigger value="question" className="gap-2 px-4 py-3">
                        Question
                    </TabsTrigger>
                    <TabsTrigger value="answers" className="gap-2 px-4 py-3">
                        Answers
                        <span className="rounded-full bg-[var(--bg-raised)] px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
                            {answerCount}/3
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
                    <TabsTrigger value="contexts" className="gap-2 px-4 py-3">
                        Contexts
                        {ctxN > 0 && (
                            <span className="rounded-full bg-[var(--bg-raised)] px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
                                {ctxN}
                            </span>
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
                        <AnswersTab question={question} />
                    </TabsContent>
                    <TabsContent value="links" className="mt-0">
                        <LinksTab question={question} />
                    </TabsContent>
                    <TabsContent value="contexts" className="mt-0">
                        <ContextsTab question={question} />
                    </TabsContent>
                </div>
            </Tabs>
        </div>
    );
}
