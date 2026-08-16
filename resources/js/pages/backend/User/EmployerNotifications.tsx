import { Head, router, usePage } from '@inertiajs/react';
import { useMemo, useState } from 'react';

import EmployerLayout from '@/layouts/employer-layout';
import { cn } from '@/lib/utils';
import type { SharedData } from '@/types';

type NotificationRow = {
    id: string;
    title: string;
    message: string;
    category: string;
    category_key: string;
    read: boolean;
    created_at: string | null;
};

type FilterId =
    | 'all'
    | 'unread'
    | 'applications'
    | 'jobs'
    | 'billing'
    | 'system';

const categoryStyle: Record<
    string,
    { icon: string; iconBox: string; tag: string }
> = {
    applications: {
        icon: '📋',
        iconBox: 'bg-[#eeeffe]',
        tag: 'bg-[#eeeffe] text-[#0057c8]',
    },
    jobs: {
        icon: '💼',
        iconBox: 'bg-[#fff7ed]',
        tag: 'bg-[#fff7ed] text-[#c2410c]',
    },
    billing: {
        icon: '💳',
        iconBox: 'bg-[#f0fdf4]',
        tag: 'bg-[#f0fdf4] text-[#15803d]',
    },
    verification: {
        icon: '✅',
        iconBox: 'bg-[#dcfce7]',
        tag: 'bg-[#dcfce7] text-[#166534]',
    },
    system: {
        icon: '⚙️',
        iconBox: 'bg-[#f1f5f9]',
        tag: 'bg-[#f1f5f9] text-[#475569]',
    },
};

const actionClass =
    'inline-flex h-[31px] cursor-pointer items-center justify-center rounded-lg px-3 text-xs font-semibold';

