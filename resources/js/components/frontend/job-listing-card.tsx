import { Link } from '@inertiajs/react';
import { Share2 } from 'lucide-react';
import { useState } from 'react';

import { useLocale } from '@/hooks/use-locale';
import { cn } from '@/lib/utils';
import { show as jobShow } from '@/routes/jobs';

export type JobListingCardJob = {
    id?: number;
    slug: string;
    title: string;
    company: string | null;
    initials: string;
    logo_url?: string | null;
    location: string | null;
    closing_date?: string | null;
};

type JobListingCardProps = {
    job: JobListingCardJob;
    href?: string;
    className?: string;
    applied?: boolean;
    appliedLabel?: string;
};

/** Square company mark: fills the frame without empty padding bands. */
export function CompanyLogoMark({
    logoUrl,
    alt,
    initials,
    className,
}: {
    logoUrl?: string | null;
    alt: string;
    initials: string;
    className?: string;
}) {
    const [failed, setFailed] = useState(false);

    return (
        <div
            className={cn(
                'flex shrink-0 items-center justify-center overflow-hidden rounded-xl border border-[#e5e7eb] bg-white',
                className ?? 'size-[96px] sm:size-[112px]',
            )}
        >
            {logoUrl && !failed ? (
                <img
                    src={logoUrl}
                    alt={alt}
                    onError={() => setFailed(true)}
                    className="size-full object-cover object-center"
                />
            ) : (
                <div
                    className="flex size-full items-center justify-center text-base font-bold text-white sm:text-lg"
                    style={{
                        backgroundImage:
                            'linear-gradient(135deg, rgb(30, 58, 138) 0%, rgb(37, 99, 235) 100%)',
                    }}
                >
                    {initials}
                </div>
            )}
        </div>
    );
}

async function shareJob(url: string, title: string): Promise<boolean> {
    try {
        if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
            await navigator.share({ title, url, text: title });

            return true;
        }
    } catch {
        // Fall through to clipboard.
    }

    try {
        await navigator.clipboard.writeText(url);

        return true;
    } catch {
        return false;
    }
}

export function JobListingCard({
    job,
    href,
    className,
    applied = false,
    appliedLabel,
}: JobListingCardProps) {
    const { t } = useLocale();
    const jobHref = href ?? jobShow.url(job.slug);
    const absoluteUrl =
        typeof window !== 'undefined'
            ? new URL(jobHref, window.location.origin).toString()
            : jobHref;
    const [shareNote, setShareNote] = useState<string | null>(null);

    const onShare = async (): Promise<void> => {
        const ok = await shareJob(absoluteUrl, job.title);
        setShareNote(
            ok ? t('jobs_page.share_copied') : t('jobs_page.share_failed'),
        );
        window.setTimeout(() => setShareNote(null), 2000);
    };

    return (
        <article
            className={cn(
                'flex flex-col gap-4 rounded-md border border-[#d1d5db] bg-white p-4 sm:flex-row sm:items-center sm:gap-5 sm:p-5',
                className,
            )}
        >
            <div className="flex min-w-0 flex-1 items-center gap-4 sm:gap-5">
                <CompanyLogoMark
                    logoUrl={job.logo_url}
                    alt={job.company || job.title}
                    initials={job.initials}
                />

                <div className="min-w-0 flex-1">
                    <Link
                        href={jobHref}
                        className="block text-base font-bold leading-snug text-[#1e3a8a] hover:underline sm:text-lg"
                    >
                        {job.title}
                    </Link>

                    {job.company ? (
                        <p className="mt-1 text-sm font-semibold text-[#e57124] sm:text-[15px]">
                            {job.company}
                        </p>
                    ) : null}

                    {job.location ? (
                        <p className="mt-2 text-sm text-[#111827]">
                            <span className="font-medium">
                                {t('jobs_page.location_label')}:
                            </span>{' '}
                            {job.location}
                        </p>
                    ) : null}

                    {job.closing_date ? (
                        <p className="mt-1 text-sm text-[#111827]">
                            <span className="font-medium">
                                {t('jobs_page.closing_date')}:
                            </span>{' '}
                            {job.closing_date}
                        </p>
                    ) : null}

                    <div className="mt-3 flex flex-wrap items-center gap-2">
                        <Link
                            href={jobHref}
                            className="inline-flex h-8 items-center justify-center rounded-lg border border-[#bfdbfe] bg-white px-3.5 text-sm font-semibold text-[#0057c8] transition hover:bg-[#eff6ff]"
                        >
                            {t('common.view')}
                        </Link>
                        <button
                            type="button"
                            onClick={() => void onShare()}
                            className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg border border-[#e2e8f0] bg-white px-3.5 text-sm font-semibold text-[#475569] transition hover:bg-[#f8fafc]"
                        >
                            <Share2 className="size-3.5" strokeWidth={2} />
                            {t('common.share')}
                        </button>
                        {shareNote ? (
                            <span className="text-xs font-medium text-[#15803d]">
                                {shareNote}
                            </span>
                        ) : null}
                    </div>
                </div>
            </div>

            <div className="flex shrink-0 sm:ps-2">
                {applied ? (
                    <span className="inline-flex h-10 w-full items-center justify-center rounded-xl bg-[#e2e8f0] px-5 text-sm font-semibold text-[#64748b] sm:w-auto">
                        {appliedLabel ?? t('job_seeker.dashboard.applied')}
                    </span>
                ) : (
                    <Link
                        href={jobHref}
                        className="inline-flex h-10 w-full items-center justify-center rounded-xl bg-[#0057c8] px-5 text-sm font-semibold text-white transition hover:brightness-110 sm:w-auto"
                    >
                        {t('common.view')}
                    </Link>
                )}
            </div>
        </article>
    );
}
