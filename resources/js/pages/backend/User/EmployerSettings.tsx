import { Head, useForm, usePage } from '@inertiajs/react';
import { useState } from 'react';

import EmployerLayout from '@/layouts/employer-layout';
import { cn } from '@/lib/utils';
import type { SharedData } from '@/types';

type SettingsTab =
    | 'account'
    | 'notifications'
    | 'privacy'
    | 'language'
    | 'danger';

const TABS: { id: SettingsTab; label: string; danger?: boolean }[] = [
    { id: 'account', label: 'Account' },
    { id: 'notifications', label: 'Notifications' },
    { id: 'privacy', label: 'Privacy' },
    { id: 'language', label: 'Language' },
    { id: 'danger', label: 'Danger Zone', danger: true },
];

export default function EmployerSettings({
    profile,
}: {
    profile: { name: string | null; email: string | null; company_name: string | null };
}) {
    const { auth, flash } = usePage<SharedData>().props;
    const [activeTab, setActiveTab] = useState<SettingsTab>('account');
    const accountForm = useForm({
        name: profile?.name || auth.user.name,
        email: profile?.email || auth.user.email,
        company_name: profile?.company_name || auth.user.company_name || '',
        contact_name: profile?.name || auth.user.name,
    });
    const passwordForm = useForm({
        current_password: '',
        password: '',
        password_confirmation: '',
    });
    const [emailAlerts, setEmailAlerts] = useState(true);
    const [applicationAlerts, setApplicationAlerts] = useState(true);
    const [billingAlerts, setBillingAlerts] = useState(false);
    const [profileVisible, setProfileVisible] = useState(true);
    const [language, setLanguage] = useState('en');

    return (
        <EmployerLayout title="Settings">
            <Head title="Settings" />

            <div className="space-y-6 px-4 py-6 sm:px-6">
                <div>
                    <h1 className="text-[28px] font-extrabold tracking-tight text-[#050315]">
                        Settings
                    </h1>
                    <p className="mt-1 text-sm text-[#3977a6]">
                        Manage your account preferences and portal configuration
                    </p>
                </div>

                <div className="flex flex-col gap-6 lg:flex-row">
                    <nav className="flex shrink-0 flex-row gap-1 overflow-x-auto lg:w-52 lg:flex-col lg:gap-0.5">
                        {TABS.map((tab) => (
                            <button
                                key={tab.id}
                                type="button"
                                onClick={() => setActiveTab(tab.id)}
                                className={cn(
                                    'whitespace-nowrap rounded-xl px-4 py-3 text-left text-sm font-medium transition-colors',
                                    activeTab === tab.id
                                        ? tab.danger
                                            ? 'bg-[#fef2f2] text-[#ef4444]'
                                            : 'bg-[#0057c8] text-white'
                                        : tab.danger
                                          ? 'text-[#ef4444] hover:bg-[#fef2f2]'
                                          : 'text-[#3977a6] hover:bg-white',
                                )}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </nav>

                    <div className="min-w-0 flex-1 rounded-2xl border border-[#e8d5e8] bg-white p-6 shadow-[0px_2px_4px_rgba(5,3,21,0.06)]">
                        {activeTab === 'account' && (
                            <div className="space-y-8">
                                {flash.success && (
                                    <div className="rounded-xl border border-[#bbf7d0] bg-[#f0fdf4] px-4 py-3 text-sm text-[#15803d]">
                                        {typeof flash.success === 'string'
                                            ? flash.success
                                            : 'Saved successfully.'}
                                    </div>
                                )}
                                <form
                                    className="space-y-4"
                                    onSubmit={(event) => {
                                        event.preventDefault();
                                        accountForm.put('/employer/profile');
                                    }}
                                >
                                    <h2 className="text-base font-bold text-[#050315]">
                                        Account Information
                                    </h2>
                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <label className="block">
                                            <span className="text-xs font-medium text-[#6b7280]">
                                                Contact Name
                                            </span>
                                            <input
                                                type="text"
                                                value={accountForm.data.name}
                                                onChange={(event) =>
                                                    accountForm.setData(
                                                        'name',
                                                        event.target.value,
                                                    )
                                                }
                                                className="mt-1 w-full rounded-lg border border-[#e8d5e8] bg-[#f8faff] px-3 py-2 text-sm"
                                            />
                                        </label>
                                        <label className="block">
                                            <span className="text-xs font-medium text-[#6b7280]">
                                                Email
                                            </span>
                                            <input
                                                type="email"
                                                value={accountForm.data.email}
                                                onChange={(event) =>
                                                    accountForm.setData(
                                                        'email',
                                                        event.target.value,
                                                    )
                                                }
                                                className="mt-1 w-full rounded-lg border border-[#e8d5e8] bg-[#f8faff] px-3 py-2 text-sm"
                                            />
                                        </label>
                                    </div>
                                    <button
                                        type="submit"
                                        className="rounded-lg bg-[#0057c8] px-6 py-2.5 text-sm font-semibold text-white"
                                        disabled={accountForm.processing}
                                    >
                                        Save Changes
                                    </button>
                                </form>
                                <form
                                    className="space-y-4"
                                    onSubmit={(event) => {
                                        event.preventDefault();
                                        passwordForm.put('/settings/password', {
                                            onSuccess: () =>
                                                passwordForm.reset(),
                                        });
                                    }}
                                >
                                    <h2 className="text-base font-bold text-[#050315]">
                                        Change Password
                                    </h2>
                                    <input
                                        type="password"
                                        placeholder="Current password"
                                        value={
                                            passwordForm.data.current_password
                                        }
                                        onChange={(event) =>
                                            passwordForm.setData(
                                                'current_password',
                                                event.target.value,
                                            )
                                        }
                                        className="w-full rounded-lg border px-3 py-2 text-sm"
                                    />
                                    <input
                                        type="password"
                                        placeholder="New password"
                                        value={passwordForm.data.password}
                                        onChange={(event) =>
                                            passwordForm.setData(
                                                'password',
                                                event.target.value,
                                            )
                                        }
                                        className="w-full rounded-lg border px-3 py-2 text-sm"
                                    />
                                    <input
                                        type="password"
                                        placeholder="Confirm new password"
                                        value={
                                            passwordForm.data
                                                .password_confirmation
                                        }
                                        onChange={(event) =>
                                            passwordForm.setData(
                                                'password_confirmation',
                                                event.target.value,
                                            )
                                        }
                                        className="w-full rounded-lg border px-3 py-2 text-sm"
                                    />
                                    <button
                                        type="submit"
                                        className="rounded-lg bg-[#0057c8] px-6 py-2.5 text-sm font-semibold text-white"
                                        disabled={passwordForm.processing}
                                    >
                                        Update password
                                    </button>
                                </form>
                            </div>
                        )}

                        {activeTab === 'notifications' && (
                            <div className="space-y-4">
                                <h2 className="text-base font-bold text-[#050315]">
                                    Notification Preferences
                                </h2>
                                {[
                                    {
                                        label: 'Email alerts',
                                        description:
                                            'Receive email updates for important events',
                                        checked: emailAlerts,
                                        onChange: setEmailAlerts,
                                    },
                                    {
                                        label: 'Application alerts',
                                        description:
                                            'Get notified when new candidates apply',
                                        checked: applicationAlerts,
                                        onChange: setApplicationAlerts,
                                    },
                                    {
                                        label: 'Billing alerts',
                                        description:
                                            'Receive invoices and payment reminders',
                                        checked: billingAlerts,
                                        onChange: setBillingAlerts,
                                    },
                                ].map((item) => (
                                    <label
                                        key={item.label}
                                        className="flex items-center justify-between gap-4 rounded-xl border border-[#f1f5f9] p-4"
                                    >
                                        <div>
                                            <p className="font-medium text-[#050315]">
                                                {item.label}
                                            </p>
                                            <p className="text-sm text-[#6b7280]">
                                                {item.description}
                                            </p>
                                        </div>
                                        <input
                                            type="checkbox"
                                            checked={item.checked}
                                            onChange={(e) =>
                                                item.onChange(e.target.checked)
                                            }
                                            className="size-4 rounded border-[#e8d5e8] text-[#0057c8] focus:ring-[#0057c8]"
                                        />
                                    </label>
                                ))}
                            </div>
                        )}

                        {activeTab === 'privacy' && (
                            <div className="space-y-4">
                                <h2 className="text-base font-bold text-[#050315]">
                                    Privacy Settings
                                </h2>
                                <p className="text-sm text-[#6b7280]">
                                    Control how your company profile appears to
                                    job seekers across the UAE portal.
                                </p>
                                <label className="flex items-center justify-between gap-4 rounded-xl border border-[#f1f5f9] p-4">
                                    <div>
                                        <p className="font-medium text-[#050315]">
                                            Public company profile
                                        </p>
                                        <p className="text-sm text-[#6b7280]">
                                            Allow candidates to view your
                                            company page
                                        </p>
                                    </div>
                                    <input
                                        type="checkbox"
                                        checked={profileVisible}
                                        onChange={(e) =>
                                            setProfileVisible(e.target.checked)
                                        }
                                        className="size-4 rounded border-[#e8d5e8] text-[#0057c8] focus:ring-[#0057c8]"
                                    />
                                </label>
                            </div>
                        )}

                        {activeTab === 'language' && (
                            <div className="space-y-4">
                                <h2 className="text-base font-bold text-[#050315]">
                                    Language
                                </h2>
                                <p className="text-sm text-[#6b7280]">
                                    Choose your preferred portal language.
                                </p>
                                <select
                                    value={language}
                                    onChange={(e) =>
                                        setLanguage(e.target.value)
                                    }
                                    className="w-full max-w-xs rounded-lg border border-[#e8d5e8] bg-[#f8faff] px-4 py-2 text-sm text-[#050315] focus:border-[#0057c8] focus:outline-none"
                                >
                                    <option value="en">English</option>
                                    <option value="ar">Arabic (العربية)</option>
                                </select>
                            </div>
                        )}

                        {activeTab === 'danger' && (
                            <div className="space-y-4">
                                <h2 className="text-base font-bold text-[#ef4444]">
                                    Danger Zone
                                </h2>
                                <p className="text-sm text-[#6b7280]">
                                    These actions are permanent and cannot be
                                    undone. Please proceed with caution.
                                </p>
                                <div className="flex flex-wrap gap-3">
                                    <button
                                        type="button"
                                        className="rounded-lg border border-[#ef4444] px-4 py-2 text-sm font-semibold text-[#ef4444] hover:bg-[#fef2f2]"
                                    >
                                        Deactivate Account
                                    </button>
                                    <button
                                        type="button"
                                        className="rounded-lg bg-[#ef4444] px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
                                    >
                                        Delete Account
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </EmployerLayout>
    );
}
