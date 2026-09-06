import { Form, Head, Link } from '@inertiajs/react';

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

type Option = { value: string; label: string };

type Props = {
    options: {
        locations: string[];
        statuses: Option[];
        resume_statuses: Option[];
    };
};

export default function JobSeekerCreate({ options }: Props) {
    const { t } = useLocale();

    return (
        <AdminPortalLayout>
            <Head title={t('admin.job_seekers.add')} />

            <div className="space-y-6 p-6">
                <AdminPageHeader
                    title={t('admin.job_seekers.add')}
                    subtitle={t('admin.job_seekers.create_subtitle')}
                    actions={
                        <Link href="/admin/job-seekers">
                            <AdminSecondaryButton>
                                {t('admin.job_seekers.back_to_list')}
                            </AdminSecondaryButton>
                        </Link>
                    }
                />

                <AdminPanel className="max-w-2xl">
                    <Form
                        action="/admin/job-seekers"
                        method="post"
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
                                        className="h-10 w-full rounded-xl border border-[#e2e8f0] bg-white px-3 text-sm"
                                        defaultValue=""
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
                                </div>
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div className="space-y-1.5">
                                        <Label htmlFor="resume_status">
                                            {t('admin.job_seekers.fields.resume')}
                                        </Label>
                                        <NativeSelect
                                            id="resume_status"
                                            name="resume_status"
                                            defaultValue="warning"
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
                                            defaultValue="active"
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
                                                'admin.job_seekers.fields.password',
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
                                        ? t('common.creating')
                                        : t('admin.job_seekers.create')}
                                </AdminPrimaryButton>
                            </>
                        )}
                    </Form>
                </AdminPanel>
            </div>
        </AdminPortalLayout>
    );
}
