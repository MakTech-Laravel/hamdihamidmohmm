import { Node, mergeAttributes } from '@tiptap/core';
import { Color } from '@tiptap/extension-color';
import Highlight from '@tiptap/extension-highlight';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import {
    Table,
    TableCell,
    TableHeader,
    TableRow,
} from '@tiptap/extension-table';
import TextAlign from '@tiptap/extension-text-align';
import { FontSize, TextStyle } from '@tiptap/extension-text-style';
import Underline from '@tiptap/extension-underline';
import { TableMap, cellAround } from '@tiptap/pm/tables';
import {
    EditorContent,
    NodeViewWrapper,
    ReactNodeViewRenderer,
    useEditor,
    type Editor,
    type NodeViewProps,
} from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import {
    AlignCenter,
    AlignLeft,
    AlignRight,
    AlertCircle,
    ArrowRight,
    Award,
    Bold,
    Briefcase,
    Building2,
    Calendar,
    Check,
    CircleCheck,
    Clock,
    FileText,
    Globe,
    Heart,
    Highlighter,
    Home,
    Info,
    Italic,
    Link as LinkIcon,
    Link2,
    List,
    ListOrdered,
    Mail,
    MapPin,
    MessageCircle,
    Minus,
    Palette,
    Paperclip,
    Phone,
    Plus,
    Redo2,
    Shield,
    Sparkles,
    Star,
    Table2,
    Target,
    ThumbsUp,
    Underline as UnderlineIcon,
    Undo2,
    Users,
    X,
    Youtube,
    Zap,
    type LucideIcon,
} from 'lucide-react';
import {
    useEffect,
    useLayoutEffect,
    useRef,
    useState,
    type ReactNode,
    type RefObject,
} from 'react';
import { createPortal } from 'react-dom';
import { renderToStaticMarkup } from 'react-dom/server';

import { cn } from '@/lib/utils';

const FONT_SIZES = [
    { label: 'S', value: '14px' },
    { label: 'M', value: '16px' },
    { label: 'L', value: '18px' },
    { label: 'XL', value: '22px' },
] as const;

const TEXT_COLORS = [
    '#050315',
    '#334155',
    '#0057c8',
    '#0f766e',
    '#b45309',
    '#b91c1c',
    '#7c3aed',
    '#ffffff',
] as const;

const HIGHLIGHT_COLORS = [
    '#fef08a',
    '#bbf7d0',
    '#bfdbfe',
    '#fecaca',
    '#e9d5ff',
    '#fde68a',
] as const;

const TABLE_BORDER_PRESETS = [
    { label: 'Gray', className: 'border border-[#e2e8f0]' },
    { label: 'Slate', className: 'border border-[#94a3b8]' },
    { label: 'Blue', className: 'border border-[#0057c8]' },
    { label: 'Teal', className: 'border border-[#0f766e]' },
    { label: 'Amber', className: 'border border-[#b45309]' },
] as const;

const TABLE_RADIUS_PRESETS = [
    { label: 'None', className: 'rounded-none' },
    { label: 'SM', className: 'rounded-sm' },
    { label: 'MD', className: 'rounded-md' },
    { label: 'LG', className: 'rounded-lg' },
    { label: 'XL', className: 'rounded-xl' },
] as const;

const TABLE_FILL_COLORS = [
    '#ffffff',
    '#f8fafc',
    '#eef5ff',
    '#bfdbfe',
    '#bbf7d0',
    '#fef08a',
    '#fecaca',
    '#e9d5ff',
] as const;

const RICH_ICONS: Record<string, LucideIcon> = {
    check: Check,
    'circle-check': CircleCheck,
    star: Star,
    'map-pin': MapPin,
    mail: Mail,
    phone: Phone,
    briefcase: Briefcase,
    'building-2': Building2,
    users: Users,
    clock: Clock,
    calendar: Calendar,
    globe: Globe,
    link: LinkIcon,
    'file-text': FileText,
    award: Award,
    heart: Heart,
    shield: Shield,
    zap: Zap,
    target: Target,
    sparkles: Sparkles,
    'thumbs-up': ThumbsUp,
    'message-circle': MessageCircle,
    home: Home,
    info: Info,
    'alert-circle': AlertCircle,
    'arrow-right': ArrowRight,
    plus: Plus,
    minus: Minus,
    x: X,
};

