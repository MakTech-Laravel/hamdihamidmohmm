import { Head } from '@inertiajs/react';
import { Download, Eye, Search, UserRound } from 'lucide-react';
import { useMemo, useState } from 'react';

import { jobSeekerDemo } from '@/components/admin-portal/demo-data';
import {
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

function resumeTone(
    value: string,
): 'success' | 'warning' | 'neutral' {
    if (value === 'Active') {
        return 'success';
    }
    if (value === 'Warning') {
        return 'warning';
    }
    return 'neutral';
}

export default function JobSeekerManagement() {
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('All Status');
    const [countryFilter, setCountryFilter] = useState('All Countries');

    const filteredRows = useMemo(() => {
        const query = search.trim().toLowerCase();

        return jobSeekerDemo.rows.filter((row) => {
            const matchesStatus =
                statusFilter === 'All Status' || row.status === statusFilter;
            const matchesCountry =
                countryFilter === 'All Countries' ||
                row.location.includes(
                    countryFilter.replace('All ', '').replace('s', ''),
                );
            const matchesSearch =
                query === '' ||
                row.name.toLowerCase().includes(query) ||
                row.email.toLowerCase().includes(query) ||
                row.phone.includes(query) ||
                row.location.toLowerCase().includes(query);

            return matchesStatus && matchesCountry && matchesSearch;
        });
    }, [countryFilter, search, statusFilter]);

    return (
        <AdminPortalLayout>
            <Head title="Job Seeker Management" />

            <div className="space-y-6 p-6">
                <AdminPageHeader
                    title="Job Seeker Management"
                    subtitle="Monitor and manage candidate accounts."
                    actions={
                        <AdminSecondaryButton>
                            <Download className="size-4" />
                            Export
                        </AdminSecondaryButton>
                    }
                />

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    {jobSeekerDemo.stats.map((stat) => (
                        <AdminStatCard
                            key={stat.label}
                            label={stat.label}
                            value={stat.value}
                            valueClassName={stat.tone}
                            icon={UserRound}
                        />
                    ))}
                </div>

                <AdminPanel>
                    <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                        <div className="relative max-w-md flex-1">
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
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <select
                                value={statusFilter}
                                onChange={(event) =>
                                    setStatusFilter(event.target.value)
                                }
                                className="rounded-xl border border-[#e2e8f0] bg-white px-3 py-2.5 text-sm font-semibold text-[#64748b] outline-none focus:border-[#0057c8]"
                            >
                                <option>All Status</option>
                                <option>Active</option>
                                <option>Inactive</option>
                                <option>Suspended</option>
                            </select>
                            <select
                                value={countryFilter}
                                onChange={(event) =>
                                    setCountryFilter(event.target.value)
                                }
                                className="rounded-xl border border-[#e2e8f0] bg-white px-3 py-2.5 text-sm font-semibold text-[#64748b] outline-none focus:border-[#0057c8]"
                            >
                                <option>All Countries</option>
                                <option>UAE</option>
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
                        {filteredRows.map((row) => (
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
                                    {row.date}
                                </td>
                                <td className="px-3 py-3">
                                    <AdminStatusBadge
                                        label={row.status}
                                        tone={statusTone(row.status)}
                                    />
                                </td>
                                <td className="px-3 py-3">
                                    <div className="flex items-center gap-1.5">
                                        <button
                                            type="button"
                                            className="flex size-8 items-center justify-center rounded-lg border border-[#e2e8f0] text-[#64748b] hover:bg-[#f8faff]"
                                            aria-label="View job seeker"
                                        >
                                            <Eye className="size-4" />
                                        </button>
                                        {row.status === 'Suspended' ? (
                                            <button
                                                type="button"
                                                className={cn(
                                                    'rounded-lg px-3 py-1.5 text-xs font-semibold',
                                                    'bg-[#d1fae5] text-[#065f46] hover:bg-[#a7f3d0]',
                                                )}
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
                                            >
                                                Suspend
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </AdminTableShell>

                    <AdminPagination
                        showingLabel={`Showing ${filteredRows.length} of ${jobSeekerDemo.rows.length}`}
                    />
                </AdminPanel>
            </div>
        </AdminPortalLayout>
    );
}
