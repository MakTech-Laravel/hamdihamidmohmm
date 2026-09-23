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
import { PasswordInput } from '@/components/ui/password-input';
import { useLocale } from '@/hooks/use-locale';
import AdminPortalLayout from '@/layouts/admin-portal-layout';
import type { SharedData } from '@/types';

type JobSeeker = {
    id: number;
    name: string;
    email: string;
    phone: string;
    location: string;
    applications: number;
    resume: string;
    status: string;
    can_suspend: boolean;
    can_reactivate: boolean;
    created_at: string | null;
    updated_at: string | null;
};

type ActivityItem = {
    id: number;
    action_label: string;
    description: string;
    actor_name: string | null;
    created_at: string | null;
};

type Props = {
    jobSeeker: JobSeeker;
    activities: ActivityItem[];
};

function tone(
    value: string,
): 'success' | 'warning' | 'danger' | 'neutral' {
    if (value === 'Active') {
        return 'success';
    }
    if (value === 'Inactive' || value === 'Warning') {
        return 'warning';
    }
    if (value === 'Suspended') {
        return 'danger';
    }
    return 'neutral';
}

export default function JobSeekerShow({ jobSeeker, activities }: Props) {
    const { flash } = usePage<SharedData>().props;
    const { t } = useLocale();
    const [resetOpen, setResetOpen] = useState(false);
    const [password, setPassword] = useState('');
    const [passwordConfirmation, setPasswordConfirmation] = useState('');
    const [deleteOpen, setDeleteOpen] = useState(false);

    const facts = [
        [t('admin.job_seekers.fields.name'), jobSeeker.name],
        [t('admin.job_seekers.fields.email'), jobSeeker.email],
        [t('admin.job_seekers.fields.phone'), jobSeeker.phone],
        [t('admin.job_seekers.fields.location'), jobSeeker.location],
        [
            t('admin.job_seekers.cols.applications'),
            String(jobSeeker.applications),
        ],
        [t('admin.job_seekers.fields.resume'), jobSeeker.resume],
        [t('admin.job_seekers.cols.registered'), jobSeeker.created_at ?? '—'],
        [t('admin.users.meta.last_updated'), jobSeeker.updated_at ?? '—'],
    ];

    return (
        <AdminPortalLayout>
            <Head
                title={t('admin.job_seekers.show_subtitle', {
                    name: jobSeeker.name,
                })}
            />

            <div className="space-y-6 p-6">
                <AdminPageHeader
                    title={jobSeeker.name}
                    subtitle={t('admin.job_seekers.show_desc')}
                    actions={
                        <div className="flex flex-wrap gap-2">
                            <Link href="/admin/job-seekers">
                                <AdminSecondaryButton>
                                    {t('admin.job_seekers.back_to_list')}
                                </AdminSecondaryButton>
                            </Link>
                            <Link
                                href={`/admin/job-seekers/${jobSeeker.id}/edit`}
                            >
                                <AdminPrimaryButton>
                                    {t('common.edit')}
                                </AdminPrimaryButton>
                            </Link>
                            <Button
                                type="button"
                                variant="outline"
                                className="rounded-xl"
                                onClick={() => setResetOpen(true)}
                            >
                                {t('admin.job_seekers.reset_password')}
                            </Button>
                            <Button
                                type="button"
                                className="rounded-xl bg-[#b91c1c] text-white hover:bg-[#991b1b]"
                                onClick={() => setDeleteOpen(true)}
                            >
                                {t('admin.job_seekers.delete_account')}
                            </Button>
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
                        label={jobSeeker.status}
                        tone={tone(jobSeeker.status)}
                    />
                    <AdminStatusBadge
                        label={`${t('admin.job_seekers.fields.resume')}: ${jobSeeker.resume}`}
                        tone={tone(jobSeeker.resume)}
                    />
                </div>

                <div className="flex flex-wrap gap-2">
                    {jobSeeker.can_reactivate ? (
                        <Button
                            type="button"
                            className="rounded-xl bg-[#059669] text-white hover:bg-[#047857]"
                            onClick={() =>
                                router.post(
                                    `/admin/job-seekers/${jobSeeker.id}/reactivate`,
                                )
                            }
                        >
                            {t('common.reactivate')}
                        </Button>
                    ) : (
                        <Button
                            type="button"
                            className="rounded-xl bg-[#b91c1c] text-white hover:bg-[#991b1b]"
                            onClick={() =>
                                router.post(
                                    `/admin/job-seekers/${jobSeeker.id}/suspend`,
                                )
                            }
                        >
                            {t('common.suspend')}
                        </Button>
                    )}
                </div>

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

            <Dialog open={resetOpen} onOpenChange={setResetOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {t('admin.job_seekers.reset_password_title')}
                        </DialogTitle>
                        <DialogDescription>
                            {t('admin.job_seekers.reset_password_prompt')}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-3">
                        <div className="space-y-1.5">
                            <Label htmlFor="reset_password">
                                {t('admin.employers.fields.new_password')}
                            </Label>
                            <PasswordInput
                                id="reset_password"
                                value={password}
                                onChange={(event) =>
                                    setPassword(event.target.value)
                                }
                                className="rounded-xl"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="reset_password_confirmation">
                                {t('admin.employers.fields.confirm_password')}
                            </Label>
                            <PasswordInput
                                id="reset_password_confirmation"
                                value={passwordConfirmation}
                                onChange={(event) =>
                                    setPasswordConfirmation(event.target.value)
                                }
                                className="rounded-xl"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setResetOpen(false)}
                        >
                            {t('common.cancel')}
                        </Button>
                        <Button
                            type="button"
                            disabled={
                                password.trim() === '' ||
                                password !== passwordConfirmation
                            }
                            onClick={() =>
                                router.post(
                                    `/admin/job-seekers/${jobSeeker.id}/reset-password`,
                                    {
                                        password,
                                        password_confirmation:
                                            passwordConfirmation,
                                    },
                                    {
                                        onSuccess: () => {
                                            setResetOpen(false);
                                            setPassword('');
                                            setPasswordConfirmation('');
                                        },
                                    },
                                )
                            }
                        >
                            {t('admin.job_seekers.reset_password')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {t('admin.job_seekers.delete_title')}
                        </DialogTitle>
                        <DialogDescription>
                            {t('admin.job_seekers.delete_confirm')}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setDeleteOpen(false)}
                        >
                            {t('common.cancel')}
                        </Button>
                        <Button
                            type="button"
                            className="bg-[#b91c1c] text-white hover:bg-[#991b1b]"
                            onClick={() =>
                                router.delete(
                                    `/admin/job-seekers/${jobSeeker.id}`,
                                )
                            }
                        >
                            {t('admin.job_seekers.delete_account')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AdminPortalLayout>
    );
}
