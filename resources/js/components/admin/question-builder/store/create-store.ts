import { createStore } from 'zustand/vanilla';
import type { AnswerDepthLevel } from '@/types/questions';
import type { SelectedNode } from '../paper-tree';
import type { EditorTab } from '../composite-editor';

export type PendingNav =
    | { kind: 'selection'; target: SelectedNode | null }
    | { kind: 'tab'; target: EditorTab };

type ResetCallback = () => void;

/**
 * UI-state-only store for one question-builder instance (paper or pool).
 * Server data (the paper / pool tree) stays as Inertia props — this store owns
 * selection, the active tab, pending navigation, and the dirty registry that
 * every editable surface registers into via useDirtyRegistration.
 */
export interface QuestionBuilderState {
    selectedNode: SelectedNode | null;
    activeTab: EditorTab;
    pendingDepth: AnswerDepthLevel | null;
    pendingNav: PendingNav | null;
    dirtyRegistry: Record<string, boolean>;
    resetCallbacks: Record<string, ResetCallback>;

    requestSelection: (next: SelectedNode | null) => void;
    requestTabChange: (next: EditorTab) => void;
    confirmDiscard: () => void;
    cancelDiscard: () => void;
    registerDirty: (key: string, isDirty: boolean, reset: ResetCallback) => void;
    unregisterDirty: (key: string) => void;
    selectChildDepth: (childId: string, depth: AnswerDepthLevel) => void;
    consumeInitialDepth: () => void;
    /** Select a freshly-created question, clearing dirty state — the draft is now persisted. */
    selectCreatedQuestion: (id: string) => void;
}

export function selectIsAnyDirty(state: QuestionBuilderState): boolean {
    return Object.values(state.dirtyRegistry).some(Boolean);
}

/** True when any answer-depth surface is dirty (keys `answers` or `answers:*`). */
export function selectAnswersDirty(state: QuestionBuilderState): boolean {
    return Object.entries(state.dirtyRegistry).some(
        ([key, dirty]) => dirty && (key === 'answers' || key.startsWith('answers:')),
    );
}

function sameSelection(a: SelectedNode | null, b: SelectedNode | null): boolean {
    if (a === b) return true;
    if (a === null || b === null) return false;
    if (a.type !== b.type) return false;
    if (a.type === 'draft' || b.type === 'draft') return false;
    return a.id === b.id;
}

export function createQuestionBuilderStore(initialSelectedNode: SelectedNode | null) {
    return createStore<QuestionBuilderState>((set, get) => ({
        selectedNode: initialSelectedNode,
        activeTab: 'question',
        pendingDepth: null,
        pendingNav: null,
        dirtyRegistry: {},
        resetCallbacks: {},

        requestSelection: (next) => {
            if (sameSelection(next, get().selectedNode)) return;
            if (selectIsAnyDirty(get())) {
                set({ pendingNav: { kind: 'selection', target: next } });
                return;
            }
            set(
                next?.type === 'draft'
                    ? { selectedNode: next, activeTab: 'question' }
                    : { selectedNode: next },
            );
        },

        requestTabChange: (next) => {
            if (next === get().activeTab) return;
            if (selectIsAnyDirty(get())) {
                set({ pendingNav: { kind: 'tab', target: next } });
                return;
            }
            set({ activeTab: next });
        },

        confirmDiscard: () => {
            const { pendingNav, resetCallbacks } = get();
            Object.values(resetCallbacks).forEach((reset) => reset());
            const patch: Partial<QuestionBuilderState> = {
                pendingNav: null,
                dirtyRegistry: {},
                resetCallbacks: {},
            };
            if (pendingNav?.kind === 'selection') {
                patch.selectedNode = pendingNav.target;
                if (pendingNav.target?.type === 'draft') {
                    patch.activeTab = 'question';
                }
            }
            if (pendingNav?.kind === 'tab') {
                patch.activeTab = pendingNav.target;
            }
            set(patch);
        },

        cancelDiscard: () => set({ pendingNav: null }),

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

        selectChildDepth: (childId, depth) =>
            set({
                selectedNode: { type: 'question', id: childId },
                activeTab: 'answers',
                pendingDepth: depth,
            }),

        consumeInitialDepth: () => set({ pendingDepth: null }),

        selectCreatedQuestion: (id) =>
            set({
                selectedNode: { type: 'question', id },
                activeTab: 'question',
                pendingNav: null,
                dirtyRegistry: {},
                resetCallbacks: {},
            }),
    }));
}

export type QuestionBuilderStore = ReturnType<typeof createQuestionBuilderStore>;
