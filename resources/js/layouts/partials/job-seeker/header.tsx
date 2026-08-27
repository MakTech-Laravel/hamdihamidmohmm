import { Link, router, usePage } from '@inertiajs/react';
import {
    Bell,
    ChevronDown,
    ExternalLink,
    Globe,
    LogOut,
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
}: {
    title: string;
    unreadCount?: number;
}) {
    const { auth } = usePage<SharedData>().props;
    const { locale, setLocale } = useLocale();
    const user = auth.user;
    const initials = getInitials(user.name);
    const shortName = firstName(user.name);
    const switchLocale = locale === 'ar' ? 'en' : 'ar';
    const localeLabel = locale === 'ar' ? 'English' : 'العربية';
    const [avatarFailed, setAvatarFailed] = useState(false);
    const showAvatar = Boolean(user.avatar_url) && !avatarFailed;

    return (
        <header className="sticky top-0 z-30 flex h-[60px] shrink-0 items-center justify-between border-b border-[rgba(57,119,166,0.2)] bg-[#f8faff]/95 px-6 shadow-[0px_1px_2px_rgba(0,0,0,0.04)] backdrop-blur supports-[backdrop-filter]:bg-[#f8faff]/90">
            <div>
                <p className="text-sm font-bold text-[#101828]">{title}</p>
                <p className="text-xs text-[#99a1af]">
                    RR Job Portal · {user.name}
                </p>
            </div>

            <div className="flex items-center gap-2">
                <Link
                    href="/"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-[#e2e8f0] bg-[#f8faff] px-3 py-1.5 text-xs font-medium text-[#64748b] transition-colors hover:bg-white"
                >
                    <ExternalLink className="size-3.5" />
                    Public Website
                </Link>

                <button
                    type="button"
                    onClick={() => setLocale(switchLocale)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-[#e2e8f0] bg-[#f8faff] px-3 py-1.5 text-xs font-medium text-[#64748b] transition-colors hover:bg-white"
                >
                    <Globe className="size-3.5" />
                    {localeLabel}
                </button>

                <Link
                    href="/job-seeker/notifications"
                    className="relative rounded-lg p-2 text-[#64748b] transition-colors hover:bg-white"
                    aria-label="Notifications"
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
                            aria-label="User menu"
                        >
                            {showAvatar ? (
                                <img
                                    src={user.avatar_url}
                                    alt={user.name}
                                    onError={() => setAvatarFailed(true)}
                                    className="size-8 rounded-full object-cover"
                                />
                            ) : (
                                <div className="flex size-8 items-center justify-center rounded-full bg-gradient-to-br from-[#0057c8] to-[#3b82f6] text-xs font-bold text-white">
                                    {initials}
                                </div>
                            )}
                            <span className="text-sm font-semibold text-[#364153]">
                                {shortName}
                            </span>
                            <ChevronDown className="size-4 text-[#99a1af]" />
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
                                Profile
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-[#e2e8f0]" />
                        <DropdownMenuItem
                            className="cursor-pointer rounded-lg px-2 py-2 text-sm text-[#b91c1c] focus:bg-[#fef2f2] focus:text-[#b91c1c]"
                            onSelect={() => router.post('/logout')}
                        >
                            <LogOut className="size-4" />
                            Log out
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </header>
    );
}
