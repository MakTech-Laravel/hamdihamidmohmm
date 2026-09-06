import { Link, router, usePage } from '@inertiajs/react';

import { AdminIcon } from '@/components/admin-icon';
import BrandLogo from '@/components/brand-logo';
import { useLocale } from '@/hooks/use-locale';
import { cn } from '@/lib/utils';
import type { SharedData } from '@/types';

type NavItem = {
    titleKey: string;
    href: string | null;
    icon: string;
    match?: string;
    superAdminOnly?: boolean;
};

const navItems: NavItem[] = [
    {
        titleKey: 'admin.nav.dashboard',
        href: '/admin/dashboard',
        icon: '/images/admin/nav-dashboard.svg',
        match: '/admin/dashboard',
    },
    {
        titleKey: 'admin.nav.users',
        href: '/admin/users',
        icon: '/images/admin/nav-job-seekers.svg',
        match: '/admin/users',
    },
    {
        titleKey: 'admin.nav.roles',
        href: '/admin/roles-permissions',
        icon: '/images/admin/nav-verification.svg',
        match: '/admin/roles-permissions',
    },
    {
        titleKey: 'admin.nav.employers',
        href: '/admin/employers',
        icon: '/images/admin/nav-employers.svg',
        match: '/admin/employers',
    },
    {
        titleKey: 'admin.nav.job_seekers',
        href: '/admin/job-seekers',
        icon: '/images/admin/nav-job-seekers.svg',
        match: '/admin/job-seekers',
    },
    {
        titleKey: 'admin.nav.jobs',
        href: '/admin/jobs',
        icon: '/images/admin/nav-jobs.svg',
        match: '/admin/jobs',
    },
    {
        titleKey: 'admin.nav.applications',
        href: '/admin/applications',
        icon: '/images/admin/nav-applications.svg',
        match: '/admin/applications',
    },
    {
        titleKey: 'admin.nav.packages',
        href: '/admin/packages',
        icon: '/images/admin/nav-packages.svg',
        match: '/admin/packages',
    },
    {
        titleKey: 'admin.nav.payments',
        href: '/admin/payments',
        icon: '/images/admin/nav-payments.svg',
        match: '/admin/payments',
    },
    {
        titleKey: 'admin.nav.verifications',
        href: '/admin/verifications',
        icon: '/images/admin/nav-verification.svg',
        match: '/admin/verifications',
    },
    {
        titleKey: 'admin.nav.reports',
        href: '/admin/reports',
        icon: '/images/admin/nav-reports.svg',
        match: '/admin/reports',
    },
    {
        titleKey: 'admin.nav.content',
        href: '/admin/content',
        icon: '/images/admin/nav-content.svg',
        match: '/admin/content',
    },
    {
        titleKey: 'admin.nav.notifications',
        href: '/admin/notifications',
        icon: '/images/admin/nav-notifications.svg',
        match: '/admin/notifications',
    },
    {
        titleKey: 'admin.nav.settings',
        href: '/admin/settings',
        icon: '/images/admin/nav-settings.svg',
        match: '/admin/settings',
    },
    {
        titleKey: 'admin.nav.admins',
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
    const { t } = useLocale();

    return (
        <aside
            className={cn(
                'flex h-full w-[240px] shrink-0 flex-col border-r border-[rgba(57,119,166,0.2)] bg-white',
                className,
            )}
        >
            <div className="flex h-[72px] shrink-0 items-center px-4 border-b border-[rgba(57,119,166,0.2)]">
                <BrandLogo
                    className="h-[65px] w-[98px]"
                    width={98}
                    height={65}
                    alt={t('admin.brand')}
                />
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
                                ? 'bg-[rgba(0,87,200,0.1)] text-[#0057c8]'
                                : 'text-[#3977a6] hover:bg-[rgba(0,87,200,0.06)]',
                        );
                        const title = t(item.titleKey);

                        return (
                            <Link
                                key={item.titleKey}
                                href={item.href!}
                                className={className}
                            >
                                <AdminIcon
                                    src={item.icon}
                                    size={16}
                                    tint
                                    className={cn(!active && 'opacity-60')}
                                />
                                <span className="truncate">{title}</span>
                            </Link>
                        );
                    })}
            </nav>

            <div className="shrink-0 border-t border-[rgba(57,119,166,0.2)] px-2 py-3">
                <button
                    type="button"
                    onClick={() => router.post('/logout')}
                    className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-[13px] font-medium text-[#3977a6] transition-colors hover:bg-[rgba(0,87,200,0.06)]"
                >
                    <AdminIcon
                        src="/images/admin/nav-logout.svg"
                        size={16}
                        tint
                    />
                    {t('admin.nav.logout')}
                </button>
            </div>
        </aside>
    );
}
