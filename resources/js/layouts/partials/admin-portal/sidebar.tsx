import { Link, router, usePage } from '@inertiajs/react';
import {
    BarChart3,
    Bell,
    Briefcase,
    Building2,
    Code2,
    CreditCard,
    FileText,
    LayoutDashboard,
    LogOut,
    Package,
    Settings,
    Shield,
    ShieldCheck,
    Users,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import type { SharedData } from '@/types';

type NavItem = {
    title: string;
    href: string | null;
    icon: typeof LayoutDashboard;
    match?: string;
    superAdminOnly?: boolean;
};

const navItems: NavItem[] = [
    {
        title: 'Dashboard',
        href: '/admin/dashboard',
        icon: LayoutDashboard,
        match: '/admin/dashboard',
    },
    {
        title: 'All Users',
        href: '/admin/users',
        icon: Users,
        match: '/admin/users',
    },
    {
        title: 'Roles & Permissions',
        href: '/admin/roles-permissions',
        icon: ShieldCheck,
        match: '/admin/roles-permissions',
    },
    {
        title: 'Employer Management',
        href: '/admin/employers',
        icon: Building2,
        match: '/admin/employers',
    },
    {
        title: 'Job Seeker Management',
        href: '/admin/job-seekers',
        icon: Users,
        match: '/admin/job-seekers',
    },
    {
        title: 'Job Management',
        href: '/admin/jobs',
        icon: Briefcase,
        match: '/admin/jobs',
    },
    {
        title: 'Applications',
        href: '/admin/applications',
        icon: FileText,
        match: '/admin/applications',
    },
    {
        title: 'Packages & Pricing',
        href: '/admin/packages',
        icon: Package,
        match: '/admin/packages',
    },
    {
        title: 'Payments & Revenue',
        href: '/admin/payments',
        icon: CreditCard,
        match: '/admin/payments',
    },
    {
        title: 'Verification Center',
        href: '/admin/verifications',
        icon: ShieldCheck,
        match: '/admin/verifications',
    },
    {
        title: 'Reports & Analytics',
        href: '/admin/reports',
        icon: BarChart3,
        match: '/admin/reports',
    },
    {
        title: 'Content Management',
        href: '/admin/content',
        icon: Code2,
        match: '/admin/content',
    },
    {
        title: 'Notifications',
        href: '/admin/notifications',
        icon: Bell,
        match: '/admin/notifications',
    },
    {
        title: 'Platform Settings',
        href: '/admin/settings',
        icon: Settings,
        match: '/admin/settings',
    },
    {
        title: 'Admin Management',
        href: '/admin/admins',
        icon: Shield,
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
                    src="/logo.png"
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
                        const Icon = item.icon;
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
                                <Icon
                                    className={cn(
                                        'size-4 shrink-0',
                                        !active && 'opacity-60',
                                    )}
                                    strokeWidth={1.75}
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
                    <LogOut className="size-4 shrink-0" strokeWidth={1.75} />
                    Logout
                </button>
            </div>
        </aside>
    );
}
