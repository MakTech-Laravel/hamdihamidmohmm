import { Link, router, usePage } from '@inertiajs/react';
import {
    Bell,
    ChevronDown,
    ExternalLink,
    Globe,
    LogOut,
    Menu,
    UserRound,
} from 'lucide-react';
import { useState } from 'react';

import { firstName, getInitials } from '@/components/job-seeker/demo-data';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useLocale } from '@/hooks/use-locale';
import type { SharedData } from '@/types';

export function JobSeekerHeader({
    title,
    unreadCount = 0,
    onToggleSidebar,
}: {
    title: string;
    unreadCount?: number;
    onToggleSidebar?: () => void;
}) {
    const { auth } = usePage<SharedData>().props;
    const { locale, setLocale, t } = useLocale();
    const user = auth.user;
    const initials = getInitials(user.name);
    const shortName = firstName(user.name);
    const switchLocale = locale === 'ar' ? 'en' : 'ar';
    const localeLabel =
        locale === 'ar' ? t('lang.switch_to_english') : t('lang.switch_to_arabic');
    const [avatarFailed, setAvatarFailed] = useState(false);
    const showAvatar = Boolean(user.avatar_url) && !avatarFailed;

    return (
        <header className="sticky top-0 z-30 flex h-[60px] shrink-0 items-center justify-between gap-2 overflow-x-hidden border-b border-[rgba(57,119,166,0.2)] bg-[#f8faff]/95 px-3 shadow-[0px_1px_2px_rgba(0,0,0,0.04)] backdrop-blur supports-[backdrop-filter]:bg-[#f8faff]/90 sm:gap-4 sm:px-6">
            <div className="flex min-w-0 flex-1 items-center gap-2">
                {onToggleSidebar ? (
                    <button
                        type="button"
                        onClick={onToggleSidebar}
                        className="shrink-0 rounded-lg p-1.5 text-[#3977a6] hover:bg-white md:hidden"
                        aria-label={t('common.toggle_sidebar')}
                    >
                        <Menu className="size-[18px]" strokeWidth={1.75} />
                    </button>
                ) : null}
                <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-[#101828]">
                        {title}
                    </p>
                    <p className="hidden truncate text-xs text-[#99a1af] sm:block">
                        {t('app.name')} · {user.name}
                    </p>
                </div>
            </div>

            <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
                <Link
                    href="/"
                    className="hidden items-center gap-1.5 rounded-lg border border-[#e2e8f0] bg-[#f8faff] px-3 py-1.5 text-xs font-medium text-[#64748b] transition-colors hover:bg-white sm:inline-flex"
                >
                    <ExternalLink className="size-3.5" />
                    <span className="hidden lg:inline">
                        {t('common.public_website')}
                    </span>
                </Link>

                <button
                    type="button"
                    onClick={() => setLocale(switchLocale)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-[#e2e8f0] bg-[#f8faff] px-2 py-1.5 text-xs font-medium text-[#64748b] transition-colors hover:bg-white sm:px-3"
                    aria-label={localeLabel}
                    title={localeLabel}
                >
                    <Globe className="size-3.5" />
                    <span className="hidden sm:inline">{localeLabel}</span>
                </button>

                <Link
                    href="/job-seeker/notifications"
                    className="relative rounded-lg p-2 text-[#64748b] transition-colors hover:bg-white"
                    aria-label={t('common.notifications')}
                >
                    <Bell className="size-5" />
                    {unreadCount > 0 && (
                        <span className="absolute top-0.5 right-0.5 flex size-4 min-w-4 items-center justify-center rounded-full bg-[#ef4444] px-0.5 text-[9px] font-bold text-white">
                            {unreadCount}
                        </span>
                    )}
                </Link>

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button
                            type="button"
                            className="flex items-center gap-2 rounded-xl p-1 transition-colors hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0057c8]/30"
                            aria-label={t('job_seeker.header.user_menu')}
                        >
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
                            <span className="hidden text-sm font-semibold text-[#364153] sm:inline">
                                {shortName}
                            </span>
                            <ChevronDown className="hidden size-4 text-[#99a1af] sm:block" />
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                        align="end"
                        sideOffset={8}
                        className="w-48 rounded-xl border border-[#e2e8f0] bg-white p-1 shadow-[0px_8px_20px_rgba(5,3,21,0.08)]"
                    >
                        <DropdownMenuItem asChild>
                            <Link
                                href="/job-seeker/profile"
                                className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-2 text-sm text-[#364153]"
                            >
                                <UserRound className="size-4 text-[#0057c8]" />
                                {t('common.profile')}
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-[#e2e8f0]" />
                        <DropdownMenuItem
                            className="cursor-pointer rounded-lg px-2 py-2 text-sm text-[#b91c1c] focus:bg-[#fef2f2] focus:text-[#b91c1c]"
                            onSelect={() => router.post('/logout')}
                        >
                            <LogOut className="size-4" />
                            {t('common.log_out')}
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </header>
    );
}
