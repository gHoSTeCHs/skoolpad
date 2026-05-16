import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';

import { DiagramNodeView } from './diagram-node-view';

export type DiagramKind = 'free_form' | 'circuit' | 'force_diagram' | 'flowchart' | 'graph';

export interface DiagramAttrs {
    assetId: string | null;
    caption: string;
    altText: string;
    kind: DiagramKind;
}

/**
 * Identifies the entity any newly-saved diagram attaches to.
 * Surfaces (Content Studio block editor, question stem editor, etc.) set this
 * via `editor.storage.diagram.owner = {...}` before mounting. CP3 reads this
 * at save time to populate the asset's owner FK.
 */
export type DiagramOwner =
    | { kind: 'content_block'; id: string }
    | { kind: 'question'; id: string }
    | { kind: 'question_paper'; id: string };

export interface DiagramStorage {
    owner: DiagramOwner | null;
}

declare module '@tiptap/core' {
    interface Commands<ReturnType> {
        diagram: {
            insertDiagram: (attrs?: Partial<DiagramAttrs>) => ReturnType;
        };
    }
    interface Storage {
        diagram?: DiagramStorage;
    }
}

export const DiagramNode = Node.create({
    name: 'diagram',
    group: 'block',
    atom: true,
    selectable: true,
    draggable: true,

    addAttributes() {
        return {
            assetId: {
                default: null as string | null,
                parseHTML: (el) => el.getAttribute('data-asset-id') || null,
                renderHTML: (attrs) =>
                    attrs.assetId ? { 'data-asset-id': attrs.assetId } : {},
            },
            caption: {
                default: '',
                parseHTML: (el) => el.getAttribute('data-caption') || '',
                renderHTML: (attrs) =>
                    attrs.caption ? { 'data-caption': attrs.caption } : {},
            },
            altText: {
                default: '',
                parseHTML: (el) => el.getAttribute('data-alt-text') || '',
                renderHTML: (attrs) =>
                    attrs.altText ? { 'data-alt-text': attrs.altText } : {},
            },
            kind: {
                default: 'free_form' as DiagramKind,
                parseHTML: (el) =>
                    (el.getAttribute('data-kind') as DiagramKind) || 'free_form',
                renderHTML: (attrs) => ({ 'data-kind': attrs.kind }),
            },
        };
    },

    parseHTML() {
        return [{ tag: 'div[data-diagram]' }];
    },

    renderHTML({ HTMLAttributes }) {
        return ['div', mergeAttributes(HTMLAttributes, { 'data-diagram': '' })];
    },

    addStorage(): DiagramStorage {
        return { owner: null };
    },

    addNodeView() {
        return ReactNodeViewRenderer(DiagramNodeView);
    },

    addCommands() {
        return {
            insertDiagram:
                (attrs = {}) =>
                ({ commands }) =>
                    commands.insertContent({
                        type: this.name,
                        attrs: {
                            assetId: attrs.assetId ?? null,
                            caption: attrs.caption ?? '',
                            altText: attrs.altText ?? '',
                            kind: attrs.kind ?? 'free_form',
                        },
                    }),
        };
    },
});
