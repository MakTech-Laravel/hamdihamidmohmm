import { Node, mergeAttributes } from '@tiptap/core';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import TextAlign from '@tiptap/extension-text-align';
import { FontSize, TextStyle } from '@tiptap/extension-text-style';
import Underline from '@tiptap/extension-underline';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import {
    AlignCenter,
    AlignLeft,
    AlignRight,
    Bold,
    Italic,
    Link2,
    List,
    ListOrdered,
    Paperclip,
    Redo2,
    Underline as UnderlineIcon,
    Undo2,
    Youtube,
} from 'lucide-react';
import { useEffect, useRef, useState, type ReactNode } from 'react';

import { cn } from '@/lib/utils';

const FONT_SIZES = [
    { label: 'S', value: '14px' },
    { label: 'M', value: '16px' },
    { label: 'L', value: '18px' },
    { label: 'XL', value: '22px' },
] as const;

const YoutubeEmbed = Node.create({
    name: 'youtubeEmbed',
    group: 'block',
    atom: true,
    selectable: true,
    draggable: true,

    addAttributes() {
        return {
            src: {
                default: null,
            },
        };
    },

    parseHTML() {
        return [
            {
                tag: 'div[data-youtube-video] iframe',
                getAttrs: (element) => {
                    if (!(element instanceof HTMLIFrameElement)) {
                        return false;
                    }

                    return { src: element.getAttribute('src') };
                },
            },
            {
                tag: 'iframe[src*="youtube.com/embed"]',
                getAttrs: (element) => {
                    if (!(element instanceof HTMLIFrameElement)) {
                        return false;
                    }

                    return { src: element.getAttribute('src') };
                },
            },
            {
                tag: 'iframe[src*="youtube-nocookie.com/embed"]',
                getAttrs: (element) => {
                    if (!(element instanceof HTMLIFrameElement)) {
                        return false;
                    }

                    return { src: element.getAttribute('src') };
                },
            },
        ];
    },

    renderHTML({ HTMLAttributes }) {
        return [
            'div',
            {
                'data-youtube-video': '',
                class: 'youtube-embed my-3 aspect-video w-full overflow-hidden rounded-xl',
            },
            [
                'iframe',
                mergeAttributes(HTMLAttributes, {
                    width: '560',
                    height: '315',
                    frameborder: '0',
                    allowfullscreen: 'allowfullscreen',
                    allow: 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture',
                    loading: 'lazy',
                    referrerpolicy: 'strict-origin-when-cross-origin',
                    title: 'YouTube video',
                    class: 'h-full w-full',
                }),
            ],
        ];
    },

    addCommands() {
        return {
            setYoutubeEmbed:
                (options: { src: string }) =>
                ({ commands }) =>
                    commands.insertContent({
                        type: this.name,
                        attrs: options,
                    }),
        };
    },
});

declare module '@tiptap/core' {
    interface Commands<ReturnType> {
        youtubeEmbed: {
            setYoutubeEmbed: (options: { src: string }) => ReturnType;
        };
    }
}

type RichTextEditorProps = {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
    attachmentUploadUrl?: string;
};

