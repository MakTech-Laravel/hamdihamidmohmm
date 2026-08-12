import { Form, Head, Link, usePage } from '@inertiajs/react';
import { Check, Shield, X } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import AdminPortalLayout from '@/layouts/admin-portal-layout';
import { cn } from '@/lib/utils';
import type { SharedData } from '@/types';

type RoleCard = {
    value: string;
    label: string;
    users_count: number;
    permissions: string[];
    permissions_count: number;
};

type PermissionMatrixRow = {
    name: string;
    label: string;
    roles: Record<string, boolean>;
};

type Props = {
    roles: RoleCard[];
    permissionMatrix: PermissionMatrixRow[];
    allPermissions: Array<{ name: string; label: string }>;
    adminPermissions: string[];
    canManageAdmins: boolean;
};

const roleBadgeStyles: Record<string, string> = {
    'super-admin': 'bg-[#f3e8ff] text-[#7e22ce]',
    admin: 'bg-[#dbeafe] text-[#1d4ed8]',
    'job-seeker': 'bg-[#dcfce7] text-[#15803d]',
    employer: 'bg-[#ffedd5] text-[#c2410c]',
};

export default function RolePermissions({
    roles,
    permissionMatrix,
    allPermissions,
    adminPermissions,
    canManageAdmins,
}: Props) {
    const { flash } = usePage<SharedData>().props;
    const [selectedPermissions, setSelectedPermissions] =
        useState<string[]>(adminPermissions);

    return (
        <AdminPortalLayout>
            <Head title="Roles & Permissions" />

            <div className="space-y-6 p-6">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                        <h1 className="text-[28px] font-extrabold tracking-tight text-[#050315]">
                            Roles & Permissions
                        </h1>
                        <p className="mt-1 text-sm text-[#3977a6]">
                            Review role access and update Admin permissions.
                        </p>
                    </div>
                    <Link
                        href="/admin/users"
                        className="inline-flex items-center justify-center rounded-xl border border-[#e2e8f0] bg-white px-4 py-2.5 text-sm font-semibold text-[#0057c8] hover:bg-[#f8fafc]"
                    >
                        All Users
                    </Link>
                </div>

                {flash.success && (
                    <div className="rounded-xl border border-[#bbf7d0] bg-[#f0fdf4] px-4 py-3 text-sm text-[#15803d]">
                        {typeof flash.success === 'string'
                            ? flash.success
                            : 'Saved successfully.'}
                    </div>
                )}

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    {roles.map((role) => (
                        <div
                            key={role.value}
                            className="rounded-2xl border border-[#e2e8f0] bg-white p-5 shadow-[0px_1px_3px_rgba(0,0,0,0.06)]"
                        >
                            <span
                                className={cn(
                                    'rounded-full px-2.5 py-1 text-xs font-semibold',
                                    roleBadgeStyles[role.value] ??
                                    'bg-[#f1f5f9] text-[#64748b]',
                                )}
                            >
                                {role.label}
                            </span>
                            <p className="mt-4 text-3xl font-extrabold text-[#101828]">
                                {role.users_count}
                            </p>
                            <p className="mt-1 text-xs text-[#6a7282]">
                                Users with this role
                            </p>
                            <p className="mt-3 text-xs font-medium text-[#64748b]">
                                {role.permissions_count} permissions assigned
                            </p>
                        </div>
                    ))}
                </div>

                <div className="rounded-2xl border border-[#e2e8f0] bg-white p-5 shadow-[0px_1px_3px_rgba(0,0,0,0.06)]">
                    <div className="mb-4 flex items-center gap-2">
                        <Shield className="size-5 text-[#0057c8]" />
                        <div>
                            <h2 className="text-base font-bold text-[#101828]">
                                Role Permissions Matrix
                            </h2>
                            <p className="text-xs text-[#99a1af]">
                                Module access by role
                            </p>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="min-w-full text-left text-sm">
                            <thead className="border-b border-[#e2e8f0] text-[#64748b]">
                                <tr>
                                    <th className="px-3 py-2 font-semibold">
                                        Module
                                    </th>
                                    <th className="px-3 py-2 font-semibold">
                                        Super Admin
                                    </th>
                                    <th className="px-3 py-2 font-semibold">
                                        Admin
                                    </th>
                                    <th className="px-3 py-2 font-semibold">
                                        Job Seeker
                                    </th>
                                    <th className="px-3 py-2 font-semibold">
                                        Employer
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {permissionMatrix.map((row) => (
                                    <tr
                                        key={row.name}
                                        className="border-b border-[#f1f5f9]"
                                    >
                                        <td className="px-3 py-3 font-medium text-[#101828]">
                                            {row.label}
                                        </td>
                                        {(
                                            [
                                                'super-admin',
                                                'admin',
                                                'job-seeker',
                                                'employer',
                                            ] as const
                                        ).map((roleKey) => (
                                            <td
                                                key={roleKey}
                                                className="px-3 py-3"
                                            >
                                                <PermissionIcon
                                                    allowed={
                                                        row.roles[roleKey]
                                                    }
                                                />
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {canManageAdmins ? (
                    <div className="rounded-2xl border border-[#e2e8f0] bg-white p-5 shadow-[0px_1px_3px_rgba(0,0,0,0.06)]">
                        <h3 className="text-base font-bold text-[#101828]">
                            Edit Admin Role Permissions
                        </h3>
                        <p className="mt-1 text-xs text-[#99a1af]">
                            Super Admin always has full access. Update the Admin
                            role permissions below.
                        </p>
                        <Form
                            action="/admin/roles/permissions"
                            method="put"
                            className="mt-4 space-y-4"
                        >
                            {({ processing }) => (
                                <>
                                    <input
                                        type="hidden"
                                        name="role"
                                        value="admin"
                                    />
                                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                        {allPermissions.map((permission) => {
                                            const checked =
                                                selectedPermissions.includes(
                                                    permission.name,
                                                );

                                            return (
                                                <label
                                                    key={permission.name}
                                                    className="flex items-center gap-2 rounded-xl border border-[#e2e8f0] px-3 py-2 text-sm"
                                                >
                                                    <input
                                                        type="checkbox"
                                                        name="permissions[]"
                                                        value={permission.name}
                                                        checked={checked}
                                                        onChange={(event) => {
                                                            setSelectedPermissions(
                                                                (current) =>
                                                                    event.target
                                                                        .checked
                                                                        ? [
                                                                            ...current,
                                                                            permission.name,
                                                                        ]
                                                                        : current.filter(
                                                                            (
                                                                                item,
                                                                            ) =>
                                                                                item !==
                                                                                permission.name,
                                                                        ),
                                                            );
                                                        }}
                                                        className="accent-[#0057c8]"
                                                    />
                                                    {permission.label}
                                                </label>
                                            );
                                        })}
                                    </div>
                                    <Button
                                        type="submit"
                                        disabled={processing}
                                        className="rounded-xl bg-[#0057c8] text-white hover:bg-[#0046a3]"
                                    >
                                        {processing
                                            ? 'Saving…'
                                            : 'Save Admin Permissions'}
                                    </Button>
                                </>
                            )}
                        </Form>
                    </div>
                ) : (
                    <div className="rounded-2xl border border-[#e2e8f0] bg-[#f8fafc] p-5 text-sm text-[#64748b]">
                        Only Super Admins can edit role permissions.
                    </div>
                )}
            </div>
        </AdminPortalLayout>
    );
}

function PermissionIcon({ allowed }: { allowed: boolean }) {
    return allowed ? (
        <span className="inline-flex size-6 items-center justify-center rounded-full bg-[#dcfce7] text-[#15803d]">
            <Check className="size-3.5" />
        </span>
    ) : (
        <span className="inline-flex size-6 items-center justify-center rounded-full bg-[#f1f5f9] text-[#94a3b8]">
            <X className="size-3.5" />
        </span>
    );
}
