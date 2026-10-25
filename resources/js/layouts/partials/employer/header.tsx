import { Link, router, usePage } from '@inertiajs/react';
import { LogOut, Menu, UserRound } from 'lucide-react';
import { useState } from 'react';

import { firstName, getInitials } from '@/components/employer/demo-data';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useLocale } from '@/hooks/use-locale';
import { cn } from '@/lib/utils';
import type { SharedData } from '@/types';

export function EmployerHeader({
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
    const personName = user.name || user.contact_name || 'Employer';
    const initials = getInitials(personName);
    const shortName = firstName(personName);
    const companyName =
        user.company_name || t('employer.profile.organization_fallback');
    const switchLocale = locale === 'ar' ? 'en' : 'ar';
    const localeLabel =
        switchLocale === 'ar'
            ? t('lang.switch_to_arabic')
            : t('lang.switch_to_english');
    const [avatarFailed, setAvatarFailed] = useState(false);
    const showAvatar = Boolean(user.avatar_url) && !avatarFailed;

    return (
        <header className="sticky top-0 z-30 flex h-[60px] shrink-0 items-center justify-between gap-2 overflow-x-hidden border-b border-[rgba(57,119,166,0.2)] bg-white px-3 shadow-[0px_1px_2px_rgba(0,0,0,0.04)] sm:gap-4 sm:px-6">
            <div className="flex min-w-0 flex-1 items-center gap-2">
                {onToggleSidebar ? (
                    <button
                        type="button"
                        onClick={onToggleSidebar}
                        className="shrink-0 rounded-lg p-1.5 text-[#3977a6] hover:bg-[#f8faff] md:hidden"
                        aria-label={t('common.toggle_sidebar')}
                    >
                        <Menu className="size-[18px]" strokeWidth={1.75} />
                    </button>
                ) : null}
                <div className="min-w-0">
                    <p className="truncate text-sm leading-5 font-bold text-[#101828]">
                        {title}
                    </p>
                    <p className="hidden truncate text-xs leading-4 text-[#99a1af] sm:block">
                        {companyName} · {personName}
                    </p>
                </div>
            </div>

            <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
                <Link
                    href="/"
                    className="hidden cursor-pointer items-center gap-1.5 rounded-lg border border-[#e2e8f0] bg-[#d1f6ff] px-3 py-1.5 text-xs font-medium text-[#64748b] transition-colors hover:bg-white sm:inline-flex"
                >
                    <img
                        src="/images/employer/external-link.svg"
                        alt=""
                        width={14}
                        height={14}
                        className="size-3.5 shrink-0 object-contain"
                    />
                    <span className="hidden lg:inline">
                        {t('common.public_website')}
                    </span>
                </Link>

                <button
                    type="button"
                    onClick={() => setLocale(switchLocale)}
                    className={cn(
                        'inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-[#e2e8f0] bg-[#d1f6ff] px-2 py-1.5 text-xs font-medium text-[#64748b] transition-colors hover:bg-white sm:px-3',
                    )}
                    aria-label={localeLabel}
                    title={localeLabel}
                >
                    <img
                        src="/images/employer/globe.svg"
                        alt=""
                        width={14}
                        height={14}
                        className="size-3.5 shrink-0 object-contain"
                    />
                    <span className="hidden sm:inline">{localeLabel}</span>
                </button>

                <Link
                    href="/employer/notifications"
                    className="relative flex size-9 items-center justify-center rounded-lg p-2 text-[#64748b] transition-colors hover:bg-[#d1f6ff]"
                    aria-label={t('common.notifications')}
                >
                    <img
                        src="/images/employer/bell.svg"
                        alt=""
                        width={20}
                        height={20}
                        className="size-5 shrink-0 object-contain"
                    />
                    {unreadCount > 0 && (
                        <span className="absolute top-0.5 right-0.5 flex size-4 min-w-4 items-center justify-center rounded-full bg-[#ef4444] px-0.5 text-[9px] leading-[13.5px] font-bold text-white">
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                    )}
                </Link>

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button
                            type="button"
                            className="flex cursor-pointer items-center gap-2 rounded-xl p-1 transition-colors hover:bg-[#d1f6ff] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0057c8]/30"
                            aria-label={t('employer.header.user_menu')}
                        >
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
                            <div className="hidden text-left sm:block">
                                <p className="text-sm leading-[17.5px] font-semibold text-[#364153]">
                                    {shortName}
                                </p>
                                <p className="text-xs leading-[15px] text-[#99a1af]">
                                    {user.role_label}
                                </p>
                            </div>
                            <img
                                src="/images/employer/chevron.svg"
                                alt=""
                                width={16}
                                height={16}
                                className="hidden size-4 shrink-0 object-contain sm:block"
                            />
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                        align="end"
                        sideOffset={8}
                        className="w-48 rounded-xl border border-[#e2e8f0] bg-white p-1 shadow-[0px_8px_20px_rgba(5,3,21,0.08)]"
                    >
                        <DropdownMenuItem asChild>
                            <Link
                                href="/employer/profile"
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
