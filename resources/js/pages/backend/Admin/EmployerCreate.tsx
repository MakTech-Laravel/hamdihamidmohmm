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
import { PasswordInput } from '@/components/ui/password-input';
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
    return (
        <AdminPortalLayout>
            <Head title="Add Employer" />

            <div className="space-y-6 p-6">
                <AdminPageHeader
                    title="Add Employer"
                    subtitle="Create an employer account and choose their package."
                    actions={
                        <Link href="/admin/employers">
                            <AdminSecondaryButton>
                                ← All Employers
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
                                        Company name
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
                                        Contact name
                                    </Label>
                                    <Input
                                        id="contact_name"
                                        name="contact_name"
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
                                        className="rounded-xl"
                                    />
                                    <InputError message={errors.email} />
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="industry">Industry</Label>
                                    <select
                                        id="industry"
                                        name="industry"
                                        className="h-10 w-full rounded-xl border border-[#e2e8f0] bg-white px-3 text-sm"
                                        defaultValue=""
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
                                        </select>
                                        <InputError
                                            message={errors.account_status}
                                        />
                                    </div>
                                </div>
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div className="space-y-1.5">
                                        <Label htmlFor="password">
                                            Password
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
                                        ? 'Creating…'
                                        : 'Create employer'}
                                </AdminPrimaryButton>
                            </>
                        )}
                    </Form>
                </AdminPanel>
            </div>
        </AdminPortalLayout>
    );
}
