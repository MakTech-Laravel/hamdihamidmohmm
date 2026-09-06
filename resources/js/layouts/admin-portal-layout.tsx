import { usePage } from '@inertiajs/react';
import { type ReactNode, useState } from 'react';

import { Toaster } from '@/components/ui/sonner';
import { useLocale } from '@/hooks/use-locale';
import { AdminPortalHeader } from '@/layouts/partials/admin-portal/header';
import { AdminPortalSidebar } from '@/layouts/partials/admin-portal/sidebar';
import { cn } from '@/lib/utils';
import type { SharedData } from '@/types';

export default function AdminPortalLayout({
    children,
}: {
    children: ReactNode;
}) {
    const [mobileOpen, setMobileOpen] = useState(false);
    const { t } = useLocale();
    const unreadCount = Number(
        usePage<SharedData>().props.unread_notifications ?? 0,
    );

    return (
        <div className="flex h-svh overflow-hidden bg-[#f8faff]">
            <div className="sticky top-0 z-40 hidden h-svh shrink-0 md:block">
                <AdminPortalSidebar />
            </div>

            <div
                className={cn(
                    'fixed inset-y-0 left-0 z-50 md:hidden',
                    mobileOpen ? 'block' : 'hidden',
                )}
            >
                <AdminPortalSidebar className="shadow-xl" />
            </div>

            {mobileOpen && (
                <button
                    type="button"
                    className="fixed inset-0 z-40 bg-slate-900/40 md:hidden"
                    aria-label={t('common.close_sidebar')}
                    onClick={() => setMobileOpen(false)}
                />
            )}

            <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
                <AdminPortalHeader
                    onToggleSidebar={() => setMobileOpen((value) => !value)}
                    unreadCount={unreadCount}
                />
                <main className="min-h-0 flex-1 overflow-y-auto overscroll-contain bg-[#f8faff]">
                    {children}
                </main>
            </div>

            <Toaster position="top-right" richColors />
        </div>
    );
}
