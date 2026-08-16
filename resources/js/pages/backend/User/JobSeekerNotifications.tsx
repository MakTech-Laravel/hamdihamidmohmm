import { Head, router, usePage } from '@inertiajs/react';

import JobSeekerLayout from '@/layouts/job-seeker-layout';
import type { SharedData } from '@/types';
import { cn } from '@/lib/utils';

type NotificationRow = {
    id: string;
    title: string;
    message: string;
    category: string;
    read: boolean;
    created_at: string | null;
};

export default function JobSeekerNotifications({
    notifications,
    unread,
}: {
    notifications: NotificationRow[];
    unread: number;
}) {
    const { flash } = usePage<SharedData>().props;

    return (
        <JobSeekerLayout title="Notifications" unreadCount={unread}>
            <Head title="Notifications" />

            <div className="space-y-5 p-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-extrabold text-[#0057c8]">
                        Notifications
                    </h1>
                    {unread > 0 && (
                        <button
                            type="button"
                            className="text-sm font-semibold text-[#0057c8]"
                            onClick={() =>
                                router.post(
                                    '/job-seeker/notifications/read-all',
                                )
                            }
                        >
                            Mark all read
                        </button>
                    )}
                </div>
                {flash.success && (
                    <div className="rounded-xl border border-[#bbf7d0] bg-[#f0fdf4] px-4 py-3 text-sm text-[#15803d]">
                        {typeof flash.success === 'string'
                            ? flash.success
                            : 'Saved successfully.'}
                    </div>
                )}
                <div className="space-y-3">
                    {notifications.map((item) => (
                        <button
                            key={item.id}
                            type="button"
                            className={cn(
                                'w-full rounded-2xl border p-4 text-left',
                                item.read ? 'bg-white' : 'bg-[#eff6ff]',
                            )}
                            onClick={() => {
                                if (!item.read) {
                                    router.post(
                                        `/job-seeker/notifications/${item.id}/read`,
                                    );
                                }
                            }}
                        >
                            <p className="font-semibold">{item.title}</p>
                            <p className="text-sm text-[#64748b]">
                                {item.message}
                            </p>
                            <p className="mt-1 text-xs text-[#99a1af]">
                                {item.category} · {item.created_at}
                            </p>
                        </button>
                    ))}
                    {notifications.length === 0 && (
                        <p className="text-center text-sm text-[#99a1af]">
                            No notifications yet.
                        </p>
                    )}
                </div>
            </div>
        </JobSeekerLayout>
    );
}