const TABLE_DISPLAY_CLASS =
    '[&_.rich-text-table-wrap]:my-3 [&_.rich-text-table-wrap]:max-w-full [&_.rich-text-table-wrap]:overflow-x-auto [&_table]:my-3 [&_table]:w-full [&_table]:min-w-full [&_table]:max-w-full [&_table]:border-collapse [&_table_th]:border [&_table_th]:border-[#e2e8f0] [&_table_th]:bg-[#f8fafc] [&_table_th]:px-3 [&_table_th]:py-2 [&_table_th]:text-left [&_table_td]:border [&_table_td]:border-[#e2e8f0] [&_table_td]:px-3 [&_table_td]:py-2';

const EDITOR_CONTENT_CLASS =
    `tiptap min-h-[160px] min-w-0 max-w-full px-3 py-3 text-sm leading-6 text-[#050315] outline-none focus:outline-none [&_ul]:list-disc [&_ul]:ps-5 [&_ol]:list-decimal [&_ol]:ps-5 [&_p]:mb-2 [&_p:last-child]:mb-0 [&_strong]:font-bold [&_b]:font-bold [&_em]:italic [&_i]:italic [&_u]:underline [&_a]:font-semibold [&_a]:text-[#0057c8] [&_a]:underline [&_.youtube-embed]:my-3 [&_.youtube-embed]:aspect-video [&_.youtube-embed]:w-full [&_.youtube-embed]:overflow-hidden [&_.youtube-embed]:rounded-xl [&_.youtube-embed_iframe]:h-full [&_.youtube-embed_iframe]:w-full [&_.rich-text-icon]:mx-0.5 [&_.rich-text-icon]:inline-flex [&_.rich-text-icon]:align-text-bottom [&_mark]:rounded-sm [&_mark]:px-0.5 ${TABLE_DISPLAY_CLASS}`;

const DISPLAY_CONTENT_CLASS =
    `rich-text-content min-w-0 max-w-full break-words text-sm leading-6 text-[#364153] [overflow-wrap:anywhere] [&_p]:mb-2 [&_p:last-child]:mb-0 [&_ul]:my-2 [&_ul]:list-disc [&_ul]:ps-5 [&_ol]:my-2 [&_ol]:list-decimal [&_ol]:ps-5 [&_strong]:font-bold [&_b]:font-bold [&_em]:italic [&_i]:italic [&_u]:underline [&_a]:font-semibold [&_a]:text-[#0057c8] [&_a]:underline [&_.youtube-embed]:my-3 [&_.youtube-embed]:aspect-video [&_.youtube-embed]:w-full [&_.youtube-embed]:overflow-hidden [&_.youtube-embed]:rounded-xl [&_.youtube-embed_iframe]:h-full [&_.youtube-embed_iframe]:w-full [&_iframe]:aspect-video [&_iframe]:w-full [&_iframe]:rounded-xl [&_.rich-text-icon]:mx-0.5 [&_.rich-text-icon]:inline-flex [&_.rich-text-icon]:align-text-bottom [&_mark]:rounded-sm [&_mark]:px-0.5 ${TABLE_DISPLAY_CLASS}`;

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

function RichIconView({ node, selected }: NodeViewProps) {
    const name = String(node.attrs.name ?? '');
    const Icon = RICH_ICONS[name];

    if (!Icon) {
        return null;
    }

    return (
        <NodeViewWrapper
            as="span"
            className={cn(
                'rich-text-icon mx-0.5 inline-flex align-text-bottom text-[#0057c8]',
                selected && 'rounded-sm ring-2 ring-[#0057c8]/40',
            )}
            data-rich-icon={name}
            aria-hidden="true"
        >
            <Icon className="size-4" strokeWidth={2.25} />
        </NodeViewWrapper>
    );
}

const RichIcon = Node.create({
    name: 'richIcon',
    group: 'inline',
    inline: true,
    atom: true,
    selectable: true,
    draggable: true,

    addAttributes() {
        return {
            name: {
                default: null,
                parseHTML: (element) =>
                    element.getAttribute('data-rich-icon'),
                renderHTML: (attributes) => {
                    if (!attributes.name || !RICH_ICONS[attributes.name]) {
                        return {};
                    }

                    return {
                        'data-rich-icon': attributes.name,
                    };
                },
            },
        };
    },

    parseHTML() {
        return [
            {
                tag: 'span[data-rich-icon]',
                getAttrs: (element) => {
                    if (!(element instanceof HTMLElement)) {
                        return false;
                    }

                    const name = element.getAttribute('data-rich-icon');

                    if (!name || !RICH_ICONS[name]) {
                        return false;
                    }

                    return { name };
                },
            },
        ];
    },

    renderHTML({ HTMLAttributes }) {
        return [
            'span',
            mergeAttributes(HTMLAttributes, {
                class: 'rich-text-icon',
                'aria-hidden': 'true',
            }),
        ];
    },

    addNodeView() {
        return ReactNodeViewRenderer(RichIconView, {
            as: 'span',
            className: 'rich-text-icon-view',
        });
    },

    addCommands() {
        return {
            insertRichIcon:
                (options: { name: string }) =>
                ({ commands }) => {
                    if (!RICH_ICONS[options.name]) {
                        return false;
                    }

                    return commands.insertContent([
                        {
                            type: this.name,
                            attrs: { name: options.name },
                        },
                        {
                            type: 'text',
                            text: ' ',
                        },
                    ]);
                },
        };
    },
});

