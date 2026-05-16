import { createStore } from 'zustand/vanilla';
import type { QuestionPaper } from '@/types/questions';
import { currentLevelQuestions, findQuestion } from '../lib/drill';

export type Col1Mode = 'sections' | 'contexts';
export type InspectorTab = 'links' | 'contexts' | 'ai' | 'history';

type ResetCallback = () => void;

export type PendingNav =
    | { kind: 'selectSection'; sectionId: string }
    | { kind: 'selectQuestion'; questionId: string }
    | { kind: 'drillTo'; questionId: string }
    | { kind: 'popDrillTo'; index: number }
    | { kind: 'activateContexts' };

export interface QuestionBuilderV4State {
    paper: QuestionPaper;
    col1Mode: Col1Mode;
    activeSectionId: string | null;
    /** Ancestor question IDs, deepest last. Each entry is a group-question that has been drilled into. */
    drillPath: string[];
    selectedQuestionId: string | null;
    inspectorTab: InspectorTab | null;

    /** Dirty contract — surfaces register here on mount and unregister on unmount. */
    dirtyRegistry: Record<string, boolean>;
    resetCallbacks: Record<string, ResetCallback>;
    /** Nav request held while any surface is dirty; the AlertDialog resolves it. */
    pendingNav: PendingNav | null;
    /** Incremented whenever the save bar asks the active form(s) to submit. */
    saveRequestNonce: number;

    // primitives (always applied; used by confirmDiscard + bootstrap)
    selectSection: (sectionId: string) => void;
    activateContexts: () => void;
    selectQuestion: (id: string) => void;
    drillTo: (id: string) => void;
    popDrillTo: (index: number) => void;

    // gated wrappers (use these from components — they respect the dirty contract)
    requestSelectSection: (sectionId: string) => void;
    requestActivateContexts: () => void;
    requestSelectQuestion: (id: string) => void;
    requestDrillTo: (id: string) => void;
    requestPopDrillTo: (index: number) => void;

    // dirty contract
    registerDirty: (key: string, isDirty: boolean, reset: ResetCallback) => void;
    unregisterDirty: (key: string) => void;
    confirmDiscard: () => void;
    cancelDiscard: () => void;

    // inspector + save
    setInspectorTab: (tab: InspectorTab | null) => void;
    requestSave: () => void;
}

export function selectIsAnyDirty(state: QuestionBuilderV4State): boolean {
    return Object.values(state.dirtyRegistry).some(Boolean);
}

export function selectDirtyKeys(state: QuestionBuilderV4State): string[] {
    return Object.entries(state.dirtyRegistry)
        .filter(([, dirty]) => dirty)
        .map(([key]) => key);
}

export function createQuestionBuilderV4Store(paper: QuestionPaper) {
    const firstSection = paper.sections[0] ?? null;
    return createStore<QuestionBuilderV4State>((set, get) => {
        function applyNav(nav: PendingNav): void {
            const s = get();
            switch (nav.kind) {
                case 'selectSection':
                    s.selectSection(nav.sectionId);
                    break;
                case 'selectQuestion':
                    s.selectQuestion(nav.questionId);
                    break;
                case 'drillTo':
                    s.drillTo(nav.questionId);
                    break;
                case 'popDrillTo':
                    s.popDrillTo(nav.index);
                    break;
                case 'activateContexts':
                    s.activateContexts();
                    break;
            }
        }

        function gate(nav: PendingNav, run: () => void): void {
            if (selectIsAnyDirty(get())) {
                set({ pendingNav: nav });
                return;
            }
            run();
        }

        return {
            paper,
            col1Mode: 'sections',
            activeSectionId: firstSection?.id ?? null,
            drillPath: [],
            selectedQuestionId: firstSection?.questions[0]?.id ?? null,
            inspectorTab: null,

            dirtyRegistry: {},
            resetCallbacks: {},
            pendingNav: null,
            saveRequestNonce: 0,

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

            requestSelectSection: (sectionId) =>
                gate({ kind: 'selectSection', sectionId }, () => get().selectSection(sectionId)),

            requestActivateContexts: () =>
                gate({ kind: 'activateContexts' }, () => get().activateContexts()),

            requestSelectQuestion: (id) =>
                gate({ kind: 'selectQuestion', questionId: id }, () => get().selectQuestion(id)),

            requestDrillTo: (id) =>
                gate({ kind: 'drillTo', questionId: id }, () => get().drillTo(id)),

            requestPopDrillTo: (index) =>
                gate({ kind: 'popDrillTo', index }, () => get().popDrillTo(index)),

            registerDirty: (key, isDirty, reset) =>
                set((s) => ({
                    dirtyRegistry:
                        s.dirtyRegistry[key] === isDirty
                            ? s.dirtyRegistry
                            : { ...s.dirtyRegistry, [key]: isDirty },
                    resetCallbacks: { ...s.resetCallbacks, [key]: reset },
                })),

            unregisterDirty: (key) =>
                set((s) => {
                    const dirtyRegistry = { ...s.dirtyRegistry };
                    const resetCallbacks = { ...s.resetCallbacks };
                    delete dirtyRegistry[key];
                    delete resetCallbacks[key];
                    return { dirtyRegistry, resetCallbacks };
                }),

            confirmDiscard: () => {
                const { pendingNav, resetCallbacks } = get();
                Object.values(resetCallbacks).forEach((reset) => reset());
                set({ pendingNav: null, dirtyRegistry: {}, resetCallbacks: {} });
                if (pendingNav) applyNav(pendingNav);
            },

            cancelDiscard: () => set({ pendingNav: null }),

            setInspectorTab: (tab) => {
                set((s) => ({ inspectorTab: s.inspectorTab === tab ? null : tab }));
            },

            requestSave: () => set((s) => ({ saveRequestNonce: s.saveRequestNonce + 1 })),
        };
    });
}

export type QuestionBuilderV4Store = ReturnType<typeof createQuestionBuilderV4Store>;
