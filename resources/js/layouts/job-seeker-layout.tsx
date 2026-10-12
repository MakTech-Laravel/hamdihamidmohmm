import { usePage } from '@inertiajs/react';
import { type ReactNode, useState } from 'react';

import { PublicChatWidget } from '@/components/ai-chat-widget';
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
    const { unread_notifications: unreadNotifications, ai_chat: aiChat } =
        usePage<SharedData>().props;
    const sharedUnread = Number(unreadNotifications ?? 0);

    return (
        <div className="flex h-svh overflow-hidden bg-[#f1f5f9]">
            <div className="sticky top-0 z-40 hidden h-svh shrink-0 md:block">
                <JobSeekerSidebar
                    collapsed={collapsed}
                    onToggle={() => setCollapsed((value) => !value)}
                />
            </div>
            <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
                <JobSeekerHeader
                    title={title}
                    unreadCount={unreadCount ?? sharedUnread}
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
