import { Head, router, usePage } from '@inertiajs/react';
import { Check, Download, Eye, Search, X } from 'lucide-react';
import { useMemo, useState } from 'react';

import {
    exportMethod,
    index,
    show,
} from '@/actions/App/Http/Controllers/Backend/Admin/JobManagementController';
import {
    AdminPagination,
    AdminPanel,
    AdminStatusBadge,
    AdminTableShell,
} from '@/components/admin-portal/ui';
import { useLocale } from '@/hooks/use-locale';
import AdminPortalLayout from '@/layouts/admin-portal-layout';
import { cn } from '@/lib/utils';
import type { SharedData } from '@/types';

type JobRow = {
    id: number;
    title: string;
    employer: string;
    category: string;
    location: string;
    applications: number;
    views: number;
    status: string;
    status_value: string;
    created: string | null;
    can_review: boolean;
};

type Props = {
    jobs: {
        data: JobRow[];
        links: Array<{ url: string | null; label: string; active: boolean }>;
        from: number | null;
        to: number | null;
        total: number;
    };
    filters: { status: string; search: string };
    stats: {
        total: number;
        active: number;
        pending: number;
        rejected: number;
        expired: number;
    };
};

const filterChipKeys = [
    ['all', 'common.all'],
    ['active', 'common.active'],
    ['pending', 'common.pending'],
    ['rejected', 'common.rejected'],
    ['expired', 'common.expired'],
] as const;

function jobStatusTone(
    value: string,
): 'success' | 'warning' | 'danger' | 'neutral' {
    if (value === 'Active') {
        return 'success';
    }
    if (value === 'Pending') {
        return 'warning';
    }
    if (value === 'Rejected') {
        return 'danger';
    }

    return 'neutral';
}

function jobReference(id: number): string {
    return `JOB-${String(id).padStart(4, '0')}`;
}

