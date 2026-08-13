import { Head } from '@inertiajs/react';
import { Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';

import {
    NOTIFICATION_FEED,
    type NotificationCategory,
} from '@/components/employer/demo-data';
import EmployerLayout from '@/layouts/employer-layout';
import { cn } from '@/lib/utils';

type FilterOption = 'All' | 'Unread' | NotificationCategory;

const FILTER_PILLS: { key: FilterOption; label: string }[] = [
    { key: 'All', label: 'All' },
    { key: 'Unread', label: 'Unread' },
    { key: 'Applications', label: 'Applications' },
    { key: 'Jobs', label: 'Jobs' },
    { key: 'Billing', label: 'Billing' },
    { key: 'System', label: 'System' },
];

const CATEGORY_TONE: Record<NotificationCategory, string> = {
    Applications: 'bg-[#eeeffe] text-[#323981]',
    Jobs: 'bg-[#fff7ed] text-[#c2410c]',
    Billing: 'bg-[#dcfce7] text-[#166534]',
    System: 'bg-[#f3f4f6] text-[#6b7280]',
};

export default function EmployerNotifications() {
    const [activeFilter, setActiveFilter] = useState<FilterOption>('All');
    const [notifications, setNotifications] = useState(NOTIFICATION_FEED);

    const unreadCount = notifications.filter((n) => n.unread).length;

    const filteredNotifications = useMemo(() => {
        return notifications.filter((notification) => {
            if (activeFilter === 'All') {
                return true;
            }
            if (activeFilter === 'Unread') {
                return notification.unread;
            }
            return notification.category === activeFilter;
        });
    }, [notifications, activeFilter]);

    const filterCounts = useMemo(() => {
        return {
            All: notifications.length,
            Unread: unreadCount,
        };
    }, [notifications.length, unreadCount]);

    const markAllRead = () => {
        setNotifications((prev) =>
            prev.map((n) => ({ ...n, unread: false })),
        );
    };

    const markAsRead = (id: string) => {
        setNotifications((prev) =>
            prev.map((n) => (n.id === id ? { ...n, unread: false } : n)),
        );
    };

    const deleteNotification = (id: string) => {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
    };

    return (
        <EmployerLayout title="Notifications" unreadCount={unreadCount}>
            <Head title="Notifications" />

            <div className="space-y-6 px-4 py-6 sm:px-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                        <h1 className="text-[28px] font-extrabold tracking-tight text-[#050315]">
                            Notifications
                        </h1>
                        <p className="mt-1 text-sm text-[#3977a6]">
                            Stay updated on applications, jobs, billing, and
                            system alerts
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={markAllRead}
                        className="rounded-lg border border-[#323981] px-4 py-2 text-sm font-semibold text-[#323981] transition-colors hover:bg-[#eeeffe]"
                    >
                        Mark All as Read
                    </button>
                </div>

                {unreadCount > 0 && (
                    <div className="rounded-xl border border-[#fed7aa] bg-[#fff7ed] px-4 py-3 text-sm font-semibold text-[#e57124]">
                        {unreadCount} unread notification
                        {unreadCount !== 1 ? 's' : ''}
                    </div>
                )}

                <div className="flex flex-wrap gap-2">
                    {FILTER_PILLS.map((pill) => {
                        const count =
                            pill.key === 'All'
                                ? filterCounts.All
                                : pill.key === 'Unread'
                                  ? filterCounts.Unread
                                  : notifications.filter(
                                        (n) => n.category === pill.key,
                                    ).length;

                        return (
                            <button
                                key={pill.key}
                                type="button"
                                onClick={() => setActiveFilter(pill.key)}
                                className={cn(
                                    'rounded-full px-4 py-1.5 text-xs font-semibold transition-colors',
                                    activeFilter === pill.key
                                        ? 'bg-[#0057c8] text-white'
                                        : 'bg-white text-[#6b7280] ring-1 ring-[#e8d5e8] hover:bg-[#f8faff]',
                                )}
                            >
                                {pill.label}({count})
                            </button>
                        );
                    })}
                </div>

                <div className="space-y-3">
                    {filteredNotifications.map((notification) => (
                        <div
                            key={notification.id}
                            className={cn(
                                'rounded-2xl border p-5 shadow-[0px_2px_4px_rgba(5,3,21,0.06)]',
                                notification.unread
                                    ? 'border-[#c5d9e8] bg-[#f8fbff]'
                                    : 'border-[#e8d5e8] bg-white',
                            )}
                        >
                            <div className="flex flex-wrap items-start justify-between gap-3">
                                <div className="flex items-start gap-3">
                                    {notification.unread && (
                                        <span className="mt-1.5 size-2 shrink-0 rounded-full bg-[#e57124]" />
                                    )}
                                    <div>
                                        <span
                                            className={cn(
                                                'inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold',
                                                CATEGORY_TONE[
                                                    notification.category
                                                ],
                                            )}
                                        >
                                            {notification.category}
                                        </span>
                                        <p className="mt-2 font-semibold text-[#050315]">
                                            {notification.title}
                                        </p>
                                        <p className="mt-1 text-sm text-[#6b7280]">
                                            {notification.detail}
                                        </p>
                                        <p className="mt-2 text-xs text-[#94a3b8]">
                                            {notification.time}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    {notification.unread && (
                                        <button
                                            type="button"
                                            onClick={() =>
                                                markAsRead(notification.id)
                                            }
                                            className="rounded-lg border border-[#323981] px-3 py-1.5 text-xs font-semibold text-[#323981] hover:bg-[#eeeffe]"
                                        >
                                            Mark as Read
                                        </button>
                                    )}
                                    <button
                                        type="button"
                                        onClick={() =>
                                            deleteNotification(notification.id)
                                        }
                                        className="inline-flex items-center gap-1 rounded-lg border border-[#dc2626] px-3 py-1.5 text-xs font-semibold text-[#dc2626] hover:bg-[#fef2f2]"
                                    >
                                        <Trash2 className="size-3.5" />
                                        Delete
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                    {filteredNotifications.length === 0 && (
                        <div className="rounded-2xl border border-[#e8d5e8] bg-white p-8 text-center shadow-[0px_2px_4px_rgba(5,3,21,0.06)]">
                            <p className="text-sm text-[#6b7280]">
                                No notifications in this category.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </EmployerLayout>
    );
}
