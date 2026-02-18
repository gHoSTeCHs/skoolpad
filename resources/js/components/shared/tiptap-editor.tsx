import './tiptap-editor.css';

import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Mathematics from '@tiptap/extension-mathematics';
import Placeholder from '@tiptap/extension-placeholder';
import { Table } from '@tiptap/extension-table';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import TableRow from '@tiptap/extension-table-row';
import Underline from '@tiptap/extension-underline';
import {
    type Editor,
    EditorContent,
    useEditor,
    useEditorState,
} from '@tiptap/react';
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
import {
    ArrowDownToLine,
    ArrowLeftToLine,
    ArrowRightToLine,
    ArrowUpToLine,
    Bold,
    Code,
    CodeXml,
    Heading1,
    Heading2,
    Heading3,
    ImagePlus,
    Italic,
    Link as LinkIcon,
    List,
    ListOrdered,
    Minus,
    Pilcrow,
    Quote,
    Redo2,
    Strikethrough,
    TableIcon,
    Trash2,
    Underline as UnderlineIcon,
    Undo2,
    Upload,
} from 'lucide-react';
import { createLowlight } from 'lowlight';
import {
    type FormEvent,
    type ReactNode,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import type { TiptapJSON } from '@/types/tiptap';

const lowlight = createLowlight();
lowlight.register({
    javascript,
    typescript,
    php,
    python,
    bash,
    sql,
    json,
    xml,
    css,
});

interface TiptapEditorProps {
    value: TiptapJSON | null;
    onChange: (json: TiptapJSON, plainText: string) => void;
    placeholder?: string;
    onImageUpload?: (file: File) => Promise<string>;
    className?: string;
    disabled?: boolean;
}

export function TiptapEditor({
    value,
    onChange,
    placeholder,
    onImageUpload,
    className,
    disabled = false,
}: TiptapEditorProps) {
    const { t } = useTranslation();
    const lastEmittedJson = useRef<TiptapJSON | null>(value);
    const [linkDialogOpen, setLinkDialogOpen] = useState(false);
    const [imageDialogOpen, setImageDialogOpen] = useState(false);

    const extensions = useMemo(
        () => [
            StarterKit.configure({ codeBlock: false }),
            Underline,
            Link.configure({
                openOnClick: false,
                HTMLAttributes: { class: 'tiptap-link' },
            }),
            Image.configure({ inline: false, allowBase64: false }),
            Table.configure({ resizable: true }),
            TableRow,
            TableHeader,
            TableCell,
            CodeBlockLowlight.configure({ lowlight }),
            Placeholder.configure({
                placeholder: placeholder ?? t('editor.placeholder'),
            }),
            Mathematics,
        ],
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [placeholder],
    );

    const editor = useEditor({
        extensions,
        editable: !disabled,
        content: value ?? undefined,
        onUpdate({ editor: ed }) {
            const json = ed.getJSON() as TiptapJSON;
            lastEmittedJson.current = json;
            onChange(json, ed.getText());
        },
    });

    useEffect(() => {
        if (!editor || !value) return;
        if (value === lastEmittedJson.current) return;
        editor.commands.setContent(value);
    }, [editor, value]);

    useEffect(() => {
        if (editor) {
            editor.setEditable(!disabled);
        }
    }, [editor, disabled]);

    if (!editor) return null;

    return (
        <div
            className={cn(
                'tiptap-editor overflow-hidden rounded-lg border border-border bg-card',
                disabled && 'opacity-60',
                className,
            )}
        >
            <EditorToolbar
                editor={editor}
                disabled={disabled}
                onLinkClick={() => setLinkDialogOpen(true)}
                onImageClick={() => setImageDialogOpen(true)}
            />
            <div className="min-h-[400px] px-4 py-3">
                <EditorContent editor={editor} />
            </div>
            <LinkDialog
                editor={editor}
                open={linkDialogOpen}
                onOpenChange={setLinkDialogOpen}
            />
            <ImageDialog
                editor={editor}
                open={imageDialogOpen}
                onOpenChange={setImageDialogOpen}
                onImageUpload={onImageUpload}
            />
        </div>
    );
}

interface ToolbarButtonProps {
    icon: ReactNode;
    label: string;
    onClick: () => void;
    active?: boolean;
    disabled?: boolean;
}

function ToolbarButton({
    icon,
    label,
    onClick,
    active = false,
    disabled = false,
}: ToolbarButtonProps) {
    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <button
                    type="button"
                    onClick={onClick}
                    disabled={disabled}
                    data-active={active}
                    className="flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-50 data-[active=true]:bg-accent data-[active=true]:text-accent-foreground"
                >
                    {icon}
                </button>
            </TooltipTrigger>
            <TooltipContent>{label}</TooltipContent>
        </Tooltip>
    );
}