export default function EmployerNotifications({
    notifications,
    unread,
}: {
    notifications: NotificationRow[];
    unread: number;
}) {
    const { flash } = usePage<SharedData>().props;
    const [filter, setFilter] = useState<FilterId>('all');

    const counts = useMemo(
        () => ({
            all: notifications.length,
            unread: notifications.filter((item) => !item.read).length,
            applications: notifications.filter(
                (item) => item.category_key === 'applications',
            ).length,
            jobs: notifications.filter((item) => item.category_key === 'jobs')
                .length,
            billing: notifications.filter(
                (item) => item.category_key === 'billing',
            ).length,
            system: notifications.filter(
                (item) => item.category_key === 'system',
            ).length,
        }),
        [notifications],
    );

    const filtered = useMemo(() => {
        return notifications.filter((item) => {
            if (filter === 'all') {
                return true;
            }

            if (filter === 'unread') {
                return !item.read;
            }

            return item.category_key === filter;
        });
    }, [notifications, filter]);

    const filters: { id: FilterId; label: string; count: number }[] = [
        { id: 'all', label: 'All', count: counts.all },
        { id: 'unread', label: 'Unread', count: counts.unread },
        {
            id: 'applications',
            label: 'Applications',
            count: counts.applications,
        },
        { id: 'jobs', label: 'Jobs', count: counts.jobs },
        { id: 'billing', label: 'Billing', count: counts.billing },
        { id: 'system', label: 'System', count: counts.system },
    ];

    return (
        <EmployerLayout title="Notifications" unreadCount={unread}>
            <Head title="Notifications" />

            <div className="flex flex-col px-6 py-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                        <h1 className="text-2xl leading-9 font-extrabold text-[#050315]">
                            Notifications
                        </h1>
                        <p className="pt-1 text-sm leading-[21px] text-[#6b7280]">
                            Stay updated with applications, jobs, and account
                            activity.
                        </p>
                    </div>
                    <button
                        type="button"
                        className="cursor-pointer rounded-xl border border-[#e8d5e8] bg-white px-4 py-2 text-[13.6px] font-semibold text-[#0057c8]"
                        onClick={() =>
                            router.post('/employer/notifications/read-all')
                        }
                        disabled={unread === 0}
                    >
                        Mark All as Read
                    </button>
                </div>

                {flash.success && (
                    <div className="mt-5 rounded-xl border border-[#bbf7d0] bg-[#f0fdf4] px-4 py-3 text-sm text-[#15803d]">
                        {typeof flash.success === 'string'
                            ? flash.success
                            : 'Saved successfully.'}
                    </div>
                )}

                {unread > 0 && (
                    <div className="mt-5 flex h-[43px] items-center gap-2 rounded-xl border border-[#fed7aa] bg-[#fff7ed] px-4">
                        <span className="size-2 rounded bg-[#e57124]" />
                        <p className="text-sm font-semibold text-[#e57124]">
                            {unread} unread{' '}
                            {unread === 1 ? 'notification' : 'notifications'}
                        </p>
                    </div>
                )}

                <div className="flex flex-wrap gap-2 pt-4">
                    {filters.map((item) => {
                        const active = filter === item.id;

                        return (
                            <button
                                key={item.id}
                                type="button"
                                onClick={() => setFilter(item.id)}
                                className={cn(
                                    'inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-full border px-3 text-[12.48px] font-semibold',
                                    active
                                        ? 'border-[#3977a6] bg-[#0057c8] text-white'
                                        : 'border-[#e5e7eb] bg-white text-[#374151]',
                                )}
                            >
                                {item.label}
                                <span
                                    className={cn(
                                        'inline-flex size-4 items-center justify-center rounded-lg text-[10px] font-bold',
                                        active
                                            ? 'bg-white/25 text-white'
                                            : 'bg-[#f1f5f9] text-[#374151]',
                                    )}
                                >
                                    {item.count}
                                </span>
                            </button>
                        );
                    })}
                </div>

                <div className="flex flex-col gap-2 pt-4">
                    {filtered.map((item) => {
                        const style =
                            categoryStyle[item.category_key] ??
                            categoryStyle.system;

                        return (
                            <div
                                key={item.id}
                                className={cn(
                                    'rounded-2xl border p-4 shadow-[0px_2px_4px_rgba(5,3,21,0.06)]',
                                    item.read
                                        ? 'border-[#e8d5e8] bg-white'
                                        : 'border-[#c5d9e8] bg-[#f8fbff]',
                                )}
                            >
                                <div className="flex items-start gap-4">
                                    <div
                                        className={cn(
                                            'flex size-10 shrink-0 items-center justify-center rounded-xl text-xl',
                                            style.iconBox,
                                        )}
                                    >
                                        {style.icon}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-start justify-between gap-3">
                                            <p className="text-sm font-bold text-[#050315]">
                                                {item.title}
                                            </p>
                                            {!item.read && (
                                                <span className="mt-0.5 size-2.5 shrink-0 rounded-[5px] bg-[#e57124]" />
                                            )}
                                        </div>
                                        <p className="pt-1 text-[13.6px] leading-[20.4px] text-[#6b7280]">
                                            {item.message}
                                        </p>
                                        <div className="flex flex-wrap items-center gap-3 pt-2">
                                            <p className="text-xs text-[#9ca3af]">
                                                {item.created_at}
                                            </p>
                                            <span
                                                className={cn(
                                                    'rounded-full px-2 py-0.5 text-[11.52px] font-semibold',
                                                    style.tag,
                                                )}
                                            >
                                                {item.category}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-2 pt-3 pl-14">
                                    {!item.read && (
                                        <button
                                            type="button"
                                            className={cn(
                                                actionClass,
                                                'border border-[#e5e7eb] bg-white text-[#374151]',
                                            )}
                                            onClick={() =>
                                                router.post(
                                                    `/employer/notifications/${item.id}/read`,
                                                )
                                            }
                                        >
                                            Mark as Read
                                        </button>
                                    )}
                                    <button
                                        type="button"
                                        className={cn(
                                            actionClass,
                                            'border border-[#fecaca] bg-white text-[#dc2626]',
                                        )}
                                        onClick={() =>
                                            router.delete(
                                                `/employer/notifications/${item.id}`,
                                            )
                                        }
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                    {filtered.length === 0 && (
                        <p className="rounded-2xl border border-dashed p-10 text-center text-sm text-[#99a1af]">
                            No notifications yet.
                        </p>
                    )}
                </div>
            </div>
        </EmployerLayout>
    );
}
