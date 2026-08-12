import { Head } from '@inertiajs/react';
import {
    AlertTriangle,
    Bell,
    CreditCard,
    Megaphone,
    Send,
    ShieldCheck,
    Users,
} from 'lucide-react';
import { useMemo, useState } from 'react';

import {
    AdminFilterChip,
    AdminPageHeader,
    AdminPanel,
    AdminPrimaryButton,
    AdminSecondaryButton,
    AdminStatusBadge,
} from '@/components/admin-portal/ui';
import AdminPortalLayout from '@/layouts/admin-portal-layout';
import { cn } from '@/lib/utils';

const tabs = ['All', 'Unread', 'Alerts'] as const;

const notifications = [
    {
        id: 1,
        title: 'New employer verification pending',
        message:
            'Gulf Construction Co. submitted documents for review. Priority: High.',
        category: 'Verification',
        categoryTone: 'warning' as const,
        time: '12 min ago',
        unread: true,
    },
    {
        id: 2,
        title: 'Payment failed — Nova Retail LLC',
        message:
            'Credit card payment of AED 299 for Starter package was declined.',
        category: 'Payment',
        categoryTone: 'danger' as const,
        time: '45 min ago',
        unread: true,
    },
    {
        id: 3,
        title: 'Monthly revenue target reached',
        message:
            'Platform monthly revenue has exceeded AED 130K for March 2024.',
        category: 'Revenue',
        categoryTone: 'success' as const,
        time: '2 hours ago',
        unread: false,
    },
    {
        id: 4,
        title: '12 jobs pending approval',
        message:
            'New job listings are awaiting admin review in the moderation queue.',
        category: 'Jobs',
        categoryTone: 'info' as const,
        time: '3 hours ago',
        unread: true,
    },
    {
        id: 5,
        title: 'System maintenance scheduled',
        message:
            'Planned maintenance window on March 15, 2024 from 02:00–04:00 GST.',
        category: 'System',
        categoryTone: 'neutral' as const,
        time: 'Yesterday',
        unread: false,
    },
    {
        id: 6,
        title: 'New admin account created',
        message:
            'Super Admin created a new admin account for Sarah Mitchell.',
        category: 'Admin',
        categoryTone: 'purple' as const,
        time: 'Yesterday',
        unread: false,
    },
];

const categoryIcons: Record<string, typeof Bell> = {
    Verification: ShieldCheck,
    Payment: CreditCard,
    Revenue: Megaphone,
    Jobs: Users,
    System: AlertTriangle,
    Admin: Bell,
};

