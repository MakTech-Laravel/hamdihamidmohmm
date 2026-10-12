import { Link } from '@inertiajs/react';
import {
    Bot,
    Languages,
    LifeBuoy,
    LoaderCircle,
    Mail,
    Phone,
    RotateCcw,
    SendHorizontal,
    Sparkles,
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

type ReplyLanguage = 'auto' | 'en' | 'ar';

type TranslationTarget = Exclude<ReplyLanguage, 'auto'>;

type MessageTranslation = {
    target: TranslationTarget;
    text: string | null;
    showing: boolean;
    loading: boolean;
    error: string | null;
};

type AiChatWidgetProps = {
    endpoint: string;
    translateEndpoint: string;
    title: string;
    subtitle: string;
    greeting: string;
    suggestions: string[];
    placeholder: string;
    teaser: string;
};

const MAX_LENGTH = 1000;
const TEASER_DELAY_MS = 4000;
const TEASER_DISMISSED_KEY = 'ai_chat.teaser_dismissed';
const REPLY_LANGUAGE_KEY = 'ai_chat.reply_language';
const REPLY_LANGUAGES: ReplyLanguage[] = ['auto', 'en', 'ar'];
const ARABIC_SCRIPT = /[\u0600-\u06FF]/;

function translationTargetFor(text: string): TranslationTarget {
    return ARABIC_SCRIPT.test(text) ? 'en' : 'ar';
}

function storedReplyLanguage(): ReplyLanguage {
    if (typeof window === 'undefined') {
        return 'auto';
    }

    const stored = window.localStorage.getItem(REPLY_LANGUAGE_KEY);

    return REPLY_LANGUAGES.includes(stored as ReplyLanguage)
        ? (stored as ReplyLanguage)
        : 'auto';
}

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
    const pattern =
        /\[([^\]]+)\]\(([^)\s]+)\)|\*\*([^*]+)\*\*|\*([^*\s][^*]*?)\*/g;
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
        } else if (match[4] !== undefined) {
            nodes.push(<em key={key}>{match[4]}</em>);
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

    return (
        <div dir="auto" className="space-y-2 text-start break-words">
            {blocks}
        </div>
    );
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

function TranslateAction({
    translation,
    target,
    onClick,
}: {
    translation?: MessageTranslation;
    target: TranslationTarget;
    onClick: () => void;
}) {
    const { t } = useLocale();

    const label = translation?.loading
        ? t('chatbot.translating')
        : translation?.showing
          ? t('chatbot.show_original')
          : t(`chatbot.translate_to_${translation?.target ?? target}`);

    return (
        <div className="mt-2 border-t border-[#eef2f7] pt-1.5">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px]">
                {translation?.showing ? (
                    <span className="text-[#94a3b8]">
                        {t('chatbot.translated')}
                    </span>
                ) : null}
                <button
                    type="button"
                    onClick={onClick}
                    disabled={translation?.loading}
                    className="inline-flex cursor-pointer items-center gap-1 font-semibold text-[#0057c8] hover:underline disabled:cursor-wait disabled:opacity-70"
                >
                    {translation?.loading ? (
                        <LoaderCircle className="size-3 animate-spin" />
                    ) : (
                        <Languages className="size-3" />
                    )}
                    {label}
                </button>
            </div>
            {translation?.error ? (
                <p className="mt-1 text-[11px] text-[#b91c1c]">
                    {translation.error}
                </p>
            ) : null}
        </div>
    );
}

