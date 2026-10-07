import { Head, router, usePage } from '@inertiajs/react';
import { CheckCheck, MailOpen, Trash2 } from 'lucide-react';

import {
    AdminFilterChip,
    AdminPageHeader,
    AdminPanel,
    AdminPrimaryButton,
    AdminSecondaryButton,
    AdminStatusBadge,
} from '@/components/admin-portal/ui';
import { useLocale } from '@/hooks/use-locale';
import AdminPortalLayout from '@/layouts/admin-portal-layout';
import { cn } from '@/lib/utils';
import type { SharedData } from '@/types';

type ContactMessageRow = {
    id: number;
    name: string;
    email: string;
    phone: string | null;
    message: string;
    read: boolean;
    created_at: string | null;
    created_at_exact: string | null;
};

type Props = {
    messages: ContactMessageRow[];
    unread: number;
    tab: string;
};

export default function ContactMessages({ messages, unread, tab }: Props) {
    const { flash } = usePage<SharedData>().props;
    const { t } = useLocale();

    return (
        <AdminPortalLayout>
            <Head title={t('admin.contact_messages.title')} />

            <div className="space-y-6 p-6">
                <AdminPageHeader
                    title={t('admin.contact_messages.title')}
                    subtitle={t('admin.contact_messages.subtitle')}
                    actions={
                        unread > 0 ? (
                            <AdminPrimaryButton
                                onClick={() =>
                                    router.post(
                                        '/admin/contact-messages/read-all',
                                    )
                                }
                            >
                                <CheckCheck className="size-4" />
                                {t('admin.contact_messages.mark_all_read')}
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

                <div className="flex flex-wrap gap-2">
                    <AdminFilterChip
                        active={tab === 'all'}
                        label={t('admin.contact_messages.tab_all')}
                        onClick={() =>
                            router.get('/admin/contact-messages', {
                                tab: 'all',
                            })
                        }
                    />
                    <AdminFilterChip
                        active={tab === 'unread'}
                        label={`${t('admin.contact_messages.tab_unread')}${unread > 0 ? ` (${unread})` : ''}`}
                        onClick={() =>
                            router.get('/admin/contact-messages', {
                                tab: 'unread',
                            })
                        }
                    />
                </div>

                <div className="space-y-3">
                    {messages.length === 0 ? (
                        <AdminPanel className="px-4 py-10 text-center text-sm text-[#64748b]">
                            {t('admin.contact_messages.empty')}
                        </AdminPanel>
                    ) : (
                        messages.map((message) => (
                            <AdminPanel
                                key={message.id}
                                className={cn(
                                    'space-y-3 p-4',
                                    !message.read && 'border-[#bfdbfe] bg-[#f8fbff]',
                                )}
                            >
                                <div className="flex flex-wrap items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <p className="text-base font-bold text-[#050315]">
                                                {message.name}
                                            </p>
                                            <AdminStatusBadge
                                                tone={
                                                    message.read
                                                        ? 'neutral'
                                                        : 'info'
                                                }
                                                label={
                                                    message.read
                                                        ? t(
                                                              'admin.contact_messages.read',
                                                          )
                                                        : t(
                                                              'admin.contact_messages.unread',
                                                          )
                                                }
                                            />
                                        </div>
                                        <p className="mt-1 text-sm text-[#64748b]">
                                            <a
                                                href={`mailto:${message.email}`}
                                                className="font-semibold text-[#0057c8] hover:underline"
                                            >
                                                {message.email}
                                            </a>
                                            {message.phone
                                                ? ` · ${message.phone}`
                                                : ''}
                                        </p>
                                        <p className="mt-1 text-xs text-[#94a3b8]">
                                            {message.created_at_exact ||
                                                message.created_at}
                                        </p>
                                    </div>

                                    <div className="flex flex-wrap gap-2">
                                        {!message.read ? (
                                            <AdminSecondaryButton
                                                onClick={() =>
                                                    router.post(
                                                        `/admin/contact-messages/${message.id}/read`,
                                                    )
                                                }
                                            >
                                                <MailOpen className="size-4" />
                                                {t(
                                                    'admin.contact_messages.mark_read',
                                                )}
                                            </AdminSecondaryButton>
                                        ) : null}
                                        <AdminSecondaryButton
                                            onClick={() => {
                                                if (
                                                    window.confirm(
                                                        t(
                                                            'admin.contact_messages.delete_confirm',
                                                        ),
                                                    )
                                                ) {
                                                    router.delete(
                                                        `/admin/contact-messages/${message.id}`,
                                                    );
                                                }
                                            }}
                                        >
                                            <Trash2 className="size-4 text-[#b91c1c]" />
                                            {t('common.delete')}
                                        </AdminSecondaryButton>
                                    </div>
                                </div>

                                <p className="whitespace-pre-wrap text-sm leading-6 text-[#334155]">
                                    {message.message}
                                </p>
                            </AdminPanel>
                        ))
                    )}
                </div>
            </div>
        </AdminPortalLayout>
    );
}
