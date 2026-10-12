import { Link } from '@inertiajs/react';
import {
    Bot,
    LifeBuoy,
    Mail,
    MessageCircle,
    Phone,
    RotateCcw,
    SendHorizontal,
    X,
} from 'lucide-react';
import {
    type FormEvent,
    type KeyboardEvent,
    type ReactNode,
    useCallback,
    useEffect,
    useRef,
    useState,
} from 'react';

import { useLocale } from '@/hooks/use-locale';
import { cn } from '@/lib/utils';

type SupportContacts = {
    support_phone?: string;
    support_phone_secondary?: string;
    support_email?: string;
    contact_email?: string;
    contact_url?: string;
};

type ChatMessage = {
    role: 'user' | 'assistant';
    content: string;
    support?: SupportContacts | null;
    isError?: boolean;
};

type ChatReply = {
    reply: string;
    fallback: boolean;
    support: SupportContacts | null;
};

type AiChatWidgetProps = {
    endpoint: string;
    title: string;
    subtitle: string;
    greeting: string;
    suggestions: string[];
    placeholder: string;
};

const MAX_LENGTH = 1000;

function xsrfToken(): string | null {
    const raw = document.cookie
        .split('; ')
        .find((row) => row.startsWith('XSRF-TOKEN='))
        ?.split('=')
        .slice(1)
        .join('=');

    return raw ? decodeURIComponent(raw) : null;
}

async function request<T>(
    url: string,
    method: 'GET' | 'POST' | 'DELETE',
    body?: Record<string, unknown>,
): Promise<{ ok: boolean; status: number; data: T | null }> {
    const token = xsrfToken();
    const response = await fetch(url, {
        method,
        credentials: 'same-origin',
        headers: {
            Accept: 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
            ...(body ? { 'Content-Type': 'application/json' } : {}),
            ...(token ? { 'X-XSRF-TOKEN': token } : {}),
        },
        body: body ? JSON.stringify(body) : undefined,
    });

    const data = (await response.json().catch(() => null)) as T | null;

    return { ok: response.ok, status: response.status, data };
}

const SAFE_URL = /^(\/(?!\/)|https?:\/\/|mailto:|tel:)/i;

function renderInline(text: string, keyPrefix: string): ReactNode[] {
    const nodes: ReactNode[] = [];
    const pattern = /\[([^\]]+)\]\(([^)\s]+)\)|\*\*([^*]+)\*\*/g;
    let lastIndex = 0;
    let match: RegExpExecArray | null;
    let index = 0;

    while ((match = pattern.exec(text)) !== null) {
        if (match.index > lastIndex) {
            nodes.push(text.slice(lastIndex, match.index));
        }

        const key = `${keyPrefix}-${index++}`;

        if (match[1] !== undefined && match[2] !== undefined) {
            const [label, href] = [match[1], match[2]];

            if (!SAFE_URL.test(href)) {
                nodes.push(label);
            } else if (href.startsWith('/')) {
                nodes.push(
                    <Link
                        key={key}
                        href={href}
                        className="font-semibold text-[#0057c8] underline underline-offset-2"
                    >
                        {label}
                    </Link>,
                );
            } else {
                nodes.push(
                    <a
                        key={key}
                        href={href}
                        target={href.startsWith('http') ? '_blank' : undefined}
                        rel="noopener noreferrer"
                        className="font-semibold text-[#0057c8] underline underline-offset-2"
                    >
                        {label}
                    </a>,
                );
            }
        } else if (match[3] !== undefined) {
            nodes.push(<strong key={key}>{match[3]}</strong>);
        }

        lastIndex = pattern.lastIndex;
    }

    if (lastIndex < text.length) {
        nodes.push(text.slice(lastIndex));
    }

    return nodes;
}

