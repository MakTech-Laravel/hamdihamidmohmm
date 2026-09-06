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
import { useLocale } from '@/hooks/use-locale';
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
    if (value === 'Professional' || value === 'Single Posting') {
        return 'info';
    }
    if (
        value === 'Enterprise' ||
        value === 'Premium' ||
        value === 'Business Package'
    ) {
        return 'purple';
    }
    if (value === 'Starter') {
        return 'orange';
    }
    return 'neutral';
}

export default function EmployerShow({ employer, activities }: Props) {
    const { flash } = usePage<SharedData>().props;
    const { t } = useLocale();
    const [rejectOpen, setRejectOpen] = useState(false);
    const [rejectionReason, setRejectionReason] = useState('');

    const facts = [
        [t('common.company'), employer.company_name],
        [t('admin.employers.cols.contact'), employer.contact_name],
        [t('common.email'), employer.email],
        [t('admin.employers.fields.industry'), employer.industry],
        [t('admin.employers.cols.package'), employer.package],
        [t('admin.dashboard.active_jobs'), String(employer.jobs)],
        [t('admin.employers.cols.registered'), employer.created_at ?? '—'],
        [t('admin.users.meta.last_updated'), employer.updated_at ?? '—'],
        [t('common.verified'), employer.verified_at ?? t('common.never')],
    ];

    return (
        <AdminPortalLayout>
            <Head
                title={t('admin.employers.show_subtitle', {
                    name: employer.company_name,
                })}
            />

            <div className="space-y-6 p-6">
                <AdminPageHeader
                    title={employer.company_name}
                    subtitle={t('admin.employers.show_desc')}
                    actions={
                        <div className="flex flex-wrap gap-2">
                            <Link href="/admin/employers">
                                <AdminSecondaryButton>
                                    {t('admin.employers.back_to_list')}
                                </AdminSecondaryButton>
                            </Link>
                            <Link href={`/admin/employers/${employer.id}/edit`}>
                                <AdminPrimaryButton>
                                    {t('common.edit')}
                                </AdminPrimaryButton>
                            </Link>
                        </div>
                    }
                />

                {flash.success && (
                    <div className="rounded-xl border border-[#bbf7d0] bg-[#f0fdf4] px-4 py-3 text-sm text-[#15803d]">
                        {typeof flash.success === 'string'
                            ? flash.success
                            : t('common.saved')}
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
                            {t('common.approve')}
                        </Button>
                        <Button
                            type="button"
                            className="rounded-xl bg-[#b91c1c] text-white hover:bg-[#991b1b]"
                            onClick={() => setRejectOpen(true)}
                        >
                            {t('common.reject')}
                        </Button>
                    </div>
                )}

                {employer.rejection_reason && (
                    <div className="rounded-xl border border-[#fecaca] bg-[#fef2f2] px-4 py-3 text-sm text-[#991b1b]">
                        {t('common.reason')}: {employer.rejection_reason}
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
                        {t('common.activity')}
                    </h2>
                    {activities.length === 0 ? (
                        <p className="text-sm text-[#99a1af]">
                            {t('admin.activity.empty')}
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
                                        {item.actor_name ?? t('common.system')}{' '}
                                        · {item.created_at}
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
                        <DialogTitle>
                            {t('admin.employers.reject_title')}
                        </DialogTitle>
                        <DialogDescription>
                            {t('admin.employers.reject_prompt')}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-1.5">
                        <Label htmlFor="rejection_reason">
                            {t('common.reason')}
                        </Label>
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
                            {t('common.cancel')}
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
                            {t('common.reject')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AdminPortalLayout>
    );
}