export default function JobManagement({ jobs, filters, stats }: Props) {
    const { flash } = usePage<SharedData>().props;
    const { t } = useLocale();
    const [search, setSearch] = useState(filters.search ?? '');

    const query = useMemo(() => {
        const params = new URLSearchParams();

        if (filters.status) {
            params.set('status', filters.status);
        }

        if (search.trim() !== '') {
            params.set('search', search.trim());
        }

        const encoded = params.toString();

        return encoded === '' ? '' : `?${encoded}`;
    }, [filters.status, search]);

    const visitList = (status: string, searchValue = search): void => {
        router.get(
            index.url({
                query: {
                    ...(status !== 'all' && status !== '' ? { status } : {}),
                    ...(searchValue.trim() !== ''
                        ? { search: searchValue.trim() }
                        : {}),
                },
            }),
            {},
            { preserveState: true, replace: true },
        );
    };

    return (
        <AdminPortalLayout>
            <Head title={t('admin.jobs.title')} />

            <div className="space-y-6 p-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-[22px] leading-[33px] font-bold text-[#0f172a]">
                            {t('admin.jobs.title')}
                        </h1>
                        <p className="pt-1 text-[13px] leading-[19.5px] text-[#94a3b8]">
                            {t('admin.jobs.subtitle')}
                        </p>
                    </div>
                    <a
                        href={`${exportMethod.url()}${query}`}
                        className="inline-flex h-[34px] items-center justify-center gap-1.5 rounded-[6px] border border-[#e2e8f0] bg-[#f1f5f9] px-[14px] py-[7px] text-[13px] font-semibold text-[#475569] hover:bg-white"
                    >
                        <Download className="size-3.5" strokeWidth={2} />
                        {t('common.export')}
                    </a>
                </div>

                {flash.success && (
                    <div className="rounded-xl border border-[#bbf7d0] bg-[#f0fdf4] px-4 py-3 text-sm text-[#15803d]">
                        {typeof flash.success === 'string'
                            ? flash.success
                            : t('common.saved')}
                    </div>
                )}

                <div className="grid grid-cols-2 gap-2.5 xl:grid-cols-5">
                    {(
                        [
                            [
                                t('admin.jobs.stats.total'),
                                stats.total,
                                'text-[#0057c8]',
                            ],
                            [
                                t('admin.jobs.stats.active'),
                                stats.active,
                                'text-[#e57124]',
                            ],
                            [
                                t('admin.jobs.stats.pending'),
                                stats.pending,
                                'text-[#f59e0b]',
                            ],
                            [
                                t('admin.jobs.stats.rejected'),
                                stats.rejected,
                                'text-[#ef4444]',
                            ],
                            [
                                t('admin.jobs.stats.expired'),
                                stats.expired,
                                'text-[#94a3b8]',
                            ],
                        ] as const
                    ).map(([label, value, tone]) => (
                        <div
                            key={label}
                            className="rounded-[8px] border border-[#e2e8f0] bg-white px-[14px] py-[12px]"
                        >
                            <p
                                className={cn(
                                    'text-[18px] leading-[27px] font-bold',
                                    tone,
                                )}
                            >
                                {Number(value).toLocaleString()}
                            </p>
                            <p className="pt-0.5 text-[11px] leading-[16.5px] text-[#94a3b8]">
                                {label}
                            </p>
                        </div>
                    ))}
                </div>

                <AdminPanel className="rounded-[8px] p-0 shadow-none">
                    <div className="flex flex-col gap-2.5 border-b border-[#e2e8f0] px-4 py-3.5 lg:flex-row lg:items-center">
                        <form
                            className="relative min-w-[200px] flex-1"
                            onSubmit={(event) => {
                                event.preventDefault();
                                visitList(filters.status || 'all');
                            }}
                        >
                            <Search className="absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-[#94a3b8]" />
                            <input
                                type="search"
                                placeholder={t('admin.jobs.search_placeholder')}
                                value={search}
                                onChange={(event) =>
                                    setSearch(event.target.value)
                                }
                                className="h-[34px] w-full rounded-[6px] border border-[#e2e8f0] bg-white py-2 pr-3 pl-8 text-[13px] text-[#0f172a] outline-none placeholder:text-[#0f172a]/50 focus:border-[#0057c8]"
                            />
                        </form>
                        <div className="flex flex-wrap items-center gap-2.5">
                            {filterChipKeys.map(([key, labelKey]) => {
                                const active =
                                    (filters.status || 'all') === key;

                                return (
                                    <button
                                        key={key}
                                        type="button"
                                        onClick={() => visitList(key)}
                                        className={cn(
                                            'h-[34px] cursor-pointer rounded-[6px] px-2.5 py-[5px] text-[12px] font-semibold',
                                            active
                                                ? 'bg-[#0057c8] text-white'
                                                : 'border border-[#e2e8f0] bg-[#f1f5f9] text-[#475569]',
                                        )}
                                    >
                                        {t(labelKey)}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <AdminTableShell
                        headers={[
                            t('admin.jobs.cols.title'),
                            t('admin.jobs.cols.employer'),
                            t('admin.jobs.fields.category'),
                            t('common.location'),
                            t('admin.jobs.cols.applications'),
                            t('admin.jobs.fields.views'),
                            t('common.status'),
                            t('common.created'),
                            t('common.actions'),
                        ]}
                    >
                        {jobs.data.map((row) => (
                            <tr
                                key={row.id}
                                className="border-b border-[#f1f5f9] last:border-0"
                            >
                                <td className="px-3 py-2.5">
                                    <button
                                        type="button"
                                        className="text-left hover:underline"
                                        onClick={() =>
                                            router.visit(show.url(row.id))
                                        }
                                    >
                                        <p className="text-[13px] leading-[19.5px] font-semibold text-[#0f172a]">
                                            {row.title}
                                        </p>
                                        <p className="text-[11px] leading-[16.5px] text-[#94a3b8]">
                                            {jobReference(row.id)}
                                        </p>
                                    </button>
                                </td>
                                <td className="px-4 py-3 text-[12px] text-[#64748b]">
                                    {row.employer}
                                </td>
                                <td className="px-4 py-3">
                                    <span className="inline-flex rounded-full bg-[#dbeafe] px-2 py-0.5 text-[11px] font-semibold tracking-[0.22px] text-[#1e40af]">
                                        {row.category}
                                    </span>
                                </td>
                                <td className="px-4 py-3 text-[12px] text-[#0f172a]">
                                    {row.location}
                                </td>
                                <td className="px-4 py-3 text-[12px] font-semibold text-[#0f172a]">
                                    {row.applications}
                                </td>
                                <td className="px-4 py-3 text-[12px] text-[#64748b]">
                                    {row.views}
                                </td>
                                <td className="px-4 py-3">
                                    <AdminStatusBadge
                                        label={row.status}
                                        tone={jobStatusTone(row.status)}
                                    />
                                </td>
                                <td className="px-4 py-3 text-[12px] text-[#64748b]">
                                    {row.created ?? '—'}
                                </td>
                                <td className="px-1 py-3">
                                    <div className="flex items-center gap-1">
                                        <button
                                            type="button"
                                            className="flex h-[23px] items-center rounded-[6px] px-2.5 py-[5px] text-[#64748b] hover:bg-[#f8fafc]"
                                            aria-label={t('admin.jobs.view_details')}
                                            onClick={() =>
                                                router.visit(show.url(row.id))
                                            }
                                        >
                                            <Eye
                                                className="size-[13px]"
                                                strokeWidth={2}
                                            />
                                        </button>
                                        {row.can_review ? (
                                            <>
                                                <button
                                                    type="button"
                                                    className="flex h-[23px] items-center rounded-[6px] bg-[#d1fae5] px-2.5 py-[5px] text-[#065f46] hover:bg-[#a7f3d0]"
                                                    aria-label={t('admin.jobs.approve')}
                                                    onClick={() =>
                                                        router.visit(
                                                            show.url(row.id),
                                                        )
                                                    }
                                                >
                                                    <Check
                                                        className="size-[11px]"
                                                        strokeWidth={2.5}
                                                    />
                                                </button>
                                                <button
                                                    type="button"
                                                    className="flex h-[23px] items-center rounded-[6px] bg-[#fee2e2] px-2.5 py-[5px] text-[#991b1b] hover:bg-[#fecaca]"
                                                    aria-label={t('admin.jobs.reject')}
                                                    onClick={() =>
                                                        router.visit(
                                                            show.url(row.id),
                                                        )
                                                    }
                                                >
                                                    <X
                                                        className="size-[11px]"
                                                        strokeWidth={2.5}
                                                    />
                                                </button>
                                            </>
                                        ) : null}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </AdminTableShell>

                    {jobs.data.length === 0 && (
                        <p className="mt-6 text-center text-sm text-[#99a1af]">
                            {t('admin.jobs.empty')}
                        </p>
                    )}

                    <div className="px-4 pb-4">
                        <AdminPagination
                            showingLabel={t('common.showing_range', {
                            from: 1,
                            to: jobs.to ?? 0,
                            total: jobs.total,
                        })}
                            links={jobs.links}
                        />
                    </div>
                </AdminPanel>
            </div>
        </AdminPortalLayout>
    );
}
