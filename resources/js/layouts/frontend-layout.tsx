import { usePage } from '@inertiajs/react';
import * as React from 'react';

import { PublicChatWidget } from '@/components/ai-chat-widget';
import { FrontendFooter } from '@/layouts/partials/frontend/footer';
import { FrontendHeader } from '@/layouts/partials/frontend/header';
import type { SharedData } from '@/types';

interface FrontendLayoutProps {
    children: React.ReactNode;
}

export default function FrontendLayout({ children }: FrontendLayoutProps) {
    const { ai_chat: aiChat } = usePage<SharedData>().props;

    return (
        <div className="flex min-h-screen flex-col bg-[#f8faff] font-['Plus_Jakarta_Sans','Noto_Sans_Arabic',sans-serif] text-[#050315]">
            <FrontendHeader />
            <main className="flex flex-1 flex-col">{children}</main>
            <FrontendFooter />
            {aiChat?.public_chat_enabled ? <PublicChatWidget /> : null}
        </div>
    );
}
