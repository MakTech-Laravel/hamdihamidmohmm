import { Link, router, usePage } from '@inertiajs/react';

import { AdminIcon } from '@/components/admin-icon';
import { cn } from '@/lib/utils';
import type { SharedData } from '@/types';

type NavItem = {
    title: string;
    href: string | null;
    icon: string;
    match?: string;
    superAdminOnly?: boolean;
};

const navItems: NavItem[] = [
    {
        title: 'Dashboard',
        href: '/admin/dashboard',
        icon: '/images/admin/nav-dashboard.svg',
        match: '/admin/dashboard',
    },
    {
        title: 'All Users',
        href: '/admin/users',
        icon: '/images/admin/nav-job-seekers.svg',
        match: '/admin/users',
    },
    {
        title: 'Roles & Permissions',
        href: '/admin/roles-permissions',
        icon: '/images/admin/nav-verification.svg',
        match: '/admin/roles-permissions',
    },
    {
        title: 'Employer Management',
        href: '/admin/employers',
        icon: '/images/admin/nav-employers.svg',
        match: '/admin/employers',
    },
    {
        title: 'Job Seeker Management',
        href: '/admin/job-seekers',
        icon: '/images/admin/nav-job-seekers.svg',
        match: '/admin/job-seekers',
    },
    {
        title: 'Job Management',
        href: '/admin/jobs',
        icon: '/images/admin/nav-jobs.svg',
        match: '/admin/jobs',
    },
    {
        title: 'Applications',
        href: '/admin/applications',
        icon: '/images/admin/nav-applications.svg',
        match: '/admin/applications',
    },
    {
        title: 'Packages & Pricing',
        href: '/admin/packages',
        icon: '/images/admin/nav-packages.svg',
        match: '/admin/packages',
    },
    {
        title: 'Payments & Revenue',
        href: '/admin/payments',
        icon: '/images/admin/nav-payments.svg',
        match: '/admin/payments',
    },
    {
        title: 'Verification Center',
        href: '/admin/verifications',
        icon: '/images/admin/nav-verification.svg',
        match: '/admin/verifications',
    },
    {
        title: 'Reports & Analytics',
        href: '/admin/reports',
        icon: '/images/admin/nav-reports.svg',
        match: '/admin/reports',
    },
    {
        title: 'Content Management',
        href: '/admin/content',
        icon: '/images/admin/nav-content.svg',
        match: '/admin/content',
    },
    {
        title: 'Notifications',
        href: '/admin/notifications',
        icon: '/images/admin/nav-notifications.svg',
        match: '/admin/notifications',
    },
    {
        title: 'Platform Settings',
        href: '/admin/settings',
        icon: '/images/admin/nav-settings.svg',
        match: '/admin/settings',
    },
    {
        title: 'Admin Management',
        href: '/admin/admins',
        icon: '/images/admin/nav-admins.svg',
        match: '/admin/admins',
        superAdminOnly: true,
    },
];

export function AdminPortalSidebar({ className }: { className?: string }) {
    const page = usePage<SharedData>();
    const { auth } = page.props;
    const currentUrl = page.url;

    return (
        <aside
            className={cn(
                'flex h-full w-[240px] shrink-0 flex-col border-r border-[rgba(57,119,166,0.2)] bg-[#ffebf5]',
                className,
            )}
        >
            <div className="flex h-[60px] shrink-0 items-center gap-3 border-b border-[rgba(57,119,166,0.2)] px-4">
                <img
                    src="/images/admin/logo.png"
                    alt="RR Job Portal"
                    className="h-[51px] w-[76px] object-contain"
                    width={76}
                    height={51}
                />
                <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-[#050315]">
                        RR Job Portal
                    </p>
                    <p className="truncate text-xs font-normal text-[#3977a6]">
                        Admin Portal
                    </p>
                </div>
            </div>

            <nav className="flex-1 space-y-0 overflow-y-auto px-2 py-3">
                {navItems
                    .filter(
                        (item) =>
                            !item.superAdminOnly || auth.user.can_manage_admins,
                    )
                    .map((item) => {
                        const active = item.match
                            ? currentUrl.startsWith(item.match)
                            : false;
                        const className = cn(
                            'flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium tracking-[-0.16px] transition-colors',
                            active
                                ? 'bg-[rgba(50,57,129,0.1)] text-[#0057c8]'
                                : 'text-[#3977a6] hover:bg-[rgba(50,57,129,0.06)]',
                        );

                        return (
                            <Link
                                key={item.title}
                                href={item.href!}
                                className={className}
                            >
                                <AdminIcon
                                    src={item.icon}
                                    size={16}
                                    tint
                                    className={cn(!active && 'opacity-60')}
                                />
                                <span className="truncate">{item.title}</span>
                            </Link>
                        );
                    })}
            </nav>

            <div className="shrink-0 border-t border-[rgba(57,119,166,0.2)] px-2 py-3">
                <button
                    type="button"
                    onClick={() => router.post('/logout')}
                    className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-[13px] font-medium text-[#3977a6] transition-colors hover:bg-[rgba(50,57,129,0.06)]"
                >
                    <AdminIcon
                        src="/images/admin/nav-logout.svg"
                        size={16}
                        tint
                    />
                    Logout
                </button>
            </div>
        </aside>
    );
}