export function AiChatWidget({
    endpoint,
    translateEndpoint,
    title,
    subtitle,
    greeting,
    suggestions,
    placeholder,
    teaser,
}: AiChatWidgetProps) {
    const { t } = useLocale();
    const [open, setOpen] = useState(false);
    const [showTeaser, setShowTeaser] = useState(false);
    const [loaded, setLoaded] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [sending, setSending] = useState(false);
    const [replyLanguage, setReplyLanguage] =
        useState<ReplyLanguage>(storedReplyLanguage);
    const [translations, setTranslations] = useState<
        Record<number, MessageTranslation>
    >({});
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

    const teaserStorageKey = `${TEASER_DISMISSED_KEY}:${endpoint}`;

    useEffect(() => {
        if (sessionStorage.getItem(teaserStorageKey)) {
            return;
        }

        const timer = window.setTimeout(
            () => setShowTeaser(true),
            TEASER_DELAY_MS,
        );

        return () => window.clearTimeout(timer);
    }, [teaserStorageKey]);

    const dismissTeaser = useCallback(() => {
        setShowTeaser(false);
        sessionStorage.setItem(teaserStorageKey, '1');
    }, [teaserStorageKey]);

    const toggleOpen = useCallback(() => {
        dismissTeaser();
        setOpen((value) => !value);
    }, [dismissTeaser]);

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
                >(endpoint, 'POST', { message, language: replyLanguage });

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
        [endpoint, sending, replyLanguage, t],
    );

    const chooseReplyLanguage = (language: ReplyLanguage) => {
        setReplyLanguage(language);
        window.localStorage.setItem(REPLY_LANGUAGE_KEY, language);
    };

    const patchTranslation = (
        index: number,
        patch: Partial<MessageTranslation>,
    ) => {
        setTranslations((current) => {
            const existing = current[index];

            if (!existing) {
                return current;
            }

            return { ...current, [index]: { ...existing, ...patch } };
        });
    };

    const translate = async (index: number, content: string) => {
        const existing = translations[index];

        if (existing?.loading) {
            return;
        }

        if (existing?.text) {
            patchTranslation(index, { showing: !existing.showing });

            return;
        }

        const target = translationTargetFor(content);

        setTranslations((current) => ({
            ...current,
            [index]: {
                target,
                text: null,
                showing: false,
                loading: true,
                error: null,
            },
        }));

        try {
            const { ok, data } = await request<{
                translation?: string;
                message?: string;
                errors?: Record<string, string[]>;
            }>(translateEndpoint, 'POST', { text: content, target });

            if (ok && data?.translation) {
                patchTranslation(index, {
                    text: data.translation,
                    showing: true,
                    loading: false,
                });

                return;
            }

            patchTranslation(index, {
                loading: false,
                error:
                    (data?.errors && Object.values(data.errors)[0]?.[0]) ||
                    data?.message ||
                    t('chatbot.translate_failed'),
            });
        } catch {
            patchTranslation(index, {
                loading: false,
                error: t('chatbot.network_error'),
            });
        }
    };

    const reset = async () => {
        setMessages([]);
        setTranslations({});
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
                    className="fixed end-4 bottom-24 z-[60] flex h-[min(600px,calc(100svh-8rem))] w-[min(390px,calc(100vw-2rem))] origin-bottom-right animate-in flex-col overflow-hidden rounded-2xl border border-[#dbe5f5] bg-white shadow-[0_24px_60px_rgba(5,3,21,0.18)] duration-300 zoom-in-95 fade-in slide-in-from-bottom-4 sm:end-6 rtl:origin-bottom-left"
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

                    <div className="flex items-center gap-2 border-b border-[#e2e8f0] bg-white px-4 py-2 text-xs text-[#475569]">
                        <Languages className="size-3.5 shrink-0 text-[#0057c8]" />
                        <span id="ai-chat-reply-language" className="shrink-0">
                            {t('chatbot.reply_language')}
                        </span>
                        <div
                            role="radiogroup"
                            aria-labelledby="ai-chat-reply-language"
                            className="ms-auto flex rounded-full bg-[#f1f5f9] p-0.5"
                        >
                            {REPLY_LANGUAGES.map((language) => (
                                <button
                                    key={language}
                                    type="button"
                                    role="radio"
                                    aria-checked={replyLanguage === language}
                                    onClick={() =>
                                        chooseReplyLanguage(language)
                                    }
                                    className={cn(
                                        'cursor-pointer rounded-full px-2.5 py-1 font-semibold transition-colors',
                                        replyLanguage === language
                                            ? 'bg-[#0057c8] text-white shadow-sm'
                                            : 'text-[#475569] hover:text-[#0057c8]',
                                    )}
                                >
                                    {t(`chatbot.language_${language}`)}
                                </button>
                            ))}
                        </div>
                    </div>

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
                                    <RichText
                                        content={
                                            translations[index]?.showing &&
                                            translations[index]?.text
                                                ? translations[index].text
                                                : message.content
                                        }
                                    />
                                    {message.support ? (
                                        <SupportCard
                                            support={message.support}
                                        />
                                    ) : null}
                                    {message.isError ? null : (
                                        <TranslateAction
                                            translation={translations[index]}
                                            target={translationTargetFor(
                                                message.content,
                                            )}
                                            onClick={() =>
                                                void translate(
                                                    index,
                                                    message.content,
                                                )
                                            }
                                        />
                                    )}
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

            {showTeaser && !open ? (
                <div className="fixed end-22 bottom-7 z-[60] flex max-w-[min(240px,calc(100vw-7.5rem))] animate-in items-start gap-2 rounded-2xl rounded-ee-sm border border-[#dbe5f5] bg-white py-2.5 ps-3.5 pe-2 text-sm text-[#0f172a] shadow-[0_14px_36px_rgba(5,3,21,0.16)] duration-500 zoom-in-90 fade-in sm:end-24">
                    <button
                        type="button"
                        onClick={toggleOpen}
                        className="cursor-pointer text-start leading-snug font-medium"
                    >
                        {teaser}
                    </button>
                    <button
                        type="button"
                        onClick={dismissTeaser}
                        className="shrink-0 cursor-pointer rounded-full p-0.5 text-[#94a3b8] hover:bg-[#f1f5f9] hover:text-[#475569]"
                        aria-label={t('chatbot.dismiss')}
                    >
                        <X className="size-3.5" />
                    </button>
                </div>
            ) : null}

            <div
                className={cn(
                    'fixed end-4 bottom-5 z-[60] sm:end-6',
                    !open && 'motion-safe:animate-chatbot-float',
                )}
            >
                {!open ? (
                    <>
                        <span
                            aria-hidden="true"
                            className="motion-safe:animate-chatbot-ring pointer-events-none absolute inset-0 rounded-full bg-[#2563eb]"
                        />
                        <span
                            aria-hidden="true"
                            className="motion-safe:animate-chatbot-ring pointer-events-none absolute inset-0 rounded-full bg-[#06b6d4] [animation-delay:1.2s]"
                        />
                    </>
                ) : null}

                <button
                    type="button"
                    onClick={toggleOpen}
                    className="group motion-safe:animate-chatbot-gradient relative flex size-14 cursor-pointer items-center justify-center rounded-full bg-gradient-to-br from-[#0057c8] via-[#2563eb] to-[#06b6d4] text-white shadow-[0_12px_30px_rgba(0,87,200,0.45)] ring-4 ring-white/70 transition-all duration-300 hover:-translate-y-0.5 hover:scale-110 hover:shadow-[0_16px_40px_rgba(0,87,200,0.6)] focus-visible:ring-[#93c5fd] focus-visible:outline-none active:scale-95"
                    aria-label={open ? t('chatbot.close') : t('chatbot.open')}
                    aria-expanded={open}
                >
                    {open ? (
                        <X
                            key="close"
                            className="size-6 animate-in duration-300 zoom-in-50 spin-in-90"
                        />
                    ) : (
                        <Bot
                            key="open"
                            className="motion-safe:animate-chatbot-wave size-7"
                        />
                    )}

                    {!open ? (
                        <>
                            <Sparkles
                                aria-hidden="true"
                                className="absolute -start-1 -top-1 size-4 fill-[#fbbf24] text-[#f59e0b] motion-safe:animate-pulse"
                            />
                            <span
                                aria-hidden="true"
                                className="absolute end-0.5 top-0.5 flex size-3.5"
                            >
                                <span className="absolute inline-flex size-full rounded-full bg-[#22c55e] opacity-75 motion-safe:animate-ping" />
                                <span className="relative inline-flex size-3.5 rounded-full border-2 border-white bg-[#22c55e]" />
                            </span>
                        </>
                    ) : null}
                </button>
            </div>
        </>
    );
}

export function PublicChatWidget() {
    const { t } = useLocale();

    return (
        <AiChatWidget
            endpoint="/chatbot/messages"
            translateEndpoint="/chatbot/translate"
            title={t('chatbot.public.title')}
            subtitle={t('chatbot.public.subtitle')}
            greeting={t('chatbot.public.greeting')}
            placeholder={t('chatbot.placeholder')}
            teaser={t('chatbot.public.teaser')}
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
            translateEndpoint="/admin/ai-assistant/translate"
            title={t('chatbot.admin.title')}
            subtitle={t('chatbot.admin.subtitle')}
            greeting={t('chatbot.admin.greeting')}
            placeholder={t('chatbot.admin.placeholder')}
            teaser={t('chatbot.admin.teaser')}
            suggestions={[
                t('chatbot.admin.suggestion_overview'),
                t('chatbot.admin.suggestion_pending'),
                t('chatbot.admin.suggestion_revenue'),
                t('chatbot.admin.suggestion_inbox'),
            ]}
        />
    );
}
