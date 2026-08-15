import { Head, Link, router, usePage } from '@inertiajs/react';
import { useState } from 'react';

import {
    AdminPageHeader,
    AdminPanel,
    AdminPrimaryButton,
    AdminSecondaryButton,
    AdminStatusBadge,
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

type Employer = {
    id: number;
    company_name: string;
    industry: string;
    contact: string;
    contact_name: string;
    email: string;
    verification: string;
    package: string;
    jobs: number;
    status: string;
    rejection_reason: string | null;
    verified_at: string | null;
    created_at: string | null;
    updated_at: string | null;
    can_review: boolean;
};

type ActivityItem = {
    id: number;
    action_label: string;
    description: string;
    actor_name: string | null;
    created_at: string | null;
};

type Props = {
    employer: Employer;
    activities: ActivityItem[];
};

function tone(
    value: string,
): 'success' | 'warning' | 'danger' | 'info' | 'purple' | 'orange' | 'neutral' {
    if (value === 'Approved' || value === 'Active') {
        return 'success';
    }
    if (value === 'Pending' || value === 'Pending Verification') {
        return 'warning';
    }
    if (value === 'Rejected' || value === 'Suspended') {
        return 'danger';
    }
    if (value === 'Professional') {
        return 'info';
    }
    if (value === 'Enterprise' || value === 'Premium') {
        return 'purple';
    }
    if (value === 'Starter') {
        return 'orange';
    }
    return 'neutral';
}

export default function EmployerShow({ employer, activities }: Props) {
    const { flash } = usePage<SharedData>().props;
    const [rejectOpen, setRejectOpen] = useState(false);
    const [rejectionReason, setRejectionReason] = useState('');

    const facts = [
        ['Company', employer.company_name],
        ['Contact', employer.contact_name],
        ['Email', employer.email],
        ['Industry', employer.industry],
        ['Package', employer.package],
        ['Active jobs', String(employer.jobs)],
        ['Registered', employer.created_at ?? '—'],
        ['Last updated', employer.updated_at ?? '—'],
        ['Verified', employer.verified_at ?? 'Never'],
    ];

    return (
        <AdminPortalLayout>
            <Head title={`${employer.company_name} · Employer`} />

            <div className="space-y-6 p-6">
                <AdminPageHeader
                    title={employer.company_name}
                    subtitle="View employer details and verification history."
                    actions={
                        <div className="flex flex-wrap gap-2">
                            <Link href="/admin/employers">
                                <AdminSecondaryButton>
                                    ← All Employers
                                </AdminSecondaryButton>
                            </Link>
                            <Link href={`/admin/employers/${employer.id}/edit`}>
                                <AdminPrimaryButton>Edit</AdminPrimaryButton>
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

                <div className="flex flex-wrap gap-2">
                    <AdminStatusBadge
                        label={employer.status}
                        tone={tone(employer.status)}
                    />
                    <AdminStatusBadge
                        label={employer.verification}
                        tone={tone(employer.verification)}
                    />
                    <AdminStatusBadge
                        label={employer.package}
                        tone={tone(employer.package)}
                    />
                </div>

                {employer.can_review && (
                    <div className="flex flex-wrap gap-2">
                        <Button
                            type="button"
                            className="rounded-xl bg-[#059669] text-white hover:bg-[#047857]"
                            onClick={() =>
                                router.post(
                                    `/admin/employers/${employer.id}/approve`,
                                )
                            }
                        >
                            Approve
                        </Button>
                        <Button
                            type="button"
                            className="rounded-xl bg-[#b91c1c] text-white hover:bg-[#991b1b]"
                            onClick={() => setRejectOpen(true)}
                        >
                            Reject
                        </Button>
                    </div>
                )}

                {employer.rejection_reason && (
                    <div className="rounded-xl border border-[#fecaca] bg-[#fef2f2] px-4 py-3 text-sm text-[#991b1b]">
                        Rejection reason: {employer.rejection_reason}
                    </div>
                )}

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {facts.map(([label, value]) => (
                        <div
                            key={label}
                            className="rounded-2xl border border-[#e2e8f0] bg-white p-4 shadow-[0px_1px_3px_rgba(0,0,0,0.06)]"
                        >
                            <p className="text-xs font-medium text-[#6a7282]">
                                {label}
                            </p>
                            <p className="mt-1 text-sm font-semibold text-[#101828]">
                                {value}
                            </p>
                        </div>
                    ))}
                </div>

                <AdminPanel>
                    <h2 className="mb-4 text-base font-bold text-[#101828]">
                        Activity
                    </h2>
                    {activities.length === 0 ? (
                        <p className="text-sm text-[#99a1af]">
                            No tracked activity yet.
                        </p>
                    ) : (
                        <ol className="space-y-4">
                            {activities.map((item) => (
                                <li
                                    key={item.id}
                                    className="border-l-2 border-[#dbeafe] pl-3"
                                >
                                    <p className="text-sm font-semibold text-[#101828]">
                                        {item.action_label}
                                    </p>
                                    <p className="text-xs text-[#64748b]">
                                        {item.description}
                                    </p>
                                    <p className="mt-1 text-[11px] text-[#99a1af]">
                                        {item.actor_name ?? 'System'} ·{' '}
                                        {item.created_at}
                                    </p>
                                </li>
                            ))}
                        </ol>
                    )}
                </AdminPanel>
            </div>

            <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Reject employer</DialogTitle>
                        <DialogDescription>
                            Provide a reason for rejecting this employer.
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
                            onClick={() => setRejectOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            className="bg-[#b91c1c] text-white hover:bg-[#991b1b]"
                            disabled={rejectionReason.trim() === ''}
                            onClick={() =>
                                router.post(
                                    `/admin/employers/${employer.id}/reject`,
                                    {
                                        rejection_reason:
                                            rejectionReason.trim(),
                                    },
                                    {
                                        onSuccess: () => setRejectOpen(false),
                                    },
                                )
                            }
                        >
                            Reject
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AdminPortalLayout>
    );
}
