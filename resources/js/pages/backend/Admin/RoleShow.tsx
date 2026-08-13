import { Head, Link, usePage } from '@inertiajs/react';

import { AdminIcon } from '@/components/admin-icon';
import {
    RolePermissionPicker,
    type PermissionGroup,
} from '@/components/admin-portal/role-permission-picker';
import AdminPortalLayout from '@/layouts/admin-portal-layout';
import { cn } from '@/lib/utils';
import type { SharedData } from '@/types';

type ManagedRole = {
    id: number;
    value: string;
    label: string;
    description: string | null;
    users_count: number;
    permissions: string[];
    permissions_count: number;
    editable: boolean;
    locked: boolean;
    is_system: boolean;
    can_delete: boolean;
    kind: 'admin-panel' | 'portal';
};

type Props = {
    managedRole: ManagedRole;
    permissionGroups: PermissionGroup[];
    canManageAdmins: boolean;
};

const roleBadgeStyles: Record<string, string> = {
    'super-admin': 'bg-[#f3e8ff] text-[#7e22ce]',
    admin: 'bg-[#dbeafe] text-[#1d4ed8]',
    'job-seeker': 'bg-[#dcfce7] text-[#15803d]',
    employer: 'bg-[#ffedd5] text-[#c2410c]',
};

export default function RoleShow({
    managedRole,
    permissionGroups,
    canManageAdmins,
}: Props) {
    const { flash } = usePage<SharedData>().props;

    return (
        <AdminPortalLayout>
            <Head title={`${managedRole.label} · Role`} />

            <div className="space-y-6 p-6">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                        <Link
                            href="/admin/roles-permissions"
                            className="text-xs font-semibold text-[#0057c8]"
                        >
                            ← Roles & Permissions
                        </Link>
                        <h1 className="mt-2 text-[28px] font-extrabold tracking-tight text-[#050315]">
                            {managedRole.label}
                        </h1>
                        <p className="mt-1 text-sm text-[#3977a6]">
                            {managedRole.description ||
                                'Review the modules assigned to this role.'}
                        </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <span
                            className={cn(
                                'inline-flex w-fit rounded-full px-3 py-1 text-xs font-semibold',
                                roleBadgeStyles[managedRole.value] ??
                                    'bg-[#eef2ff] text-[#3730a3]',
                            )}
                        >
                            {managedRole.locked
                                ? 'Locked'
                                : managedRole.is_system
                                  ? 'System'
                                  : 'Custom'}
                        </span>
                        {canManageAdmins && managedRole.editable && (
                            <Link
                                href={`/admin/roles-permissions/${managedRole.id}/edit`}
                                className="inline-flex h-9 items-center rounded-xl bg-[#0057c8] px-4 text-sm font-semibold text-white hover:bg-[#0046a3]"
                            >
                                Edit
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

                <div className="grid gap-4 sm:grid-cols-3">
                    {[
                        ['Users', String(managedRole.users_count)],
                        [
                            'Permissions',
                            String(managedRole.permissions_count),
                        ],
                        ['Key', managedRole.value],
                    ].map(([label, value]) => (
                        <div
                            key={label}
                            className="rounded-2xl border border-[#e2e8f0] bg-white p-4 shadow-[0px_1px_3px_rgba(0,0,0,0.06)]"
                        >
                            <p className="text-xs font-medium text-[#6a7282]">
                                {label}
                            </p>
                            <p className="mt-1 text-sm font-semibold text-[#101828]">
                                {value}
                            </p>
                        </div>
                    ))}
                </div>

                <div className="rounded-2xl border border-[#e2e8f0] bg-white p-5 shadow-[0px_1px_3px_rgba(0,0,0,0.06)]">
                    <div className="mb-5 flex items-center gap-2">
                        <AdminIcon
                            src="/images/admin/nav-verification.svg"
                            size={16}
                            tint
                            className="text-[#0057c8]"
                        />
                        <h2 className="text-base font-bold text-[#101828]">
                            Assigned permissions
                        </h2>
                    </div>
                    <RolePermissionPicker
                        groups={permissionGroups}
                        selected={managedRole.permissions}
                        disabled
                        onToggle={() => undefined}
                    />
                </div>
            </div>
        </AdminPortalLayout>
    );
}
