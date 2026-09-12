import { Link, router, usePage } from '@inertiajs/react';
import { LogOut, UserRound } from 'lucide-react';

import { AdminIcon } from '@/components/admin-icon';
import { getInitials } from '@/components/job-seeker/demo-data';
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

export function AdminPortalHeader({
    onToggleSidebar,
    className,
    unreadCount,
}: {
    onToggleSidebar?: () => void;
    className?: string;
    unreadCount?: number;
}) {
    const { auth, unread_notifications } = usePage<SharedData>().props;
    const { locale, setLocale, t } = useLocale();
    const user = auth.user;
    const initials = getInitials(user.name);
    const badgeCount = unreadCount ?? Number(unread_notifications ?? 0);
    const now = new Intl.DateTimeFormat(locale === 'ar' ? 'ar' : 'en-US', {
        hour: 'numeric',
        minute: '2-digit',
        weekday: 'short',
        month: 'short',
        day: 'numeric',
    }).format(new Date());
    const switchLocale = locale === 'ar' ? 'en' : 'ar';

    return (
        <header
            className={cn(
                'sticky top-0 z-30 flex h-[60px] shrink-0 items-center justify-between gap-4 border-b border-[#e2e8f0] bg-white/95 px-5 backdrop-blur supports-[backdrop-filter]:bg-white/90',
                className,
            )}
        >
            <div className="flex min-w-0 flex-1 items-center gap-3">
                <button
                    type="button"
                    onClick={onToggleSidebar}
                    className="rounded-lg p-1.5 text-[#3977a6] hover:bg-[#f8faff] md:hidden"
                    aria-label={t('common.toggle_sidebar')}
                >
                    <AdminIcon src="/images/admin/header-menu.svg" size={18} />
                </button>
            </div>

            <div className="flex items-center gap-3">
                <div className="hidden items-center gap-2 lg:flex">
                    <div className="text-right text-[11px] leading-tight text-[#3977a6]">
                        <p className="font-semibold text-[#050315]">
                            {now.split(',')[0]}
                        </p>
                        <p>{now.split(',').slice(1).join(',').trim()}</p>
                    </div>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-[#d1fae5] px-2.5 py-1 text-[10px] font-semibold text-[#065f46]">
                        <span className="size-1.5 rounded-full bg-[#10b981]" />
                        {t('admin.header.operational')}
                    </span>
                </div>

                <Link
                    href="/admin/notifications"
                    className="relative rounded-lg p-1.5 text-[#3977a6] hover:bg-[#f8faff]"
                    aria-label={t('common.notifications')}
                >
                    <AdminIcon src="/images/admin/header-bell.svg" size={18} />
                    {badgeCount > 0 && (
                        <span className="absolute -top-0.5 -right-0.5 flex size-4 min-w-4 items-center justify-center rounded-full bg-[#ef4444] px-0.5 text-[9px] font-bold text-white">
                            {badgeCount > 9 ? '9+' : badgeCount}
                        </span>
                    )}
                </Link>

                <button
                    type="button"
                    onClick={() => setLocale(switchLocale)}
                    className="rounded-lg p-1.5 text-[#3977a6] hover:bg-[#f8faff]"
                    aria-label={t('common.switch_language')}
                >
                    <AdminIcon src="/images/admin/header-globe.svg" size={18} />
                </button>

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button
                            type="button"
                            className="flex cursor-pointer items-center gap-2 rounded-xl px-1.5 py-1 transition-colors hover:bg-[#f8faff] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0057c8]/30"
                            aria-label={t('admin.header.user_menu')}
                        >
                            <div className="flex size-8 items-center justify-center rounded-full bg-[#0057c8] text-xs font-bold text-white">
                                {initials}
                            </div>
                            <div className="hidden text-left sm:block">
                                <p className="text-xs font-semibold text-[#050315]">
                                    {user.name}
                                </p>
                                <p className="text-[11px] text-[#3977a6]">
                                    {user.role_label}
                                </p>
                            </div>
                            <AdminIcon
                                src="/images/admin/header-chevron.svg"
                                size={14}
                                className="hidden sm:block"
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
                                href="/settings/profile"
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
