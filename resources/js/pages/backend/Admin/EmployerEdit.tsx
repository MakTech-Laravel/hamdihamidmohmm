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
import { PasswordInput } from '@/components/ui/password-input';
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

    return (
        <AdminPortalLayout>
            <Head title={`Edit ${employer.company_name}`} />

            <div className="space-y-6 p-6">
                <AdminPageHeader
                    title={`Edit ${employer.company_name}`}
                    subtitle="Update employer information, package, and account status."
                    actions={
                        <Link href={`/admin/employers/${employer.id}`}>
                            <AdminSecondaryButton>
                                ← Employer details
                            </AdminSecondaryButton>
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
                                        Company name
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
                                        Contact name
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
                                    <Label htmlFor="email">Email</Label>
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
                                    <Label htmlFor="industry">Industry</Label>
                                    <select
                                        id="industry"
                                        name="industry"
                                        defaultValue={
                                            employer.industry === '—'
                                                ? ''
                                                : employer.industry
                                        }
                                        className="h-10 w-full rounded-xl border border-[#e2e8f0] bg-white px-3 text-sm"
                                    >
                                        <option value="">Select industry</option>
                                        {options.industries.map((industry) => (
                                            <option
                                                key={industry}
                                                value={industry}
                                            >
                                                {industry}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div className="space-y-1.5">
                                        <Label htmlFor="package">Package</Label>
                                        <select
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
                                        </select>
                                        <InputError message={errors.package} />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="account_status">
                                            Status
                                        </Label>
                                        <select
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
                                        </select>
                                        <InputError
                                            message={errors.account_status}
                                        />
                                    </div>
                                </div>
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div className="space-y-1.5">
                                        <Label htmlFor="password">
                                            New password
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
                                            Confirm password
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
                                        ? 'Saving…'
                                        : 'Save changes'}
                                </AdminPrimaryButton>
                            </>
                        )}
                    </Form>
                </AdminPanel>
            </div>
        </AdminPortalLayout>
    );
}
