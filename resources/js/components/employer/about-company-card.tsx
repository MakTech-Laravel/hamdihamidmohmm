import { ExternalLink } from 'lucide-react';
import { useMemo, useState } from 'react';

import { RichTextContent } from '@/components/ui/rich-text-editor';
import { useLocale } from '@/hooks/use-locale';
import { cn } from '@/lib/utils';

const ABOUT_PREVIEW_LIMIT = 300;

type AboutCompanyCardProps = {
    title: string;
    companyName: string;
    industry?: string | null;
    about?: string | null;
    website?: string | null;
    logoUrl?: string | null;
    initials?: string;
    visitWebsiteLabel: string;
    className?: string;
};

export function AboutCompanyCard({
    title,
    companyName,
    industry,
    about,
    website,
    logoUrl,
    initials = 'CO',
    visitWebsiteLabel,
    className,
}: AboutCompanyCardProps) {
    const { t } = useLocale();
    const [expanded, setExpanded] = useState(false);
    const websiteHref = normalizeWebsite(website);

    const aboutPlain = useMemo(() => toPlainText(about), [about]);
    const needsSeeMore = aboutPlain.length > ABOUT_PREVIEW_LIMIT;
    const previewPlain = needsSeeMore
        ? `${aboutPlain.slice(0, ABOUT_PREVIEW_LIMIT).trimEnd()}…`
        : aboutPlain;

    return (
        <article
            className={cn(
                'min-w-0 overflow-hidden rounded-2xl border border-[#e2e8f0] bg-white p-5 shadow-[0px_1px_1.5px_rgba(0,0,0,0.06)]',
                className,
            )}
        >
            <h2 className="text-lg font-bold text-[#050315]">{title}</h2>

            <div className="mt-4 flex items-center gap-4">
                {logoUrl ? (
                    <img
                        src={logoUrl}
                        alt={companyName}
                        className="size-[112px] shrink-0 rounded-2xl border border-[#e2e8f0] bg-[#f8faff] object-cover"
                    />
                ) : (
                    <div
                        className="flex size-[112px] shrink-0 items-center justify-center rounded-2xl text-xl font-bold text-white"
                        style={{
                            backgroundImage:
                                'linear-gradient(135deg, rgb(30, 58, 138) 0%, rgb(37, 99, 235) 100%)',
                        }}
                    >
                        {initials}
                    </div>
                )}
                <div className="min-w-0">
                    <p className="truncate text-base font-semibold text-[#050315]">
                        {companyName}
                    </p>
                    {industry ? (
                        <p className="truncate text-xs text-[#6a7282]">
                            {industry}
                        </p>
                    ) : null}
                </div>
            </div>

            {about ? (
                <div className="mt-4 min-w-0 overflow-hidden">
                    {needsSeeMore && !expanded ? (
                        <p className="break-words text-sm leading-6 text-[#4a5565] [overflow-wrap:anywhere]">
                            {previewPlain}
                        </p>
                    ) : (
                        <RichTextContent
                            html={about}
                            className="break-words text-[#4a5565] [overflow-wrap:anywhere]"
                        />
                    )}
                    {needsSeeMore ? (
                        <button
                            type="button"
                            onClick={() => setExpanded((open) => !open)}
                            className="mt-2 cursor-pointer text-sm font-semibold text-[#0057c8] transition hover:underline"
                        >
                            {expanded
                                ? t('job_detail.see_less')
                                : t('job_detail.see_more')}
                        </button>
                    ) : null}
                </div>
            ) : null}

            {websiteHref ? (
                <a
                    href={websiteHref}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[#0057c8] transition hover:underline"
                >
                    <ExternalLink className="size-4" />
                    {visitWebsiteLabel}
                </a>
            ) : null}
        </article>
    );
}

function toPlainText(html?: string | null): string {
    if (!html?.trim()) {
        return '';
    }

    return html
        .replace(/<br\s*\/?>/gi, ' ')
        .replace(/<\/(p|div|li|h[1-6])>/gi, ' ')
        .replace(/<[^>]+>/g, '')
        .replace(/&nbsp;/gi, ' ')
        .replace(/&amp;/gi, '&')
        .replace(/&lt;/gi, '<')
        .replace(/&gt;/gi, '>')
        .replace(/&quot;/gi, '"')
        .replace(/&#39;/gi, "'")
        .replace(/\s+/g, ' ')
        .trim();
}

function normalizeWebsite(website?: string | null): string | null {
    if (!website?.trim()) {
        return null;
    }

    const value = website.trim();

    if (/^https?:\/\//i.test(value)) {
        return value;
    }

    return `https://${value}`;
}