export default function AdminNotifications() {
    const [activeTab, setActiveTab] = useState<(typeof tabs)[number]>('All');
    const [recipient, setRecipient] = useState('All Users');
    const [type, setType] = useState('Announcement');
    const [title, setTitle] = useState('');
    const [message, setMessage] = useState('');

    const filteredNotifications = useMemo(() => {
        if (activeTab === 'Unread') {
            return notifications.filter((n) => n.unread);
        }
        if (activeTab === 'Alerts') {
            return notifications.filter(
                (n) =>
                    n.categoryTone === 'danger' ||
                    n.categoryTone === 'warning',
            );
        }
        return notifications;
    }, [activeTab]);

    return (
        <AdminPortalLayout>
            <Head title="Notifications" />

            <div className="space-y-6 p-6">
                <AdminPageHeader
                    title="Notifications"
                    subtitle="Manage platform-wide notifications and announcements."
                    actions={
                        <AdminPrimaryButton>
                            <Send className="size-4" />
                            Send Notification
                        </AdminPrimaryButton>
                    }
                />

                <div className="flex flex-wrap gap-2">
                    {tabs.map((tab) => (
                        <AdminFilterChip
                            key={tab}
                            label={tab}
                            active={activeTab === tab}
                            onClick={() => setActiveTab(tab)}
                        />
                    ))}
                </div>

                <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
                    <AdminPanel className="space-y-3">
                        <h2 className="text-base font-bold text-[#050315]">
                            Notification Feed
                        </h2>
                        {filteredNotifications.map((notification) => {
                            const Icon =
                                categoryIcons[notification.category] ?? Bell;

                            return (
                                <div
                                    key={notification.id}
                                    className={cn(
                                        'flex gap-3 rounded-xl border p-4 transition-colors',
                                        notification.unread
                                            ? 'border-[#dbeafe] bg-[#f8faff]'
                                            : 'border-[#e2e8f0] bg-white',
                                    )}
                                >
                                    {notification.unread && (
                                        <span className="mt-2 size-2 shrink-0 rounded-full bg-[#0057c8]" />
                                    )}
                                    {!notification.unread && (
                                        <span className="mt-2 size-2 shrink-0" />
                                    )}
                                    <div
                                        className={cn(
                                            'flex size-9 shrink-0 items-center justify-center rounded-lg',
                                            notification.categoryTone ===
                                                'danger' &&
                                                'bg-[#fee2e2] text-[#991b1b]',
                                            notification.categoryTone ===
                                                'warning' &&
                                                'bg-[#fef3c7] text-[#92400e]',
                                            notification.categoryTone ===
                                                'success' &&
                                                'bg-[#d1fae5] text-[#065f46]',
                                            notification.categoryTone ===
                                                'info' &&
                                                'bg-[#dbeafe] text-[#1d4ed8]',
                                            notification.categoryTone ===
                                                'neutral' &&
                                                'bg-[#f1f5f9] text-[#475569]',
                                            notification.categoryTone ===
                                                'purple' &&
                                                'bg-[#ede9fe] text-[#6d28d9]',
                                        )}
                                    >
                                        <Icon className="size-4" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <h3 className="text-sm font-bold text-[#050315]">
                                                {notification.title}
                                            </h3>
                                            <AdminStatusBadge
                                                label={notification.category}
                                                tone={
                                                    notification.categoryTone
                                                }
                                            />
                                        </div>
                                        <p className="mt-1 text-sm text-[#64748b]">
                                            {notification.message}
                                        </p>
                                        <p className="mt-1 text-xs text-[#94a3b8]">
                                            {notification.time}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                    </AdminPanel>

                    <AdminPanel>
                        <h2 className="mb-4 text-base font-bold text-[#050315]">
                            Compose Notification
                        </h2>
                        <div className="space-y-4">
                            <div>
                                <label className="mb-1.5 block text-xs font-semibold text-[#3977a6]">
                                    Recipients
                                </label>
                                <select
                                    value={recipient}
                                    onChange={(event) =>
                                        setRecipient(event.target.value)
                                    }
                                    className="w-full rounded-xl border border-[#e2e8f0] bg-[#f8faff] px-3 py-2.5 text-sm text-[#050315] outline-none focus:border-[#0057c8]"
                                >
                                    <option>All Users</option>
                                    <option>Employers Only</option>
                                    <option>Job Seekers Only</option>
                                    <option>Admins Only</option>
                                </select>
                            </div>
                            <div>
                                <label className="mb-1.5 block text-xs font-semibold text-[#3977a6]">
                                    Type
                                </label>
                                <select
                                    value={type}
                                    onChange={(event) =>
                                        setType(event.target.value)
                                    }
                                    className="w-full rounded-xl border border-[#e2e8f0] bg-[#f8faff] px-3 py-2.5 text-sm text-[#050315] outline-none focus:border-[#0057c8]"
                                >
                                    <option>Announcement</option>
                                    <option>Alert</option>
                                    <option>System Update</option>
                                    <option>Promotional</option>
                                </select>
                            </div>
                            <div>
                                <label className="mb-1.5 block text-xs font-semibold text-[#3977a6]">
                                    Title
                                </label>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={(event) =>
                                        setTitle(event.target.value)
                                    }
                                    placeholder="Notification title..."
                                    className="w-full rounded-xl border border-[#e2e8f0] bg-[#f8faff] px-3 py-2.5 text-sm text-[#050315] outline-none focus:border-[#0057c8]"
                                />
                            </div>
                            <div>
                                <label className="mb-1.5 block text-xs font-semibold text-[#3977a6]">
                                    Message
                                </label>
                                <textarea
                                    value={message}
                                    onChange={(event) =>
                                        setMessage(event.target.value)
                                    }
                                    placeholder="Write your message..."
                                    rows={4}
                                    className="w-full resize-none rounded-xl border border-[#e2e8f0] bg-[#f8faff] px-3 py-2.5 text-sm text-[#050315] outline-none focus:border-[#0057c8]"
                                />
                            </div>

                            {(title || message) && (
                                <div className="rounded-xl border border-[#e2e8f0] bg-[#f8faff] p-4">
                                    <p className="text-xs font-semibold text-[#3977a6]">
                                        Preview
                                    </p>
                                    <p className="mt-1 text-sm font-bold text-[#050315]">
                                        {title || 'Notification Title'}
                                    </p>
                                    <p className="mt-1 text-sm text-[#64748b]">
                                        {message ||
                                            'Your message will appear here...'}
                                    </p>
                                </div>
                            )}

                            <div className="flex gap-2">
                                <AdminPrimaryButton className="flex-1">
                                    <Send className="size-4" />
                                    Send
                                </AdminPrimaryButton>
                                <AdminSecondaryButton
                                    onClick={() => {
                                        setTitle('');
                                        setMessage('');
                                    }}
                                >
                                    Clear
                                </AdminSecondaryButton>
                            </div>
                        </div>
                    </AdminPanel>
                </div>
            </div>
        </AdminPortalLayout>
    );
}
