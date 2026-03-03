import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { QuestionRenderer } from '@/components/skoolpad/questions';
import { ContentRenderer } from '@/components/shared/content-renderer';
import { nodeToShowcase } from '@/lib/question-node-to-showcase';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { QuestionNode } from '@/types/questions';
import type { RenderableContent } from '@/types/tiptap';

interface PaperQuestionNodeProps {
    node: QuestionNode;
}

function AnswerSection({ answers }: { answers: NonNullable<QuestionNode['answers']> }) {
    const publishedAnswers = answers.filter((a) => a.is_published);
    if (publishedAnswers.length === 0) return null;

    const depthLabels: Record<string, string> = {
        quick: 'Quick',
        standard: 'Standard',
        deep_dive: 'Deep Dive',
    };

    if (publishedAnswers.length === 1) {
        const answer = publishedAnswers[0];
        return (
            <div className="mt-3 rounded-md border border-border/60 bg-accent/30 p-3">
                <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Answer ({depthLabels[answer.depth_level] ?? answer.depth_level})
                </div>
                <ContentRenderer content={answer.content as RenderableContent} className="prose-sm" />
            </div>
        );
    }

    return (
        <div className="mt-3 rounded-md border border-border/60 bg-accent/30 p-3">
            <Tabs defaultValue={publishedAnswers[0].depth_level}>
                <TabsList>
                    {publishedAnswers.map((a) => (
                        <TabsTrigger key={a.id} value={a.depth_level}>
                            {depthLabels[a.depth_level] ?? a.depth_level}
                        </TabsTrigger>
                    ))}
                </TabsList>
                {publishedAnswers.map((a) => (
                    <TabsContent key={a.id} value={a.depth_level}>
                        <ContentRenderer content={a.content as RenderableContent} className="prose-sm" />
                    </TabsContent>
                ))}
            </Tabs>
        </div>
    );
}

function collectLeafAnswers(node: QuestionNode): { questionLabel: string; answers: NonNullable<QuestionNode['answers']> }[] {
    if (node.children.length === 0 && node.answers && node.answers.length > 0) {
        return [{ questionLabel: node.display_label || node.question_number || '', answers: node.answers }];
    }

    return node.children.flatMap(collectLeafAnswers);
}

export function PaperQuestionNode({ node }: PaperQuestionNodeProps) {
    const [isExpanded, setIsExpanded] = useState(true);
    const showcase = nodeToShowcase(node);
    const isLeaf = node.children.length === 0;
    const hasAnswers = isLeaf && node.answers && node.answers.length > 0;

    if (isLeaf) {
        return (
            <div className="rounded-md border border-border/50 bg-card p-3" style={{ borderRadius: 'var(--card-radius)' }}>
                <QuestionRenderer q={showcase} />
                {hasAnswers && <AnswerSection answers={node.answers!} />}
            </div>
        );
    }

    const leafAnswers = collectLeafAnswers(node);

    return (
        <div className="rounded-md border border-border/50 bg-card p-3" style={{ borderRadius: 'var(--card-radius)' }}>
            <button
                type="button"
                onClick={() => setIsExpanded(!isExpanded)}
                className="mb-2 flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
            >
                {isExpanded ? <ChevronDown className="size-3.5" /> : <ChevronRight className="size-3.5" />}
                {node.display_label || node.question_number || 'Question'} ({node.children.length} sub-question{node.children.length !== 1 ? 's' : ''})
            </button>

            <QuestionRenderer q={{ ...showcase, children: [] }} />

            {isExpanded && (
                <div className="mt-3 space-y-3 border-l-2 border-border/40 pl-3">
                    {node.children.map((child) => (
                        <PaperQuestionNode key={child.id} node={child} />
                    ))}
                </div>
            )}

            {leafAnswers.length > 0 && !isExpanded && (
                <p className="mt-2 text-[11px] text-muted-foreground">
                    {leafAnswers.length} answer{leafAnswers.length !== 1 ? 's' : ''} available — expand to view
                </p>
            )}
        </div>
    );
}
