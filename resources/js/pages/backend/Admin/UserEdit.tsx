import { Form, Head, Link, usePage } from '@inertiajs/react';

import { AdminIcon } from '@/components/admin-icon';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PasswordInput } from '@/components/ui/password-input';
import AdminPortalLayout from '@/layouts/admin-portal-layout';
import { cn } from '@/lib/utils';
import type { SharedData } from '@/types';

type RoleOption = {
    value: string;
    label: string;
};

type ManagedUser = {
    id: number;
    name: string;
    email: string;
    company_name: string | null;
    role: number | null;
    role_name: string | null;
    role_label: string;
    is_self: boolean;
};

type Props = {
    managedUser: ManagedUser;
    roles: RoleOption[];
    canManageAdmins: boolean;
};

const roleBadgeStyles: Record<string, string> = {
    'super-admin': 'bg-[#f3e8ff] text-[#7e22ce]',
    admin: 'bg-[#dbeafe] text-[#1d4ed8]',
    'job-seeker': 'bg-[#dcfce7] text-[#15803d]',
    employer: 'bg-[#ffedd5] text-[#c2410c]',
};

export default function UserEdit({
    managedUser,
    roles,
    canManageAdmins,
}: Props) {
    const { flash } = usePage<SharedData>().props;

    const assignableRoles = roles.filter((role) => {
        if (role.value === 'super-admin') {
            return canManageAdmins;
        }

        return true;
    });

    return (
        <AdminPortalLayout>
            <Head title={`Edit ${managedUser.name}`} />

            <div className="space-y-6 p-6">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                        <Link
                            href={`/admin/users/${managedUser.id}`}
                            className="text-xs font-semibold text-[#0057c8]"
                        >
                            ← User details
                        </Link>
                        <h1 className="mt-2 text-[28px] font-extrabold tracking-tight text-[#050315]">
                            Edit {managedUser.name}
                        </h1>
                        <p className="mt-1 text-sm text-[#3977a6]">
                            Update account information and assign a role.
                        </p>
                    </div>
                    <span
                        className={cn(
                            'inline-flex w-fit rounded-full px-3 py-1 text-xs font-semibold',
                            roleBadgeStyles[managedUser.role_name ?? ''] ??
                            'bg-[#f1f5f9] text-[#64748b]',
                        )}
                    >
                        {managedUser.role_label}
                    </span>
                </div>

                {flash.success && (
                    <div className="rounded-xl border border-[#bbf7d0] bg-[#f0fdf4] px-4 py-3 text-sm text-[#15803d]">
                        {typeof flash.success === 'string'
                            ? flash.success
                            : 'Saved successfully.'}
                    </div>
                )}

                <div className="max-w-2xl rounded-2xl border border-[#e2e8f0] bg-white p-5 shadow-[0px_1px_3px_rgba(0,0,0,0.06)]">
                    <div className="mb-5 flex items-center gap-2">
                        <AdminIcon
                            src="/images/admin/nav-admins.svg"
                            size={16}
                            tint
                            className="text-[#0057c8]"
                        />
                        <h2 className="text-base font-bold text-[#101828]">
                            Update information
                        </h2>
                    </div>

                    <Form
                        action={`/admin/users/${managedUser.id}`}
                        method="put"
                        className="space-y-4"
                    >
                        {({ processing, errors }) => (
                            <>
                                <div className="space-y-1.5">
                                    <Label htmlFor="name">Full name</Label>
                                    <Input
                                        id="name"
                                        name="name"
                                        defaultValue={managedUser.name}
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
                                        defaultValue={managedUser.email}
                                        className="rounded-xl"
                                    />
                                    <InputError message={errors.email} />
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="company_name">
                                        Company name
                                    </Label>
                                    <Input
                                        id="company_name"
                                        name="company_name"
                                        defaultValue={
                                            managedUser.company_name ?? ''
                                        }
                                        className="rounded-xl"
                                    />
                                    <InputError
                                        message={errors.company_name}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="role">Assign role</Label>
                                    {managedUser.is_self ? (
                                        <>
                                            <input
                                                type="hidden"
                                                name="role"
                                                value={
                                                    managedUser.role_name ?? ''
                                                }
                                            />
                                            <Input
                                                id="role"
                                                value={managedUser.role_label}
                                                disabled
                                                className="rounded-xl"
                                            />
                                        </>
                                    ) : (
                                        <select
                                            id="role"
                                            name="role"
                                            defaultValue={
                                                managedUser.role_name ?? ''
                                            }
                                            className="h-10 w-full rounded-xl border border-[#e2e8f0] bg-white px-3 text-sm"
                                        >
                                            {assignableRoles.map((role) => (
                                                <option
                                                    key={role.value}
                                                    value={role.value}
                                                >
                                                    {role.label}
                                                </option>
                                            ))}
                                        </select>
                                    )}
                                    <InputError message={errors.role} />
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
                                        <InputError
                                            message={errors.password}
                                        />
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
                                <Button
                                    type="submit"
                                    disabled={processing}
                                    className="rounded-xl bg-[#0057c8] text-white hover:bg-[#0046a3]"
                                >
                                    {processing
                                        ? 'Saving...'
                                        : 'Save changes'}
                                </Button>
                            </>
                        )}
                    </Form>
                </div>
            </div>
        </AdminPortalLayout>
    );
}
