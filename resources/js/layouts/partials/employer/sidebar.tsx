import { Link, router, usePage } from '@inertiajs/react';

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
    const personName = user.contact_name || user.name;
    const initials = getInitials(personName);

    return (
        <aside className="flex h-full w-[240px] shrink-0 flex-col border-r border-[rgba(57,119,166,0.2)] bg-white">
            <div className="flex h-[60px] items-center gap-3 border-b border-[rgba(57,119,166,0.2)] px-4">
                <img
                    src="/images/admin/logo.png"
                    alt="RR Job Portal"
                    className="h-[51px] w-[76px] object-contain"
                    width={76}
                    height={51}
                />
                <div className="min-w-0">
                    <p className="truncate text-sm leading-5 font-bold text-[#050315]">
                        RR Job Portal
                    </p>
                    <p className="truncate text-xs leading-4 text-[#0057c8]">
                        Employer Portal
                    </p>
                </div>
            </div>

            <nav className="flex-1 overflow-y-auto py-4">
                {navItems.map((item) => {
                    const active = currentUrl.startsWith(item.match);

                    return (
                        <div key={item.href} className="px-2">
                            <Link
                                href={item.href}
                                className={cn(
                                    'relative flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm tracking-[-0.16px] transition-colors',
                                    active
                                        ? 'bg-[#d1f6ff] font-bold text-[#0057c8]'
                                        : 'font-normal text-[#0057c8] hover:bg-[#f8faff]',
                                )}
                            >
                                {active && (
                                    <span className="absolute top-2.5 left-0 h-6 w-0.5 rounded-full bg-[#0057c8]" />
                                )}
                                <span className="text-base leading-4">
                                    {item.icon}
                                </span>
                                <span>{item.title}</span>
                            </Link>
                        </div>
                    );
                })}
            </nav>

            <div className="border-t border-[rgba(57,119,166,0.2)] p-3">
                <div className="mb-2 flex items-center gap-3 rounded-xl bg-white p-2">
                    <div className="flex size-8 items-center justify-center rounded-full bg-[#0057c8] text-xs font-bold text-white">
                        {initials}
                    </div>
                    <div className="min-w-0">
                        <p className="truncate text-xs leading-4 font-medium tracking-[-0.12px] text-[#050315]">
                            {personName}
                        </p>
                        <p className="truncate text-xs leading-4 text-[#0057c8]">
                            {user.role_label || 'Employer'}
                        </p>
                    </div>
                </div>
                <button
                    type="button"
                    onClick={() => router.post('/logout')}
                    className="flex w-full cursor-pointer items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium text-[#0057c8] transition-colors hover:bg-[#f8faff]"
                >
                    <img
                        src="/images/employer/logout.svg"
                        alt=""
                        width={20}
                        height={20}
                        className="size-5 shrink-0 object-contain"
                    />
                    <span>Logout</span>
                </button>
            </div>
        </aside>
    );
}
