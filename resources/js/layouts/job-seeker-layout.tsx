import { type ReactNode, useState } from 'react';

import { Toaster } from '@/components/ui/sonner';
import { JobSeekerHeader } from '@/layouts/partials/job-seeker/header';
import { JobSeekerSidebar } from '@/layouts/partials/job-seeker/sidebar';

interface JobSeekerLayoutProps {
    children: ReactNode;
    title: string;
    unreadCount?: number;
}

export default function JobSeekerLayout({
    children,
    title,
    unreadCount = 2,
}: JobSeekerLayoutProps) {
    const [collapsed, setCollapsed] = useState(false);

    return (
        <div className="flex min-h-screen bg-[#f1f5f9]">
            <JobSeekerSidebar
                collapsed={collapsed}
                onToggle={() => setCollapsed((value) => !value)}
            />
            <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
                <JobSeekerHeader title={title} unreadCount={unreadCount} />
                <main className="flex-1 overflow-y-auto bg-[#f8faff]">
                    {children}
                </main>
            </div>
            <Toaster position="top-right" richColors />
        </div>
    );
}
