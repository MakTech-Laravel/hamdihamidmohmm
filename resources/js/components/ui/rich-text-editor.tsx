import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import TextAlign from '@tiptap/extension-text-align';
import { FontSize, TextStyle } from '@tiptap/extension-text-style';
import Underline from '@tiptap/extension-underline';
import {
    AlignCenter,
    AlignLeft,
    AlignRight,
    Bold,
    Italic,
    List,
    ListOrdered,
    Redo2,
    Underline as UnderlineIcon,
    Undo2,
} from 'lucide-react';
import { useEffect, type ReactNode } from 'react';

import { cn } from '@/lib/utils';

const FONT_SIZES = [
    { label: 'S', value: '14px' },
    { label: 'M', value: '16px' },
    { label: 'L', value: '18px' },
    { label: 'XL', value: '22px' },
] as const;

type RichTextEditorProps = {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
};

export function RichTextEditor({
    value,
    onChange,
    placeholder,
    className,
}: RichTextEditorProps) {
    const editor = useEditor({
        immediatelyRender: false,
        extensions: [
            StarterKit.configure({
                heading: {
                    levels: [2, 3],
                },
                bold: {
                    HTMLAttributes: {
                        class: 'font-bold',
                    },
                },
                italic: {
                    HTMLAttributes: {
                        class: 'italic',
                    },
                },
            }),
            Underline.configure({
                HTMLAttributes: {
                    class: 'underline',
                },
            }),
            TextStyle,
            FontSize,
            TextAlign.configure({
                types: ['heading', 'paragraph'],
            }),
            Placeholder.configure({
                placeholder: placeholder ?? '',
            }),
        ],
        content: value || '',
        editorProps: {
            attributes: {
                class: 'tiptap min-h-[160px] px-3 py-3 text-sm leading-6 text-[#050315] outline-none focus:outline-none [&_ul]:list-disc [&_ul]:ps-5 [&_ol]:list-decimal [&_ol]:ps-5 [&_p]:mb-2 [&_p:last-child]:mb-0 [&_strong]:font-bold [&_b]:font-bold [&_em]:italic [&_i]:italic [&_u]:underline',
            },
        },
        onUpdate: ({ editor: current }) => {
            const html = current.getHTML();
            onChange(isEditorEmpty(html) ? '' : html);
        },
    });

    useEffect(() => {
        if (!editor) {
            return;
        }

        const current = editor.getHTML();
        const incoming = value || '';

        if (normalizeHtml(current) !== normalizeHtml(incoming)) {
            editor.commands.setContent(incoming, { emitUpdate: false });
        }
    }, [editor, value]);

    if (!editor) {
        return null;
    }

    const activeFontSize =
        (editor.getAttributes('textStyle').fontSize as string | undefined) ??
        '';

    return (
        <div
            className={cn(
                'mt-1 overflow-hidden rounded-xl border border-[#e8d5e8] bg-[#f8faff] focus-within:border-[#0057c8]',
                className,
            )}
        >
            <div className="flex flex-wrap items-center gap-1 border-b border-[#e8d5e8] bg-white px-2 py-1.5">
                <ToolbarButton
                    label="Bold"
                    active={editor.isActive('bold')}
                    onClick={() => editor.chain().focus().toggleBold().run()}
                >
                    <Bold className="size-4" />
                </ToolbarButton>
                <ToolbarButton
                    label="Italic"
                    active={editor.isActive('italic')}
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                >
                    <Italic className="size-4" />
                </ToolbarButton>
                <ToolbarButton
                    label="Underline"
                    active={editor.isActive('underline')}
                    onClick={() =>
                        editor.chain().focus().toggleUnderline().run()
                    }
                >
                    <UnderlineIcon className="size-4" />
                </ToolbarButton>

                <ToolbarDivider />

                {FONT_SIZES.map((size) => (
                    <ToolbarButton
                        key={size.value}
                        label={`Size ${size.label}`}
                        active={activeFontSize === size.value}
                        onClick={() =>
                            editor
                                .chain()
                                .focus()
                                .setFontSize(size.value)
                                .run()
                        }
                        className="min-w-8 px-1.5 text-xs font-bold"
                    >
                        {size.label}
                    </ToolbarButton>
                ))}

                <ToolbarDivider />

                <ToolbarButton
                    label="Align left"
                    active={editor.isActive({ textAlign: 'left' })}
                    onClick={() =>
                        editor.chain().focus().setTextAlign('left').run()
                    }
                >
                    <AlignLeft className="size-4" />
                </ToolbarButton>
                <ToolbarButton
                    label="Align center"
                    active={editor.isActive({ textAlign: 'center' })}
                    onClick={() =>
                        editor.chain().focus().setTextAlign('center').run()
                    }
                >
                    <AlignCenter className="size-4" />
                </ToolbarButton>
                <ToolbarButton
                    label="Align right"
                    active={editor.isActive({ textAlign: 'right' })}
                    onClick={() =>
                        editor.chain().focus().setTextAlign('right').run()
                    }
                >
                    <AlignRight className="size-4" />
                </ToolbarButton>

                <ToolbarDivider />

                <ToolbarButton
                    label="Bullet list"
                    active={editor.isActive('bulletList')}
                    onClick={() =>
                        editor.chain().focus().toggleBulletList().run()
                    }
                >
                    <List className="size-4" />
                </ToolbarButton>
                <ToolbarButton
                    label="Numbered list"
                    active={editor.isActive('orderedList')}
                    onClick={() =>
                        editor.chain().focus().toggleOrderedList().run()
                    }
                >
                    <ListOrdered className="size-4" />
                </ToolbarButton>

                <ToolbarDivider />

                <ToolbarButton
                    label="Undo"
                    onClick={() => editor.chain().focus().undo().run()}
                    disabled={!editor.can().undo()}
                >
                    <Undo2 className="size-4" />
                </ToolbarButton>
                <ToolbarButton
                    label="Redo"
                    onClick={() => editor.chain().focus().redo().run()}
                    disabled={!editor.can().redo()}
                >
                    <Redo2 className="size-4" />
                </ToolbarButton>
            </div>

            <EditorContent editor={editor} />
        </div>
    );
}

