import { Head } from '@inertiajs/react';
import { ArrowRight, Eye, Search, X } from 'lucide-react';
import { useMemo, useState } from 'react';

import {
    APPLICATION_ROWS,
    APPLICATION_STATS,
    APPLICATION_STATUS_TONE,
    getInitials,
    type ApplicationStatus,
} from '@/components/employer/demo-data';
import EmployerLayout from '@/layouts/employer-layout';
import { cn } from '@/lib/utils';

const STATUS_OPTIONS: Array<'All' | ApplicationStatus> = [
    'All',
    'Interview',
    'Shortlisted',
    'Under Review',
    'Applied',
    'Rejected',
];

const STAT_CARDS = [
    { label: 'Total', value: APPLICATION_STATS.total },
    { label: 'New This Week', value: APPLICATION_STATS.newThisWeek },
    { label: 'Shortlisted', value: APPLICATION_STATS.shortlisted },
    {
        label: 'Interviews Scheduled',
        value: APPLICATION_STATS.interviewsScheduled,
    },
] as const;

export default function EmployerApplications() {
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<'All' | ApplicationStatus>(
        'All',
    );

    const filteredApplications = useMemo(() => {
        return APPLICATION_ROWS.filter((row) => {
            const query = search.toLowerCase();
            const matchesSearch =
                !query ||
                row.name.toLowerCase().includes(query) ||
                row.job.toLowerCase().includes(query) ||
                row.location.toLowerCase().includes(query);
            const matchesStatus =
                statusFilter === 'All' || row.status === statusFilter;

            return matchesSearch && matchesStatus;
        });
    }, [search, statusFilter]);

    return (
        <EmployerLayout title="Applications">
            <Head title="Applications" />

            <div className="space-y-6 px-4 py-6 sm:px-6">
                <div>
                    <h1 className="text-[28px] font-extrabold tracking-tight text-[#050315]">
                        Applications
                    </h1>
                    <p className="mt-1 text-sm text-[#3977a6]">
                        Manage candidates across all stages
                    </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    {STAT_CARDS.map((stat) => (
                        <div
                            key={stat.label}
                            className="rounded-2xl border border-[#e8d5e8] bg-white p-5 shadow-[0px_2px_4px_rgba(5,3,21,0.06)]"
                        >
                            <p className="text-3xl font-bold text-[#e57124]">
                                {stat.value}
                            </p>
                            <p className="mt-1 text-sm text-[#6b7280]">
                                {stat.label}
                            </p>
                        </div>
                    ))}
                </div>

                <div className="rounded-2xl border border-[#e8d5e8] bg-white p-6 shadow-[0px_2px_4px_rgba(5,3,21,0.06)]">
                    <div className="flex flex-wrap items-center gap-4">
                        <div className="relative min-w-[200px] flex-1">
                            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[#6b7280]" />
                            <input
                                type="search"
                                placeholder="Search candidates..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full rounded-lg border border-[#e8d5e8] bg-[#f8faff] py-2 pr-4 pl-9 text-sm text-[#050315] placeholder:text-[#94a3b8] focus:border-[#0057c8] focus:outline-none"
                            />
                        </div>
                        <select
                            value={statusFilter}
                            onChange={(e) =>
                                setStatusFilter(
                                    e.target.value as 'All' | ApplicationStatus,
                                )
                            }
                            className="rounded-lg border border-[#e8d5e8] bg-[#f8faff] px-4 py-2 text-sm text-[#050315] focus:border-[#0057c8] focus:outline-none"
                        >
                            {STATUS_OPTIONS.map((option) => (
                                <option key={option} value={option}>
                                    {option}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="mt-6 overflow-x-auto">
                        <table className="w-full table-fixed text-left text-sm">
                            <colgroup>
                                <col className="w-[18%]" />
                                <col className="w-[18%]" />
                                <col className="w-[12%]" />
                                <col className="w-[12%]" />
                                <col className="w-[10%]" />
                                <col className="w-[10%]" />
                                <col className="w-[20%]" />
                            </colgroup>
                            <thead>
                                <tr className="border-b border-[#e8d5e8] bg-[#f8faff] text-xs text-[#475569]">
                                    <th className="px-3 py-2.5 font-bold">
                                        Candidate
                                    </th>
                                    <th className="px-3 py-2.5 font-bold">
                                        Job Applied
                                    </th>
                                    <th className="px-3 py-2.5 font-bold">
                                        Status
                                    </th>
                                    <th className="px-3 py-2.5 font-bold">
                                        Applied Date
                                    </th>
                                    <th className="px-3 py-2.5 font-bold">
                                        Experience
                                    </th>
                                    <th className="px-3 py-2.5 font-bold">
                                        Location
                                    </th>
                                    <th className="px-3 py-2.5 font-bold">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredApplications.map((row) => (
                                    <tr
                                        key={row.id}
                                        className="border-b border-[#f1f5f9] last:border-0"
                                    >
                                        <td className="px-3 py-3">
                                            <div className="flex min-w-0 items-center gap-2.5">
                                                <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#323981] text-[11px] font-bold text-white">
                                                    {getInitials(row.name)}
                                                </div>
                                                <span className="truncate font-semibold text-[#050315]">
                                                    {row.name}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-3 py-3 text-[#050315]">
                                            <span className="line-clamp-2">
                                                {row.job}
                                            </span>
                                        </td>
                                        <td className="px-3 py-3">
                                            <span
                                                className={cn(
                                                    'inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap',
                                                    APPLICATION_STATUS_TONE[
                                                    row.status
                                                    ],
                                                )}
                                            >
                                                {row.status}
                                            </span>
                                        </td>
                                        <td className="px-3 py-3 whitespace-nowrap text-[#6b7280]">
                                            {row.appliedDate}
                                        </td>
                                        <td className="px-3 py-3 whitespace-nowrap text-[#050315]">
                                            {row.experience}
                                        </td>
                                        <td className="px-3 py-3 whitespace-nowrap text-[#050315]">
                                            {row.location}
                                        </td>
                                        <td className="px-3 py-3">
                                            <div className="flex items-center gap-1.5 whitespace-nowrap">
                                                <button
                                                    type="button"
                                                    className="inline-flex items-center gap-1 rounded-md bg-[#eeeffe] px-2 py-1 text-xs font-semibold text-[#323981]"
                                                >
                                                    <Eye className="size-3" />
                                                    View
                                                </button>
                                                {row.status !== 'Rejected' && (
                                                    <button
                                                        type="button"
                                                        className="inline-flex items-center gap-1 rounded-md bg-[#f1f5f9] px-2 py-1 text-xs font-semibold text-[#323981]"
                                                    >
                                                        <ArrowRight className="size-3" />
                                                        Move
                                                    </button>
                                                )}
                                                {row.status !== 'Rejected' && (
                                                    <button
                                                        type="button"
                                                        className="inline-flex items-center gap-1 rounded-md bg-[#fef2f2] px-2 py-1 text-xs font-semibold text-[#dc2626]"
                                                    >
                                                        <X className="size-3" />
                                                        Reject
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {filteredApplications.length === 0 && (
                            <p className="py-8 text-center text-sm text-[#6b7280]">
                                No applications match your filters.
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </EmployerLayout>
    );
}