const tableCellBackgroundAttribute = {
    backgroundColor: {
        default: null as string | null,
        parseHTML: (element: HTMLElement) =>
            normalizeHexColor(
                element.getAttribute('data-background-color') ||
                    element.style.backgroundColor ||
                    null,
            ),
        renderHTML: (attributes: { backgroundColor?: string | null }) => {
            const hex = normalizeHexColor(attributes.backgroundColor ?? null);

            if (!hex) {
                return {};
            }

            return {
                'data-background-color': hex,
                style: `background-color: ${hex}`,
            };
        },
    },
};

const ColoredTableCell = TableCell.extend({
    addAttributes() {
        return {
            ...this.parent?.(),
            ...tableCellBackgroundAttribute,
        };
    },
});

const ColoredTableHeader = TableHeader.extend({
    addAttributes() {
        return {
            ...this.parent?.(),
            ...tableCellBackgroundAttribute,
        };
    },
});

const TableWithWrapper = Table.extend({
    renderHTML({ HTMLAttributes }) {
        return [
            'div',
            {
                class: 'rich-text-table-wrap overflow-x-auto',
            },
            [
                'table',
                mergeAttributes(this.options.HTMLAttributes, HTMLAttributes),
                0,
            ],
        ];
    },
}).configure({
    resizable: false,
    HTMLAttributes: {
        class: 'rich-text-table w-full min-w-full border-collapse border border-[#e2e8f0] rounded-lg',
    },
});

