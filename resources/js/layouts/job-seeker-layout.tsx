import { usePage } from '@inertiajs/react';
import { type ReactNode, useEffect, useState } from 'react';

import { PublicChatWidget } from '@/components/ai-chat-widget';
import { PortalMobileNav } from '@/components/portal-mobile-nav';
import { Toaster } from '@/components/ui/sonner';
import { JobSeekerHeader } from '@/layouts/partials/job-seeker/header';
import { JobSeekerSidebar } from '@/layouts/partials/job-seeker/sidebar';
import type { SharedData } from '@/types';

interface JobSeekerLayoutProps {
    children: ReactNode;
    title: string;
    unreadCount?: number;
}

export default function JobSeekerLayout({
    children,
    title,
    unreadCount,
}: JobSeekerLayoutProps) {
    const [collapsed, setCollapsed] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const page = usePage<SharedData>();
    const { unread_notifications: unreadNotifications, ai_chat: aiChat } =
        page.props;
    const sharedUnread = Number(unreadNotifications ?? 0);

    useEffect(() => {
        setMobileOpen(false);
    }, [page.url]);

    return (
        <div className="flex h-svh overflow-hidden bg-[#f1f5f9]">
            <div className="sticky top-0 z-40 hidden h-svh shrink-0 overflow-visible md:block">
                <JobSeekerSidebar
                    collapsed={collapsed}
                    onToggle={() => setCollapsed((value) => !value)}
                />
            </div>

            <PortalMobileNav
                open={mobileOpen}
                onClose={() => setMobileOpen(false)}
            >
                <JobSeekerSidebar
                    className="shadow-xl"
                    collapsed={false}
                    onNavigate={() => setMobileOpen(false)}
                />
            </PortalMobileNav>

            <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
                <JobSeekerHeader
                    title={title}
                    unreadCount={unreadCount ?? sharedUnread}
                    onToggleSidebar={() => setMobileOpen((value) => !value)}
                />
                <main className="min-h-0 flex-1 overflow-y-auto overscroll-contain bg-[#f8faff]">
                    {children}
                </main>
            </div>
            <Toaster position="top-right" richColors />
            {aiChat?.public_chat_enabled ? <PublicChatWidget /> : null}
        </div>
    );
}
