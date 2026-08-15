import { Head, Link, router, usePage } from '@inertiajs/react';
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

type EmployerRow = {
    id: number;
    company_name: string;
    industry: string;
    contact: string;
    email: string;
    verification: string;
    verification_value: string | null;
    package: string;
    jobs: number;
    date: string | null;
    status: string;
    status_value: string | null;
    can_review: boolean;
};

type PaginatedEmployers = {
    data: EmployerRow[];
    links: Array<{ url: string | null; label: string; active: boolean }>;
    from: number | null;
    to: number | null;
    total: number;
};

type Props = {
    employers: PaginatedEmployers;
    filters: { status: string; search: string };
    stats: {
        total: number;
        active: number;
        pending: number;
        suspended: number;
        rejected: number;
    };
};

const filterChips = [
    ['all', 'All'],
    ['active', 'Active'],
    ['pending', 'Pending Verification'],
    ['suspended', 'Suspended'],
    ['rejected', 'Rejected'],
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

export default function EmployerManagement({
    employers,
    filters,
    stats,
}: Props) {
    const { flash } = usePage<SharedData>().props;
    const [search, setSearch] = useState(filters.search ?? '');
    const [rejecting, setRejecting] = useState<EmployerRow | null>(null);
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
            '/admin/employers',
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
            <Head title="Employer Management" />

            <div className="space-y-6 p-6">
                <AdminPageHeader
                    title="Employer Management"
                    subtitle="Manage employer accounts, verification, and subscriptions."
                    actions={
                        <Link href="/admin/employers/create">
                            <AdminPrimaryButton>
                                <Plus className="size-4" />
                                Add Employer
                            </AdminPrimaryButton>
                        </Link>
                    }
                />

                {flash.success && (
                    <div className="rounded-xl border border-[#bbf7d0] bg-[#f0fdf4] px-4 py-3 text-sm text-[#15803d]">
                        {typeof flash.success === 'string'
                            ? flash.success
                            : 'Saved successfully.'}
                    </div>
                )}

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
                    {[
                        ['Total Employers', stats.total, 'text-[#0057c8]'],
                        ['Active Employers', stats.active, 'text-[#10b981]'],
                        ['Pending Employers', stats.pending, 'text-[#e57124]'],
                        [
                            'Suspended Employers',
                            stats.suspended,
                            'text-[#ef4444]',
                        ],
                        [
                            'Rejected Employers',
                            stats.rejected,
                            'text-[#64748b]',
                        ],
                    ].map(([label, value, tone]) => (
                        <AdminStatCard
                            key={label}
                            label={label}
                            value={Number(value).toLocaleString()}
                            valueClassName={tone}
                            icon={Building2}
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
                                placeholder="Search employers..."
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
                            <a href={`/admin/employers/export${query}`}>
                                <AdminSecondaryButton className="ml-1">
                                    <Download className="size-4" />
                                    Export
                                </AdminSecondaryButton>
                            </a>
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
                        {employers.data.map((row) => (
                            <tr
                                key={row.id}
                                className="border-b border-[#e2e8f0] last:border-0 hover:bg-[#f8faff]"
                            >
                                <td className="px-3 py-3 font-semibold text-[#050315]">
                                    {row.company_name}
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
                                            href={`/admin/employers/${row.id}`}
                                            className="flex size-8 items-center justify-center rounded-lg border border-[#e2e8f0] text-[#64748b] hover:bg-[#f8faff]"
                                            aria-label="View employer"
                                        >
                                            <Eye className="size-4" />
                                        </Link>
                                        <Link
                                            href={`/admin/employers/${row.id}/edit`}
                                            className="flex size-8 items-center justify-center rounded-lg border border-[#e2e8f0] text-[#64748b] hover:bg-[#f8faff]"
                                            aria-label="Edit employer"
                                        >
                                            <Pencil className="size-4" />
                                        </Link>
                                        {row.can_review && (
                                            <>
                                                <button
                                                    type="button"
                                                    className="flex size-8 items-center justify-center rounded-lg border border-[#d1fae5] bg-[#d1fae5] text-[#065f46] hover:bg-[#a7f3d0]"
                                                    aria-label="Approve employer"
                                                    onClick={() =>
                                                        router.post(
                                                            `/admin/employers/${row.id}/approve`,
                                                        )
                                                    }
                                                >
                                                    <Check className="size-4" />
                                                </button>
                                                <button
                                                    type="button"
                                                    className="flex size-8 items-center justify-center rounded-lg border border-[#fee2e2] bg-[#fee2e2] text-[#991b1b] hover:bg-[#fecaca]"
                                                    aria-label="Reject employer"
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

                    {employers.data.length === 0 && (
                        <p className="mt-6 text-center text-sm text-[#99a1af]">
                            No employers match these filters.
                        </p>
                    )}

                    <AdminPagination
                        showingLabel={`Showing ${employers.from ?? 0}-${employers.to ?? 0} of ${employers.total}`}
                        links={employers.links}
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
                        <DialogTitle>Reject employer</DialogTitle>
                        <DialogDescription>
                            {rejecting
                                ? `Tell ${rejecting.company_name} why this account is being rejected.`
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
                                    `/admin/employers/${rejecting.id}/reject`,
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
