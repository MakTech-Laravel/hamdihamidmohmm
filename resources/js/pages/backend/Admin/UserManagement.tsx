import { Head, Link, router, usePage } from '@inertiajs/react';
import { useMemo, useState } from 'react';

import { AdminIcon } from '@/components/admin-icon';
import { Input } from '@/components/ui/input';
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
    role: number | null;
    role_name: string | null;
    role_label: string;
    permissions: string[];
    created_at: string | null;
    is_self: boolean;
};

type PaginatedUsers = {
    data: ManagedUser[];
    links: Array<{ url: string | null; label: string; active: boolean }>;
};

type Props = {
    users: PaginatedUsers;
    filters: { role: string };
    roleCounts: Record<string, number>;
    roles: RoleOption[];
    canManageAdmins: boolean;
};

const roleBadgeStyles: Record<string, string> = {
    'super-admin': 'bg-[#f3e8ff] text-[#7e22ce]',
    admin: 'bg-[#dbeafe] text-[#1d4ed8]',
    'job-seeker': 'bg-[#dcfce7] text-[#15803d]',
    employer: 'bg-[#ffedd5] text-[#c2410c]',
};

export default function UserManagement({
    users,
    filters,
    roleCounts,
    canManageAdmins,
}: Props) {
    const { flash } = usePage<SharedData>().props;
    const [search, setSearch] = useState('');

    const filteredUsers = useMemo(() => {
        const query = search.trim().toLowerCase();

        if (query === '') {
            return users.data;
        }

        return users.data.filter(
            (user) =>
                user.name.toLowerCase().includes(query) ||
                user.email.toLowerCase().includes(query) ||
                user.role_label.toLowerCase().includes(query),
        );
    }, [search, users.data]);

    return (
        <AdminPortalLayout>
            <Head title="All Users" />

            <div className="space-y-6 p-6">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                        <h1 className="text-[28px] font-extrabold tracking-tight text-[#050315]">
                            All Users
                        </h1>
                        <p className="mt-1 text-sm text-[#3977a6]">
                            View every account, update details, and track activity.
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <Link
                            href="/admin/roles-permissions"
                            className="inline-flex items-center justify-center rounded-xl border border-[#e2e8f0] bg-white px-4 py-2.5 text-sm font-semibold text-[#0057c8] hover:bg-[#f8fafc]"
                        >
                            Roles & Permissions
                        </Link>
                        {canManageAdmins && (
                            <Link
                                href="/admin/admins"
                                className="inline-flex items-center justify-center rounded-xl bg-[#0057c8] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#0046a3]"
                            >
                                + Create Admin
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

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
                    {[
                        ['all', 'All Users', roleCounts.all ?? 0],
                        [
                            'super-admin',
                            'Super Admin',
                            roleCounts['super-admin'] ?? 0,
                        ],
                        ['admin', 'Admins', roleCounts.admin ?? 0],
                        [
                            'job-seeker',
                            'Job Seekers',
                            roleCounts['job-seeker'] ?? 0,
                        ],
                        ['employer', 'Employers', roleCounts.employer ?? 0],
                    ].map(([key, label, count]) => (
                        <button
                            key={key}
                            type="button"
                            onClick={() =>
                                router.get(
                                    '/admin/users',
                                    key === 'all' ? {} : { role: key },
                                    { preserveState: true, replace: true },
                                )
                            }
                            className={cn(
                                'rounded-2xl border bg-white p-4 text-left shadow-[0px_1px_3px_rgba(0,0,0,0.06)] transition-colors',
                                (filters.role || 'all') === key
                                    ? 'border-[#0057c8] ring-1 ring-[#0057c8]'
                                    : 'border-[#e2e8f0]',
                            )}
                        >
                            <p className="text-2xl font-extrabold text-[#101828]">
                                {count}
                            </p>
                            <p className="mt-1 text-xs font-medium text-[#6a7282]">
                                {label}
                            </p>
                        </button>
                    ))}
                </div>

                <div className="rounded-2xl border border-[#e2e8f0] bg-white p-5 shadow-[0px_1px_3px_rgba(0,0,0,0.06)]">
                    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-2">
                            <AdminIcon
                                src="/images/admin/nav-job-seekers.svg"
                                size={16}
                                tint
                                className="text-[#0057c8]"
                            />
                            <h2 className="text-base font-bold text-[#101828]">
                                Users Directory
                            </h2>
                        </div>
                        <Input
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder="Search by name, email, or role…"
                            className="max-w-sm rounded-xl"
                        />
                    </div>

                    <div className="overflow-x-auto">
                        <table className="min-w-full text-left text-sm">
                            <thead className="border-b border-[#e2e8f0] text-[#64748b]">
                                <tr>
                                    <th className="px-3 py-2 font-semibold">
                                        User
                                    </th>
                                    <th className="px-3 py-2 font-semibold">
                                        Email
                                    </th>
                                    <th className="px-3 py-2 font-semibold">
                                        Role
                                    </th>
                                    <th className="px-3 py-2 font-semibold">
                                        Permissions
                                    </th>
                                    <th className="px-3 py-2 font-semibold">
                                        Created
                                    </th>
                                    <th className="px-3 py-2 font-semibold">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredUsers.map((user) => (
                                    <tr
                                        key={user.id}
                                        className="border-b border-[#f1f5f9]"
                                    >
                                        <td className="px-3 py-3">
                                            <div className="flex items-center gap-3">
                                                <div className="flex size-9 items-center justify-center rounded-full bg-gradient-to-br from-[#0057c8] to-[#3b82f6] text-xs font-bold text-white">
                                                    {user.name
                                                        .slice(0, 2)
                                                        .toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-[#101828]">
                                                        {user.name}
                                                    </p>
                                                    <p className="text-xs text-[#99a1af]">
                                                        ID-{user.id}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-3 py-3 text-[#64748b]">
                                            {user.email}
                                        </td>
                                        <td className="px-3 py-3">
                                            <span
                                                className={cn(
                                                    'rounded-full px-2.5 py-1 text-xs font-semibold',
                                                    roleBadgeStyles[
                                                    user.role_name ?? ''
                                                    ] ??
                                                    'bg-[#f1f5f9] text-[#64748b]',
                                                )}
                                            >
                                                {user.role_label}
                                            </span>
                                        </td>
                                        <td className="px-3 py-3 text-xs text-[#64748b]">
                                            {user.permissions.length > 0
                                                ? `${user.permissions.length} assigned`
                                                : 'Role defaults'}
                                        </td>
                                        <td className="px-3 py-3 text-[#99a1af]">
                                            {user.created_at ?? '—'}
                                        </td>
                                        <td className="px-3 py-3">
                                            <div className="flex flex-wrap gap-2">
                                                <Link
                                                    href={`/admin/users/${user.id}`}
                                                    className="inline-flex h-9 items-center rounded-lg border border-[#e2e8f0] bg-white px-3 text-xs font-semibold text-[#0057c8] hover:bg-[#f8faff]"
                                                >
                                                    View
                                                </Link>
                                                {(canManageAdmins ||
                                                    user.role_name !==
                                                    'super-admin') && (
                                                        <Link
                                                            href={`/admin/users/${user.id}/edit`}
                                                            className="inline-flex h-9 items-center rounded-lg border border-[#e2e8f0] bg-white px-3 text-xs font-semibold text-[#101828] hover:bg-[#f8faff]"
                                                        >
                                                            Edit
                                                        </Link>
                                                    )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                        {users.links.map((link, index) => (
                            <button
                                key={`${link.label}-${index}`}
                                type="button"
                                disabled={!link.url}
                                onClick={() =>
                                    link.url &&
                                    router.get(
                                        link.url,
                                        {},
                                        { preserveState: true },
                                    )
                                }
                                className={cn(
                                    'rounded-lg px-3 py-1.5 text-xs font-semibold',
                                    link.active
                                        ? 'bg-[#0057c8] text-white'
                                        : 'bg-[#f8faff] text-[#64748b]',
                                    !link.url && 'opacity-40',
                                )}
                                dangerouslySetInnerHTML={{ __html: link.label }}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </AdminPortalLayout>
    );
}
