import { Head, Link, router } from '@inertiajs/react';
import { useMemo, useState } from 'react';

import { useLocale } from '@/hooks/use-locale';
import EmployerLayout from '@/layouts/employer-layout';
import { cn } from '@/lib/utils';

type JobRow = {
    id: number;
    title: string;
    category: string | null;
    location: string | null;
    type: string | null;
    salary_range: string | null;
    status: string;
    status_value: string;
    applications: number;
    new_applications: number;
    views: number;
    expires_at: string | null;
    created_at: string | null;
};

type Props = {
    jobs: JobRow[];
    stats: { total: number; active: number; draft: number; expired: number };
    plan: { credits_remaining: number; can_post_job: boolean } | null;
};

const statusTone: Record<string, string> = {
    active: 'bg-[#dcfce7] text-[#166534]',
    draft: 'bg-[#f1f5f9] text-[#475569]',
    pending: 'bg-[#fff7ed] text-[#c2410c]',
    expired: 'bg-[#fef2f2] text-[#b91c1c]',
    rejected: 'bg-[#f3f4f6] text-[#6b7280]',
};

type FilterId = 'all' | 'active' | 'draft' | 'expired' | 'closed';

const formatJobType = (type: string | null): string => {
    if (!type) {
        return '—';
    }

    return type
        .replaceAll('-', ' ')
        .replace(/\b\w/g, (character) => character.toUpperCase());
};

const actionClass =
    'inline-flex h-7 cursor-pointer items-center justify-center rounded-lg px-2.5 text-xs font-semibold';

