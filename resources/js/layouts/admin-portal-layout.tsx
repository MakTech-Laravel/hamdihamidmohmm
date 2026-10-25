import { usePage } from '@inertiajs/react';
import { type ReactNode, useEffect, useState } from 'react';

import { AdminAssistantWidget } from '@/components/ai-chat-widget';
import { PortalMobileNav } from '@/components/portal-mobile-nav';
import { Toaster } from '@/components/ui/sonner';
import { AdminPortalHeader } from '@/layouts/partials/admin-portal/header';
import { AdminPortalSidebar } from '@/layouts/partials/admin-portal/sidebar';
import type { SharedData } from '@/types';

export default function AdminPortalLayout({
    children,
}: {
    children: ReactNode;
}) {
    const [mobileOpen, setMobileOpen] = useState(false);
    const [collapsed, setCollapsed] = useState(false);
    const page = usePage<SharedData>();
    const { unread_notifications: unreadNotifications, ai_chat: aiChat } =
        page.props;
    const unreadCount = Number(unreadNotifications ?? 0);

    useEffect(() => {
        setMobileOpen(false);
    }, [page.url]);

    return (
        <div className="flex h-svh overflow-hidden bg-[#f8faff]">
            <div className="sticky top-0 z-40 hidden h-svh shrink-0 overflow-visible md:block">
                <AdminPortalSidebar
                    collapsed={collapsed}
                    onToggle={() => setCollapsed((value) => !value)}
                />
            </div>

            <PortalMobileNav
                open={mobileOpen}
                onClose={() => setMobileOpen(false)}
            >
                <AdminPortalSidebar
                    className="shadow-xl"
                    collapsed={false}
                    onNavigate={() => setMobileOpen(false)}
                />
            </PortalMobileNav>

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
            {aiChat?.admin_assistant_enabled ? <AdminAssistantWidget /> : null}
        </div>
    );
}
