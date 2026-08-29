import { Head, router, useForm, usePage } from '@inertiajs/react';

import {
    AdminFilterChip,
    AdminPageHeader,
    AdminPanel,
    AdminPrimaryButton,
} from '@/components/admin-portal/ui';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { NativeSelect } from '@/components/ui/native-select';
import { Textarea } from '@/components/ui/textarea';
import { useLocale } from '@/hooks/use-locale';
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
    const { t } = useLocale();
    const form = useForm({
        audience: 'all',
        category: 'System',
        title: '',
        message: '',
    });

    return (
        <AdminPortalLayout>
            <Head title={t('admin.notifications.title')} />

            <div className="space-y-6 p-6">
                <AdminPageHeader
                    title={t('admin.notifications.title')}
                    subtitle={t('admin.notifications.subtitle')}
                    actions={
                        unread > 0 ? (
                            <AdminPrimaryButton
                                onClick={() =>
                                    router.post('/admin/notifications/read-all')
                                }
                            >
                                {t('admin.notifications.mark_all_read')}
                            </AdminPrimaryButton>
                        ) : null
                    }
                />

                {flash.success && (
                    <div className="rounded-xl border border-[#bbf7d0] bg-[#f0fdf4] px-4 py-3 text-sm text-[#15803d]">
                        {typeof flash.success === 'string'
                            ? flash.success
                            : t('common.saved')}
                    </div>
                )}

                <div className="grid gap-5 lg:grid-cols-[320px_1fr]">
                    <AdminPanel>
                        <h2 className="mb-4 text-base font-bold">
                            {t('admin.notifications.compose')}
                        </h2>
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
                                <Label>{t('admin.notifications.audience')}</Label>
                                <NativeSelect
                                    className="mt-1 w-full rounded-xl border px-3 py-2 text-sm"
                                    value={form.data.audience}
                                    onChange={(event) =>
                                        form.setData(
                                            'audience',
                                            event.target.value,
                                        )
                                    }
                                >
                                    <option value="all">{t('admin.notifications.all_users')}</option>
                                    <option value="employers">{t('admin.notifications.employers')}</option>
                                    <option value="job_seekers">
                                        {t('admin.notifications.job_seekers')}
                                    </option>
                                </NativeSelect>
                            </div>
                            <div>
                                <Label>{t('admin.notifications.category')}</Label>
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
                                <Label>
                                    {t('admin.notifications.notification_title')}
                                </Label>
                                <Input
                                    value={form.data.title}
                                    onChange={(event) =>
                                        form.setData('title', event.target.value)
                                    }
                                />
                            </div>
                            <div>
                                <Label>{t('admin.notifications.message')}</Label>
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
                                {t('common.send')}
                            </AdminPrimaryButton>
                        </form>
                    </AdminPanel>

                    <AdminPanel>
                        <div className="mb-4 flex gap-2">
                            <AdminFilterChip
                                label={t('common.all')}
                                active={tab !== 'unread'}
                                onClick={() =>
                                    router.get('/admin/notifications')
                                }
                            />
                            <AdminFilterChip
                                label={t('admin.notifications.unread', {
                                    count: unread,
                                })}
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
                                    {t('admin.notifications.empty')}
                                </p>
                            )}
                        </div>
                    </AdminPanel>
                </div>
            </div>
        </AdminPortalLayout>
    );
}
