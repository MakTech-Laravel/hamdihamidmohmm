import { Link, router, usePage } from '@inertiajs/react';
import {
    Bell,
    Briefcase,
    ChevronLeft,
    LayoutDashboard,
    LogOut,
    Search,
    Settings,
    UserRound,
} from 'lucide-react';
import { useState } from 'react';

import { getInitials } from '@/components/job-seeker/demo-data';
import { useLocale } from '@/hooks/use-locale';
import { cn } from '@/lib/utils';
import { jobs } from '@/routes';
import type { SharedData } from '@/types';

const navItems = [
    {
        titleKey: 'job_seeker.nav.dashboard',
        href: '/job-seeker/dashboard',
        icon: LayoutDashboard,
        match: '/job-seeker/dashboard',
    },
    {
        titleKey: 'job_seeker.nav.jobs',
        href: '/job-seeker/jobs',
        icon: Search,
        match: '/job-seeker/jobs',
    },
    {
        titleKey: 'job_seeker.nav.profile',
        href: '/job-seeker/profile',
        icon: UserRound,
        match: '/job-seeker/profile',
    },
    {
        titleKey: 'job_seeker.nav.applications',
        href: '/job-seeker/applications',
        icon: Briefcase,
        match: '/job-seeker/applications',
    },
    {
        titleKey: 'job_seeker.nav.notifications',
        href: '/job-seeker/notifications',
        icon: Bell,
        match: '/job-seeker/notifications',
    },
    {
        titleKey: 'job_seeker.nav.settings',
        href: '/job-seeker/settings',
        icon: Settings,
        match: '/job-seeker/settings',
    },
] as const;

export function JobSeekerSidebar({
    collapsed,
    onToggle,
}: {
    collapsed: boolean;
    onToggle: () => void;
}) {
    const page = usePage<SharedData>();
    const { t } = useLocale();
    const { auth } = page.props;
    const currentUrl = page.url;
    const user = auth.user;
    const initials = getInitials(user.name);
    const [avatarFailed, setAvatarFailed] = useState(false);
    const showAvatar = Boolean(user.avatar_url) && !avatarFailed;

    return (
        <aside
            className={cn(
                'relative flex h-full shrink-0 flex-col border-r border-[rgba(57,119,166,0.2)] bg-white transition-all duration-300',
                collapsed ? 'w-[72px]' : 'w-[240px]',
                'hidden md:flex',
            )}
        >
            <div className="flex h-[60px] items-center gap-3 border-b border-[rgba(57,119,166,0.2)] px-4">
                <Link
                    href={jobs()}
                    className="flex min-w-0 items-center gap-3 transition-opacity hover:opacity-80"
                    aria-label={t('nav.jobs')}
                >
                    <img
                        src="/images/admin/logo.png"
                        alt={t('app.name')}
                        className="h-[51px] w-[76px] shrink-0 object-contain"
                        width={76}
                        height={51}
                    />
                    {!collapsed && (
                        <div className="min-w-0">
                            <p className="truncate text-sm font-bold text-[#050315]">
                                {t('app.name')}
                            </p>
                            <p className="truncate text-xs text-[#3977a6]">
                                {t('job_seeker.portal')}
                            </p>
                        </div>
                    )}
                </Link>
            </div>

            <nav className="flex-1 space-y-0.5 overflow-y-auto px-2 py-4">
                {navItems.map((item) => {
                    const active = currentUrl.startsWith(item.match);
                    const Icon = item.icon;

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                'relative flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors',
                                active
                                    ? 'bg-[rgba(0,87,200,0.1)] text-[#0057c8]'
                                    : 'text-[#3977a6] hover:bg-white/60',
                                collapsed && 'justify-center px-2',
                            )}
                        >
                            {active && (
                                <span className="absolute top-1/2 left-0 h-6 w-0.5 -translate-y-1/2 rounded-full bg-[#0057c8]" />
                            )}
                            <Icon className="size-5 shrink-0" strokeWidth={1.75} />
                            {!collapsed && <span>{t(item.titleKey)}</span>}
                        </Link>
                    );
                })}
            </nav>

            <div className="border-t border-[rgba(57,119,166,0.2)] p-3">
                {!collapsed && (
                    <div className="mb-2 flex items-center gap-3 rounded-xl bg-white p-2">
                        {showAvatar ? (
                            <img
                                src={user.avatar_url}
                                alt={user.name}
                                onError={() => setAvatarFailed(true)}
                                className="size-8 rounded-full object-cover object-top"
                            />
                        ) : (
                            <div className="flex size-8 items-center justify-center rounded-full bg-gradient-to-br from-[#0057c8] to-[#3b82f6] text-xs font-bold text-white">
                                {initials}
                            </div>
                        )}
                        <div className="min-w-0">
                            <p className="truncate text-xs font-medium text-[#050315]">
                                {user.name}
                            </p>
                            <p className="truncate text-xs text-[#3977a6]">
                                {user.headline ||
                                    t('job_seeker.profile.fallback_name')}
                            </p>
                        </div>
                    </div>
                )}
                <button
                    type="button"
                    onClick={() => router.post('/logout')}
                    className={cn(
                        'flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium text-[#3977a6] transition-colors hover:bg-white/60',
                        collapsed && 'justify-center px-2',
                    )}
                >
                    <LogOut className="size-5 shrink-0" strokeWidth={1.75} />
                    {!collapsed && <span>{t('common.logout')}</span>}
                </button>
            </div>

            <button
                type="button"
                onClick={onToggle}
                className="absolute top-20 -right-3 z-10 flex size-6 items-center justify-center rounded-full border border-[#3977a6] bg-[#0057c8] text-white shadow-sm"
                aria-label={
                    collapsed
                        ? t('common.expand_sidebar')
                        : t('common.collapse_sidebar')
                }
            >
                <ChevronLeft
                    className={cn(
                        'size-3 transition-transform',
                        collapsed && 'rotate-180',
                    )}
                />
            </button>
        </aside>
    );
}