function ToolbarDivider() {
    return <div className="mx-0.5 h-6 w-px bg-border" />;
}

interface EditorToolbarProps {
    editor: Editor;
    disabled: boolean;
    onLinkClick: () => void;
    onImageClick: () => void;
}

function EditorToolbar({
    editor,
    disabled,
    onLinkClick,
    onImageClick,
}: EditorToolbarProps) {
    const { t } = useTranslation();
    const iconSize = 'size-4';

    const state = useEditorState({
        editor,
        selector: ({ editor: e }) => ({
            canUndo: e.can().undo(),
            canRedo: e.can().redo(),
            isParagraph: e.isActive('paragraph'),
            isH1: e.isActive('heading', { level: 1 }),
            isH2: e.isActive('heading', { level: 2 }),
            isH3: e.isActive('heading', { level: 3 }),
            isBold: e.isActive('bold'),
            isItalic: e.isActive('italic'),
            isUnderline: e.isActive('underline'),
            isStrike: e.isActive('strike'),
            isCode: e.isActive('code'),
            isBulletList: e.isActive('bulletList'),
            isOrderedList: e.isActive('orderedList'),
            isBlockquote: e.isActive('blockquote'),
            isCodeBlock: e.isActive('codeBlock'),
            isLink: e.isActive('link'),
            isTable: e.isActive('table'),
        }),
    });

    return (
        <div className="flex flex-wrap items-center gap-0.5 border-b border-border bg-muted/30 px-2 py-1.5">
            <ToolbarButton
                icon={<Undo2 className={iconSize} />}
                label={t('Undo')}
                onClick={() => editor.chain().focus().undo().run()}
                disabled={disabled || !state.canUndo}
            />
            <ToolbarButton
                icon={<Redo2 className={iconSize} />}
                label={t('Redo')}
                onClick={() => editor.chain().focus().redo().run()}
                disabled={disabled || !state.canRedo}
            />

            <ToolbarDivider />

            <ToolbarButton
                icon={<Pilcrow className={iconSize} />}
                label={t('Paragraph')}
                onClick={() => editor.chain().focus().setParagraph().run()}
                active={state.isParagraph}
                disabled={disabled}
            />
            <ToolbarButton
                icon={<Heading1 className={iconSize} />}
                label={t('Heading 1')}
                onClick={() =>
                    editor.chain().focus().toggleHeading({ level: 1 }).run()
                }
                active={state.isH1}
                disabled={disabled}
            />
            <ToolbarButton
                icon={<Heading2 className={iconSize} />}
                label={t('Heading 2')}
                onClick={() =>
                    editor.chain().focus().toggleHeading({ level: 2 }).run()
                }
                active={state.isH2}
                disabled={disabled}
            />
            <ToolbarButton
                icon={<Heading3 className={iconSize} />}
                label={t('Heading 3')}
                onClick={() =>
                    editor.chain().focus().toggleHeading({ level: 3 }).run()
                }
                active={state.isH3}
                disabled={disabled}
            />

            <ToolbarDivider />

            <ToolbarButton
                icon={<Bold className={iconSize} />}
                label={t('Bold')}
                onClick={() => editor.chain().focus().toggleBold().run()}
                active={state.isBold}
                disabled={disabled}
            />
            <ToolbarButton
                icon={<Italic className={iconSize} />}
                label={t('Italic')}
                onClick={() => editor.chain().focus().toggleItalic().run()}
                active={state.isItalic}
                disabled={disabled}
            />
            <ToolbarButton
                icon={<UnderlineIcon className={iconSize} />}
                label={t('Underline')}
                onClick={() => editor.chain().focus().toggleUnderline().run()}
                active={state.isUnderline}
                disabled={disabled}
            />
            <ToolbarButton
                icon={<Strikethrough className={iconSize} />}
                label={t('Strikethrough')}
                onClick={() => editor.chain().focus().toggleStrike().run()}
                active={state.isStrike}
                disabled={disabled}
            />
            <ToolbarButton
                icon={<Code className={iconSize} />}
                label={t('Inline Code')}
                onClick={() => editor.chain().focus().toggleCode().run()}
                active={state.isCode}
                disabled={disabled}
            />

            <ToolbarDivider />

            <ToolbarButton
                icon={<List className={iconSize} />}
                label={t('Bullet List')}
                onClick={() => editor.chain().focus().toggleBulletList().run()}
                active={state.isBulletList}
                disabled={disabled}
            />
            <ToolbarButton
                icon={<ListOrdered className={iconSize} />}
                label={t('Ordered List')}
                onClick={() => editor.chain().focus().toggleOrderedList().run()}
                active={state.isOrderedList}
                disabled={disabled}
            />
            <ToolbarButton
                icon={<Quote className={iconSize} />}
                label={t('Blockquote')}
                onClick={() => editor.chain().focus().toggleBlockquote().run()}
                active={state.isBlockquote}
                disabled={disabled}
            />
            <ToolbarButton
                icon={<CodeXml className={iconSize} />}
                label={t('Code Block')}
                onClick={() => editor.chain().focus().toggleCodeBlock().run()}
                active={state.isCodeBlock}
                disabled={disabled}
            />
            <ToolbarButton
                icon={<Minus className={iconSize} />}
                label={t('Horizontal Rule')}
                onClick={() => editor.chain().focus().setHorizontalRule().run()}
                disabled={disabled}
            />

            <ToolbarDivider />

            <ToolbarButton
                icon={<LinkIcon className={iconSize} />}
                label={t('Link')}
                onClick={onLinkClick}
                active={state.isLink}
                disabled={disabled}
            />
            <ToolbarButton
                icon={<ImagePlus className={iconSize} />}
                label={t('Image')}
                onClick={onImageClick}
                disabled={disabled}
            />
            <ToolbarButton
                icon={<TableIcon className={iconSize} />}
                label={t('Table')}
                onClick={() =>
                    editor
                        .chain()
                        .focus()
                        .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
                        .run()
                }
                disabled={disabled}
            />

            {state.isTable && (
                <>
                    <ToolbarDivider />
                    <ToolbarButton
                        icon={<ArrowLeftToLine className={iconSize} />}
                        label={t('Add Column Before')}
                        onClick={() =>
                            editor.chain().focus().addColumnBefore().run()
                        }
                        disabled={disabled}
                    />
                    <ToolbarButton
                        icon={<ArrowRightToLine className={iconSize} />}
                        label={t('Add Column After')}
                        onClick={() =>
                            editor.chain().focus().addColumnAfter().run()
                        }
                        disabled={disabled}
                    />
                    <ToolbarButton
                        icon={<ArrowUpToLine className={iconSize} />}
                        label={t('Add Row Before')}
                        onClick={() =>
                            editor.chain().focus().addRowBefore().run()
                        }
                        disabled={disabled}
                    />
                    <ToolbarButton
                        icon={<ArrowDownToLine className={iconSize} />}
                        label={t('Add Row After')}
                        onClick={() =>
                            editor.chain().focus().addRowAfter().run()
                        }
                        disabled={disabled}
                    />
                    <ToolbarButton
                        icon={<Trash2 className={iconSize} />}
                        label={t('Delete Table')}
                        onClick={() =>
                            editor.chain().focus().deleteTable().run()
                        }
                        disabled={disabled}
                    />
                </>
            )}
        </div>
    );
}

