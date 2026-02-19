import './tiptap-editor.css';

import { generateHTML } from '@tiptap/core';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Mathematics from '@tiptap/extension-mathematics';
import { Table, TableCell, TableHeader, TableRow } from '@tiptap/extension-table';
import Underline from '@tiptap/extension-underline';
import StarterKit from '@tiptap/starter-kit';
import bash from 'highlight.js/lib/languages/bash';
import css from 'highlight.js/lib/languages/css';
import javascript from 'highlight.js/lib/languages/javascript';
import json from 'highlight.js/lib/languages/json';
import php from 'highlight.js/lib/languages/php';
import python from 'highlight.js/lib/languages/python';
import sql from 'highlight.js/lib/languages/sql';
import typescript from 'highlight.js/lib/languages/typescript';
import xml from 'highlight.js/lib/languages/xml';
import { createLowlight } from 'lowlight';
import { useMemo } from 'react';

import { cn } from '@/lib/utils';
import type { TiptapJSON } from '@/types/tiptap';

const lowlight = createLowlight();
lowlight.register({ javascript, typescript, php, python, bash, sql, json, xml, css });

const extensions = [
    StarterKit.configure({ codeBlock: false, link: false, underline: false }),
    Underline,
    Link.configure({ openOnClick: true, HTMLAttributes: { class: 'tiptap-link' } }),
    Image.configure({ inline: false, allowBase64: false }),
    Table.configure({ resizable: false }),
    TableRow,
    TableHeader,
    TableCell,
    CodeBlockLowlight.configure({ lowlight }),
    Mathematics,
];

interface TiptapRendererProps {
    content: TiptapJSON | null;
    className?: string;
}

export function TiptapRenderer({ content, className }: TiptapRendererProps) {
    const html = useMemo(() => {
        if (!content) return '';
        try {
            return generateHTML(content, extensions);
        } catch {
            return '';
        }
    }, [content]);

    if (!content || !html) return null;

    return (
        <div
            className={cn('tiptap-editor', className)}
            dangerouslySetInnerHTML={{ __html: html }}
        />
    );
}
