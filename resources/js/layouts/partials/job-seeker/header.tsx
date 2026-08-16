import { Link, usePage } from '@inertiajs/react';
import { Bell, ChevronDown, ExternalLink, Globe } from 'lucide-react';

import { firstName, getInitials } from '@/components/job-seeker/demo-data';
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

                <button
                    type="button"
                    className="flex items-center gap-2 rounded-xl p-1 transition-colors hover:bg-white"
                >
                    <div className="flex size-8 items-center justify-center rounded-full bg-gradient-to-br from-[#0057c8] to-[#3b82f6] text-xs font-bold text-white">
                        {initials}
                    </div>
                    <span className="text-sm font-semibold text-[#364153]">
                        {shortName}
                    </span>
                    <ChevronDown className="size-4 text-[#99a1af]" />
                </button>
            </div>
        </header>
    );
}
