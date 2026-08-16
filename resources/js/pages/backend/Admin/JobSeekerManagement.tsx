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
            <Head title="Job Seeker Management" />

            <div className="space-y-6 p-6">
                <AdminPageHeader
                    title="Job Seeker Management"
                    subtitle="Monitor and manage candidate accounts."
                    actions={
                        <div className="flex flex-wrap gap-2">
                            <a href={`/admin/job-seekers/export${query}`}>
                                <AdminSecondaryButton>
                                    <Download className="size-4" />
                                    Export
                                </AdminSecondaryButton>
                            </a>
                            <Link href="/admin/job-seekers/create">
                                <AdminPrimaryButton>
                                    <Plus className="size-4" />
                                    Add Job Seeker
                                </AdminPrimaryButton>
                            </Link>
                        </div>
                    }
                />

                {flash.success && (
                    <div className="rounded-xl border border-[#bbf7d0] bg-[#f0fdf4] px-4 py-3 text-sm text-[#15803d]">
                        {typeof flash.success === 'string'
                            ? flash.success
                            : 'Saved successfully.'}
                    </div>
                )}

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    {[
                        ['Total Job Seekers', stats.total, 'text-[#0057c8]'],
                        [
                            'Active Job Seekers',
                            stats.active,
                            'text-[#10b981]',
                        ],
                        [
                            'Suspended Job Seekers',
                            stats.suspended,
                            'text-[#ef4444]',
                        ],
                        [
                            'Inactive Job Seekers',
                            stats.inactive,
                            'text-[#64748b]',
                        ],
                    ].map(([label, value, tone]) => (
                        <AdminStatCard
                            key={label}
                            label={label}
                            value={Number(value).toLocaleString()}
                            valueClassName={tone}
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
                                placeholder="Search job seekers..."
                                value={search}
                                onChange={(event) =>
                                    setSearch(event.target.value)
                                }
                                className="w-full rounded-xl border border-[#e2e8f0] bg-[#f8faff] py-2.5 pr-4 pl-10 text-sm text-[#050315] outline-none focus:border-[#0057c8]"
                            />
                        </form>
                        <div className="flex flex-wrap gap-2">
                            <select
                                value={filters.status || 'all'}
                                onChange={(event) =>
                                    visitList(event.target.value)
                                }
                                className="rounded-xl border border-[#e2e8f0] bg-white px-3 py-2.5 text-sm font-semibold text-[#64748b] outline-none focus:border-[#0057c8]"
                            >
                                <option value="all">All Status</option>
                                {options.statuses.map((status) => (
                                    <option
                                        key={status.value}
                                        value={status.value}
                                    >
                                        {status.label}
                                    </option>
                                ))}
                            </select>
                            <select
                                value={filters.location || 'all'}
                                onChange={(event) =>
                                    visitList(
                                        filters.status,
                                        event.target.value,
                                    )
                                }
                                className="rounded-xl border border-[#e2e8f0] bg-white px-3 py-2.5 text-sm font-semibold text-[#64748b] outline-none focus:border-[#0057c8]"
                            >
                                <option value="all">All Countries</option>
                                <option value="UAE">UAE</option>
                                {options.locations.map((location) => (
                                    <option key={location} value={location}>
                                        {location}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <AdminTableShell
                        headers={[
                            'Name',
                            'Email',
                            'Phone',
                            'Location',
                            'Applications',
                            'Resume',
                            'Reg. Date',
                            'Status',
                            'Actions',
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
                                            aria-label="View job seeker"
                                        >
                                            <Eye className="size-4" />
                                        </Link>
                                        <Link
                                            href={`/admin/job-seekers/${row.id}/edit`}
                                            className="flex size-8 items-center justify-center rounded-lg border border-[#e2e8f0] text-[#64748b] hover:bg-[#f8faff]"
                                            aria-label="Edit job seeker"
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
                                                Reactivate
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
                                                Suspend
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </AdminTableShell>

                    {jobSeekers.data.length === 0 && (
                        <p className="mt-6 text-center text-sm text-[#99a1af]">
                            No job seekers match these filters.
                        </p>
                    )}

                    <AdminPagination
                        showingLabel={`Showing ${jobSeekers.from ?? 0}-${jobSeekers.to ?? 0} of ${jobSeekers.total}`}
                        links={jobSeekers.links}
                    />
                </AdminPanel>
            </div>
        </AdminPortalLayout>
    );
}
