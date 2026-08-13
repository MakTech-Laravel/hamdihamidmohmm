import { Form, Head, Link, usePage } from '@inertiajs/react';

import { AdminIcon } from '@/components/admin-icon';
import AdminPortalLayout from '@/layouts/admin-portal-layout';
import { cn } from '@/lib/utils';
import type { SharedData } from '@/types';

type RoleCard = {
    id: number;
    value: string;
    label: string;
    description: string | null;
    users_count: number;
    permissions_count: number;
    editable: boolean;
    locked: boolean;
    is_system: boolean;
    can_delete: boolean;
    kind: 'admin-panel' | 'portal';
};

type PermissionMatrixRow = {
    name: string;
    label: string;
    group: string;
    roles: Record<string, boolean>;
};

type Props = {
    roles: RoleCard[];
    permissionMatrix: PermissionMatrixRow[];
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
    canManageAdmins,
}: Props) {
    const { flash } = usePage<SharedData>().props;

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
                            Create roles, edit access, and set which modules
                            each role can use.
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <Link
                            href="/admin/users"
                            className="inline-flex items-center justify-center rounded-xl border border-[#e2e8f0] bg-white px-4 py-2.5 text-sm font-semibold text-[#0057c8] hover:bg-[#f8fafc]"
                        >
                            All Users
                        </Link>
                        {canManageAdmins && (
                            <Link
                                href="/admin/roles-permissions/create"
                                className="inline-flex items-center justify-center rounded-xl bg-[#0057c8] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#0046a3]"
                            >
                                + Create Role
                            </Link>
                        )}
                    </div>
                </div>

                {flash.success && (
                    <div className="rounded-xl border border-[#bbf7d0] bg-[#f0fdf4] px-4 py-3 text-sm text-[#15803d]">
                        {typeof flash.success === 'string'
                            ? flash.success
                            : 'Saved successfully.'}
                    </div>
                )}

                <div className="rounded-2xl border border-[#e2e8f0] bg-white p-5 shadow-[0px_1px_3px_rgba(0,0,0,0.06)]">
                    <div className="mb-4 flex items-center gap-2">
                        <AdminIcon
                            src="/images/admin/nav-verification.svg"
                            size={16}
                            tint
                            className="text-[#0057c8]"
                        />
                        <div>
                            <h2 className="text-base font-bold text-[#101828]">
                                Roles
                            </h2>
                            <p className="text-xs text-[#99a1af]">
                                System roles stay in place. Custom roles can be
                                created, edited, or removed.
                            </p>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="min-w-full text-left text-sm">
                            <thead className="border-b border-[#e2e8f0] text-[#64748b]">
                                <tr>
                                    <th className="px-3 py-2 font-semibold">
                                        Role
                                    </th>
                                    <th className="px-3 py-2 font-semibold">
                                        Type
                                    </th>
                                    <th className="px-3 py-2 font-semibold">
                                        Users
                                    </th>
                                    <th className="px-3 py-2 font-semibold">
                                        Permissions
                                    </th>
                                    <th className="px-3 py-2 font-semibold">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {roles.map((role) => (
                                    <tr
                                        key={role.id}
                                        className="border-b border-[#f1f5f9]"
                                    >
                                        <td className="px-3 py-3">
                                            <div className="flex flex-col gap-1">
                                                <span
                                                    className={cn(
                                                        'w-fit rounded-full px-2.5 py-1 text-xs font-semibold',
                                                        roleBadgeStyles[
                                                            role.value
                                                        ] ??
                                                            'bg-[#eef2ff] text-[#3730a3]',
                                                    )}
                                                >
                                                    {role.label}
                                                </span>
                                                <span className="text-xs text-[#99a1af]">
                                                    {role.description ||
                                                        role.value}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-3 py-3 text-xs font-medium text-[#64748b]">
                                            {role.locked
                                                ? 'Locked'
                                                : role.is_system
                                                  ? 'System'
                                                  : 'Custom'}
                                        </td>
                                        <td className="px-3 py-3 font-semibold text-[#101828]">
                                            {role.users_count}
                                        </td>
                                        <td className="px-3 py-3 text-[#64748b]">
                                            {role.permissions_count} assigned
                                        </td>
                                        <td className="px-3 py-3">
                                            <div className="flex flex-wrap gap-2">
                                                <Link
                                                    href={`/admin/roles-permissions/${role.id}`}
                                                    className="inline-flex h-9 items-center rounded-lg border border-[#e2e8f0] bg-white px-3 text-xs font-semibold text-[#0057c8] hover:bg-[#f8faff]"
                                                >
                                                    View
                                                </Link>
                                                {canManageAdmins &&
                                                    role.editable && (
                                                        <Link
                                                            href={`/admin/roles-permissions/${role.id}/edit`}
                                                            className="inline-flex h-9 items-center rounded-lg border border-[#e2e8f0] bg-white px-3 text-xs font-semibold text-[#101828] hover:bg-[#f8faff]"
                                                        >
                                                            Edit
                                                        </Link>
                                                    )}
                                                {canManageAdmins &&
                                                    role.can_delete && (
                                                        <Form
                                                            action={`/admin/roles-permissions/${role.id}`}
                                                            method="delete"
                                                        >
                                                            {({
                                                                processing,
                                                            }) => (
                                                                <button
                                                                    type="submit"
                                                                    disabled={
                                                                        processing
                                                                    }
                                                                    className="inline-flex h-9 items-center rounded-lg border border-[#fecaca] bg-white px-3 text-xs font-semibold text-[#b91c1c] hover:bg-[#fef2f2]"
                                                                >
                                                                    Delete
                                                                </button>
                                                            )}
                                                        </Form>
                                                    )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="rounded-2xl border border-[#e2e8f0] bg-white p-5 shadow-[0px_1px_3px_rgba(0,0,0,0.06)]">
                    <div className="mb-4 flex items-center gap-2">
                        <AdminIcon
                            src="/images/admin/nav-reports.svg"
                            size={16}
                            tint
                            className="text-[#0057c8]"
                        />
                        <div>
                            <h2 className="text-base font-bold text-[#101828]">
                                Access comparison
                            </h2>
                            <p className="text-xs text-[#99a1af]">
                                Module access for every role
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
                                    {roles.map((role) => (
                                        <th
                                            key={role.id}
                                            className="px-3 py-2 font-semibold"
                                        >
                                            {role.label}
                                        </th>
                                    ))}
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
                                        {roles.map((role) => (
                                            <td
                                                key={role.id}
                                                className="px-3 py-3"
                                            >
                                                {row.roles[role.value] ? (
                                                    <span className="inline-flex rounded-full bg-[#dcfce7] px-2.5 py-1 text-[11px] font-semibold text-[#15803d]">
                                                        On
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex rounded-full bg-[#f1f5f9] px-2.5 py-1 text-[11px] font-semibold text-[#94a3b8]">
                                                        Off
                                                    </span>
                                                )}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </AdminPortalLayout>
    );
}
