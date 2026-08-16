import { Head, router, usePage } from '@inertiajs/react';
import { Check, Download, Eye, Search, X } from 'lucide-react';
import { useMemo, useState } from 'react';

import {
    approve,
    exportMethod,
    index,
    reject,
} from '@/actions/App/Http/Controllers/Backend/Admin/JobManagementController';
import {
    CandidatePreviewDrawer,
    type CandidatePreview,
} from '@/components/admin-portal/candidate-preview-drawer';
import {
    AdminPagination,
    AdminPanel,
    AdminStatusBadge,
    AdminTableShell,
} from '@/components/admin-portal/ui';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
    preview: CandidatePreview;
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

const filterChips = [
    ['all', 'All'],
    ['active', 'Active'],
    ['pending', 'Pending'],
    ['rejected', 'Rejected'],
    ['expired', 'Expired'],
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
    const [search, setSearch] = useState(filters.search ?? '');
    const [rejecting, setRejecting] = useState<JobRow | null>(null);
    const [previewing, setPreviewing] = useState<JobRow | null>(null);
    const [rejectionReason, setRejectionReason] = useState('');

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
            <Head title="Job Management" />

            <div className="space-y-6 p-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-[22px] leading-[33px] font-bold text-[#0f172a]">
                            Job Management
                        </h1>
                        <p className="pt-1 text-[13px] leading-[19.5px] text-[#94a3b8]">
                            Review, approve, and moderate job listings.
                        </p>
                    </div>
                    <a
                        href={`${exportMethod.url()}${query}`}
                        className="inline-flex h-[34px] items-center justify-center gap-1.5 rounded-[6px] border border-[#e2e8f0] bg-[#f1f5f9] px-[14px] py-[7px] text-[13px] font-semibold text-[#475569] hover:bg-white"
                    >
                        <Download className="size-3.5" strokeWidth={2} />
                        Export
                    </a>
                </div>

                {flash.success && (
                    <div className="rounded-xl border border-[#bbf7d0] bg-[#f0fdf4] px-4 py-3 text-sm text-[#15803d]">
                        {typeof flash.success === 'string'
                            ? flash.success
                            : 'Saved successfully.'}
                    </div>
                )}

                <div className="grid grid-cols-2 gap-2.5 xl:grid-cols-5">
                    {(
                        [
                            [
                                'Total Jobs',
                                stats.total,
                                'text-[#0057c8]',
                            ],
                            [
                                'Active Jobs',
                                stats.active,
                                'text-[#e57124]',
                            ],
                            [
                                'Pending Jobs',
                                stats.pending,
                                'text-[#f59e0b]',
                            ],
                            [
                                'Rejected Jobs',
                                stats.rejected,
                                'text-[#ef4444]',
                            ],
                            [
                                'Expired Jobs',
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
                                placeholder="Search by title, employer…"
                                value={search}
                                onChange={(event) =>
                                    setSearch(event.target.value)
                                }
                                className="h-[34px] w-full rounded-[6px] border border-[#e2e8f0] bg-white py-2 pr-3 pl-8 text-[13px] text-[#0f172a] outline-none placeholder:text-[#0f172a]/50 focus:border-[#0057c8]"
                            />
                        </form>
                        <div className="flex flex-wrap items-center gap-2.5">
                            {filterChips.map(([key, label]) => {
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
                                        {label}
                                    </button>
                                );
                            })}
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
                        {jobs.data.map((row) => (
                            <tr
                                key={row.id}
                                className="border-b border-[#f1f5f9] last:border-0"
                            >
                                <td className="px-3 py-2.5">
                                    <p className="text-[13px] leading-[19.5px] font-semibold text-[#0f172a]">
                                        {row.title}
                                    </p>
                                    <p className="text-[11px] leading-[16.5px] text-[#94a3b8]">
                                        {jobReference(row.id)}
                                    </p>
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
                                            aria-label="View applicant"
                                            onClick={() => setPreviewing(row)}
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
                                                    aria-label="Approve job"
                                                    onClick={() =>
                                                        router.post(
                                                            approve.url(row.id),
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
                                                    aria-label="Reject job"
                                                    onClick={() => {
                                                        setRejectionReason('');
                                                        setRejecting(row);
                                                    }}
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
                            No jobs match these filters.
                        </p>
                    )}

                    <div className="px-4 pb-4">
                        <AdminPagination
                            showingLabel={`Showing ${jobs.to ?? 0} of ${jobs.total}`}
                            links={jobs.links}
                        />
                    </div>
                </AdminPanel>
            </div>

            <Dialog
                open={rejecting !== null}
                onOpenChange={(open) => {
                    if (!open) {
                        setRejecting(null);
                    }
                }}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Reject job</DialogTitle>
                        <DialogDescription>
                            {rejecting
                                ? `Tell the employer why “${rejecting.title}” is being rejected.`
                                : 'Provide a rejection reason.'}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-1.5">
                        <Label htmlFor="rejection_reason">Reason</Label>
                        <Textarea
                            id="rejection_reason"
                            value={rejectionReason}
                            onChange={(event) =>
                                setRejectionReason(event.target.value)
                            }
                            className="min-h-24 rounded-xl"
                        />
                    </div>
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setRejecting(null)}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            className="bg-[#b91c1c] text-white hover:bg-[#991b1b]"
                            disabled={rejectionReason.trim() === ''}
                            onClick={() => {
                                if (rejecting === null) {
                                    return;
                                }

                                router.post(
                                    reject.url(rejecting.id),
                                    {
                                        rejection_reason:
                                            rejectionReason.trim(),
                                    },
                                    {
                                        onSuccess: () => setRejecting(null),
                                    },
                                );
                            }}
                        >
                            Reject
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <CandidatePreviewDrawer
                open={previewing !== null}
                onOpenChange={(open) => {
                    if (!open) {
                        setPreviewing(null);
                    }
                }}
                preview={previewing?.preview ?? null}
            />
        </AdminPortalLayout>
    );
}
