import { Head, router, useForm, usePage } from '@inertiajs/react';

import {
    AdminFilterChip,
    AdminPageHeader,
    AdminPanel,
    AdminPrimaryButton,
} from '@/components/admin-portal/ui';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import AdminPortalLayout from '@/layouts/admin-portal-layout';
import { cn } from '@/lib/utils';
import type { SharedData } from '@/types';

type NotificationRow = {
    id: string;
    title: string;
    message: string;
    category: string;
    read: boolean;
    created_at: string | null;
};

type Props = {
    notifications: NotificationRow[];
    unread: number;
    tab: string;
};

export default function AdminNotifications({
    notifications,
    unread,
    tab,
}: Props) {
    const { flash } = usePage<SharedData>().props;
    const form = useForm({
        audience: 'all',
        category: 'System',
        title: '',
        message: '',
    });

    return (
        <AdminPortalLayout>
            <Head title="Notifications" />

            <div className="space-y-6 p-6">
                <AdminPageHeader
                    title="Notifications"
                    subtitle="Compose platform notices and review your own inbox."
                    actions={
                        unread > 0 ? (
                            <AdminPrimaryButton
                                onClick={() =>
                                    router.post('/admin/notifications/read-all')
                                }
                            >
                                Mark all read
                            </AdminPrimaryButton>
                        ) : null
                    }
                />

                {flash.success && (
                    <div className="rounded-xl border border-[#bbf7d0] bg-[#f0fdf4] px-4 py-3 text-sm text-[#15803d]">
                        {typeof flash.success === 'string'
                            ? flash.success
                            : 'Saved successfully.'}
                    </div>
                )}

                <div className="grid gap-5 lg:grid-cols-[320px_1fr]">
                    <AdminPanel>
                        <h2 className="mb-4 text-base font-bold">Compose</h2>
                        <form
                            className="space-y-3"
                            onSubmit={(event) => {
                                event.preventDefault();
                                form.post('/admin/notifications', {
                                    onSuccess: () => form.reset(),
                                });
                            }}
                        >
                            <div>
                                <Label>Audience</Label>
                                <select
                                    className="mt-1 w-full rounded-xl border px-3 py-2 text-sm"
                                    value={form.data.audience}
                                    onChange={(event) =>
                                        form.setData(
                                            'audience',
                                            event.target.value,
                                        )
                                    }
                                >
                                    <option value="all">All users</option>
                                    <option value="employers">Employers</option>
                                    <option value="job_seekers">
                                        Job seekers
                                    </option>
                                </select>
                            </div>
                            <div>
                                <Label>Category</Label>
                                <Input
                                    value={form.data.category}
                                    onChange={(event) =>
                                        form.setData(
                                            'category',
                                            event.target.value,
                                        )
                                    }
                                />
                            </div>
                            <div>
                                <Label>Title</Label>
                                <Input
                                    value={form.data.title}
                                    onChange={(event) =>
                                        form.setData('title', event.target.value)
                                    }
                                />
                            </div>
                            <div>
                                <Label>Message</Label>
                                <Textarea
                                    value={form.data.message}
                                    onChange={(event) =>
                                        form.setData(
                                            'message',
                                            event.target.value,
                                        )
                                    }
                                />
                            </div>
                            <AdminPrimaryButton type="submit">
                                Send
                            </AdminPrimaryButton>
                        </form>
                    </AdminPanel>

                    <AdminPanel>
                        <div className="mb-4 flex gap-2">
                            <AdminFilterChip
                                label="All"
                                active={tab !== 'unread'}
                                onClick={() =>
                                    router.get('/admin/notifications')
                                }
                            />
                            <AdminFilterChip
                                label={`Unread (${unread})`}
                                active={tab === 'unread'}
                                onClick={() =>
                                    router.get('/admin/notifications', {
                                        tab: 'unread',
                                    })
                                }
                            />
                        </div>
                        <div className="space-y-3">
                            {notifications.map((item) => (
                                <button
                                    key={item.id}
                                    type="button"
                                    className={cn(
                                        'w-full rounded-xl border p-4 text-left',
                                        item.read
                                            ? 'border-[#e2e8f0] bg-white'
                                            : 'border-[#bfdbfe] bg-[#eff6ff]',
                                    )}
                                    onClick={() => {
                                        if (!item.read) {
                                            router.post(
                                                `/admin/notifications/${item.id}/read`,
                                            );
                                        }
                                    }}
                                >
                                    <p className="text-sm font-bold text-[#050315]">
                                        {item.title}
                                    </p>
                                    <p className="mt-1 text-sm text-[#64748b]">
                                        {item.message}
                                    </p>
                                    <p className="mt-2 text-xs text-[#99a1af]">
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
                    </AdminPanel>
                </div>
            </div>
        </AdminPortalLayout>
    );
}
