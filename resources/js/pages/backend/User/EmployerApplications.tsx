import { Head, router } from '@inertiajs/react';
import { useMemo, useState } from 'react';

import { index, update } from '@/actions/App/Http/Controllers/Backend/User/EmployerApplicationController';
import { getInitials } from '@/components/employer/demo-data';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import EmployerLayout from '@/layouts/employer-layout';
import { cn } from '@/lib/utils';

type ApplicationRow = {
    id: number;
    name: string | null;
    email: string | null;
    location: string | null;
    job: string | null;
    job_id: number | null;
    status: string | null;
    status_value: string | null;
    date: string | null;
    experience: string | null;
    cover_letter: string | null;
    headline: string | null;
    next_status: string | null;
    can_move: boolean;
    can_reject: boolean;
};

type Props = {
    applications: ApplicationRow[];
    filters: { status: string; search: string };
    stats: { total: number; new: number; shortlisted: number; interview: number };
    statuses: Array<{ value: string; label: string }>;
};

const statusTone: Record<string, string> = {
    interview: 'bg-[#fdf4ff] text-[#7e22ce]',
    shortlisted: 'bg-[#f0fdf4] text-[#15803d]',
    under_review: 'bg-[#fff7ed] text-[#c2410c]',
    applied: 'bg-[#e6f0fb] text-[#0057c8]',
    offer: 'bg-[#eef2ff] text-[#4338ca]',
    hired: 'bg-[#dcfce7] text-[#166534]',
    rejected: 'bg-[#fef2f2] text-[#b91c1c]',
    withdrawn: 'bg-[#f3f4f6] text-[#6b7280]',
};

const actionClass =
    'inline-flex h-[30px] cursor-pointer items-center justify-center rounded-[6.4px] px-2.5 text-xs font-semibold';