function RichText({ content }: { content: string }) {
    const blocks: ReactNode[] = [];
    let list: { ordered: boolean; items: string[] } | null = null;

    const flushList = () => {
        if (!list) {
            return;
        }

        const ListTag = list.ordered ? 'ol' : 'ul';
        const key = `list-${blocks.length}`;

        blocks.push(
            <ListTag
                key={key}
                className={cn(
                    'space-y-1 ps-5',
                    list.ordered ? 'list-decimal' : 'list-disc',
                )}
            >
                {list.items.map((item, itemIndex) => (
                    <li key={`${key}-${itemIndex}`}>
                        {renderInline(item, `${key}-${itemIndex}`)}
                    </li>
                ))}
            </ListTag>,
        );
        list = null;
    };

    content.split(/\r?\n/).forEach((rawLine, lineIndex) => {
        const line = rawLine.trim();
        const bullet = line.match(/^[-*•]\s+(.*)$/);
        const numbered = line.match(/^\d+[.)]\s+(.*)$/);

        if (bullet || numbered) {
            const ordered = Boolean(numbered);

            if (list && list.ordered !== ordered) {
                flushList();
            }

            list ??= { ordered, items: [] };
            list.items.push((bullet ?? numbered)![1]);

            return;
        }

        flushList();

        if (line === '') {
            return;
        }

        const heading = line.match(/^#{1,6}\s+(.*)$/);

        blocks.push(
            <p
                key={`p-${lineIndex}`}
                className={cn(heading && 'font-bold text-[#050315]')}
            >
                {renderInline(heading ? heading[1] : line, `p-${lineIndex}`)}
            </p>,
        );
    });

    flushList();

    return <div className="space-y-2 break-words">{blocks}</div>;
}

function SupportCard({ support }: { support: SupportContacts }) {
    const { t } = useLocale();
    const email = support.support_email ?? support.contact_email;
    const phones = [
        support.support_phone,
        support.support_phone_secondary,
    ].filter((phone): phone is string => Boolean(phone));

    return (
        <div className="mt-3 space-y-2 rounded-xl border border-[#fde68a] bg-[#fffbeb] p-3 text-xs text-[#92400e]">
            <p className="flex items-center gap-1.5 font-bold">
                <LifeBuoy className="size-3.5" />
                {t('chatbot.support_title')}
            </p>
            {phones.map((phone) => (
                <a
                    key={phone}
                    href={`tel:${phone.replace(/\s+/g, '')}`}
                    className="flex items-center gap-1.5 hover:underline"
                    dir="ltr"
                >
                    <Phone className="size-3.5" />
                    {phone}
                </a>
            ))}
            {email ? (
                <a
                    href={`mailto:${email}`}
                    className="flex items-center gap-1.5 hover:underline"
                >
                    <Mail className="size-3.5" />
                    {email}
                </a>
            ) : null}
            {support.contact_url ? (
                <Link
                    href={support.contact_url}
                    className="inline-flex rounded-lg bg-[#f59e0b] px-3 py-1.5 font-semibold text-white hover:bg-[#d97706]"
                >
                    {t('chatbot.contact_support')}
                </Link>
            ) : null}
        </div>
    );
}

