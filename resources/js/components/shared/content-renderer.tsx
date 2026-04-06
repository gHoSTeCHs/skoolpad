import './tiptap-editor.css';

import DOMPurify from 'dompurify';

import { cn } from '@/lib/utils';
import { isTiptapJSON, type RenderableContent } from '@/types/tiptap';

import { MarkdownRenderer } from './markdown-renderer';
import { TiptapRenderer } from './tiptap-renderer';

const HTML_TAG_PATTERN = /<\/?[a-z][\s\S]*?>/i;

interface ContentRendererProps {
    content: RenderableContent;
    className?: string;
}

export function ContentRenderer({ content, className }: ContentRendererProps) {
    if (!content) return null;

    if (isTiptapJSON(content)) {
        return <TiptapRenderer content={content} className={className} />;
    }

    if (typeof content === 'string') {
        if (HTML_TAG_PATTERN.test(content)) {
            return (
                <div
                    className={cn('content-renderer', className)}
                    dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(content) }}
                />
            );
        }

        return <MarkdownRenderer content={content} className={className} />;
    }

    return null;
}
