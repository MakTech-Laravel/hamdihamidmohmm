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

type Employer = {
    id: number;
    company_name: string;
    contact_name: string;
    email: string;
    industry: string;
    package_value: string;
    status_value: string | null;
};

type Props = {
    employer: Employer;
    options: {
        industries: string[];
        packages: Option[];
        statuses: Option[];
    };
};

export default function EmployerEdit({ employer, options }: Props) {
    const { flash } = usePage<SharedData>().props;
    const { t } = useLocale();

    return (
        <AdminPortalLayout>
            <Head
                title={t('admin.employers.edit_title', {
                    name: employer.company_name,
                })}
            />

            <div className="space-y-6 p-6">
                <AdminPageHeader
                    title={t('admin.employers.edit_title', {
                        name: employer.company_name,
                    })}
                    subtitle={t('admin.employers.edit_subtitle')}
                    actions={
                        <Link href={`/admin/employers/${employer.id}`}>
                            <AdminSecondaryButton>
                                {t('admin.employers.back_to_details')}
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
                        action={`/admin/employers/${employer.id}`}
                        method="put"
                        className="space-y-4"
                    >
                        {({ processing, errors }) => (
                            <>
                                <div className="space-y-1.5">
                                    <Label htmlFor="company_name">
                                        {t('admin.employers.fields.company_name')}
                                    </Label>
                                    <Input
                                        id="company_name"
                                        name="company_name"
                                        defaultValue={employer.company_name}
                                        className="rounded-xl"
                                    />
                                    <InputError message={errors.company_name} />
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="contact_name">
                                        {t('admin.employers.fields.contact_name')}
                                    </Label>
                                    <Input
                                        id="contact_name"
                                        name="contact_name"
                                        defaultValue={employer.contact_name}
                                        className="rounded-xl"
                                    />
                                    <InputError message={errors.contact_name} />
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="email">
                                        {t('admin.employers.fields.email')}
                                    </Label>
                                    <Input
                                        id="email"
                                        name="email"
                                        type="email"
                                        defaultValue={employer.email}
                                        className="rounded-xl"
                                    />
                                    <InputError message={errors.email} />
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="industry">
                                        {t('admin.employers.fields.industry')}
                                    </Label>
                                    <NativeSelect
                                        id="industry"
                                        name="industry"
                                        defaultValue={
                                            employer.industry === '—'
                                                ? ''
                                                : employer.industry
                                        }
                                        className="h-10 w-full rounded-xl border border-[#e2e8f0] bg-white px-3 text-sm"
                                    >
                                        <option value="">
                                            {t(
                                                'admin.employers.fields.select_industry',
                                            )}
                                        </option>
                                        {options.industries.map((industry) => (
                                            <option
                                                key={industry}
                                                value={industry}
                                            >
                                                {industry}
                                            </option>
                                        ))}
                                    </NativeSelect>
                                </div>
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div className="space-y-1.5">
                                        <Label htmlFor="package">
                                            {t('admin.employers.cols.package')}
                                        </Label>
                                        <NativeSelect
                                            id="package"
                                            name="package"
                                            defaultValue={employer.package_value}
                                            className="h-10 w-full rounded-xl border border-[#e2e8f0] bg-white px-3 text-sm"
                                        >
                                            {options.packages.map((pkg) => (
                                                <option
                                                    key={pkg.value}
                                                    value={pkg.value}
                                                >
                                                    {pkg.label}
                                                </option>
                                            ))}
                                        </NativeSelect>
                                        <InputError message={errors.package} />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="account_status">
                                            {t('admin.employers.fields.status')}
                                        </Label>
                                        <NativeSelect
                                            id="account_status"
                                            name="account_status"
                                            defaultValue={
                                                employer.status_value ??
                                                'pending_verification'
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
                                                'admin.employers.fields.new_password',
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
                                                'admin.employers.fields.confirm_password',
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