export function AiChatWidget({
    endpoint,
    title,
    subtitle,
    greeting,
    suggestions,
    placeholder,
}: AiChatWidgetProps) {
    const { t } = useLocale();
    const [open, setOpen] = useState(false);
    const [loaded, setLoaded] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [sending, setSending] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        if (!open || loaded) {
            return;
        }

        let cancelled = false;

        request<{ messages: ChatMessage[] }>(endpoint, 'GET')
            .then(({ ok, data }) => {
                if (!cancelled && ok && data) {
                    setMessages(data.messages ?? []);
                }
            })
            .catch(() => undefined)
            .finally(() => {
                if (!cancelled) {
                    setLoaded(true);
                }
            });

        return () => {
            cancelled = true;
        };
    }, [open, loaded, endpoint]);

    useEffect(() => {
        scrollRef.current?.scrollTo({
            top: scrollRef.current.scrollHeight,
            behavior: 'smooth',
        });
    }, [messages, sending, open]);

    useEffect(() => {
        if (open) {
            inputRef.current?.focus();
        }
    }, [open]);

    const send = useCallback(
        async (text: string) => {
            const message = text.trim();

            if (message.length < 2 || sending) {
                return;
            }

            setMessages((current) => [
                ...current,
                { role: 'user', content: message },
            ]);
            setInput('');
            setSending(true);

            try {
                const { ok, status, data } = await request<
                    ChatReply & {
                        message?: string;
                        errors?: Record<string, string[]>;
                    }
                >(endpoint, 'POST', { message });

                if (ok && data) {
                    setMessages((current) => [
                        ...current,
                        {
                            role: 'assistant',
                            content: data.reply,
                            support: data.support,
                        },
                    ]);

                    return;
                }

                const errorText =
                    (data?.errors && Object.values(data.errors)[0]?.[0]) ||
                    (status === 429 || status === 403 ? data?.message : null) ||
                    t('chatbot.error_message');

                setMessages((current) => [
                    ...current,
                    { role: 'assistant', content: errorText, isError: true },
                ]);
            } catch {
                setMessages((current) => [
                    ...current,
                    {
                        role: 'assistant',
                        content: t('chatbot.network_error'),
                        isError: true,
                    },
                ]);
            } finally {
                setSending(false);
            }
        },
        [endpoint, sending, t],
    );

    const reset = async () => {
        setMessages([]);
        await request(endpoint, 'DELETE').catch(() => undefined);
    };

    const onSubmit = (event: FormEvent) => {
        event.preventDefault();
        void send(input);
    };

    const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            void send(input);
        }
    };

    return (
        <>
            {open ? (
                <section
                    role="dialog"
                    aria-label={title}
                    className="fixed end-4 bottom-24 z-[60] flex h-[min(600px,calc(100svh-8rem))] w-[min(390px,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-[#dbe5f5] bg-white shadow-[0_24px_60px_rgba(5,3,21,0.18)] sm:end-6"
                >
                    <header className="flex items-center gap-3 bg-gradient-to-r from-[#0057c8] to-[#3b82f6] px-4 py-3 text-white">
                        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-white/20">
                            <Bot className="size-5" />
                        </span>
                        <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-bold">
                                {title}
                            </p>
                            <p className="truncate text-xs text-white/80">
                                {subtitle}
                            </p>
                        </div>
                        {messages.length > 0 ? (
                            <button
                                type="button"
                                onClick={() => void reset()}
                                className="cursor-pointer rounded-lg p-1.5 hover:bg-white/15"
                                aria-label={t('chatbot.new_chat')}
                                title={t('chatbot.new_chat')}
                            >
                                <RotateCcw className="size-4" />
                            </button>
                        ) : null}
                        <button
                            type="button"
                            onClick={() => setOpen(false)}
                            className="cursor-pointer rounded-lg p-1.5 hover:bg-white/15"
                            aria-label={t('chatbot.close')}
                        >
                            <X className="size-4" />
                        </button>
                    </header>

                    <div
                        ref={scrollRef}
                        className="flex-1 space-y-3 overflow-y-auto overscroll-contain bg-[#f8faff] px-4 py-4 text-sm leading-6"
                        aria-live="polite"
                    >
                        <div className="max-w-[88%] rounded-2xl rounded-ss-sm bg-white px-3.5 py-2.5 text-[#1f2a44] shadow-sm">
                            {greeting}
                        </div>

                        {loaded && messages.length === 0 ? (
                            <div className="flex flex-wrap gap-2">
                                {suggestions.map((suggestion) => (
                                    <button
                                        key={suggestion}
                                        type="button"
                                        onClick={() => void send(suggestion)}
                                        className="cursor-pointer rounded-full border border-[#bfdbfe] bg-white px-3 py-1.5 text-xs font-semibold text-[#0057c8] hover:bg-[#eff6ff]"
                                    >
                                        {suggestion}
                                    </button>
                                ))}
                            </div>
                        ) : null}

                        {messages.map((message, index) =>
                            message.role === 'user' ? (
                                <div
                                    key={index}
                                    className="ms-auto max-w-[85%] rounded-2xl rounded-se-sm bg-[#0057c8] px-3.5 py-2.5 whitespace-pre-wrap text-white"
                                >
                                    {message.content}
                                </div>
                            ) : (
                                <div
                                    key={index}
                                    className={cn(
                                        'max-w-[92%] rounded-2xl rounded-ss-sm px-3.5 py-2.5 shadow-sm',
                                        message.isError
                                            ? 'border border-[#fecaca] bg-[#fef2f2] text-[#991b1b]'
                                            : 'bg-white text-[#1f2a44]',
                                    )}
                                >
                                    <RichText content={message.content} />
                                    {message.support ? (
                                        <SupportCard
                                            support={message.support}
                                        />
                                    ) : null}
                                </div>
                            ),
                        )}

                        {sending ? (
                            <div className="flex w-16 items-center justify-center gap-1 rounded-2xl rounded-ss-sm bg-white px-3.5 py-3 shadow-sm">
                                {[0, 150, 300].map((delay) => (
                                    <span
                                        key={delay}
                                        className="size-1.5 animate-bounce rounded-full bg-[#94a3b8]"
                                        style={{ animationDelay: `${delay}ms` }}
                                    />
                                ))}
                            </div>
                        ) : null}
                    </div>

                    <form
                        onSubmit={onSubmit}
                        className="flex items-end gap-2 border-t border-[#e2e8f0] bg-white p-3"
                    >
                        <textarea
                            ref={inputRef}
                            value={input}
                            onChange={(event) => setInput(event.target.value)}
                            onKeyDown={onKeyDown}
                            rows={1}
                            maxLength={MAX_LENGTH}
                            placeholder={placeholder}
                            aria-label={placeholder}
                            className="max-h-28 min-h-10 flex-1 resize-none rounded-xl border border-[#e2e8f0] bg-[#f8fafc] px-3 py-2 text-sm text-[#050315] outline-none focus:border-[#0057c8] focus:bg-white"
                        />
                        <button
                            type="submit"
                            disabled={sending || input.trim().length < 2}
                            className="flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-xl bg-[#0057c8] text-white hover:bg-[#0046a3] disabled:cursor-not-allowed disabled:opacity-50"
                            aria-label={t('chatbot.send')}
                        >
                            <SendHorizontal className="size-4 rtl:rotate-180" />
                        </button>
                    </form>
                    <p className="bg-white px-3 pb-2 text-center text-[10px] text-[#94a3b8]">
                        {t('chatbot.disclaimer')}
                    </p>
                </section>
            ) : null}

            <button
                type="button"
                onClick={() => setOpen((value) => !value)}
                className="fixed end-4 bottom-5 z-[60] flex size-14 cursor-pointer items-center justify-center rounded-full bg-[#0057c8] text-white shadow-[0_12px_30px_rgba(0,87,200,0.4)] transition-transform hover:scale-105 hover:bg-[#0046a3] sm:end-6"
                aria-label={open ? t('chatbot.close') : t('chatbot.open')}
                aria-expanded={open}
            >
                {open ? (
                    <X className="size-6" />
                ) : (
                    <MessageCircle className="size-6" />
                )}
            </button>
        </>
    );
}

export function PublicChatWidget() {
    const { t } = useLocale();

    return (
        <AiChatWidget
            endpoint="/chatbot/messages"
            title={t('chatbot.public.title')}
            subtitle={t('chatbot.public.subtitle')}
            greeting={t('chatbot.public.greeting')}
            placeholder={t('chatbot.placeholder')}
            suggestions={[
                t('chatbot.public.suggestion_jobs'),
                t('chatbot.public.suggestion_register'),
                t('chatbot.public.suggestion_resume'),
                t('chatbot.public.suggestion_pricing'),
            ]}
        />
    );
}

export function AdminAssistantWidget() {
    const { t } = useLocale();

    return (
        <AiChatWidget
            endpoint="/admin/ai-assistant/messages"
            title={t('chatbot.admin.title')}
            subtitle={t('chatbot.admin.subtitle')}
            greeting={t('chatbot.admin.greeting')}
            placeholder={t('chatbot.admin.placeholder')}
            suggestions={[
                t('chatbot.admin.suggestion_overview'),
                t('chatbot.admin.suggestion_pending'),
                t('chatbot.admin.suggestion_revenue'),
                t('chatbot.admin.suggestion_inbox'),
            ]}
        />
    );
}
