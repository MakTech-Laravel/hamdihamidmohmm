import { Link, usePage } from '@inertiajs/react';

import { firstName, getInitials } from '@/components/employer/demo-data';
import { useLocale } from '@/hooks/use-locale';
import type { SharedData } from '@/types';

export function EmployerHeader({
    title,
    unreadCount = 0,
}: {
    title: string;
    unreadCount?: number;
}) {
    const { auth } = usePage<SharedData>().props;
    const { locale, setLocale } = useLocale();
    const user = auth.user;
    const personName = user.contact_name || user.name;
    const initials = getInitials(personName);
    const shortName = firstName(personName);
    const companyName = user.company_name || 'Company';
    const switchLocale = locale === 'ar' ? 'en' : 'ar';
    const localeLabel = locale === 'ar' ? 'English' : 'العربية';

    return (
        <header className="sticky top-0 z-30 flex h-[60px] shrink-0 items-center justify-between border-b border-[rgba(57,119,166,0.2)] bg-white px-6 shadow-[0px_1px_2px_rgba(0,0,0,0.04)]">
            <div>
                <p className="text-sm leading-5 font-bold text-[#101828]">
                    {title}
                </p>
                <p className="text-xs leading-4 text-[#99a1af]">
                    {companyName} · {personName}
                </p>
            </div>

            <div className="flex items-center gap-2">
                <Link
                    href="/"
                    className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-[#e2e8f0] bg-[#d1f6ff] px-3 py-1.5 text-xs font-medium text-[#64748b] transition-colors hover:bg-white"
                >
                    <img
                        src="/images/employer/external-link.svg"
                        alt=""
                        width={14}
                        height={14}
                        className="size-3.5 shrink-0 object-contain"
                    />
                    Public Website
                </Link>

                <button
                    type="button"
                    onClick={() => setLocale(switchLocale)}
                    className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-[#e2e8f0] bg-[#d1f6ff] px-3 py-1.5 text-xs font-medium text-[#64748b] transition-colors hover:bg-white"
                >
                    <img
                        src="/images/employer/globe.svg"
                        alt=""
                        width={14}
                        height={14}
                        className="size-3.5 shrink-0 object-contain"
                    />
                    {localeLabel}
                </button>

                <Link
                    href="/employer/notifications"
                    className="relative flex size-9 items-center justify-center rounded-lg p-2 text-[#64748b] transition-colors hover:bg-[#d1f6ff]"
                    aria-label="Notifications"
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

                <button
                    type="button"
                    className="flex cursor-pointer items-center gap-2 rounded-xl p-1 transition-colors hover:bg-[#d1f6ff]"
                >
                    <div className="flex size-8 items-center justify-center rounded-full bg-[#0057c8] text-xs font-bold text-white">
                        {initials}
                    </div>
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
                        className="size-4 shrink-0 object-contain"
                    />
                </button>
            </div>
        </header>
    );
}
