import { Head } from '@inertiajs/react';
import {
    Calendar,
    FileText,
    Lightbulb,
    Settings,
} from 'lucide-react';
import { useMemo, useState } from 'react';

import {
    NOTIFICATIONS,
    type NotificationCategory,
} from '@/components/job-seeker/demo-data';
import { Button } from '@/components/ui/button';
import JobSeekerLayout from '@/layouts/job-seeker-layout';
import { cn } from '@/lib/utils';

const filters = [
    'All',
    'Unread',
    'Applications',
    'Interviews',
    'Recommendations',
    'System',
] as const;

const categoryStyles: Record<
    NotificationCategory,
    { badge: string; icon: typeof Calendar; iconBg: string }
> = {
    Interview: {
        badge: 'bg-[#f0fdf4] text-[#15803d]',
        icon: Calendar,
        iconBg: 'bg-[#dcfce7] text-[#15803d]',
    },
    Application: {
        badge: 'bg-[#eff6ff] text-[#1d4ed8]',
        icon: FileText,
        iconBg: 'bg-[#dbeafe] text-[#1d4ed8]',
    },
    Recommendation: {
        badge: 'bg-[#fdf4ff] text-[#7e22ce]',
        icon: Lightbulb,
        iconBg: 'bg-[#f3e8ff] text-[#7e22ce]',
    },
    System: {
        badge: 'bg-[#f1f5f9] text-[#64748b]',
        icon: Settings,
        iconBg: 'bg-[#e2e8f0] text-[#64748b]',
    },
};

export default function JobSeekerNotifications() {
    const [filter, setFilter] = useState<(typeof filters)[number]>('All');
    const [items, setItems] = useState(NOTIFICATIONS);

    const unreadCount = items.filter((item) => item.unread).length;

    const filtered = useMemo(() => {
        switch (filter) {
            case 'Unread':
                return items.filter((item) => item.unread);
            case 'Applications':
                return items.filter((item) => item.category === 'Application');
            case 'Interviews':
                return items.filter((item) => item.category === 'Interview');
            case 'Recommendations':
                return items.filter(
                    (item) => item.category === 'Recommendation',
                );
            case 'System':
                return items.filter((item) => item.category === 'System');
            default:
                return items;
        }
    }, [filter, items]);

    const counts = {
        All: items.length,
        Unread: unreadCount,
        Applications: items.filter((item) => item.category === 'Application')
            .length,
        Interviews: items.filter((item) => item.category === 'Interview')
            .length,
        Recommendations: items.filter(
            (item) => item.category === 'Recommendation',
        ).length,
        System: items.filter((item) => item.category === 'System').length,
    };

    return (
        <JobSeekerLayout title="Notifications" unreadCount={unreadCount}>
            <Head title="Notifications" />

            <div className="space-y-6 p-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-extrabold text-[#1e3a8a]">
                            Notifications
                        </h1>
                        <p className="mt-1 text-sm text-[#6a7282]">
                            Stay updated with your job applications and
                            opportunities.
                        </p>
                    </div>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() =>
                            setItems((current) =>
                                current.map((item) => ({
                                    ...item,
                                    unread: false,
                                })),
                            )
                        }
                        className="rounded-xl border-[#e2e8f0] text-[#1e3a8a]"
                    >
                        Mark All as Read
                    </Button>
                </div>

                {unreadCount > 0 && (
                    <div className="rounded-xl bg-[#eff6ff] px-4 py-3 text-sm font-medium text-[#1d4ed8]">
                        • {unreadCount} unread notification
                        {unreadCount === 1 ? '' : 's'}
                    </div>
                )}

                <div className="flex flex-wrap gap-2">
                    {filters.map((item) => (
                        <button
                            key={item}
                            type="button"
                            onClick={() => setFilter(item)}
                            className={cn(
                                'rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors',
                                filter === item
                                    ? 'bg-[#0057c8] text-white'
                                    : 'bg-white text-[#3977a6] ring-1 ring-[#e2e8f0] hover:bg-[#f8faff]',
                            )}
                        >
                            {item} ({counts[item]})
                        </button>
                    ))}
                </div>

                <div className="space-y-3">
                    {filtered.map((notification) => {
                        const style = categoryStyles[notification.category];
                        const Icon = style.icon;

                        return (
                            <div
                                key={notification.id}
                                className={cn(
                                    'rounded-2xl border border-[#e2e8f0] bg-white p-5 shadow-[0px_1px_3px_rgba(0,0,0,0.06)]',
                                    notification.unread && 'bg-[#f8fbff]',
                                )}
                            >
                                <div className="flex gap-4">
                                    <div
                                        className={cn(
                                            'flex size-10 shrink-0 items-center justify-center rounded-xl',
                                            style.iconBg,
                                        )}
                                    >
                                        <Icon className="size-5" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-start justify-between gap-3">
                                            <div>
                                                <h2 className="text-sm font-bold text-[#101828]">
                                                    {notification.title}
                                                </h2>
                                                <p className="mt-1 text-sm text-[#6a7282]">
                                                    {notification.body}
                                                </p>
                                                <div className="mt-2 flex flex-wrap items-center gap-2">
                                                    <span className="text-xs text-[#99a1af]">
                                                        {notification.time}
                                                    </span>
                                                    <span
                                                        className={cn(
                                                            'rounded-full px-2.5 py-0.5 text-xs font-semibold',
                                                            style.badge,
                                                        )}
                                                    >
                                                        {notification.category}
                                                    </span>
                                                </div>
                                            </div>
                                            {notification.unread && (
                                                <span className="mt-1 size-2 shrink-0 rounded-full bg-[#0057c8]" />
                                            )}
                                        </div>
                                        <div className="mt-3 flex flex-wrap gap-3">
                                            {notification.unread && (
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setItems((current) =>
                                                            current.map(
                                                                (item) =>
                                                                    item.id ===
                                                                    notification.id
                                                                        ? {
                                                                              ...item,
                                                                              unread: false,
                                                                          }
                                                                        : item,
                                                            ),
                                                        )
                                                    }
                                                    className="text-xs font-semibold text-[#0057c8]"
                                                >
                                                    Mark as Read
                                                </button>
                                            )}
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setItems((current) =>
                                                        current.filter(
                                                            (item) =>
                                                                item.id !==
                                                                notification.id,
                                                        ),
                                                    )
                                                }
                                                className="text-xs font-semibold text-[#ef4444]"
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </JobSeekerLayout>
    );
}