export default function EmployerJobs({ jobs, stats, plan }: Props) {
    const { t } = useLocale();
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState<FilterId>('all');

    const filters = [
        { id: 'all' as const, label: t('common.all') },
        { id: 'active' as const, label: t('common.active') },
        { id: 'draft' as const, label: t('employer.jobs.filter.draft') },
        { id: 'expired' as const, label: t('employer.jobs.filter.expired') },
        { id: 'closed' as const, label: t('employer.jobs.filter.closed') },
    ];

    const filtered = useMemo(() => {
        const query = search.toLowerCase();

        return jobs.filter((job) => {
            const matchesQuery =
                query === '' ||
                job.title.toLowerCase().includes(query) ||
                (job.category ?? '').toLowerCase().includes(query) ||
                (job.location ?? '').toLowerCase().includes(query);

            const matchesFilter =
                filter === 'all' ||
                (filter === 'draft' &&
                    ['draft', 'pending'].includes(job.status_value)) ||
                (filter === 'closed' && job.status_value === 'rejected') ||
                job.status_value === filter;

            return matchesQuery && matchesFilter;
        });
    }, [jobs, search, filter]);

    const statCards = [
        {
            label: t('employer.jobs.stat.total'),
            value: stats.total,
            box: 'bg-[#e6f0fb] text-[#0057c8]',
        },
        {
            label: t('employer.jobs.stat.active'),
            value: stats.active,
            box: 'bg-[#dcfce7] text-[#166534]',
        },
        {
            label: t('employer.jobs.stat.draft'),
            value: stats.draft,
            box: 'bg-[#f1f5f9] text-[#475569]',
        },
        {
            label: t('employer.jobs.stat.expired'),
            value: stats.expired,
            box: 'bg-[#fef2f2] text-[#b91c1c]',
        },
    ];

    const headings = [
        t('employer.jobs.col.job'),
        t('employer.jobs.col.location_type'),
        t('employer.jobs.col.salary'),
        t('common.status'),
        t('employer.jobs.col.applications'),
        t('employer.jobs.col.views'),
        t('common.actions'),
    ];

    return (
        <EmployerLayout title={t('employer.jobs.title')}>
            <Head title={t('employer.jobs.title')} />

            <div className="flex flex-col gap-5 px-4 py-6 sm:px-6">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl leading-9 font-bold text-[#050315]">
                            {t('employer.jobs.title')}
                        </h1>
                        <p className="mt-1 text-sm leading-[21px] text-[#475569]">
                            {t('employer.jobs.subtitle')}
                        </p>
                    </div>
                    <Link
                        href="/employer/jobs/create"
                        className="inline-flex cursor-pointer items-center rounded-xl bg-[#0057c8] px-6 py-3 text-base font-medium tracking-[-0.18px] text-white"
                    >
                        {t('employer.jobs.post_new')}
                    </Link>
                </div>

                {plan && !plan.can_post_job && (
                    <p className="rounded-xl border border-[#fed7aa] bg-[#fff7ed] px-4 py-3 text-sm text-[#c2410c]">
                        {t('employer.jobs.credits_warning')}
                    </p>
                )}

                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    {statCards.map((stat) => (
                        <div
                            key={stat.label}
                            className="flex items-center gap-3.5 rounded-2xl border border-[#e8d5e8] bg-white px-5 py-4"
                        >
                            <div
                                className={cn(
                                    'flex size-11 shrink-0 items-center justify-center rounded-xl text-lg leading-[27px] font-extrabold',
                                    stat.box,
                                )}
                            >
                                {stat.value}
                            </div>
                            <p className="text-sm font-semibold text-[#475569]">
                                {stat.label}
                            </p>
                        </div>
                    ))}
                </div>

                <div className="overflow-hidden rounded-2xl border border-[#e8d5e8] bg-white">
                    <div className="flex flex-col gap-4 border-b border-[#e8d5e8] px-5 py-4 lg:flex-row lg:items-center">
                        <div className="relative w-full max-w-[334px]">
                            <img
                                src="/images/jobs/search.svg"
                                alt=""
                                width={20}
                                height={20}
                                className="pointer-events-none absolute top-1/2 left-3.5 size-5 -translate-y-1/2"
                            />
                            <input
                                value={search}
                                onChange={(event) =>
                                    setSearch(event.target.value)
                                }
                                placeholder={t('employer.jobs.search')}
                                className="h-[41px] w-full rounded-lg border border-[#e8d5e8] bg-white py-2 pr-3.5 pl-11 text-[15px] text-[#050315] outline-none placeholder:text-[#050315]/50"
                            />
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                            {filters.map((item) => (
                                <button
                                    key={item.id}
                                    type="button"
                                    onClick={() => setFilter(item.id)}
                                    className={cn(
                                        'cursor-pointer rounded-full px-4 py-1.5 text-sm font-semibold',
                                        filter === item.id
                                            ? 'bg-[#0057c8] text-white'
                                            : 'bg-[#f1f5f9] text-[#3977a6]',
                                    )}
                                >
                                    {item.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[1080px] text-left">
                            <thead>
                                <tr className="border-b border-[#d1f6ff]">
                                    {headings.map((heading) => (
                                        <th
                                            key={heading}
                                            className="px-5 py-2.5 text-[13px] leading-[19.5px] font-bold text-[#475569]"
                                        >
                                            {heading}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((job) => (
                                    <tr
                                        key={job.id}
                                        className="border-b border-[#d1f6ff] last:border-b-0"
                                    >
                                        <td className="px-5 py-4 align-top">
                                            <p className="text-[15px] leading-[22.5px] font-bold text-[#050315]">
                                                {job.title}
                                            </p>
                                            {job.category && (
                                                <span className="mt-1 inline-flex rounded-full bg-[#e6f0fb] px-2.5 py-px text-xs font-semibold text-[#0057c8]">
                                                    {job.category}
                                                </span>
                                            )}
                                            <p className="mt-1.5 text-xs leading-[18px] text-[#94a3b8]">
                                                {t(
                                                    'employer.jobs.posted_expires',
                                                    {
                                                        posted:
                                                            job.created_at ||
                                                            '—',
                                                        expires:
                                                            job.expires_at ||
                                                            '—',
                                                    },
                                                )}
                                            </p>
                                        </td>
                                        <td className="px-5 py-4 align-top">
                                            <p className="text-sm font-medium text-[#475569]">
                                                📍 {job.location || '—'}
                                            </p>
                                            <span className="mt-1 inline-flex rounded-full bg-[#fff7ed] px-2 py-0.5 text-xs font-semibold text-[#c2410c]">
                                                {formatJobType(job.type)}
                                            </span>
                                        </td>
                                        <td className="px-5 py-4 align-top text-sm font-semibold text-[#0057c8]">
                                            {job.salary_range || '—'}
                                        </td>
                                        <td className="px-5 py-4 align-top">
                                            <span
                                                className={cn(
                                                    'inline-flex rounded-full px-3 py-0.5 text-[13px] leading-[19.5px] font-bold',
                                                    statusTone[
                                                        job.status_value
                                                    ] ??
                                                        'bg-[#f1f5f9] text-[#475569]',
                                                )}
                                            >
                                                {job.status_value === 'rejected'
                                                    ? t('employer.jobs.closed')
                                                    : job.status}
                                            </span>
                                        </td>
                                        <td className="px-5 py-4 align-top">
                                            <div className="flex items-center gap-1.5">
                                                <span className="text-base font-bold text-[#050315]">
                                                    {job.applications}
                                                </span>
                                                {job.new_applications > 0 && (
                                                    <span className="rounded-full bg-[#e57124] px-2 py-0.5 text-[11.2px] leading-[16.8px] font-bold text-white">
                                                        {t(
                                                            'employer.jobs.new_count',
                                                            {
                                                                count: job.new_applications,
                                                            },
                                                        )}
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-5 py-4 align-top text-[14.4px] leading-[21.6px] font-medium text-[#475569]">
                                            👁 {job.views}
                                        </td>
                                        <td className="px-5 py-4 align-top">
                                            <div className="flex w-[188px] flex-wrap gap-1.5">
                                                <Link
                                                    href="/employer/applications"
                                                    className={cn(
                                                        actionClass,
                                                        'bg-[#e6f0fb] text-[#0057c8]',
                                                    )}
                                                >
                                                    {t(
                                                        'employer.jobs.view_applicants',
                                                    )}
                                                </Link>
                                                <Link
                                                    href={`/employer/jobs/${job.id}/edit`}
                                                    className={cn(
                                                        actionClass,
                                                        'bg-[#f1f5f9] text-[#475569]',
                                                    )}
                                                >
                                                    {t('common.edit')}
                                                </Link>
                                                <button
                                                    type="button"
                                                    className={cn(
                                                        actionClass,
                                                        'bg-[#f1f5f9] text-[#475569]',
                                                    )}
                                                    onClick={() =>
                                                        router.post(
                                                            `/employer/jobs/${job.id}/duplicate`,
                                                        )
                                                    }
                                                >
                                                    {t(
                                                        'employer.jobs.duplicate',
                                                    )}
                                                </button>
                                                {job.status_value ===
                                                    'active' && (
                                                    <button
                                                        type="button"
                                                        className={cn(
                                                            actionClass,
                                                            'bg-[#fef2f2] text-[#b91c1c]',
                                                        )}
                                                        onClick={() =>
                                                            router.post(
                                                                `/employer/jobs/${job.id}/pause`,
                                                            )
                                                        }
                                                    >
                                                        {t(
                                                            'employer.jobs.pause',
                                                        )}
                                                    </button>
                                                )}
                                                {(job.status_value ===
                                                    'draft' ||
                                                    job.status_value ===
                                                        'rejected') && (
                                                    <button
                                                        type="button"
                                                        className={cn(
                                                            actionClass,
                                                            'bg-[#dcfce7] text-[#166534]',
                                                        )}
                                                        onClick={() =>
                                                            router.post(
                                                                `/employer/jobs/${job.id}/publish`,
                                                            )
                                                        }
                                                    >
                                                        {t('common.publish')}
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {filtered.length === 0 && (
                            <p className="px-5 py-10 text-center text-sm text-[#99a1af]">
                                {t('employer.jobs.empty_cta')}
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </EmployerLayout>
    );
}
