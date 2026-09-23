import { Link } from '@inertiajs/react';

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

export function JobListingCard({
    job,
    href,
    className,
    applied = false,
    appliedLabel,
}: JobListingCardProps) {
    const { t } = useLocale();
    const jobHref = href ?? jobShow.url(job.slug);

    return (
        <article
            className={cn(
                'flex flex-col gap-4 rounded-md border border-[#d1d5db] bg-white p-4 sm:flex-row sm:items-center sm:gap-5 sm:p-5',
                className,
            )}
        >
            <div className="flex min-w-0 flex-1 items-center gap-4 sm:gap-5">
                <div className="flex size-[96px] shrink-0 items-center justify-center overflow-hidden rounded-xl border border-[#e2e8f0] bg-[#f8faff] sm:size-[112px]">
                    {job.logo_url ? (
                        <img
                            src={job.logo_url}
                            alt={job.company || job.title}
                            className="size-full object-cover"
                        />
                    ) : (
                        <div
                            className="flex size-full items-center justify-center text-base font-bold text-white sm:text-lg"
                            style={{
                                backgroundImage:
                                    'linear-gradient(135deg, rgb(30, 58, 138) 0%, rgb(37, 99, 235) 100%)',
                            }}
                        >
                            {job.initials}
                        </div>
                    )}
                </div>

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

                    <div className="mt-3 flex flex-wrap gap-2">
                        <Link
                            href={jobHref}
                            className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg border border-[#bfdbfe] bg-white px-3.5 text-sm font-semibold text-[#0057c8] transition hover:bg-[#eff6ff]"
                        >
                            {t('common.view')}
                        </Link>
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
                        {t('jobs_page.apply')}
                    </Link>
                )}
            </div>
        </article>
    );
}
