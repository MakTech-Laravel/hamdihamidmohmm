import { type ReactNode } from 'react';

import { Toaster } from '@/components/ui/sonner';
import { EmployerHeader } from '@/layouts/partials/employer/header';
import { EmployerSidebar } from '@/layouts/partials/employer/sidebar';

export default function EmployerLayout({
    children,
    title,
    unreadCount = 2,
}: {
    children: ReactNode;
    title: string;
    unreadCount?: number;
}) {
    return (
        <div className="flex h-svh overflow-hidden bg-[#f8faff]">
            <div className="sticky top-0 z-40 hidden h-svh shrink-0 md:block">
                <EmployerSidebar />
            </div>
            <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
                <EmployerHeader title={title} unreadCount={unreadCount} />
                <main className="min-h-0 flex-1 overflow-y-auto overscroll-contain bg-[#f8faff]">
                    {children}
                </main>
            </div>
            <Toaster position="top-right" richColors />
        </div>
    );
}
