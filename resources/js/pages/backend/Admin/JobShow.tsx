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

type Job = {
    id: number;
    title: string;
    employer: string;
    employer_email?: string | null;
    category: string;
    location: string;
    applications: number;
    views: number;
    status: string;
    created: string | null;
    description: string | null;
    employment_type: string | null;
    salary_range: string | null;
    rejection_reason: string | null;
    expires_at: string | null;
    can_review: boolean;
};

export default function JobShow({ job }: { job: Job }) {
    const { flash } = usePage<SharedData>().props;
    const { t } = useLocale();
    const [rejectOpen, setRejectOpen] = useState(false);
    const [rejectionReason, setRejectionReason] = useState('');

    return (
        <AdminPortalLayout>
            <Head title={job.title} />

            <div className="space-y-6 p-6">
                <AdminPageHeader
                    title={job.title}
                    subtitle={`${job.employer} · ${job.location}`}
                    actions={
                        <div className="flex flex-wrap gap-2">
                            <Link href="/admin/jobs">
                                <AdminSecondaryButton>
                                    {t('common.back')}
                                </AdminSecondaryButton>
                            </Link>
                            {job.can_review && (
                                <>
                                    <AdminPrimaryButton
                                        onClick={() =>
                                            router.post(
                                                `/admin/jobs/${job.id}/approve`,
                                            )
                                        }
                                    >
                                        {t('common.approve')}
                                    </AdminPrimaryButton>
                                    <Button
                                        type="button"
                                        className="bg-[#b91c1c] text-white hover:bg-[#991b1b]"
                                        onClick={() => setRejectOpen(true)}
                                    >
                                        {t('common.reject')}
                                    </Button>
                                </>
                            )}
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

                <div className="grid gap-4 lg:grid-cols-3">
                    <AdminPanel className="lg:col-span-2">
                        <h2 className="text-base font-bold text-[#050315]">
                            {t('common.description')}
                        </h2>
                        <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-[#475569]">
                            {job.description || t('admin.jobs.no_description')}
                        </p>
                    </AdminPanel>
                    <AdminPanel className="space-y-3">
                        <AdminStatusBadge label={job.status} tone="info" />
                        <p className="text-sm text-[#64748b]">
                            {t('admin.jobs.fields.employer')}: {job.employer}
                        </p>
                        <p className="text-sm text-[#64748b]">
                            {t('admin.jobs.fields.email')}:{' '}
                            {job.employer_email || '—'}
                        </p>
                        <p className="text-sm text-[#64748b]">
                            {t('admin.jobs.fields.category')}: {job.category}
                        </p>
                        <p className="text-sm text-[#64748b]">
                            {t('admin.jobs.fields.type')}:{' '}
                            {job.employment_type || '—'}
                        </p>
                        <p className="text-sm text-[#64748b]">
                            {t('admin.jobs.fields.salary')}:{' '}
                            {job.salary_range || '—'}
                        </p>
                        <p className="text-sm text-[#64748b]">
                            {t('admin.jobs.fields.applications')}:{' '}
                            {job.applications}
                        </p>
                        <p className="text-sm text-[#64748b]">
                            {t('admin.jobs.fields.views')}: {job.views}
                        </p>
                        <p className="text-sm text-[#64748b]">
                            {t('admin.jobs.fields.expires')}:{' '}
                            {job.expires_at || '—'}
                        </p>
                        {job.rejection_reason && (
                            <p className="text-sm text-[#b91c1c]">
                                {t('admin.jobs.fields.rejection')}:{' '}
                                {job.rejection_reason}
                            </p>
                        )}
                    </AdminPanel>
                </div>
            </div>

            <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{t('admin.jobs.reject_title')}</DialogTitle>
                        <DialogDescription>
                            {t('admin.jobs.reject_prompt')}
                        </DialogDescription>
                    </DialogHeader>
                    <Label htmlFor="job_reject_reason">{t('common.reason')}</Label>
                    <Textarea
                        id="job_reject_reason"
                        value={rejectionReason}
                        onChange={(event) =>
                            setRejectionReason(event.target.value)
                        }
                    />
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
                            disabled={rejectionReason.trim() === ''}
                            className="bg-[#b91c1c] text-white hover:bg-[#991b1b]"
                            onClick={() =>
                                router.post(
                                    `/admin/jobs/${job.id}/reject`,
                                    {
                                        rejection_reason:
                                            rejectionReason.trim(),
                                    },
                                    { onSuccess: () => setRejectOpen(false) },
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