export default function EmployerApplications({
    applications,
    filters,
    stats,
    statuses,
}: Props) {
    const [search, setSearch] = useState(filters.search ?? '');
    const [status, setStatus] = useState(filters.status ?? '');
    const [viewing, setViewing] = useState<ApplicationRow | null>(null);

    const filtered = useMemo(() => {
        const query = search.toLowerCase();

        return applications.filter((row) => {
            const matchesQuery =
                query === '' ||
                (row.name ?? '').toLowerCase().includes(query) ||
                (row.email ?? '').toLowerCase().includes(query) ||
                (row.job ?? '').toLowerCase().includes(query);

            const matchesStatus =
                status === '' || row.status_value === status;

            return matchesQuery && matchesStatus;
        });
    }, [applications, search, status]);

    const setStatusFilter = (value: string): void => {
        setStatus(value);
        router.get(
            index.url({
                query: {
                    status: value || undefined,
                    search: search || undefined,
                },
            }),
            {},
            { preserveState: true, preserveScroll: true },
        );
    };

    const updateStatus = (row: ApplicationRow, nextStatus: string): void => {
        router.put(update.url(row.id), { status: nextStatus }, { preserveScroll: true });
    };

    return (
        <EmployerLayout title="Applications">
            <Head title="Applications" />

            <div className="flex flex-col px-6 py-6">
                <div className="flex h-[85px] items-center pb-6">
                    <div>
                        <h1 className="text-2xl leading-9 font-extrabold text-[#050315]">
                            Applications
                        </h1>
                        <p className="pt-1 text-sm leading-[21px] text-[#6b7280]">
                            Manage candidates across all stages
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    {[
                        ['Total Applications', stats.total],
                        ['New This Week', stats.new],
                        ['Shortlisted', stats.shortlisted],
                        ['Interviews Scheduled', stats.interview],
                    ].map(([label, value]) => (
                        <div
                            key={label}
                            className="flex min-w-0 flex-1 items-center gap-3 rounded-2xl border border-[#e8d5e8] bg-white px-5 py-3 shadow-[0px_2px_4px_rgba(5,3,21,0.06)]"
                        >
                            <p className="text-2xl leading-9 font-extrabold text-[#0057c8]">
                                {value}
                            </p>
                            <p className="text-[12.8px] leading-[19.2px] font-medium text-[#6b7280]">
                                {label}
                            </p>
                        </div>
                    ))}
                </div>

                <div className="pt-5">
                    <div className="overflow-hidden rounded-2xl border border-[#e8d5e8] bg-white shadow-[0px_2px_4px_rgba(5,3,21,0.06)]">
                        <div className="flex items-center gap-3 border-b border-[#e8d5e8] p-4">
                            <div className="relative min-w-[180px] flex-1">
                                <img
                                    src="/images/jobs/search.svg"
                                    alt=""
                                    width={20}
                                    height={20}
                                    className="pointer-events-none absolute top-1/2 left-3 size-5 -translate-y-1/2"
                                />
                                <input
                                    value={search}
                                    onChange={(event) =>
                                        setSearch(event.target.value)
                                    }
                                    placeholder="Search candidates..."
                                    className="h-[39px] w-full rounded-lg border border-[#e8d5e8] bg-white py-2 pr-3 pl-11 text-sm text-[#050315] outline-none placeholder:text-[#050315]/50"
                                />
                            </div>
                            <select
                                className="h-[38px] w-[224px] shrink-0 cursor-pointer rounded-lg border border-[#e8d5e8] bg-white px-4 text-sm text-[#374151] outline-none"
                                value={status}
                                onChange={(event) =>
                                    setStatusFilter(event.target.value)
                                }
                            >
                                <option value="">All</option>
                                {statuses.map((item) => (
                                    <option key={item.value} value={item.value}>
                                        {item.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[1080px] text-left">
                                <thead>
                                    <tr className="border-b border-[#d1f6ff] bg-white">
                                        {[
                                            'Candidate',
                                            'Job Applied',
                                            'Status',
                                            'Applied Date',
                                            'Experience',
                                            'Location',
                                            'Actions',
                                        ].map((heading) => (
                                            <th
                                                key={heading}
                                                className="px-4 py-3 text-sm font-bold text-[#050315]"
                                            >
                                                {heading}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {filtered.map((row) => (
                                        <tr
                                            key={row.id}
                                            className="border-b border-[#f3e8f3] last:border-b-0"
                                        >
                                            <td className="px-4 py-[13px]">
                                                <div className="flex items-center gap-2">
                                                    <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#0057c8] text-[10.4px] leading-[15.6px] font-bold text-white">
                                                        {getInitials(
                                                            row.name || 'A',
                                                        )}
                                                    </div>
                                                    <p className="text-sm leading-[21px] font-semibold text-[#050315]">
                                                        {row.name}
                                                    </p>
                                                </div>
                                            </td>
                                            <td className="px-4 py-[13px] text-sm leading-[21px] text-[#374151]">
                                                {row.job || '—'}
                                            </td>
                                            <td className="px-4 py-[13px]">
                                                <span
                                                    className={cn(
                                                        'inline-flex rounded-full px-2.5 py-px text-xs font-semibold',
                                                        statusTone[
                                                            row.status_value ??
                                                                ''
                                                        ] ??
                                                            'bg-[#f8faff] text-[#0057c8]',
                                                    )}
                                                >
                                                    {row.status}
                                                </span>
                                            </td>
                                            <td className="px-4 py-[13px] text-sm leading-[21px] text-[#6b7280]">
                                                {row.date || '—'}
                                            </td>
                                            <td className="px-4 py-[13px] text-sm leading-[21px] text-[#374151]">
                                                {row.experience || '—'}
                                            </td>
                                            <td className="px-4 py-[13px] text-sm leading-[21px] text-[#374151]">
                                                {row.location || '—'}
                                            </td>
                                            <td className="px-4 py-[13px]">
                                                <div className="flex items-center gap-1.5">
                                                    <button
                                                        type="button"
                                                        className={cn(
                                                            actionClass,
                                                            'border border-[#e8d5e8] bg-white text-[#0057c8]',
                                                        )}
                                                        onClick={() =>
                                                            setViewing(row)
                                                        }
                                                    >
                                                        View
                                                    </button>
                                                    {row.can_move &&
                                                        row.next_status && (
                                                            <button
                                                                type="button"
                                                                className={cn(
                                                                    actionClass,
                                                                    'border border-[#0057c8] bg-[#0057c8] text-white',
                                                                )}
                                                                onClick={() => {
                                                                    if (row.next_status) {
                                                                        updateStatus(
                                                                            row,
                                                                            row.next_status,
                                                                        );
                                                                    }
                                                                }}
                                                            >
                                                                Move
                                                            </button>
                                                        )}
                                                    {row.can_reject && (
                                                        <button
                                                            type="button"
                                                            className={cn(
                                                                actionClass,
                                                                'border border-[#fecaca] bg-white text-[#dc2626]',
                                                            )}
                                                            onClick={() =>
                                                                updateStatus(
                                                                    row,
                                                                    'rejected',
                                                                )
                                                            }
                                                        >
                                                            Reject
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
                                    No applications yet.
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <Dialog
                open={viewing !== null}
                onOpenChange={(open) => {
                    if (!open) {
                        setViewing(null);
                    }
                }}
            >
                <DialogContent className="rounded-2xl border-[#e8d5e8] sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="text-[#050315]">
                            {viewing?.name}
                        </DialogTitle>
                        <DialogDescription className="text-[#6b7280]">
                            {viewing?.headline ||
                                viewing?.job ||
                                'Candidate details'}
                        </DialogDescription>
                    </DialogHeader>
                    {viewing && (
                        <div className="space-y-3 text-sm">
                            <p className="text-[#374151]">
                                <span className="font-semibold text-[#050315]">
                                    Job applied:{' '}
                                </span>
                                {viewing.job || '—'}
                            </p>
                            <p className="text-[#374151]">
                                <span className="font-semibold text-[#050315]">
                                    Email:{' '}
                                </span>
                                {viewing.email || '—'}
                            </p>
                            <p className="text-[#374151]">
                                <span className="font-semibold text-[#050315]">
                                    Location:{' '}
                                </span>
                                {viewing.location || '—'}
                            </p>
                            <p className="text-[#374151]">
                                <span className="font-semibold text-[#050315]">
                                    Experience:{' '}
                                </span>
                                {viewing.experience || '—'}
                            </p>
                            <p className="text-[#374151]">
                                <span className="font-semibold text-[#050315]">
                                    Applied:{' '}
                                </span>
                                {viewing.date || '—'}
                            </p>
                            {viewing.cover_letter && (
                                <p className="rounded-xl border border-[#e8d5e8] bg-[#f8faff] p-3 leading-6 text-[#374151]">
                                    {viewing.cover_letter}
                                </p>
                            )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </EmployerLayout>
    );
}