export function RichTextEditor({
    value,
    onChange,
    placeholder,
    className,
    attachmentUploadUrl,
}: RichTextEditorProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState(false);
    const [mediaError, setMediaError] = useState<string | null>(null);

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
                link: false,
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
            Link.configure({
                openOnClick: false,
                autolink: true,
                HTMLAttributes: {
                    target: '_blank',
                    rel: 'noopener noreferrer',
                    class: 'font-semibold text-[#0057c8] underline',
                },
            }),
            YoutubeEmbed,
            Placeholder.configure({
                placeholder: placeholder ?? '',
            }),
        ],
        content: value || '',
        editorProps: {
            attributes: {
                class: 'tiptap min-h-[160px] px-3 py-3 text-sm leading-6 text-[#050315] outline-none focus:outline-none [&_ul]:list-disc [&_ul]:ps-5 [&_ol]:list-decimal [&_ol]:ps-5 [&_p]:mb-2 [&_p:last-child]:mb-0 [&_strong]:font-bold [&_b]:font-bold [&_em]:italic [&_i]:italic [&_u]:underline [&_a]:font-semibold [&_a]:text-[#0057c8] [&_a]:underline [&_.youtube-embed]:my-3 [&_.youtube-embed]:aspect-video [&_.youtube-embed]:w-full [&_.youtube-embed]:overflow-hidden [&_.youtube-embed]:rounded-xl [&_.youtube-embed_iframe]:h-full [&_.youtube-embed_iframe]:w-full',
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

    const insertExternalLink = (): void => {
        setMediaError(null);
        const previous = editor.getAttributes('link').href as string | undefined;
        const url = window.prompt('Enter link URL (opens in a new tab)', previous ?? 'https://');

        if (url === null) {
            return;
        }

        const trimmed = url.trim();

        if (trimmed === '') {
            editor.chain().focus().extendMarkRange('link').unsetLink().run();

            return;
        }

        if (!isSafeHttpUrl(trimmed)) {
            setMediaError('Please enter a valid http(s) URL.');

            return;
        }

        editor
            .chain()
            .focus()
            .extendMarkRange('link')
            .setLink({
                href: trimmed,
                target: '_blank',
                rel: 'noopener noreferrer',
            })
            .run();
    };

    const insertYoutube = (): void => {
        setMediaError(null);
        const url = window.prompt('Enter a YouTube video URL');

        if (url === null) {
            return;
        }

        const embedUrl = toYoutubeEmbedUrl(url.trim());

        if (!embedUrl) {
            setMediaError('Please enter a valid YouTube URL.');

            return;
        }

        editor.chain().focus().setYoutubeEmbed({ src: embedUrl }).run();
    };

    const uploadAttachment = async (file: File): Promise<void> => {
        if (!attachmentUploadUrl) {
            return;
        }

        setMediaError(null);
        setUploading(true);

        try {
            const body = new FormData();
            body.append('file', file);

            const xsrf = document.cookie
                .split('; ')
                .find((row) => row.startsWith('XSRF-TOKEN='))
                ?.split('=')
                .slice(1)
                .join('=');

            const response = await fetch(attachmentUploadUrl, {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    ...(xsrf
                        ? { 'X-XSRF-TOKEN': decodeURIComponent(xsrf) }
                        : {}),
                },
                credentials: 'same-origin',
                body,
            });

            const payload = (await response.json().catch(() => null)) as
                | { url?: string; name?: string; message?: string; errors?: Record<string, string[]> }
                | null;

            if (!response.ok) {
                const firstError = payload?.errors
                    ? Object.values(payload.errors)[0]?.[0]
                    : null;
                setMediaError(
                    firstError || payload?.message || 'Upload failed. Please try again.',
                );

                return;
            }

            if (!payload?.url) {
                setMediaError('Upload failed. Please try again.');

                return;
            }

            const label = payload.name || file.name || 'Attachment';

            editor
                .chain()
                .focus()
                .insertContent(
                    `<p><a href="${payload.url}" target="_blank" rel="noopener noreferrer" class="rich-text-attachment font-semibold text-[#0057c8] underline">${escapeHtml(label)}</a></p>`,
                )
                .run();
        } catch {
            setMediaError('Upload failed. Please try again.');
        } finally {
            setUploading(false);

            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

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
                    label="Add link"
                    active={editor.isActive('link')}
                    onClick={insertExternalLink}
                >
                    <Link2 className="size-4" />
                </ToolbarButton>
                <ToolbarButton label="Add YouTube video" onClick={insertYoutube}>
                    <Youtube className="size-4" />
                </ToolbarButton>
                {attachmentUploadUrl ? (
                    <>
                        <ToolbarButton
                            label="Attach PDF or Word file"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploading}
                        >
                            <Paperclip className="size-4" />
                        </ToolbarButton>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                            className="hidden"
                            onChange={(event) => {
                                const file = event.target.files?.[0];

                                if (file) {
                                    void uploadAttachment(file);
                                }
                            }}
                        />
                    </>
                ) : null}

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

            {mediaError ? (
                <p className="border-t border-[#fecaca] bg-[#fef2f2] px-3 py-2 text-xs text-[#b91c1c]">
                    {mediaError}
                </p>
            ) : null}
            {uploading ? (
                <p className="border-t border-[#e8d5e8] bg-white px-3 py-2 text-xs text-[#64748b]">
                    Uploading attachment…
                </p>
            ) : null}
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
                    'text-sm break-words text-[#364153] [overflow-wrap:anywhere] whitespace-pre-wrap',
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
                'rich-text-content break-words text-sm leading-6 text-[#364153] [overflow-wrap:anywhere] [&_p]:mb-2 [&_p:last-child]:mb-0 [&_ul]:my-2 [&_ul]:list-disc [&_ul]:ps-5 [&_ol]:my-2 [&_ol]:list-decimal [&_ol]:ps-5 [&_strong]:font-bold [&_b]:font-bold [&_em]:italic [&_i]:italic [&_u]:underline [&_a]:font-semibold [&_a]:text-[#0057c8] [&_a]:underline [&_.youtube-embed]:my-3 [&_.youtube-embed]:aspect-video [&_.youtube-embed]:w-full [&_.youtube-embed]:overflow-hidden [&_.youtube-embed]:rounded-xl [&_.youtube-embed_iframe]:h-full [&_.youtube-embed_iframe]:w-full [&_iframe]:aspect-video [&_iframe]:w-full [&_iframe]:rounded-xl',
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
    const withoutMedia = html
        .replace(/<iframe[\s\S]*?<\/iframe>/gi, 'media')
        .replace(/<[^>]*>/g, '')
        .trim();

    return withoutMedia === '';
}

function normalizeHtml(html: string): string {
    return isEditorEmpty(html) ? '' : html;
}

function isSafeHttpUrl(url: string): boolean {
    if (url.startsWith('/storage/')) {
        return true;
    }

    try {
        const parsed = new URL(url);

        return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
        return false;
    }
}

function toYoutubeEmbedUrl(url: string): string | null {
    try {
        const parsed = new URL(url);
        const host = parsed.hostname.replace(/^www\./, '').toLowerCase();

        if (host === 'youtu.be') {
            const id = parsed.pathname.replace('/', '').trim();

            return id ? `https://www.youtube.com/embed/${id}` : null;
        }

        if (host === 'youtube.com' || host === 'm.youtube.com' || host === 'youtube-nocookie.com') {
            if (parsed.pathname.startsWith('/embed/')) {
                return `https://www.youtube.com${parsed.pathname}`;
            }

            const id = parsed.searchParams.get('v');

            if (id) {
                return `https://www.youtube.com/embed/${id}`;
            }

            const shorts = parsed.pathname.match(/^\/shorts\/([^/]+)/);

            if (shorts?.[1]) {
                return `https://www.youtube.com/embed/${shorts[1]}`;
            }
        }
    } catch {
        return null;
    }

    return null;
}

function escapeHtml(value: string): string {
    return value
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');
}