function LinkDialog({
    editor,
    open,
    onOpenChange,
}: {
    editor: Editor;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}) {
    const { t } = useTranslation();
    const [url, setUrl] = useState('');
    const isEditing = editor.isActive('link');

    useEffect(() => {
        if (open) {
            setUrl(editor.getAttributes('link').href ?? '');
        }
    }, [open, editor]);

    function handleSubmit(e: FormEvent) {
        e.preventDefault();
        if (url === '') {
            editor.chain().focus().unsetLink().run();
        } else {
            editor.chain().focus().setLink({ href: url }).run();
        }
        onOpenChange(false);
    }

    function handleRemove() {
        editor.chain().focus().unsetLink().run();
        onOpenChange(false);
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>
                        {isEditing ? t('Edit Link') : t('Insert Link')}
                    </DialogTitle>
                    <DialogDescription>
                        {t('Enter a URL to create a hyperlink.')}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="link-url">{t('URL')}</Label>
                        <Input
                            id="link-url"
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            placeholder="https://"
                            autoFocus
                        />
                    </div>
                    <DialogFooter className="gap-2 sm:gap-0">
                        {isEditing && (
                            <Button
                                type="button"
                                variant="destructive"
                                onClick={handleRemove}
                            >
                                {t('Remove Link')}
                            </Button>
                        )}
                        <Button type="submit">
                            {isEditing ? t('Update Link') : t('Insert Link')}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

function ImageDialog({
    editor,
    open,
    onOpenChange,
    onImageUpload,
}: {
    editor: Editor;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onImageUpload?: (file: File) => Promise<string>;
}) {
    const { t } = useTranslation();
    const [url, setUrl] = useState('');
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (open) {
            setUrl('');
            setUploading(false);
        }
    }, [open]);

    function handleSubmit(e: FormEvent) {
        e.preventDefault();
        if (url) {
            editor.chain().focus().setImage({ src: url }).run();
            onOpenChange(false);
        }
    }

    async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file || !onImageUpload) return;
        setUploading(true);
        try {
            const uploadedUrl = await onImageUpload(file);
            editor.chain().focus().setImage({ src: uploadedUrl }).run();
            onOpenChange(false);
        } finally {
            setUploading(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>{t('Insert Image')}</DialogTitle>
                    <DialogDescription>
                        {t('Insert an image from a URL or upload a file.')}
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                    {onImageUpload && (
                        <>
                            <div className="space-y-2">
                                <Label>{t('Upload')}</Label>
                                <div>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        disabled={uploading}
                                        onClick={() =>
                                            fileInputRef.current?.click()
                                        }
                                    >
                                        <Upload className="size-4" />
                                        {uploading
                                            ? t('Uploading...')
                                            : t('Choose File')}
                                    </Button>
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={handleFileChange}
                                    />
                                </div>
                            </div>
                            <div className="relative">
                                <div className="absolute inset-0 flex items-center">
                                    <span className="w-full border-t border-border" />
                                </div>
                                <div className="relative flex justify-center text-xs uppercase">
                                    <span className="bg-background px-2 text-muted-foreground">
                                        {t('or')}
                                    </span>
                                </div>
                            </div>
                        </>
                    )}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="image-url">{t('Image URL')}</Label>
                            <Input
                                id="image-url"
                                value={url}
                                onChange={(e) => setUrl(e.target.value)}
                                placeholder="https://"
                                autoFocus={!onImageUpload}
                            />
                        </div>
                        <DialogFooter>
                            <Button type="submit" disabled={!url}>
                                {t('Insert Image')}
                            </Button>
                        </DialogFooter>
                    </form>
                </div>
            </DialogContent>
        </Dialog>
    );
}
