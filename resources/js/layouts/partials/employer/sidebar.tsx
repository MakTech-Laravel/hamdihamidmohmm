import { Link, router, usePage } from '@inertiajs/react';
import { ChevronLeft } from 'lucide-react';
import { useMemo, useState } from 'react';

import { getInitials } from '@/components/employer/demo-data';
import { useLocale } from '@/hooks/use-locale';
import { cn } from '@/lib/utils';
import { jobs } from '@/routes';
import type { SharedData } from '@/types';

type NavItem = {
    title: string;
    href: string;
    icon: string;
    match: string;
    permission: string;
};

export function EmployerSidebar({
    className,
    collapsed = false,
    onToggle,
    onNavigate,
}: {
    className?: string;
    collapsed?: boolean;
    onToggle?: () => void;
    onNavigate?: () => void;
}) {
    const page = usePage<SharedData>();
    const { auth } = page.props;
    const { t } = useLocale();
    const currentUrl = page.url;
    const user = auth.user;
    const personName = user.name || user.contact_name || t('employer.portal');
    const initials = getInitials(personName);
    const [avatarFailed, setAvatarFailed] = useState(false);
    const showAvatar = Boolean(user.avatar_url) && !avatarFailed;
    const userPermissions = user.permissions ?? [];

    const navItems = useMemo(() => {
        const permissions = new Set(userPermissions);
        const jobsNavTitle = user.is_employer_owner
            ? t('employer.nav.jobs')
            : t('employer.nav.jobs_panel');
        const items: NavItem[] = [
            {
                title: t('employer.nav.dashboard'),
                href: '/employer/dashboard',
                icon: '📊',
                match: '/employer/dashboard',
                permission: 'employer.dashboard',
            },
            {
                title: t('employer.nav.company_profile'),
                href: '/employer/profile',
                icon: '🏢',
                match: '/employer/profile',
                permission: 'employer.profile',
            },
            {
                title: t('employer.nav.packages'),
                href: '/employer/packages',
                icon: '💳',
                match: '/employer/packages',
                permission: 'employer.packages',
            },
            {
                title: jobsNavTitle,
                href: '/employer/jobs',
                icon: '💼',
                match: '/employer/jobs',
                permission: 'employer.jobs',
            },
            {
                title: t('employer.nav.applications'),
                href: '/employer/applications',
                icon: '👥',
                match: '/employer/applications',
                permission: 'employer.applications',
            },
            {
                title: t('employer.nav.reports'),
                href: '/employer/reports',
                icon: '📈',
                match: '/employer/reports',
                permission: 'employer.reports',
            },
            {
                title: t('employer.nav.team'),
                href: '/employer/team',
                icon: '🧑‍🤝‍🧑',
                match: '/employer/team',
                permission: 'employer.team',
            },
            {
                title: t('employer.nav.roster'),
                href: '/employer/roster',
                icon: '📋',
                match: '/employer/roster',
                permission: 'employer.applications',
            },
            {
                title: t('employer.nav.roles'),
                href: '/employer/roles',
                icon: '🛡️',
                match: '/employer/roles',
                permission: 'employer.team',
            },
            {
                title: t('employer.nav.notifications'),
                href: '/employer/notifications',
                icon: '🔔',
                match: '/employer/notifications',
                permission: 'employer.notifications',
            },
            {
                title: t('employer.nav.settings'),
                href: '/employer/settings',
                icon: '⚙️',
                match: '/employer/settings',
                permission: 'employer.settings',
            },
        ];

        return items.filter((item) => permissions.has(item.permission));
    }, [userPermissions, user.is_employer_owner, t]);

    return (
        <aside
            className={cn(
                'relative flex h-full shrink-0 flex-col border-r border-[rgba(57,119,166,0.2)] bg-white transition-[width] duration-300 ease-in-out',
                collapsed ? 'w-[72px]' : 'w-[240px]',
                className,
            )}
        >
            <div
                className={cn(
                    'flex h-[60px] items-center border-b border-[rgba(57,119,166,0.2)]',
                    collapsed ? 'justify-center px-2' : 'gap-3 px-4',
                )}
            >
                <Link
                    href={jobs()}
                    onClick={onNavigate}
                    className={cn(
                        'flex min-w-0 items-center transition-opacity hover:opacity-80',
                        collapsed ? 'justify-center' : 'gap-3',
                    )}
                    aria-label={t('nav.jobs')}
                >
                    <img
                        src="/images/admin/logo.png"
                        alt={t('app.name')}
                        className={cn(
                            'shrink-0 object-contain',
                            collapsed
                                ? 'h-9 w-9 max-w-full'
                                : 'h-[51px] w-[76px]',
                        )}
                        width={collapsed ? 36 : 76}
                        height={collapsed ? 36 : 51}
                    />
                    {!collapsed ? (
                        <div className="min-w-0">
                            <p className="truncate text-sm leading-5 font-bold text-[#050315]">
                                {t('app.name')}
                            </p>
                            <p className="truncate text-xs leading-4 text-[#0057c8]">
                                {t('employer.portal')}
                            </p>
                        </div>
                    ) : null}
                </Link>
            </div>

            <nav className="flex-1 overflow-x-hidden overflow-y-auto overscroll-contain py-4">
                {navItems.map((item) => {
                    const pathOnly = currentUrl.split('?')[0] ?? currentUrl;
                    const active = pathOnly.startsWith(item.match);

                    return (
                        <div
                            key={item.href}
                            className={cn('px-2', collapsed && 'px-1.5')}
                        >
                            <Link
                                href={item.href}
                                onClick={onNavigate}
                                title={item.title}
                                aria-label={item.title}
                                className={cn(
                                    'relative flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm tracking-[-0.16px] transition-colors',
                                    active
                                        ? 'bg-[#d1f6ff] font-bold text-[#0057c8]'
                                        : 'font-normal text-[#0057c8] hover:bg-[#f8faff]',
                                    collapsed && 'justify-center px-2',
                                )}
                            >
                                {active ? (
                                    <span className="absolute top-2.5 left-0 h-6 w-0.5 rounded-full bg-[#0057c8]" />
                                ) : null}
                                <span className="text-base leading-4">
                                    {item.icon}
                                </span>
                                {!collapsed ? <span>{item.title}</span> : null}
                            </Link>
                        </div>
                    );
                })}
            </nav>

            <div
                className={cn(
                    'border-t border-[rgba(57,119,166,0.2)] p-3',
                    collapsed && 'px-2',
                )}
            >
                {!collapsed ? (
                    <div className="mb-2 flex items-center gap-3 rounded-xl bg-white p-2">
                        {showAvatar ? (
                            <img
                                src={user.avatar_url}
                                alt={personName}
                                onError={() => setAvatarFailed(true)}
                                className="size-8 rounded-full object-cover"
                            />
                        ) : (
                            <div className="flex size-8 items-center justify-center rounded-full bg-[#0057c8] text-xs font-bold text-white">
                                {initials}
                            </div>
                        )}
                        <div className="min-w-0">
                            <p className="truncate text-xs leading-4 font-medium tracking-[-0.12px] text-[#050315]">
                                {personName}
                            </p>
                            <p className="truncate text-xs leading-4 text-[#0057c8]">
                                {user.role_label || 'Employer'}
                            </p>
                        </div>
                    </div>
                ) : null}
                <button
                    type="button"
                    onClick={() => router.post('/logout')}
                    title={t('common.logout')}
                    aria-label={t('common.logout')}
                    className={cn(
                        'flex w-full cursor-pointer items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium text-[#0057c8] transition-colors hover:bg-[#f8faff]',
                        collapsed && 'justify-center px-2',
                    )}
                >
                    <img
                        src="/images/employer/logout.svg"
                        alt=""
                        width={20}
                        height={20}
                        className="size-5 shrink-0 object-contain"
                    />
                    {!collapsed ? <span>{t('common.logout')}</span> : null}
                </button>
            </div>

            {onToggle ? (
                <button
                    type="button"
                    onClick={onToggle}
                    className="absolute top-[4.75rem] right-0 z-50 hidden size-7 translate-x-1/2 items-center justify-center rounded-full border-2 border-white bg-[#0057c8] text-white shadow-[0_2px_8px_rgba(5,3,21,0.18)] transition-transform duration-300 ease-in-out hover:bg-[#0046a3] md:flex"
                    aria-label={
                        collapsed
                            ? t('common.expand_sidebar')
                            : t('common.collapse_sidebar')
                    }
                >
                    <ChevronLeft
                        className={cn(
                            'size-3.5 transition-transform duration-300 ease-in-out',
                            collapsed && 'rotate-180',
                        )}
                    />
                </button>
            ) : null}
        </aside>
    );
}
