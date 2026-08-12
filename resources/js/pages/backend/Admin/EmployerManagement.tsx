import { Head } from '@inertiajs/react';
import {
    Building2,
    Check,
    Download,
    Eye,
    Pencil,
    Plus,
    Search,
    X,
} from 'lucide-react';
import { useMemo, useState } from 'react';

import { employerDemo } from '@/components/admin-portal/demo-data';
import {
    AdminFilterChip,
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

const filterChips = [
    'All',
    'Active',
    'Pending Verification',
    'Suspended',
    'Rejected',
] as const;

function verificationTone(
    value: string,
): 'success' | 'warning' | 'danger' | 'neutral' {
    if (value === 'Approved') {
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

function statusTone(
    value: string,
): 'success' | 'warning' | 'danger' | 'neutral' {
    if (value === 'Active') {
        return 'success';
    }
    if (value === 'Pending Verification') {
        return 'warning';
    }
    if (value === 'Rejected' || value === 'Suspended') {
        return 'danger';
    }
    return 'neutral';
}

function packageTone(
    value: string,
): 'info' | 'purple' | 'orange' | 'neutral' {
    if (value === 'Enterprise' || value === 'Premium') {
        return 'purple';
    }
    if (value === 'Professional') {
        return 'info';
    }
    if (value === 'Starter') {
        return 'orange';
    }
    return 'neutral';
}

export default function EmployerManagement() {
    const [search, setSearch] = useState('');
    const [activeFilter, setActiveFilter] =
        useState<(typeof filterChips)[number]>('All');

    const filteredRows = useMemo(() => {
        const query = search.trim().toLowerCase();

        return employerDemo.rows.filter((row) => {
            const matchesFilter =
                activeFilter === 'All' || row.status === activeFilter;
            const matchesSearch =
                query === '' ||
                row.name.toLowerCase().includes(query) ||
                row.email.toLowerCase().includes(query) ||
                row.contact.toLowerCase().includes(query) ||
                row.industry.toLowerCase().includes(query);

            return matchesFilter && matchesSearch;
        });
    }, [activeFilter, search]);

    return (
        <AdminPortalLayout>
            <Head title="Employer Management" />

            <div className="space-y-6 p-6">
                <AdminPageHeader
                    title="Employer Management"
                    subtitle="Manage employer accounts, verification, and subscriptions."
                    actions={
                        <AdminPrimaryButton>
                            <Plus className="size-4" />
                            Add Employer
                        </AdminPrimaryButton>
                    }
                />

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
                    {employerDemo.stats.map((stat) => (
                        <AdminStatCard
                            key={stat.label}
                            label={stat.label}
                            value={stat.value}
                            valueClassName={stat.tone}
                            icon={Building2}
                        />
                    ))}
                </div>

                <AdminPanel>
                    <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                        <div className="relative max-w-md flex-1">
                            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[#94a3b8]" />
                            <input
                                type="search"
                                placeholder="Search employers..."
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
                            <AdminSecondaryButton className="ml-1">
                                <Download className="size-4" />
                                Export
                            </AdminSecondaryButton>
                        </div>
                    </div>

                    <AdminTableShell
                        headers={[
                            'Company',
                            'Industry',
                            'Contact',
                            'Email',
                            'Verification',
                            'Package',
                            'Active Jobs',
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
                                    {row.industry}
                                </td>
                                <td className="px-3 py-3 text-[#64748b]">
                                    {row.contact}
                                </td>
                                <td className="px-3 py-3 text-[#64748b]">
                                    {row.email}
                                </td>
                                <td className="px-3 py-3">
                                    <AdminStatusBadge
                                        label={row.verification}
                                        tone={verificationTone(row.verification)}
                                    />
                                </td>
                                <td className="px-3 py-3">
                                    <AdminStatusBadge
                                        label={row.package}
                                        tone={packageTone(row.package)}
                                    />
                                </td>
                                <td className="px-3 py-3 font-semibold text-[#050315]">
                                    {row.jobs}
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
                                            aria-label="View employer"
                                        >
                                            <Eye className="size-4" />
                                        </button>
                                        <button
                                            type="button"
                                            className="flex size-8 items-center justify-center rounded-lg border border-[#e2e8f0] text-[#64748b] hover:bg-[#f8faff]"
                                            aria-label="Edit employer"
                                        >
                                            <Pencil className="size-4" />
                                        </button>
                                        {row.verification === 'Pending' && (
                                            <>
                                                <button
                                                    type="button"
                                                    className="flex size-8 items-center justify-center rounded-lg border border-[#d1fae5] bg-[#d1fae5] text-[#065f46] hover:bg-[#a7f3d0]"
                                                    aria-label="Approve employer"
                                                >
                                                    <Check className="size-4" />
                                                </button>
                                                <button
                                                    type="button"
                                                    className="flex size-8 items-center justify-center rounded-lg border border-[#fee2e2] bg-[#fee2e2] text-[#991b1b] hover:bg-[#fecaca]"
                                                    aria-label="Reject employer"
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
                        showingLabel={`Showing ${filteredRows.length} of ${employerDemo.rows.length}`}
                    />
                </AdminPanel>
            </div>
        </AdminPortalLayout>
    );
}
