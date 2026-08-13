import { Link, router, usePage } from '@inertiajs/react';
import { LogOut } from 'lucide-react';

import { getInitials } from '@/components/employer/demo-data';
import { cn } from '@/lib/utils';
import type { SharedData } from '@/types';

const navItems = [
    {
        title: 'Dashboard',
        href: '/employer/dashboard',
        icon: '📊',
        match: '/employer/dashboard',
    },
    {
        title: 'Company Profile',
        href: '/employer/profile',
        icon: '🏢',
        match: '/employer/profile',
    },
    {
        title: 'Packages & Billing',
        href: '/employer/packages',
        icon: '💳',
        match: '/employer/packages',
    },
    {
        title: 'My Jobs',
        href: '/employer/jobs',
        icon: '💼',
        match: '/employer/jobs',
    },
    {
        title: 'Applications',
        href: '/employer/applications',
        icon: '👥',
        match: '/employer/applications',
    },
    {
        title: 'Notifications',
        href: '/employer/notifications',
        icon: '🔔',
        match: '/employer/notifications',
    },
    {
        title: 'Settings',
        href: '/employer/settings',
        icon: '⚙️',
        match: '/employer/settings',
    },
] as const;

export function EmployerSidebar() {
    const page = usePage<SharedData>();
    const { auth } = page.props;
    const currentUrl = page.url;
    const user = auth.user;
    const initials = getInitials(user.name);
    const companyName = user.company_name || 'Employer';

    return (
        <aside className="flex h-full w-[240px] shrink-0 flex-col border-r border-[rgba(57,119,166,0.2)] bg-[#ffebf5]">
            <div className="flex h-[60px] items-center gap-3 border-b border-[rgba(57,119,166,0.2)] px-4">
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
                    <p className="truncate text-xs text-[#3977a6]">
                        Employer Portal
                    </p>
                </div>
            </div>

            <nav className="flex-1 space-y-0.5 overflow-y-auto px-2 py-4">
                {navItems.map((item) => {
                    const active = currentUrl.startsWith(item.match);

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                'relative flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors',
                                active
                                    ? 'bg-[rgba(50,57,129,0.1)] text-[#0057c8]'
                                    : 'text-[#3977a6] hover:bg-white/60',
                            )}
                        >
                            {active && (
                                <span className="absolute top-1/2 left-0 h-6 w-0.5 -translate-y-1/2 rounded-full bg-[#0057c8]" />
                            )}
                            <span className="text-base leading-none">
                                {item.icon}
                            </span>
                            <span>{item.title}</span>
                        </Link>
                    );
                })}
            </nav>

            <div className="border-t border-[rgba(57,119,166,0.2)] p-3">
                <div className="mb-2 flex items-center gap-3 rounded-xl bg-white p-2">
                    <div className="flex size-8 items-center justify-center rounded-full bg-[#0057c8] text-xs font-bold text-white">
                        {initials}
                    </div>
                    <div className="min-w-0">
                        <p className="truncate text-xs font-medium text-[#050315]">
                            {user.name}
                        </p>
                        <p className="truncate text-xs text-[#3977a6]">
                            {companyName}
                        </p>
                    </div>
                </div>
                <button
                    type="button"
                    onClick={() => router.post('/logout')}
                    className="flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium text-[#3977a6] transition-colors hover:bg-white/60"
                >
                    <LogOut className="size-5 shrink-0" strokeWidth={1.75} />
                    <span>Logout</span>
                </button>
            </div>
        </aside>
    );
}
