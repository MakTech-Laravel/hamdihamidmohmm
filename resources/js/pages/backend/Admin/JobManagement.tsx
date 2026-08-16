import { Head, Link, router, usePage } from '@inertiajs/react';
import { Briefcase, Check, Download, Eye, Search, Star, X } from 'lucide-react';
import { useMemo, useState } from 'react';

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
    featured: boolean;
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
        featured: number;
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

export default function JobManagement({ jobs, filters, stats }: Props) {
    const { flash } = usePage<SharedData>().props;
    const [search, setSearch] = useState(filters.search ?? '');
    const [rejecting, setRejecting] = useState<JobRow | null>(null);
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
            '/admin/jobs',
            {
                ...(status !== 'all' && status !== '' ? { status } : {}),
                ...(searchValue.trim() !== ''
                    ? { search: searchValue.trim() }
                    : {}),
            },
            { preserveState: true, replace: true },
        );
    };

    return (
        <AdminPortalLayout>
            <Head title="Job Management" />

            <div className="space-y-6 p-6">
                <AdminPageHeader
                    title="Job Management"
                    subtitle="Review, approve, moderate, and feature job listings."
                    actions={
                        <a href={`/admin/jobs/export${query}`}>
                            <AdminSecondaryButton>
                                <Download className="size-4" />
                                Export
                            </AdminSecondaryButton>
                        </a>
                    }
                />

                {flash.success && (
                    <div className="rounded-xl border border-[#bbf7d0] bg-[#f0fdf4] px-4 py-3 text-sm text-[#15803d]">
                        {typeof flash.success === 'string'
                            ? flash.success
                            : 'Saved successfully.'}
                    </div>
                )}

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
                    {[
                        ['Total Jobs', stats.total, 'text-[#0057c8]'],
                        ['Active', stats.active, 'text-[#10b981]'],
                        ['Pending', stats.pending, 'text-[#e57124]'],
                        ['Rejected', stats.rejected, 'text-[#ef4444]'],
                        ['Expired', stats.expired, 'text-[#64748b]'],
                        ['Featured', stats.featured, 'text-[#7c3aed]'],
                    ].map(([label, value, tone]) => (
                        <AdminStatCard
                            key={label}
                            label={label}
                            value={Number(value).toLocaleString()}
                            valueClassName={tone}
                            icon={Briefcase}
                        />
                    ))}
                </div>

                <AdminPanel>
                    <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                        <form
                            className="relative max-w-md flex-1"
                            onSubmit={(event) => {
                                event.preventDefault();
                                visitList(filters.status || 'all');
                            }}
                        >
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
                        </form>
                        <div className="flex flex-wrap items-center gap-2">
                            {filterChips.map(([key, label]) => (
                                <AdminFilterChip
                                    key={key}
                                    label={label}
                                    active={(filters.status || 'all') === key}
                                    onClick={() => visitList(key)}
                                />
                            ))}
                        </div>
                    </div>

                    <AdminTableShell
                        headers={[
                            'Title',
                            'Employer',
                            'Category',
                            'Location',
                            'Apps',
                            'Views',
                            'Status',
                            'Actions',
                        ]}
                    >
                        {jobs.data.map((row) => (
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
                                    {row.views}
                                </td>
                                <td className="px-3 py-3">
                                    <AdminStatusBadge
                                        label={row.status}
                                        tone={jobStatusTone(row.status)}
                                    />
                                </td>
                                <td className="px-3 py-3">
                                    <div className="flex items-center gap-1.5">
                                        <Link
                                            href={`/admin/jobs/${row.id}`}
                                            className="flex size-8 items-center justify-center rounded-lg border border-[#e2e8f0] text-[#64748b] hover:bg-[#f8faff]"
                                            aria-label="View job"
                                        >
                                            <Eye className="size-4" />
                                        </Link>
                                        <button
                                            type="button"
                                            className="flex size-8 items-center justify-center rounded-lg border border-[#e2e8f0] text-[#64748b] hover:bg-[#fff7ed]"
                                            aria-label="Toggle featured"
                                            onClick={() =>
                                                router.post(
                                                    `/admin/jobs/${row.id}/feature`,
                                                )
                                            }
                                        >
                                            <Star
                                                className="size-4"
                                                fill={
                                                    row.featured
                                                        ? '#e57124'
                                                        : 'none'
                                                }
                                            />
                                        </button>
                                        {row.can_review && (
                                            <>
                                                <button
                                                    type="button"
                                                    className="flex size-8 items-center justify-center rounded-lg border border-[#d1fae5] bg-[#d1fae5] text-[#065f46] hover:bg-[#a7f3d0]"
                                                    aria-label="Approve job"
                                                    onClick={() =>
                                                        router.post(
                                                            `/admin/jobs/${row.id}/approve`,
                                                        )
                                                    }
                                                >
                                                    <Check className="size-4" />
                                                </button>
                                                <button
                                                    type="button"
                                                    className="flex size-8 items-center justify-center rounded-lg border border-[#fee2e2] bg-[#fee2e2] text-[#991b1b] hover:bg-[#fecaca]"
                                                    aria-label="Reject job"
                                                    onClick={() => {
                                                        setRejectionReason('');
                                                        setRejecting(row);
                                                    }}
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

                    {jobs.data.length === 0 && (
                        <p className="mt-6 text-center text-sm text-[#99a1af]">
                            No jobs match these filters.
                        </p>
                    )}

                    <AdminPagination
                        showingLabel={`Showing ${jobs.from ?? 0}-${jobs.to ?? 0} of ${jobs.total}`}
                        links={jobs.links}
                    />
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
                                    `/admin/jobs/${rejecting.id}/reject`,
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
        </AdminPortalLayout>
    );
}
