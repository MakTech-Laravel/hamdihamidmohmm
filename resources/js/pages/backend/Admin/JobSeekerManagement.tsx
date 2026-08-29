import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    Download,
    Eye,
    Pencil,
    Plus,
    Search,
    UserRound,
} from 'lucide-react';
import { useMemo, useState } from 'react';

import {
    AdminPageHeader,
    AdminPagination,
    AdminPanel,
    AdminPrimaryButton,
    AdminSecondaryButton,
    AdminStatCard,
    AdminStatusBadge,
    AdminTableShell,
} from '@/components/admin-portal/ui';
import { NativeSelect } from '@/components/ui/native-select';
import { useLocale } from '@/hooks/use-locale';
import AdminPortalLayout from '@/layouts/admin-portal-layout';
import { cn } from '@/lib/utils';
import type { SharedData } from '@/types';

type JobSeekerRow = {
    id: number;
    name: string;
    email: string;
    phone: string;
    location: string;
    applications: number;
    resume: string;
    date: string | null;
    status: string;
    status_value: string | null;
    can_suspend: boolean;
    can_reactivate: boolean;
};

type PaginatedJobSeekers = {
    data: JobSeekerRow[];
    links: Array<{ url: string | null; label: string; active: boolean }>;
    from: number | null;
    to: number | null;
    total: number;
};

type Props = {
    jobSeekers: PaginatedJobSeekers;
    filters: { status: string; location: string; search: string };
    stats: {
        total: number;
        active: number;
        suspended: number;
        inactive: number;
    };
    options: {
        locations: string[];
        statuses: Array<{ value: string; label: string }>;
    };
};

function statusTone(
    value: string,
): 'success' | 'warning' | 'danger' | 'neutral' {
    if (value === 'Active') {
        return 'success';
    }
    if (value === 'Inactive') {
        return 'warning';
    }
    if (value === 'Suspended') {
        return 'danger';
    }
    return 'neutral';
}

function resumeTone(value: string): 'success' | 'warning' | 'neutral' {
    if (value === 'Active') {
        return 'success';
    }
    if (value === 'Warning') {
        return 'warning';
    }
    return 'neutral';
}

