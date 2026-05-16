import { createStore } from 'zustand/vanilla';
import type { QuestionPaper } from '@/types/questions';
import { currentLevelQuestions, findQuestion } from '../lib/drill';

export type Col1Mode = 'sections' | 'contexts';
export type InspectorTab = 'links' | 'contexts' | 'ai' | 'history';

export interface QuestionBuilderV4State {
    paper: QuestionPaper;
    col1Mode: Col1Mode;
    activeSectionId: string | null;
    /** Ancestor question IDs, deepest last. Each entry is a group-question that has been drilled into. */
    drillPath: string[];
    selectedQuestionId: string | null;
    inspectorTab: InspectorTab | null;

    selectSection: (sectionId: string) => void;
    activateContexts: () => void;
    /** Click on a question card: drills if group, selects if leaf. */
    selectQuestion: (questionId: string) => void;
    /** Explicit drill-in (used by the chevron). */
    drillTo: (questionId: string) => void;
    /** Pop drillPath back to the given crumb index. 0 = section root. */
    popDrillTo: (index: number) => void;
    setInspectorTab: (tab: InspectorTab | null) => void;
}

export function createQuestionBuilderV4Store(paper: QuestionPaper) {
    const firstSection = paper.sections[0] ?? null;
    return createStore<QuestionBuilderV4State>((set, get) => ({
        paper,
        col1Mode: 'sections',
        activeSectionId: firstSection?.id ?? null,
        drillPath: [],
        selectedQuestionId: firstSection?.questions[0]?.id ?? null,
        inspectorTab: null,

        selectSection: (sectionId) => {
            const section = get().paper.sections.find((s) => s.id === sectionId);
            set({
                col1Mode: 'sections',
                activeSectionId: sectionId,
                drillPath: [],
                selectedQuestionId: section?.questions[0]?.id ?? null,
            });
        },

        activateContexts: () =>
            set({
                col1Mode: 'contexts',
                drillPath: [],
                selectedQuestionId: null,
            }),

        selectQuestion: (questionId) => {
            const q = findQuestion(get().paper, questionId);
            if (!q) return;
            if (q.children.length > 0) {
                set((s) => ({
                    drillPath: [...s.drillPath, questionId],
                    selectedQuestionId: q.children[0]?.id ?? null,
                }));
            } else {
                set({ selectedQuestionId: questionId });
            }
        },

        drillTo: (questionId) => {
            const q = findQuestion(get().paper, questionId);
            if (!q) return;
            set((s) => ({
                drillPath: [...s.drillPath, questionId],
                selectedQuestionId: q.children[0]?.id ?? null,
            }));
        },

        popDrillTo: (index) => {
            set((s) => {
                const newPath = s.drillPath.slice(0, index);
                const items = currentLevelQuestions(s.paper, s.activeSectionId, newPath);
                return {
                    drillPath: newPath,
                    selectedQuestionId: items[0]?.id ?? null,
                };
            });
        },

        setInspectorTab: (tab) => {
            set((s) => ({ inspectorTab: s.inspectorTab === tab ? null : tab }));
        },
    }));
}

export type QuestionBuilderV4Store = ReturnType<typeof createQuestionBuilderV4Store>;
