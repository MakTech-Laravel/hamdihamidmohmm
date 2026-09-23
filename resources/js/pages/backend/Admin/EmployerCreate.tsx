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
        industries: string[];
        packages: Option[];
        statuses: Option[];
    };
};

export default function EmployerCreate({ options }: Props) {
    const { t } = useLocale();

    return (
        <AdminPortalLayout>
            <Head title={t('admin.employers.add')} />

            <div className="space-y-6 p-6">
                <AdminPageHeader
                    title={t('admin.employers.add')}
                    subtitle={t('admin.employers.create_subtitle')}
                    actions={
                        <Link href="/admin/employers">
                            <AdminSecondaryButton>
                                {t('admin.employers.back_to_list')}
                            </AdminSecondaryButton>
                        </Link>
                    }
                />

                <AdminPanel className="max-w-2xl">
                    <Form
                        action="/admin/employers"
                        method="post"
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
                                        className="rounded-xl"
                                    />
                                    <InputError message={errors.email} />
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="phone">
                                        {t('admin.employers.fields.phone')}
                                    </Label>
                                    <Input
                                        id="phone"
                                        name="phone"
                                        type="tel"
                                        className="rounded-xl"
                                    />
                                    <InputError message={errors.phone} />
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="industry">
                                        {t('admin.employers.fields.industry')}
                                    </Label>
                                    <NativeSelect
                                        id="industry"
                                        name="industry"
                                        className="h-10 w-full rounded-xl border border-[#e2e8f0] bg-white px-3 text-sm"
                                        defaultValue=""
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
                                            defaultValue="professional"
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
                                            defaultValue="pending_verification"
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
                                            {t('admin.employers.fields.password')}
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
                                        ? t('common.creating')
                                        : t('admin.employers.create')}
                                </AdminPrimaryButton>
                            </>
                        )}
                    </Form>
                </AdminPanel>
            </div>
        </AdminPortalLayout>
    );
}
