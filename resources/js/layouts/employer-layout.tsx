import { usePage } from '@inertiajs/react';
import { type ReactNode, useEffect, useState } from 'react';

import { PortalMobileNav } from '@/components/portal-mobile-nav';
import { Toaster } from '@/components/ui/sonner';
import { EmployerHeader } from '@/layouts/partials/employer/header';
import { EmployerSidebar } from '@/layouts/partials/employer/sidebar';
import type { SharedData } from '@/types';

export default function EmployerLayout({
    children,
    title,
    unreadCount,
}: {
    children: ReactNode;
    title: string;
    unreadCount?: number;
}) {
    const [mobileOpen, setMobileOpen] = useState(false);
    const [collapsed, setCollapsed] = useState(false);
    const page = usePage<SharedData>();
    const sharedUnread = Number(page.props.unread_notifications ?? 0);

    useEffect(() => {
        setMobileOpen(false);
    }, [page.url]);

    return (
        <div className="flex h-svh overflow-hidden bg-[#f8faff]">
            <div className="sticky top-0 z-40 hidden h-svh shrink-0 overflow-visible md:block">
                <EmployerSidebar
                    collapsed={collapsed}
                    onToggle={() => setCollapsed((value) => !value)}
                />
            </div>

            <PortalMobileNav
                open={mobileOpen}
                onClose={() => setMobileOpen(false)}
            >
                <EmployerSidebar
                    className="shadow-xl"
                    collapsed={false}
                    onNavigate={() => setMobileOpen(false)}
                />
            </PortalMobileNav>

            <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
                <EmployerHeader
                    title={title}
                    unreadCount={unreadCount ?? sharedUnread}
                    onToggleSidebar={() => setMobileOpen((value) => !value)}
                />
                <main className="min-h-0 flex-1 overflow-y-auto overscroll-contain bg-[#f8faff]">
                    {children}
                </main>
            </div>
            <Toaster position="top-right" richColors />
        </div>
    );
}
