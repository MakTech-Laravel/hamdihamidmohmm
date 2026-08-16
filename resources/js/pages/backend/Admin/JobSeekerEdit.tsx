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

    return (
        <AdminPortalLayout>
            <Head title={`Edit ${jobSeeker.name}`} />

            <div className="space-y-6 p-6">
                <AdminPageHeader
                    title={`Edit ${jobSeeker.name}`}
                    subtitle="Update job seeker information and account status."
                    actions={
                        <Link href={`/admin/job-seekers/${jobSeeker.id}`}>
                            <AdminSecondaryButton>
                                ← Job seeker details
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
                        action={`/admin/job-seekers/${jobSeeker.id}`}
                        method="put"
                        className="space-y-4"
                    >
                        {({ processing, errors }) => (
                            <>
                                <div className="space-y-1.5">
                                    <Label htmlFor="name">Name</Label>
                                    <Input
                                        id="name"
                                        name="name"
                                        defaultValue={jobSeeker.name}
                                        className="rounded-xl"
                                    />
                                    <InputError message={errors.name} />
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="email">Email</Label>
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
                                    <Label htmlFor="phone">Phone</Label>
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
                                    <Label htmlFor="location">Location</Label>
                                    <select
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
                                            Select location
                                        </option>
                                        {options.locations.map((location) => (
                                            <option
                                                key={location}
                                                value={location}
                                            >
                                                {location}
                                            </option>
                                        ))}
                                    </select>
                                    <InputError message={errors.location} />
                                </div>
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div className="space-y-1.5">
                                        <Label htmlFor="resume_status">
                                            Resume
                                        </Label>
                                        <select
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
                                        </select>
                                        <InputError
                                            message={errors.resume_status}
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="account_status">
                                            Status
                                        </Label>
                                        <select
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