export default function JobSeekerManagement({
    jobSeekers,
    filters,
    stats,
    options,
}: Props) {
    const { flash } = usePage<SharedData>().props;
    const { t } = useLocale();
    const [search, setSearch] = useState(filters.search ?? '');

    const query = useMemo(() => {
        const params = new URLSearchParams();

        if (filters.status) {
            params.set('status', filters.status);
        }

        if (filters.location) {
            params.set('location', filters.location);
        }

        if (search.trim() !== '') {
            params.set('search', search.trim());
        }

        const encoded = params.toString();

        return encoded === '' ? '' : `?${encoded}`;
    }, [filters.location, filters.status, search]);

    const visitList = (
        status = filters.status,
        location = filters.location,
        searchValue = search,
    ): void => {
        router.get(
            '/admin/job-seekers',
            {
                ...(status !== 'all' && status !== '' ? { status } : {}),
                ...(location !== 'all' && location !== ''
                    ? { location }
                    : {}),
                ...(searchValue.trim() !== ''
                    ? { search: searchValue.trim() }
                    : {}),
            },
            { preserveState: true, replace: true },
        );
    };

    return (
        <AdminPortalLayout>
            <Head title={t('admin.job_seekers.title')} />

            <div className="space-y-6 p-6">
                <AdminPageHeader
                    title={t('admin.job_seekers.title')}
                    subtitle={t('admin.job_seekers.subtitle')}
                    actions={
                        <div className="flex flex-wrap gap-2">
                            <a href={`/admin/job-seekers/export${query}`}>
                                <AdminSecondaryButton>
                                    <Download className="size-4" />
                                    {t('common.export')}
                                </AdminSecondaryButton>
                            </a>
                            <Link href="/admin/job-seekers/create">
                                <AdminPrimaryButton>
                                    <Plus className="size-4" />
                                    {t('admin.job_seekers.add')}
                                </AdminPrimaryButton>
                            </Link>
                        </div>
                    }
                />

                {flash.success && (
                    <div className="rounded-xl border border-[#bbf7d0] bg-[#f0fdf4] px-4 py-3 text-sm text-[#15803d]">
                        {typeof flash.success === 'string'
                            ? flash.success
                            : t('common.saved')}
                    </div>
                )}

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    {[
                        [t('admin.job_seekers.stats.total'), stats.total, 'text-[#0057c8]'],
                        [
                            t('admin.job_seekers.stats.active'),
                            stats.active,
                            'text-[#10b981]',
                        ],
                        [
                            t('admin.job_seekers.stats.suspended'),
                            stats.suspended,
                            'text-[#ef4444]',
                        ],
                        [
                            t('admin.legacy_nav.inactive'),
                            stats.inactive,
                            'text-[#64748b]',
                        ],
                    ].map(([label, value, tone]) => (
                        <AdminStatCard
                            key={String(label)}
                            label={String(label)}
                            value={Number(value).toLocaleString()}
                            valueClassName={String(tone)}
                            icon={UserRound}
                        />
                    ))}
                </div>

                <AdminPanel>
                    <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                        <form
                            className="relative max-w-md flex-1"
                            onSubmit={(event) => {
                                event.preventDefault();
                                visitList();
                            }}
                        >
                            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[#94a3b8]" />
                            <input
                                type="search"
                                placeholder={t('admin.job_seekers.search_placeholder')}
                                value={search}
                                onChange={(event) =>
                                    setSearch(event.target.value)
                                }
                                className="w-full rounded-xl border border-[#e2e8f0] bg-[#f8faff] py-2.5 pr-4 pl-10 text-sm text-[#050315] outline-none focus:border-[#0057c8]"
                            />
                        </form>
                        <div className="flex flex-wrap gap-2">
                            <NativeSelect
                                value={filters.status || 'all'}
                                onChange={(event) =>
                                    visitList(event.target.value)
                                }
                                className="rounded-xl border border-[#e2e8f0] bg-white px-3 py-2.5 text-sm font-semibold text-[#64748b] outline-none focus:border-[#0057c8]"
                            >
                                <option value="all">{t('admin.job_seekers.all_status')}</option>
                                {options.statuses.map((status) => (
                                    <option
                                        key={status.value}
                                        value={status.value}
                                    >
                                        {status.label}
                                    </option>
                                ))}
                            </NativeSelect>
                            <NativeSelect
                                value={filters.location || 'all'}
                                onChange={(event) =>
                                    visitList(
                                        filters.status,
                                        event.target.value,
                                    )
                                }
                                className="rounded-xl border border-[#e2e8f0] bg-white px-3 py-2.5 text-sm font-semibold text-[#64748b] outline-none focus:border-[#0057c8]"
                            >
                                <option value="all">{t('admin.job_seekers.all_countries')}</option>
                                <option value="UAE">
                                    {t('admin.job_seekers.countries.uae')}
                                </option>
                                {options.locations.map((location) => (
                                    <option key={location} value={location}>
                                        {location}
                                    </option>
                                ))}
                            </NativeSelect>
                        </div>
                    </div>

                    <AdminTableShell
                        headers={[
                            t('admin.job_seekers.cols.name'),
                            t('admin.job_seekers.cols.email'),
                            t('admin.job_seekers.fields.phone'),
                            t('admin.job_seekers.cols.location'),
                            t('admin.job_seekers.cols.applications'),
                            t('admin.job_seekers.fields.resume'),
                            t('admin.job_seekers.cols.registered'),
                            t('common.status'),
                            t('common.actions'),
                        ]}
                    >
                        {jobSeekers.data.map((row) => (
                            <tr
                                key={row.id}
                                className="border-b border-[#e2e8f0] last:border-0 hover:bg-[#f8faff]"
                            >
                                <td className="px-3 py-3 font-semibold text-[#050315]">
                                    {row.name}
                                </td>
                                <td className="px-3 py-3 text-[#64748b]">
                                    {row.email}
                                </td>
                                <td className="px-3 py-3 text-[#64748b]">
                                    {row.phone}
                                </td>
                                <td className="px-3 py-3 text-[#64748b]">
                                    {row.location}
                                </td>
                                <td className="px-3 py-3 font-semibold text-[#050315]">
                                    {row.applications}
                                </td>
                                <td className="px-3 py-3">
                                    <AdminStatusBadge
                                        label={row.resume}
                                        tone={resumeTone(row.resume)}
                                    />
                                </td>
                                <td className="px-3 py-3 text-[#64748b]">
                                    {row.date ?? '—'}
                                </td>
                                <td className="px-3 py-3">
                                    <AdminStatusBadge
                                        label={row.status}
                                        tone={statusTone(row.status)}
                                    />
                                </td>
                                <td className="px-3 py-3">
                                    <div className="flex items-center gap-1.5">
                                        <Link
                                            href={`/admin/job-seekers/${row.id}`}
                                            className="flex size-8 items-center justify-center rounded-lg border border-[#e2e8f0] text-[#64748b] hover:bg-[#f8faff]"
                                            aria-label={t('admin.job_seekers.view')}
                                        >
                                            <Eye className="size-4" />
                                        </Link>
                                        <Link
                                            href={`/admin/job-seekers/${row.id}/edit`}
                                            className="flex size-8 items-center justify-center rounded-lg border border-[#e2e8f0] text-[#64748b] hover:bg-[#f8faff]"
                                            aria-label={t('admin.job_seekers.edit')}
                                        >
                                            <Pencil className="size-4" />
                                        </Link>
                                        {row.can_reactivate ? (
                                            <button
                                                type="button"
                                                className={cn(
                                                    'rounded-lg px-3 py-1.5 text-xs font-semibold',
                                                    'bg-[#d1fae5] text-[#065f46] hover:bg-[#a7f3d0]',
                                                )}
                                                onClick={() =>
                                                    router.post(
                                                        `/admin/job-seekers/${row.id}/reactivate`,
                                                    )
                                                }
                                            >
                                                {t('common.reactivate')}
                                            </button>
                                        ) : (
                                            <button
                                                type="button"
                                                className={cn(
                                                    'rounded-lg px-3 py-1.5 text-xs font-semibold',
                                                    'bg-[#fee2e2] text-[#991b1b] hover:bg-[#fecaca]',
                                                )}
                                                onClick={() =>
                                                    router.post(
                                                        `/admin/job-seekers/${row.id}/suspend`,
                                                    )
                                                }
                                            >
                                                {t('common.suspend')}
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </AdminTableShell>

                    {jobSeekers.data.length === 0 && (
                        <p className="mt-6 text-center text-sm text-[#99a1af]">
                            {t('admin.job_seekers.empty')}
                        </p>
                    )}

                    <AdminPagination
                        showingLabel={t('common.showing_range', {
                            from: jobSeekers.from ?? 0,
                            to: jobSeekers.to ?? 0,
                            total: jobSeekers.total,
                        })}
                        links={jobSeekers.links}
                    />
                </AdminPanel>
            </div>
        </AdminPortalLayout>
    );
}
