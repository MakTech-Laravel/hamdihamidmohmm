import { Head } from '@inertiajs/react';
import {
    Briefcase,
    Check,
    Download,
    Eye,
    Search,
    Star,
    X,
} from 'lucide-react';
import { useMemo, useState } from 'react';

import { jobDemo } from '@/components/admin-portal/demo-data';
import {
    AdminFilterChip,
    AdminPageHeader,
    AdminPagination,
    AdminPanel,
    AdminSecondaryButton,
    AdminStatCard,
    AdminStatusBadge,
    AdminTableShell,
} from '@/components/admin-portal/ui';
import AdminPortalLayout from '@/layouts/admin-portal-layout';
import { cn } from '@/lib/utils';

const filterChips = [
    'All',
    'Active',
    'Pending',
    'Rejected',
    'Expired',
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

export default function JobManagement() {
    const [search, setSearch] = useState('');
    const [activeFilter, setActiveFilter] =
        useState<(typeof filterChips)[number]>('All');

    const filteredRows = useMemo(() => {
        const query = search.trim().toLowerCase();

        return jobDemo.rows.filter((row) => {
            const matchesFilter =
                activeFilter === 'All' || row.status === activeFilter;
            const matchesSearch =
                query === '' ||
                row.title.toLowerCase().includes(query) ||
                row.employer.toLowerCase().includes(query) ||
                row.category.toLowerCase().includes(query) ||
                row.location.toLowerCase().includes(query);

            return matchesFilter && matchesSearch;
        });
    }, [activeFilter, search]);

    return (
        <AdminPortalLayout>
            <Head title="Job Management" />

            <div className="space-y-6 p-6">
                <AdminPageHeader
                    title="Job Management"
                    subtitle="Review, approve, moderate, and feature job listings."
                    actions={
                        <AdminSecondaryButton>
                            <Download className="size-4" />
                            Export
                        </AdminSecondaryButton>
                    }
                />

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-7">
                    {jobDemo.stats.map((stat) => (
                        <AdminStatCard
                            key={stat.label}
                            label={stat.label}
                            value={stat.value}
                            valueClassName={stat.tone}
                            icon={Briefcase}
                        />
                    ))}
                </div>

                <AdminPanel>
                    <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                        <div className="relative max-w-md flex-1">
                            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[#94a3b8]" />
                            <input
                                type="search"
                                placeholder="Search jobs..."
                                value={search}
                                onChange={(event) =>
                                    setSearch(event.target.value)
                                }
                                className="w-full rounded-xl border border-[#e2e8f0] bg-[#f8faff] py-2.5 pr-4 pl-10 text-sm text-[#050315] outline-none focus:border-[#0057c8]"
                            />
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            {filterChips.map((chip) => (
                                <AdminFilterChip
                                    key={chip}
                                    label={chip}
                                    active={activeFilter === chip}
                                    onClick={() => setActiveFilter(chip)}
                                />
                            ))}
                        </div>
                    </div>

                    <AdminTableShell
                        headers={[
                            'Job Title',
                            'Employer',
                            'Category',
                            'Location',
                            'Applications',
                            'Views',
                            'Status',
                            'Created',
                            'Actions',
                        ]}
                    >
                        {filteredRows.map((row) => (
                            <tr
                                key={row.id}
                                className="border-b border-[#e2e8f0] last:border-0 hover:bg-[#f8faff]"
                            >
                                <td className="px-3 py-3 font-semibold text-[#050315]">
                                    {row.title}
                                </td>
                                <td className="px-3 py-3 text-[#64748b]">
                                    {row.employer}
                                </td>
                                <td className="px-3 py-3 text-[#64748b]">
                                    {row.category}
                                </td>
                                <td className="px-3 py-3 text-[#64748b]">
                                    {row.location}
                                </td>
                                <td className="px-3 py-3 font-semibold text-[#050315]">
                                    {row.applications}
                                </td>
                                <td className="px-3 py-3 text-[#64748b]">
                                    {row.views.toLocaleString()}
                                </td>
                                <td className="px-3 py-3">
                                    <AdminStatusBadge
                                        label={row.status}
                                        tone={jobStatusTone(row.status)}
                                    />
                                </td>
                                <td className="px-3 py-3 text-[#64748b]">
                                    {row.created}
                                </td>
                                <td className="px-3 py-3">
                                    <div className="flex items-center gap-1.5">
                                        <button
                                            type="button"
                                            className="flex size-8 items-center justify-center rounded-lg border border-[#e2e8f0] text-[#64748b] hover:bg-[#f8faff]"
                                            aria-label="View job"
                                        >
                                            <Eye className="size-4" />
                                        </button>
                                        <button
                                            type="button"
                                            className="flex size-8 items-center justify-center rounded-lg border border-[#e2e8f0] text-[#e57124] hover:bg-[#fff7ed]"
                                            aria-label="Feature job"
                                        >
                                            <Star className="size-4" />
                                        </button>
                                        {row.status === 'Pending' && (
                                            <>
                                                <button
                                                    type="button"
                                                    className={cn(
                                                        'flex size-8 items-center justify-center rounded-lg',
                                                        'border border-[#d1fae5] bg-[#d1fae5] text-[#065f46] hover:bg-[#a7f3d0]',
                                                    )}
                                                    aria-label="Approve job"
                                                >
                                                    <Check className="size-4" />
                                                </button>
                                                <button
                                                    type="button"
                                                    className={cn(
                                                        'flex size-8 items-center justify-center rounded-lg',
                                                        'border border-[#fee2e2] bg-[#fee2e2] text-[#991b1b] hover:bg-[#fecaca]',
                                                    )}
                                                    aria-label="Reject job"
                                                >
                                                    <X className="size-4" />
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </AdminTableShell>

                    <AdminPagination
                        showingLabel={`Showing ${filteredRows.length} of ${jobDemo.rows.length}`}
                    />
                </AdminPanel>
            </div>
        </AdminPortalLayout>
    );
}
