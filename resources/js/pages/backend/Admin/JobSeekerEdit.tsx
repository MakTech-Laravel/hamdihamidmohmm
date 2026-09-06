import { Form, Head, Link, usePage } from '@inertiajs/react';

import {
    AdminPageHeader,
    AdminPanel,
    AdminPrimaryButton,
    AdminSecondaryButton,
} from '@/components/admin-portal/ui';
import InputError from '@/components/input-error';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { NativeSelect } from '@/components/ui/native-select';
import { PasswordInput } from '@/components/ui/password-input';
import { useLocale } from '@/hooks/use-locale';
import AdminPortalLayout from '@/layouts/admin-portal-layout';
import type { SharedData } from '@/types';

type Option = { value: string; label: string };

type JobSeeker = {
    id: number;
    name: string;
    email: string;
    phone: string;
    location: string;
    resume_value: string;
    status_value: string | null;
};

type Props = {
    jobSeeker: JobSeeker;
    options: {
        locations: string[];
        statuses: Option[];
        resume_statuses: Option[];
    };
};

export default function JobSeekerEdit({ jobSeeker, options }: Props) {
    const { flash } = usePage<SharedData>().props;
    const { t } = useLocale();

    return (
        <AdminPortalLayout>
            <Head
                title={t('admin.job_seekers.edit_title', {
                    name: jobSeeker.name,
                })}
            />

            <div className="space-y-6 p-6">
                <AdminPageHeader
                    title={t('admin.job_seekers.edit_title', {
                        name: jobSeeker.name,
                    })}
                    subtitle={t('admin.job_seekers.edit_subtitle')}
                    actions={
                        <Link href={`/admin/job-seekers/${jobSeeker.id}`}>
                            <AdminSecondaryButton>
                                {t('admin.job_seekers.back_to_details')}
                            </AdminSecondaryButton>
                        </Link>
                    }
                />

                {flash.success && (
                    <div className="rounded-xl border border-[#bbf7d0] bg-[#f0fdf4] px-4 py-3 text-sm text-[#15803d]">
                        {typeof flash.success === 'string'
                            ? flash.success
                            : t('common.saved')}
                    </div>
                )}

                <AdminPanel className="max-w-2xl">
                    <Form
                        action={`/admin/job-seekers/${jobSeeker.id}`}
                        method="put"
                        className="space-y-4"
                    >
                        {({ processing, errors }) => (
                            <>
                                <div className="space-y-1.5">
                                    <Label htmlFor="name">
                                        {t('admin.job_seekers.fields.name')}
                                    </Label>
                                    <Input
                                        id="name"
                                        name="name"
                                        defaultValue={jobSeeker.name}
                                        className="rounded-xl"
                                    />
                                    <InputError message={errors.name} />
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="email">
                                        {t('admin.job_seekers.fields.email')}
                                    </Label>
                                    <Input
                                        id="email"
                                        name="email"
                                        type="email"
                                        defaultValue={jobSeeker.email}
                                        className="rounded-xl"
                                    />
                                    <InputError message={errors.email} />
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="phone">
                                        {t('admin.job_seekers.fields.phone')}
                                    </Label>
                                    <Input
                                        id="phone"
                                        name="phone"
                                        defaultValue={
                                            jobSeeker.phone === '—'
                                                ? ''
                                                : jobSeeker.phone
                                        }
                                        className="rounded-xl"
                                    />
                                    <InputError message={errors.phone} />
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="location">
                                        {t('admin.job_seekers.fields.location')}
                                    </Label>
                                    <NativeSelect
                                        id="location"
                                        name="location"
                                        defaultValue={
                                            jobSeeker.location === '—'
                                                ? ''
                                                : jobSeeker.location
                                        }
                                        className="h-10 w-full rounded-xl border border-[#e2e8f0] bg-white px-3 text-sm"
                                    >
                                        <option value="">
                                            {t(
                                                'admin.job_seekers.fields.select_location',
                                            )}
                                        </option>
                                        {options.locations.map((location) => (
                                            <option
                                                key={location}
                                                value={location}
                                            >
                                                {location}
                                            </option>
                                        ))}
                                    </NativeSelect>
                                    <InputError message={errors.location} />
                                </div>
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div className="space-y-1.5">
                                        <Label htmlFor="resume_status">
                                            {t('admin.job_seekers.fields.resume')}
                                        </Label>
                                        <NativeSelect
                                            id="resume_status"
                                            name="resume_status"
                                            defaultValue={jobSeeker.resume_value}
                                            className="h-10 w-full rounded-xl border border-[#e2e8f0] bg-white px-3 text-sm"
                                        >
                                            {options.resume_statuses.map(
                                                (status) => (
                                                    <option
                                                        key={status.value}
                                                        value={status.value}
                                                    >
                                                        {status.label}
                                                    </option>
                                                ),
                                            )}
                                        </NativeSelect>
                                        <InputError
                                            message={errors.resume_status}
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="account_status">
                                            {t('admin.job_seekers.fields.status')}
                                        </Label>
                                        <NativeSelect
                                            id="account_status"
                                            name="account_status"
                                            defaultValue={
                                                jobSeeker.status_value ??
                                                'active'
                                            }
                                            className="h-10 w-full rounded-xl border border-[#e2e8f0] bg-white px-3 text-sm"
                                        >
                                            {options.statuses.map((status) => (
                                                <option
                                                    key={status.value}
                                                    value={status.value}
                                                >
                                                    {status.label}
                                                </option>
                                            ))}
                                        </NativeSelect>
                                        <InputError
                                            message={errors.account_status}
                                        />
                                    </div>
                                </div>
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div className="space-y-1.5">
                                        <Label htmlFor="password">
                                            {t(
                                                'admin.job_seekers.fields.new_password',
                                            )}
                                        </Label>
                                        <PasswordInput
                                            id="password"
                                            name="password"
                                            autoComplete="new-password"
                                            className="rounded-xl"
                                        />
                                        <InputError message={errors.password} />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="password_confirmation">
                                            {t(
                                                'admin.job_seekers.fields.confirm_password',
                                            )}
                                        </Label>
                                        <PasswordInput
                                            id="password_confirmation"
                                            name="password_confirmation"
                                            autoComplete="new-password"
                                            className="rounded-xl"
                                        />
                                    </div>
                                </div>
                                <AdminPrimaryButton
                                    type="submit"
                                    className={
                                        processing
                                            ? 'pointer-events-none opacity-70'
                                            : ''
                                    }
                                >
                                    {processing
                                        ? t('common.saving')
                                        : t('common.save_changes')}
                                </AdminPrimaryButton>
                            </>
                        )}
                    </Form>
                </AdminPanel>
            </div>
        </AdminPortalLayout>
    );
}
