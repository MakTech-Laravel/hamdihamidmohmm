import { Head, Link, usePage } from '@inertiajs/react';

import { AdminIcon } from '@/components/admin-icon';
import AdminPortalLayout from '@/layouts/admin-portal-layout';
import { cn } from '@/lib/utils';
import type { SharedData } from '@/types';

type ManagedUser = {
    id: number;
    name: string;
    email: string;
    company_name: string | null;
    role_name: string | null;
    role_label: string;
    permissions: string[];
    email_verified: boolean;
    two_factor_enabled: boolean;
    created_at: string | null;
    updated_at: string | null;
    last_login_at: string | null;
    can_edit: boolean;
};

type ActivityItem = {
    id: number;
    action: string;
    action_label: string;
    description: string;
    actor_name: string | null;
    created_at: string | null;
    properties: Record<string, unknown> | null;
};

type Props = {
    managedUser: ManagedUser;
    activities: ActivityItem[];
};

const roleBadgeStyles: Record<string, string> = {
    'super-admin': 'bg-[#f3e8ff] text-[#7e22ce]',
    admin: 'bg-[#dbeafe] text-[#1d4ed8]',
    'job-seeker': 'bg-[#dcfce7] text-[#15803d]',
    employer: 'bg-[#ffedd5] text-[#c2410c]',
};

export default function UserShow({ managedUser, activities }: Props) {
    const { flash } = usePage<SharedData>().props;

    const facts = [
        ['Created', managedUser.created_at ?? '—'],
        ['Last updated', managedUser.updated_at ?? '—'],
        ['Last login', managedUser.last_login_at ?? 'Never'],
        ['Email verified', managedUser.email_verified ? 'Yes' : 'No'],
        ['Two-factor', managedUser.two_factor_enabled ? 'Enabled' : 'Off'],
        ['Company', managedUser.company_name || '—'],
    ];

    const profile = [
        ['Full name', managedUser.name],
        ['Email', managedUser.email],
        ['Company name', managedUser.company_name || '—'],
        ['Role', managedUser.role_label],
    ];

    return (
        <AdminPortalLayout>
            <Head title={`${managedUser.name} · User`} />

            <div className="space-y-6 p-6">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                        <Link
                            href="/admin/users"
                            className="text-xs font-semibold text-[#0057c8]"
                        >
                            ← All Users
                        </Link>
                        <h1 className="mt-2 text-[28px] font-extrabold tracking-tight text-[#050315]">
                            {managedUser.name}
                        </h1>
                        <p className="mt-1 text-sm text-[#3977a6]">
                            View account details and track activity.
                        </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <span
                            className={cn(
                                'inline-flex w-fit rounded-full px-3 py-1 text-xs font-semibold',
                                roleBadgeStyles[managedUser.role_name ?? ''] ??
                                'bg-[#f1f5f9] text-[#64748b]',
                            )}
                        >
                            {managedUser.role_label}
                        </span>
                        {managedUser.can_edit && (
                            <Link
                                href={`/admin/users/${managedUser.id}/edit`}
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

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {facts.map(([label, value]) => (
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

                <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
                    <div className="rounded-2xl border border-[#e2e8f0] bg-white p-5 shadow-[0px_1px_3px_rgba(0,0,0,0.06)]">
                        <div className="mb-5 flex items-center gap-2">
                            <AdminIcon
                                src="/images/admin/nav-admins.svg"
                                size={16}
                                tint
                                className="text-[#0057c8]"
                            />
                            <h2 className="text-base font-bold text-[#101828]">
                                Profile
                            </h2>
                        </div>
                        <dl className="space-y-4">
                            {profile.map(([label, value]) => (
                                <div key={label}>
                                    <dt className="text-xs font-medium text-[#6a7282]">
                                        {label}
                                    </dt>
                                    <dd className="mt-1 text-sm font-semibold text-[#101828]">
                                        {value}
                                    </dd>
                                </div>
                            ))}
                        </dl>
                    </div>

                    <div className="space-y-6">
                        <div className="rounded-2xl border border-[#e2e8f0] bg-white p-5 shadow-[0px_1px_3px_rgba(0,0,0,0.06)]">
                            <h2 className="text-base font-bold text-[#101828]">
                                Account details
                            </h2>
                            <dl className="mt-4 space-y-3 text-sm">
                                <div className="flex justify-between gap-4">
                                    <dt className="text-[#6a7282]">User ID</dt>
                                    <dd className="font-semibold text-[#101828]">
                                        ID-{managedUser.id}
                                    </dd>
                                </div>
                                <div className="flex justify-between gap-4">
                                    <dt className="text-[#6a7282]">Email</dt>
                                    <dd className="truncate font-semibold text-[#101828]">
                                        {managedUser.email}
                                    </dd>
                                </div>
                                <div>
                                    <dt className="text-[#6a7282]">
                                        Permissions
                                    </dt>
                                    <dd className="mt-2 flex flex-wrap gap-1.5">
                                        {managedUser.permissions.length ===
                                            0 ? (
                                            <span className="text-xs text-[#99a1af]">
                                                Role defaults
                                            </span>
                                        ) : (
                                            managedUser.permissions.map(
                                                (permission) => (
                                                    <span
                                                        key={permission}
                                                        className="rounded-full bg-[#f8faff] px-2.5 py-1 text-[11px] font-medium text-[#3977a6]"
                                                    >
                                                        {permission}
                                                    </span>
                                                ),
                                            )
                                        )}
                                    </dd>
                                </div>
                            </dl>
                        </div>

                        <div className="rounded-2xl border border-[#e2e8f0] bg-white p-5 shadow-[0px_1px_3px_rgba(0,0,0,0.06)]">
                            <div className="mb-4 flex items-center gap-2">
                                <AdminIcon
                                    src="/images/admin/nav-reports.svg"
                                    size={16}
                                    tint
                                    className="text-[#0057c8]"
                                />
                                <h2 className="text-base font-bold text-[#101828]">
                                    Activity tracking
                                </h2>
                            </div>
                            {activities.length === 0 ? (
                                <p className="text-sm text-[#99a1af]">
                                    No tracked activity yet.
                                </p>
                            ) : (
                                <ol className="space-y-4">
                                    {activities.map((item) => (
                                        <li
                                            key={item.id}
                                            className="border-l-2 border-[#dbeafe] pl-3"
                                        >
                                            <p className="text-sm font-semibold text-[#101828]">
                                                {item.action_label}
                                            </p>
                                            <p className="text-xs text-[#64748b]">
                                                {item.description}
                                            </p>
                                            <p className="mt-1 text-[11px] text-[#99a1af]">
                                                {item.actor_name ?? 'System'} ·{' '}
                                                {item.created_at}
                                            </p>
                                        </li>
                                    ))}
                                </ol>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </AdminPortalLayout>
    );
}