export function RichTextContent({
    html,
    className,
}: {
    html?: string | null;
    className?: string;
}) {
    if (!html?.trim()) {
        return null;
    }

    const looksLikeHtml = /<\/?[a-z][\s\S]*>/i.test(html);

    if (!looksLikeHtml) {
        return (
            <p
                className={cn(
                    'break-sm break-words text-[#364153] [overflow-wrap:anywhere] whitespace-pre-wrap',
                    className,
                )}
            >
                {html}
            </p>
        );
    }

    return (
        <div
            className={cn(
                'rich-text-content break-words text-sm leading-6 text-[#364153] [overflow-wrap:anywhere] [&_p]:mb-2 [&_p:last-child]:mb-0 [&_ul]:my-2 [&_ul]:list-disc [&_ul]:ps-5 [&_ol]:my-2 [&_ol]:list-decimal [&_ol]:ps-5 [&_strong]:font-bold [&_b]:font-bold [&_em]:italic [&_i]:italic [&_u]:underline',
                className,
            )}
            dangerouslySetInnerHTML={{ __html: html }}
        />
    );
}

function ToolbarButton({
    label,
    active = false,
    disabled = false,
    onClick,
    children,
    className,
}: {
    label: string;
    active?: boolean;
    disabled?: boolean;
    onClick: () => void;
    children: ReactNode;
    className?: string;
}) {
    return (
        <button
            type="button"
            aria-label={label}
            title={label}
            disabled={disabled}
            onMouseDown={(event) => event.preventDefault()}
            onClick={onClick}
            className={cn(
                'inline-flex h-8 cursor-pointer items-center justify-center rounded-lg px-2 text-[#475569] transition hover:bg-[#eef5ff] hover:text-[#0057c8] disabled:cursor-not-allowed disabled:opacity-40',
                active && 'bg-[#eef5ff] text-[#0057c8]',
                className,
            )}
        >
            {children}
        </button>
    );
}

function ToolbarDivider() {
    return <span className="mx-0.5 h-5 w-px bg-[#e2e8f0]" aria-hidden />;
}

function isEditorEmpty(html: string): boolean {
    return html.replace(/<[^>]*>/g, '').trim() === '';
}

function normalizeHtml(html: string): string {
    return isEditorEmpty(html) ? '' : html;
}
