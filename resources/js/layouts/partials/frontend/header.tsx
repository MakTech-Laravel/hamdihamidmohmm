import { Link, router, usePage } from '@inertiajs/react';
import { ChevronDown, LayoutDashboard, LogOut, Menu, UserRound, X } from 'lucide-react';
import { useState } from 'react';

import { getInitials } from '@/components/job-seeker/demo-data';
import { LanguageSwitcher } from '@/components/language-switcher';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useLocale } from '@/hooks/use-locale';
import { about, contact, discover, jobs, login, pricing, register, training } from '@/routes';
import type { SharedData } from '@/types';

function FrontendUserMenu({
    user,
    compact = false,
}: {
    user: NonNullable<SharedData['auth']['user']>;
    compact?: boolean;
}) {
    const { t } = useLocale();
    const [avatarFailed, setAvatarFailed] = useState(false);
    const displayName = user.name || user.email;
    const initials = getInitials(displayName);
    const showAvatar = Boolean(user.avatar_url) && !avatarFailed;
    const dashboardUrl =
        typeof user.dashboard_url === 'string' && user.dashboard_url !== ''
            ? user.dashboard_url
            : '/dashboard';
    const profileUrl =
        typeof user.profile_url === 'string' && user.profile_url !== ''
            ? user.profile_url
            : dashboardUrl;

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button
                    type="button"
                    className={
                        compact
                            ? 'inline-flex max-w-[280px] items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-base font-medium text-[#d1f6ff] transition hover:bg-white/10'
                            : 'inline-flex max-w-[280px] items-center gap-2.5 rounded-xl border border-[#d1f6ff] bg-white px-3 py-2 text-base font-semibold text-[#050315] transition hover:bg-[#f8faff]'
                    }
                    aria-label={t('nav.account_menu')}
                >
                    {showAvatar ? (
                        <img
                            src={user.avatar_url}
                            alt=""
                            onError={() => setAvatarFailed(true)}
                            className="size-11 shrink-0 rounded-full object-cover object-top"
                        />
                    ) : (
                        <span
                            className={
                                compact
                                    ? 'flex size-11 shrink-0 items-center justify-center rounded-full bg-white/20 text-sm font-bold text-white'
                                    : 'flex size-11 shrink-0 items-center justify-center rounded-full bg-[#0057c8] text-sm font-bold text-white'
                            }
                        >
                            {initials}
                        </span>
                    )}
                    <span className="min-w-0 truncate">{displayName}</span>
                    <ChevronDown className="size-5 shrink-0 opacity-80" />
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[200px]">
                <DropdownMenuLabel className="font-normal">
                    <p className="truncate text-sm font-semibold text-[#050315]">
                        {displayName}
                    </p>
                    <p className="truncate text-xs text-[#64748b]">{user.email}</p>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                    <Link href={dashboardUrl} className="cursor-pointer">
                        <LayoutDashboard className="mr-2 size-4" />
                        {t('nav.dashboard')}
                    </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                    <Link href={profileUrl} className="cursor-pointer">
                        <UserRound className="mr-2 size-4" />
                        {t('common.profile')}
                    </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                    className="cursor-pointer text-[#b91c1c] focus:text-[#b91c1c]"
                    onSelect={() => router.post('/logout')}
                >
                    <LogOut className="mr-2 size-4" />
                    {t('common.logout')}
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

export function FrontendHeader() {
    const { auth } = usePage<SharedData>().props;
    const { url } = usePage();
    const { t } = useLocale();
    const [mobileOpen, setMobileOpen] = useState(false);

    const currentPath = url.split('?')[0] ?? '/';
    const user = auth.user;

    const navItems = [
        { label: t('nav.jobs'), href: jobs.url(), match: '/' },
        { label: t('nav.pricing'), href: pricing.url(), match: '/pricing' },
        { label: t('nav.training'), href: training.url(), match: '/training' },
        { label: t('nav.discover'), href: discover.url(), match: '/discover' },
        { label: t('nav.about'), href: about.url(), match: '/about' },
        { label: t('nav.contact'), href: contact.url(), match: '/contact' },
    ];

    return (
        <header className="sticky top-0 z-50 font-['Plus_Jakarta_Sans','Noto_Sans_Arabic',sans-serif]">
            <div className="bg-[#0057c8]">
                <div className="mx-auto flex max-w-[1344px] items-center justify-end gap-1 px-4 py-1 sm:px-6 lg:px-8">
                    <LanguageSwitcher variant="header" className="shrink-0" />
                    <Link
                        href={`${pricing.url()}#faq`}
                        className="rounded-lg px-4 py-2 text-sm font-medium text-[#d1f6ff] transition hover:bg-white/10"
                    >
                        {t('nav.faq')}
                    </Link>
                </div>
            </div>

            <div className="border-b border-black/0 bg-white">
                <div className="mx-auto flex h-[72px] max-w-[1344px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
                    <Link href={jobs()} className="shrink-0">
                        <img
                            src="/images/home/logo.png"
                            alt={t('app.name')}
                            className="h-[65px] w-[98px] object-contain"
                            width={98}
                            height={65}
                        />
                    </Link>

                    <nav className="hidden items-center gap-1 lg:flex">
                        {navItems.map((item) => {
                            const isActive =
                                item.match !== null && currentPath === item.match;

                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`relative rounded-lg px-4 py-2 text-sm font-medium transition ${isActive
                                        ? 'text-[#1c398e]'
                                        : 'text-[#4a5565] hover:text-[#1c398e]'
                                        }`}
                                >
                                    {item.label}
                                    {isActive && (
                                        <span className="absolute inset-x-2 -bottom-0.5 h-[2px] rounded-sm bg-[#1e3a8a]" />
                                    )}
                                </Link>
                            );
                        })}
                    </nav>

                    <div className="hidden items-center gap-2 lg:flex">
                        {user ? (
                            <FrontendUserMenu user={user} />
                        ) : (
                            <>
                                <Link
                                    href={register()}
                                    className="rounded-lg border border-[#0057c8] px-4 py-2 text-base font-medium tracking-[-0.18px] text-[#0057c8] transition hover:bg-[#0057c8]/5"
                                >
                                    {t('nav.register')}
                                </Link>
                                <Link
                                    href={login()}
                                    className="rounded-lg bg-[#0057c8] px-4 py-2 text-base font-medium tracking-[-0.18px] text-[#d1f6ff] transition hover:brightness-110"
                                >
                                    {t('nav.login')}
                                </Link>
                            </>
                        )}
                    </div>

                    <button
                        type="button"
                        className="inline-flex size-10 items-center justify-center rounded-lg text-[#0057c8] lg:hidden"
                        onClick={() => setMobileOpen((open) => !open)}
                        aria-label={t('nav.toggle_menu')}
                    >
                        {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
                    </button>
                </div>

                {mobileOpen && (
                    <div className="border-t border-[#e2e8f0] bg-white px-4 py-4 lg:hidden">
                        <nav className="flex flex-col gap-1">
                            {navItems.map((item) => (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className="rounded-lg px-3 py-2 text-sm font-medium text-[#4a5565]"
                                    onClick={() => setMobileOpen(false)}
                                >
                                    {item.label}
                                </Link>
                            ))}
                        </nav>
                        <div className="mt-3 border-t border-[#e2e8f0] pt-3">
                            <LanguageSwitcher variant="footer" />
                        </div>
                        {user ? (
                            <div className="mt-4 border-t border-[#e2e8f0] pt-4">
                                <FrontendUserMenu user={user} />
                            </div>
                        ) : (
                            <div className="mt-4 flex gap-2">
                                <Link
                                    href={register()}
                                    className="flex-1 rounded-lg border border-[#0057c8] px-4 py-2 text-center text-sm font-medium text-[#0057c8]"
                                >
                                    {t('nav.register')}
                                </Link>
                                <Link
                                    href={login()}
                                    className="flex-1 rounded-lg bg-[#0057c8] px-4 py-2 text-center text-sm font-medium text-white"
                                >
                                    {t('nav.login')}
                                </Link>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </header>
    );
}