declare module '@tiptap/core' {
    interface Commands<ReturnType> {
        youtubeEmbed: {
            setYoutubeEmbed: (options: { src: string }) => ReturnType;
        };
        richIcon: {
            insertRichIcon: (options: { name: string }) => ReturnType;
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
    const [colorOpen, setColorOpen] = useState(false);
    const [highlightOpen, setHighlightOpen] = useState(false);
    const [iconOpen, setIconOpen] = useState(false);
    const [tableOpen, setTableOpen] = useState(false);

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
            Color,
            Highlight.configure({
                multicolor: true,
            }),
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
            RichIcon,
            TableWithWrapper,
            TableRow,
            ColoredTableHeader,
            ColoredTableCell,
            Placeholder.configure({
                placeholder: placeholder ?? '',
            }),
        ],
        content: value || '',
        editorProps: {
            attributes: {
                class: EDITOR_CONTENT_CLASS,
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
    const activeColor =
        (editor.getAttributes('textStyle').color as string | undefined) ?? '';
    const activeHighlight =
        (editor.getAttributes('highlight').color as string | undefined) ?? '';
    const inTable = editor.isActive('table');

    const insertExternalLink = (): void => {
        setMediaError(null);
        const previous = editor.getAttributes('link').href as
            | string
            | undefined;
        const url = window.prompt(
            'Enter link URL (opens in a new tab)',
            previous ?? 'https://',
        );

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
                | {
                      url?: string;
                      name?: string;
                      message?: string;
                      errors?: Record<string, string[]>;
                  }
                | null;

            if (!response.ok) {
                const firstError = payload?.errors
                    ? Object.values(payload.errors)[0]?.[0]
                    : null;
                setMediaError(
                    firstError ||
                        payload?.message ||
                        'Upload failed. Please try again.',
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

    const applyTablePreset = (borderClass: string, radiusClass: string) => {
        if (!editor.isActive('table')) {
            return;
        }

        editor
            .chain()
            .focus()
            .updateAttributes('table', {
                class: cn(
                    'rich-text-table w-full min-w-full border-collapse',
                    borderClass,
                    radiusClass,
                ),
            })
            .run();
    };

    return (
        <div
            className={cn(
                'mt-1 min-w-0 rounded-xl border border-[#e8d5e8] bg-[#f8faff] focus-within:border-[#0057c8]',
                className,
            )}
        >
            <div className="relative z-30 flex flex-wrap items-center gap-1 border-b border-[#e8d5e8] bg-white px-2 py-1.5">
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

                <ToolbarMenu
                    open={colorOpen}
                    onOpenChange={(open) => {
                        setColorOpen(open);
                        setHighlightOpen(false);
                        setIconOpen(false);
                        setTableOpen(false);
                    }}
                    label="Text color"
                    icon={<Palette className="size-4" />}
                    active={Boolean(activeColor)}
                >
                    <ColorChooser
                        colors={TEXT_COLORS}
                        activeColor={activeColor || null}
                        onPick={(color, close = true) => {
                            if (close) {
                                editor.chain().focus().setColor(color).run();
                                setColorOpen(false);
                            } else {
                                editor.commands.setColor(color);
                            }
                        }}
                        onClear={() => {
                            editor.chain().focus().unsetColor().run();
                            setColorOpen(false);
                        }}
                        clearLabel="Clear color"
                    />
                </ToolbarMenu>

                <ToolbarMenu
                    open={highlightOpen}
                    onOpenChange={(open) => {
                        setHighlightOpen(open);
                        setColorOpen(false);
                        setIconOpen(false);
                        setTableOpen(false);
                    }}
                    label="Highlight"
                    icon={<Highlighter className="size-4" />}
                    active={Boolean(activeHighlight)}
                >
                    <ColorChooser
                        colors={HIGHLIGHT_COLORS}
                        activeColor={activeHighlight || null}
                        onPick={(color, close = true) => {
                            if (close) {
                                editor
                                    .chain()
                                    .focus()
                                    .toggleHighlight({ color })
                                    .run();
                                setHighlightOpen(false);
                            } else {
                                editor
                                    .chain()
                                    .setHighlight({ color })
                                    .run();
                            }
                        }}
                        onClear={() => {
                            editor.chain().focus().unsetHighlight().run();
                            setHighlightOpen(false);
                        }}
                        clearLabel="Clear highlight"
                    />
                </ToolbarMenu>

                <ToolbarMenu
                    open={iconOpen}
                    onOpenChange={(open) => {
                        setIconOpen(open);
                        setColorOpen(false);
                        setHighlightOpen(false);
                        setTableOpen(false);
                    }}
                    label="Insert icon"
                    icon={<Sparkles className="size-4" />}
                >
                    <div className="grid max-h-56 grid-cols-5 gap-1 overflow-y-auto p-2">
                        {Object.entries(RICH_ICONS).map(([name, Icon]) => (
                            <button
                                key={name}
                                type="button"
                                aria-label={`Insert ${name} icon`}
                                title={name}
                                className="inline-flex size-8 items-center justify-center rounded-lg text-[#475569] hover:bg-[#eef5ff] hover:text-[#0057c8]"
                                onMouseDown={(event) => event.preventDefault()}
                                onClick={() => {
                                    const inserted = editor
                                        .chain()
                                        .focus()
                                        .insertRichIcon({ name })
                                        .run();

                                    if (!inserted) {
                                        setMediaError(
                                            'Could not insert that icon. Place the cursor in the text and try again.',
                                        );
                                    }

                                    setIconOpen(false);
                                }}
                            >
                                <Icon className="size-4" />
                            </button>
                        ))}
                    </div>
                </ToolbarMenu>

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

                <ToolbarMenu
                    open={tableOpen}
                    onOpenChange={(open) => {
                        setTableOpen(open);
                        setColorOpen(false);
                        setHighlightOpen(false);
                        setIconOpen(false);
                    }}
                    label="Table"
                    icon={<Table2 className="size-4" />}
                    active={inTable}
                >
                    <div className="min-w-52 space-y-1 p-2">
                        <MenuAction
                            label="Insert 3×3 table"
                            onClick={() => {
                                editor
                                    .chain()
                                    .focus()
                                    .insertTable({
                                        rows: 3,
                                        cols: 3,
                                        withHeaderRow: true,
                                    })
                                    .run();
                                setTableOpen(false);
                            }}
                        />
                        <MenuAction
                            label="Add row"
                            disabled={!inTable}
                            onClick={() => {
                                editor
                                    .chain()
                                    .focus()
                                    .addRowAfter()
                                    .run();
                                setTableOpen(false);
                            }}
                        />
                        <MenuAction
                            label="Add column"
                            disabled={!inTable}
                            onClick={() => {
                                editor
                                    .chain()
                                    .focus()
                                    .addColumnAfter()
                                    .run();
                                setTableOpen(false);
                            }}
                        />
                        <MenuAction
                            label="Delete row"
                            disabled={!inTable}
                            onClick={() => {
                                editor.chain().focus().deleteRow().run();
                                setTableOpen(false);
                            }}
                        />
                        <MenuAction
                            label="Delete column"
                            disabled={!inTable}
                            onClick={() => {
                                editor.chain().focus().deleteColumn().run();
                                setTableOpen(false);
                            }}
                        />
                        <MenuAction
                            label="Delete table"
                            disabled={!inTable}
                            onClick={() => {
                                editor.chain().focus().deleteTable().run();
                                setTableOpen(false);
                            }}
                        />
                        <div className="border-t border-[#e2e8f0] pt-2">
                            <p className="px-2 pb-1 text-[11px] font-semibold tracking-wide text-[#94a3b8] uppercase">
                                Cell / row / column fill
                            </p>
                            <TableFillControls
                                disabled={!inTable}
                                onApply={(scope, color) => {
                                    applyTableBackground(editor, scope, color);
                                }}
                            />
                            <p className="px-2 pb-1 pt-2 text-[11px] font-semibold tracking-wide text-[#94a3b8] uppercase">
                                Border
                            </p>
                            <div className="flex flex-wrap gap-1 px-1 pb-2">
                                {TABLE_BORDER_PRESETS.map((preset) => (
                                    <button
                                        key={preset.label}
                                        type="button"
                                        disabled={!inTable}
                                        className="rounded-md border border-[#e2e8f0] px-2 py-1 text-[11px] font-medium text-[#475569] hover:bg-[#eef5ff] disabled:opacity-40"
                                        onMouseDown={(event) =>
                                            event.preventDefault()
                                        }
                                        onClick={() => {
                                            const current =
                                                currentTableClasses(editor);
                                            applyTablePreset(
                                                preset.className,
                                                current.radius,
                                            );
                                            setTableOpen(false);
                                        }}
                                    >
                                        {preset.label}
                                    </button>
                                ))}
                            </div>
                            <p className="px-2 pb-1 text-[11px] font-semibold tracking-wide text-[#94a3b8] uppercase">
                                Radius
                            </p>
                            <div className="flex flex-wrap gap-1 px-1">
                                {TABLE_RADIUS_PRESETS.map((preset) => (
                                    <button
                                        key={preset.label}
                                        type="button"
                                        disabled={!inTable}
                                        className="rounded-md border border-[#e2e8f0] px-2 py-1 text-[11px] font-medium text-[#475569] hover:bg-[#eef5ff] disabled:opacity-40"
                                        onMouseDown={(event) =>
                                            event.preventDefault()
                                        }
                                        onClick={() => {
                                            const current =
                                                currentTableClasses(editor);
                                            applyTablePreset(
                                                current.border,
                                                preset.className,
                                            );
                                            setTableOpen(false);
                                        }}
                                    >
                                        {preset.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </ToolbarMenu>

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

            <div className="min-w-0 max-w-full overflow-x-auto">
                <EditorContent editor={editor} />
            </div>

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
    const containerRef = useRef<HTMLDivElement>(null);

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

    const hydratedHtml = hydrateRichIcons(html);

    return (
        <RichTextHtml
            html={hydratedHtml}
            className={cn(DISPLAY_CONTENT_CLASS, className)}
            containerRef={containerRef}
        />
    );
}

function RichTextHtml({
    html,
    className,
    containerRef,
}: {
    html: string;
    className?: string;
    containerRef: RefObject<HTMLDivElement | null>;
}) {
    useLayoutEffect(() => {
        const root = containerRef.current;

        if (!root) {
            return;
        }

        ensureResponsiveTables(root);

        root.querySelectorAll<HTMLElement>('span[data-rich-icon]').forEach(
            (element) => {
                if (element.querySelector('svg')) {
                    return;
                }

                const name = element.getAttribute('data-rich-icon');
                const Icon = name ? RICH_ICONS[name] : null;

                if (!Icon) {
                    element.remove();

                    return;
                }

                element.innerHTML = renderToStaticMarkup(
                    <Icon className="size-4" aria-hidden="true" />,
                );
            },
        );
    }, [containerRef, html]);

    return (
        <div
            ref={containerRef}
            className={className}
            dangerouslySetInnerHTML={{ __html: html }}
        />
    );
}

function ensureResponsiveTables(root: HTMLElement): void {
    root.querySelectorAll('table').forEach((table) => {
        if (!(table instanceof HTMLTableElement)) {
            return;
        }

        if (!table.classList.contains('rich-text-table')) {
            table.classList.add(
                'rich-text-table',
                'w-full',
                'min-w-full',
                'border-collapse',
            );
        }

        if (table.closest('.rich-text-table-wrap')) {
            return;
        }

        const wrap = document.createElement('div');
        wrap.className =
            'rich-text-table-wrap my-3 max-w-full overflow-x-auto';
        table.parentNode?.insertBefore(wrap, table);
        wrap.appendChild(table);
    });
}

function hydrateRichIcons(html: string): string {
    return html.replace(
        /<span\b([^>]*)\bdata-rich-icon="([^"]+)"([^>]*)>([\s\S]*?)<\/span>/gi,
        (_full, before: string, name: string, after: string) => {
            const Icon = RICH_ICONS[name];

            if (!Icon) {
                return '';
            }

            const svg = renderToStaticMarkup(
                <Icon className="size-4" aria-hidden="true" />,
            );

            return `<span${before}data-rich-icon="${name}"${after} class="rich-text-icon inline-flex align-text-bottom text-[#0057c8]">${svg}</span>`;
        },
    );
}

function currentTableClasses(editor: Editor): {
    border: string;
    radius: string;
} {
    const className = String(editor.getAttributes('table').class ?? '');
    const border =
        TABLE_BORDER_PRESETS.find((preset) =>
            className.includes(preset.className),
        )?.className ?? 'border border-[#e2e8f0]';
    const radius =
        TABLE_RADIUS_PRESETS.find((preset) =>
            className.includes(preset.className),
        )?.className ?? 'rounded-lg';

    return { border, radius };
}

function normalizeHexColor(value: string | null | undefined): string | null {
    if (!value) {
        return null;
    }

    const trimmed = value.trim();

    if (/^#[0-9a-fA-F]{6}$/.test(trimmed)) {
        return trimmed.toLowerCase();
    }

    if (/^#[0-9a-fA-F]{3}$/.test(trimmed)) {
        const chars = trimmed.slice(1).split('');

        return `#${chars.map((char) => `${char}${char}`).join('')}`.toLowerCase();
    }

    const rgb = trimmed.match(
        /^rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)$/i,
    );

    if (!rgb) {
        return null;
    }

    const channels = rgb.slice(1, 4).map((part) =>
        Math.max(0, Math.min(255, Number(part))),
    );

    return `#${channels
        .map((channel) => channel.toString(16).padStart(2, '0'))
        .join('')}`;
}

function applyTableBackground(
    editor: Editor,
    scope: 'cell' | 'row' | 'column',
    color: string | null,
): boolean {
    const hex = color === null ? null : normalizeHexColor(color);

    if (color !== null && hex === null) {
        return false;
    }

    return editor
        .chain()
        .command(({ state, tr, dispatch }) => {
            const $cell = cellAround(state.selection.$from);

            if (!$cell || !$cell.nodeAfter) {
                return false;
            }

            const table = $cell.node(-1);
            const map = TableMap.get(table);
            const tableStart = $cell.start(-1);
            const cellRel = $cell.pos - tableStart;
            const rect = map.findCell(cellRel);

            const cellPositions =
                scope === 'cell'
                    ? [cellRel]
                    : scope === 'row'
                      ? map.cellsInRect({
                            left: 0,
                            right: map.width,
                            top: rect.top,
                            bottom: rect.top + 1,
                        })
                      : map.cellsInRect({
                            left: rect.left,
                            right: rect.left + 1,
                            top: 0,
                            bottom: map.height,
                        });

            if (dispatch) {
                for (const relativePos of cellPositions) {
                    const absolutePos = tableStart + relativePos;
                    const node = tr.doc.nodeAt(absolutePos);

                    if (
                        !node ||
                        (node.type.name !== 'tableCell' &&
                            node.type.name !== 'tableHeader')
                    ) {
                        continue;
                    }

                    tr.setNodeMarkup(absolutePos, undefined, {
                        ...node.attrs,
                        backgroundColor: hex,
                    });
                }
            }

            return true;
        })
        .run();
}

function ColorChooser({
    colors,
    activeColor,
    onPick,
    onClear,
    clearLabel,
}: {
    colors: readonly string[];
    activeColor: string | null;
    onPick: (color: string, close?: boolean) => void;
    onClear: () => void;
    clearLabel: string;
}) {
    const [custom, setCustom] = useState(
        normalizeHexColor(activeColor) ?? '#0057c8',
    );

    return (
        <div className="w-56">
            <div className="grid grid-cols-4 gap-1.5 p-2">
                {colors.map((color) => (
                    <button
                        key={color}
                        type="button"
                        aria-label={`Color ${color}`}
                        className={cn(
                            'size-6 rounded-md border border-[#e2e8f0]',
                            activeColor === color &&
                                'ring-2 ring-[#0057c8] ring-offset-1',
                        )}
                        style={{ backgroundColor: color }}
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => onPick(color, true)}
                    />
                ))}
            </div>
            <div className="flex items-center gap-2 border-t border-[#e2e8f0] px-2 py-2">
                <input
                    type="color"
                    aria-label="Custom color"
                    value={/^#[0-9a-fA-F]{6}$/.test(custom) ? custom : '#0057c8'}
                    className="size-8 cursor-pointer rounded border border-[#e2e8f0] bg-white p-0.5"
                    onMouseDown={(event) => event.stopPropagation()}
                    onClick={(event) => event.stopPropagation()}
                    onChange={(event) => {
                        const hex = normalizeHexColor(event.target.value);

                        if (!hex) {
                            return;
                        }

                        setCustom(hex);
                        onPick(hex, false);
                    }}
                />
                <input
                    type="text"
                    aria-label="Custom hex color"
                    value={custom}
                    maxLength={7}
                    placeholder="#0057c8"
                    className="h-8 flex-1 rounded-md border border-[#e2e8f0] px-2 font-mono text-xs text-[#334155]"
                    onMouseDown={(event) => event.stopPropagation()}
                    onChange={(event) => {
                        const next = event.target.value.startsWith('#')
                            ? event.target.value
                            : `#${event.target.value}`;
                        setCustom(next);

                        const hex = normalizeHexColor(next);

                        if (hex) {
                            onPick(hex, false);
                        }
                    }}
                    onKeyDown={(event) => {
                        if (event.key !== 'Enter') {
                            return;
                        }

                        const hex = normalizeHexColor(custom);

                        if (hex) {
                            onPick(hex, true);
                        }
                    }}
                />
            </div>

            <button
                type="button"
                className="w-full border-t border-[#e2e8f0] px-3 py-2 text-left text-xs font-medium text-[#64748b] hover:bg-[#f8fafc]"
                onMouseDown={(event) => event.preventDefault()}
                onClick={onClear}
            >
                {clearLabel}
            </button>
        </div>
    );
}

function TableFillControls({
    disabled,
    onApply,
}: {
    disabled: boolean;
    onApply: (scope: 'cell' | 'row' | 'column', color: string | null) => void;
}) {
    const [scope, setScope] = useState<'cell' | 'row' | 'column'>('cell');
    const [custom, setCustom] = useState('#bfdbfe');

    return (
        <div className={cn('space-y-2 px-1 pb-2', disabled && 'opacity-40')}>
            <div className="flex flex-wrap gap-1">
                {(
                    [
                        ['cell', 'Cell'],
                        ['row', 'Row'],
                        ['column', 'Column'],
                    ] as const
                ).map(([value, label]) => (
                    <button
                        key={value}
                        type="button"
                        disabled={disabled}
                        className={cn(
                            'rounded-md border px-2 py-1 text-[11px] font-medium',
                            scope === value
                                ? 'border-[#0057c8] bg-[#eef5ff] text-[#0057c8]'
                                : 'border-[#e2e8f0] text-[#475569] hover:bg-[#eef5ff]',
                        )}
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => setScope(value)}
                    >
                        {label}
                    </button>
                ))}
            </div>
            <div className="flex flex-wrap gap-1">
                {TABLE_FILL_COLORS.map((color) => (
                    <button
                        key={color}
                        type="button"
                        disabled={disabled}
                        aria-label={`Fill ${color}`}
                        className="size-6 rounded-md border border-[#e2e8f0]"
                        style={{ backgroundColor: color }}
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => onApply(scope, color)}
                    />
                ))}
            </div>
            <div className="flex items-center gap-2">
                <input
                    type="color"
                    disabled={disabled}
                    aria-label="Custom table fill"
                    value={custom}
                    className="size-8 cursor-pointer rounded border border-[#e2e8f0] bg-white p-0.5 disabled:cursor-not-allowed"
                    onMouseDown={(event) => event.stopPropagation()}
                    onClick={(event) => event.stopPropagation()}
                    onChange={(event) => {
                        const hex = normalizeHexColor(event.target.value);

                        if (!hex) {
                            return;
                        }

                        setCustom(hex);
                        onApply(scope, hex);
                    }}
                />
                <button
                    type="button"
                    disabled={disabled}
                    className="rounded-md border border-[#e2e8f0] px-2 py-1 text-[11px] font-medium text-[#64748b] hover:bg-[#f8fafc] disabled:cursor-not-allowed"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => onApply(scope, null)}
                >
                    Clear fill
                </button>
            </div>
        </div>
    );
}

function ToolbarMenu({
    open,
    onOpenChange,
    label,
    icon,
    active = false,
    children,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    label: string;
    icon: ReactNode;
    active?: boolean;
    children: ReactNode;
}) {
    const triggerRef = useRef<HTMLDivElement>(null);
    const panelRef = useRef<HTMLDivElement>(null);
    const [coords, setCoords] = useState<{
        top: number;
        left: number;
        openUpward: boolean;
    } | null>(null);

    useLayoutEffect(() => {
        if (!open || !triggerRef.current) {
            setCoords(null);

            return;
        }

        const updatePosition = () => {
            const rect = triggerRef.current?.getBoundingClientRect();

            if (!rect) {
                return;
            }

            const panelHeight = panelRef.current?.offsetHeight ?? 280;
            const panelWidth = Math.min(320, window.innerWidth - 16);
            const spaceBelow = window.innerHeight - rect.bottom;
            const openUpward =
                spaceBelow < panelHeight + 12 && rect.top > spaceBelow;
            const top = openUpward
                ? Math.max(8, rect.top - panelHeight - 6)
                : rect.bottom + 6;
            const left = Math.min(
                Math.max(8, rect.left),
                window.innerWidth - panelWidth - 8,
            );

            setCoords({ top, left, openUpward });
        };

        updatePosition();
        const frame = window.requestAnimationFrame(updatePosition);

        window.addEventListener('resize', updatePosition);
        window.addEventListener('scroll', updatePosition, true);

        return () => {
            window.cancelAnimationFrame(frame);
            window.removeEventListener('resize', updatePosition);
            window.removeEventListener('scroll', updatePosition, true);
        };
    }, [open]);

    useEffect(() => {
        if (!open) {
            return;
        }

        const onPointerDown = (event: MouseEvent) => {
            const target = event.target;

            if (!(target instanceof Node)) {
                return;
            }

            if (
                triggerRef.current?.contains(target) ||
                panelRef.current?.contains(target)
            ) {
                return;
            }

            const active = document.activeElement;

            if (
                active instanceof HTMLInputElement &&
                active.type === 'color' &&
                panelRef.current?.contains(active)
            ) {
                return;
            }

            onOpenChange(false);
        };

        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onOpenChange(false);
            }
        };

        document.addEventListener('mousedown', onPointerDown);
        document.addEventListener('keydown', onKeyDown);

        return () => {
            document.removeEventListener('mousedown', onPointerDown);
            document.removeEventListener('keydown', onKeyDown);
        };
    }, [open, onOpenChange]);

    return (
        <div className="relative" ref={triggerRef}>
            <ToolbarButton
                label={label}
                active={active || open}
                onClick={() => onOpenChange(!open)}
            >
                {icon}
            </ToolbarButton>
            {open && coords
                ? createPortal(
                      <div
                          ref={panelRef}
                          role="menu"
                          aria-label={label}
                          className="fixed z-[200] max-h-72 max-w-[min(100vw-2rem,20rem)] overflow-auto rounded-xl border border-[#e2e8f0] bg-white shadow-lg"
                          style={{
                              top: coords.top,
                              left: coords.left,
                          }}
                      >
                          {children}
                      </div>,
                      document.body,
                  )
                : null}
        </div>
    );
}

function MenuAction({
    label,
    onClick,
    disabled = false,
}: {
    label: string;
    onClick: () => void;
    disabled?: boolean;
}) {
    return (
        <button
            type="button"
            disabled={disabled}
            className="block w-full rounded-lg px-2 py-1.5 text-left text-xs font-medium text-[#334155] hover:bg-[#eef5ff] disabled:cursor-not-allowed disabled:opacity-40"
            onMouseDown={(event) => event.preventDefault()}
            onClick={onClick}
        >
            {label}
        </button>
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
        .replace(/<table[\s\S]*?<\/table>/gi, 'table')
        .replace(/data-rich-icon="[^"]+"/gi, 'icon')
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

        if (
            host === 'youtube.com' ||
            host === 'm.youtube.com' ||
            host === 'youtube-nocookie.com'
        ) {
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
