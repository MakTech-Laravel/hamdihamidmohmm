import { usePage } from '@inertiajs/react';

import { AdminIcon } from '@/components/admin-icon';
import { getInitials } from '@/components/job-seeker/demo-data';
import { useLocale } from '@/hooks/use-locale';
import { cn } from '@/lib/utils';
import type { SharedData } from '@/types';

export function AdminPortalHeader({
    onToggleSidebar,
    className,
}: {
    onToggleSidebar?: () => void;
    className?: string;
}) {
    const { auth } = usePage<SharedData>().props;
    const { locale, setLocale } = useLocale();
    const user = auth.user;
    const initials = getInitials(user.name);
    const now = new Intl.DateTimeFormat('en-US', {
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
                    aria-label="Toggle sidebar"
                >
                    <AdminIcon src="/images/admin/header-menu.svg" size={18} />
                </button>
                <div className="relative hidden max-w-[400px] flex-1 sm:block">
                    <AdminIcon
                        src="/images/admin/header-search.svg"
                        size={14}
                        className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2"
                    />
                    <input
                        type="search"
                        placeholder="Search employers, jobs, payments…"
                        className="h-[34px] w-full rounded-lg border border-[#e2e8f0] bg-[#f8faff] pr-3 pl-8 text-xs text-[#050315] outline-none focus:border-[#0057c8]"
                    />
                </div>
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
                        Operational
                    </span>
                </div>

                <button
                    type="button"
                    className="relative rounded-lg p-1.5 text-[#3977a6] hover:bg-[#f8faff]"
                    aria-label="Notifications"
                >
                    <AdminIcon src="/images/admin/header-bell.svg" size={18} />
                    <span className="absolute -top-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-[#ef4444] text-[9px] font-bold text-white">
                        3
                    </span>
                </button>

                <button
                    type="button"
                    onClick={() => setLocale(switchLocale)}
                    className="rounded-lg p-1.5 text-[#3977a6] hover:bg-[#f8faff]"
                    aria-label="Switch language"
                >
                    <AdminIcon src="/images/admin/header-globe.svg" size={18} />
                </button>

                <div className="flex items-center gap-2 rounded-xl px-1.5 py-1">
                    <div className="flex size-8 items-center justify-center rounded-full bg-[#0057c8] text-xs font-bold text-white">
                        {initials}
                    </div>
                    <div className="hidden sm:block">
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
                </div>
            </div>
        </header>
    );
}
