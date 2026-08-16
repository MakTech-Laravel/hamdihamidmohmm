import { Head, useForm, usePage } from '@inertiajs/react';
import { useMemo, useState, type FormEvent } from 'react';

import { useLocale } from '@/hooks/use-locale';
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

const fieldClass =
    'h-[42px] w-full max-w-[550px] rounded-lg border border-[#e8d5e8] bg-white px-3 text-sm text-[#050315] outline-none placeholder:text-[#050315]/50';

function Toggle({
    checked,
    onChange,
}: {
    checked: boolean;
    onChange: (value: boolean) => void;
}) {
    return (
        <button
            type="button"
            role="switch"
            aria-checked={checked}
            onClick={() => onChange(!checked)}
            className={cn(
                'relative h-6 w-11 shrink-0 cursor-pointer rounded-full',
                checked ? 'bg-[#0057c8]' : 'bg-[#e5e7eb]',
            )}
        >
            <span
                className={cn(
                    'absolute top-[3px] size-[18px] rounded-full bg-white transition-[left]',
                    checked ? 'left-[23px]' : 'left-[3px]',
                )}
            />
        </button>
    );
}

function passwordStrength(password: string): number {
    let score = 0;

    if (password.length >= 4) {
        score += 1;
    }

    if (password.length >= 8) {
        score += 1;
    }

    if (/[A-Z]/.test(password) && /[a-z]/.test(password)) {
        score += 1;
    }

    if (/\d/.test(password) || /[^A-Za-z0-9]/.test(password)) {
        score += 1;
    }

    return score;
}

export default function EmployerSettings({
    profile,
}: {
    profile: {
        contact_name: string | null;
        email: string | null;
        phone: string | null;
        company_name: string | null;
    };
}) {
    const { auth, flash } = usePage<SharedData>().props;
    const { locale, setLocale } = useLocale();
    const [activeTab, setActiveTab] = useState<SettingsTab>('account');
    const accountForm = useForm({
        contact_name:
            profile?.contact_name || auth.user.contact_name || auth.user.name,
        email: profile?.email || auth.user.email,
        phone: profile?.phone || auth.user.phone || '',
    });
    const passwordForm = useForm({
        current_password: '',
        password: '',
        password_confirmation: '',
    });
    const [newApplications, setNewApplications] = useState(true);
    const [jobExpiry, setJobExpiry] = useState(true);
    const [billingAlerts, setBillingAlerts] = useState(true);
    const [systemUpdates, setSystemUpdates] = useState(false);
    const [weeklyReport, setWeeklyReport] = useState(true);
    const [profileVisibility, setProfileVisibility] = useState<
        'public' | 'private'
    >('public');
    const [showSalary, setShowSalary] = useState(true);
    const [showContactEmail, setShowContactEmail] = useState(false);

    const strength = useMemo(
        () => passwordStrength(passwordForm.data.password),
        [passwordForm.data.password],
    );

    const saveAccount = (event: FormEvent): void => {
        event.preventDefault();

        accountForm.put('/employer/settings', {
            preserveScroll: true,
            onSuccess: () => {
                const wantsPasswordChange =
                    passwordForm.data.current_password !== '' ||
                    passwordForm.data.password !== '';

                if (!wantsPasswordChange) {
                    return;
                }

                passwordForm.put('/settings/password', {
                    preserveScroll: true,
                    onSuccess: () => passwordForm.reset(),
                });
            },
        });
    };

    return (
        <EmployerLayout title="Settings">
            <Head title="Settings" />

            <div className="flex flex-col px-6 py-6">
                <div>
                    <h1 className="text-2xl leading-9 font-extrabold text-[#050315]">
                        Settings
                    </h1>
                    <p className="pt-1 text-sm leading-[21px] text-[#6b7280]">
                        Manage your account preferences and configurations
                    </p>
                </div>

                <div className="flex flex-col items-start gap-6 pt-6 lg:flex-row">
                    <nav className="flex w-full shrink-0 flex-row gap-1 overflow-x-auto rounded-2xl border border-[#e8d5e8] bg-white p-2 shadow-[0px_2px_4px_rgba(5,3,21,0.06)] lg:w-[180px] lg:flex-col">
                        {TABS.map((tab) => (
                            <button
                                key={tab.id}
                                type="button"
                                onClick={() => setActiveTab(tab.id)}
                                className={cn(
                                    'w-full cursor-pointer rounded-lg px-3.5 py-2.5 text-left text-sm font-semibold whitespace-nowrap',
                                    activeTab === tab.id
                                        ? tab.danger
                                            ? 'bg-[#fef2f2] text-[#ef4444]'
                                            : 'bg-[#0057c8]/10 text-[#0057c8]'
                                        : tab.danger
                                            ? 'text-[#ef4444]'
                                            : 'text-[#374151]',
                                )}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </nav>

                    <div className="min-w-0 w-full flex-1 rounded-2xl border border-[#e8d5e8] bg-white p-6 shadow-[0px_2px_4px_rgba(5,3,21,0.06)]">
                        {activeTab === 'account' && (
                            <form className="space-y-0" onSubmit={saveAccount}>
                                {flash.success && (
                                    <div className="mb-5 rounded-xl border border-[#bbf7d0] bg-[#f0fdf4] px-4 py-3 text-sm text-[#15803d]">
                                        {typeof flash.success === 'string'
                                            ? flash.success
                                            : 'Saved successfully.'}
                                    </div>
                                )}
                                <h2 className="text-[17.6px] leading-[26.4px] font-extrabold text-[#050315]">
                                    Account Information
                                </h2>
                                <label className="mt-5 block max-w-[550px]">
                                    <span className="text-[12.8px] font-semibold text-[#374151]">
                                        Contact Name
                                    </span>
                                    <input
                                        type="text"
                                        value={accountForm.data.contact_name}
                                        onChange={(event) =>
                                            accountForm.setData(
                                                'contact_name',
                                                event.target.value,
                                            )
                                        }
                                        className={cn(fieldClass, 'mt-1.5')}
                                    />
                                    {accountForm.errors.contact_name && (
                                        <p className="mt-1 text-xs text-[#dc2626]">
                                            {accountForm.errors.contact_name}
                                        </p>
                                    )}
                                </label>
                                <label className="mt-4 block max-w-[550px]">
                                    <span className="text-[12.8px] font-semibold text-[#374151]">
                                        Email Address
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
                                        className={cn(fieldClass, 'mt-1.5')}
                                    />
                                    {accountForm.errors.email && (
                                        <p className="mt-1 text-xs text-[#dc2626]">
                                            {accountForm.errors.email}
                                        </p>
                                    )}
                                </label>
                                <label className="mt-4 block max-w-[550px]">
                                    <span className="text-[12.8px] font-semibold text-[#374151]">
                                        Phone Number
                                    </span>
                                    <input
                                        type="text"
                                        value={accountForm.data.phone}
                                        onChange={(event) =>
                                            accountForm.setData(
                                                'phone',
                                                event.target.value,
                                            )
                                        }
                                        className={cn(fieldClass, 'mt-1.5')}
                                    />
                                </label>

                                <div className="mt-5 border-t border-[#e8d5e8] pt-5">
                                    <h3 className="text-[15.2px] leading-[22.8px] font-bold text-[#050315]">
                                        Change Password
                                    </h3>
                                    <label className="mt-4 block max-w-[550px]">
                                        <span className="text-[12.8px] font-semibold text-[#374151]">
                                            Current Password
                                        </span>
                                        <input
                                            type="password"
                                            value={
                                                passwordForm.data
                                                    .current_password
                                            }
                                            onChange={(event) =>
                                                passwordForm.setData(
                                                    'current_password',
                                                    event.target.value,
                                                )
                                            }
                                            className={cn(fieldClass, 'mt-1.5')}
                                        />
                                    </label>
                                    <label className="mt-4 block max-w-[550px]">
                                        <span className="text-[12.8px] font-semibold text-[#374151]">
                                            New Password
                                        </span>
                                        <input
                                            type="password"
                                            value={passwordForm.data.password}
                                            onChange={(event) =>
                                                passwordForm.setData(
                                                    'password',
                                                    event.target.value,
                                                )
                                            }
                                            className={cn(fieldClass, 'mt-1.5')}
                                        />
                                        <div className="mt-2 flex max-w-[550px] gap-1">
                                            {[0, 1, 2, 3].map((index) => (
                                                <span
                                                    key={index}
                                                    className={cn(
                                                        'h-1 flex-1 rounded-full',
                                                        strength > index
                                                            ? 'bg-[#0057c8]'
                                                            : 'bg-[#e5e7eb]',
                                                    )}
                                                />
                                            ))}
                                        </div>
                                    </label>
                                    <label className="mt-4 block max-w-[550px]">
                                        <span className="text-[12.8px] font-semibold text-[#374151]">
                                            Confirm New Password
                                        </span>
                                        <input
                                            type="password"
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
                                            className={cn(fieldClass, 'mt-1.5')}
                                        />
                                        {passwordForm.errors.password && (
                                            <p className="mt-1 text-xs text-[#dc2626]">
                                                {passwordForm.errors.password}
                                            </p>
                                        )}
                                    </label>
                                </div>

                                <button
                                    type="submit"
                                    className="mt-6 inline-flex h-[42px] cursor-pointer items-center rounded-lg bg-[#0057c8] px-7 text-[14.4px] font-bold text-white"
                                    disabled={
                                        accountForm.processing ||
                                        passwordForm.processing
                                    }
                                >
                                    Save Changes
                                </button>
                            </form>
                        )}

                        {activeTab === 'notifications' && (
                            <div>
                                <h2 className="text-[17.6px] leading-[26.4px] font-extrabold text-[#050315]">
                                    Notification Preferences
                                </h2>
                                {[
                                    {
                                        label: 'New Applications',
                                        description:
                                            'Get notified when candidates apply to your jobs',
                                        checked: newApplications,
                                        onChange: setNewApplications,
                                    },
                                    {
                                        label: 'Job Expiry Reminders',
                                        description:
                                            'Remind me 7 days before a job listing expires',
                                        checked: jobExpiry,
                                        onChange: setJobExpiry,
                                    },
                                    {
                                        label: 'Billing Alerts',
                                        description:
                                            'Receive payment and subscription notifications',
                                        checked: billingAlerts,
                                        onChange: setBillingAlerts,
                                    },
                                    {
                                        label: 'System Updates',
                                        description:
                                            'Platform updates, maintenance, and announcements',
                                        checked: systemUpdates,
                                        onChange: setSystemUpdates,
                                    },
                                    {
                                        label: 'Weekly Report',
                                        description:
                                            'Summary of applications and job performance',
                                        checked: weeklyReport,
                                        onChange: setWeeklyReport,
                                    },
                                ].map((item) => (
                                    <div
                                        key={item.label}
                                        className="flex items-center justify-between gap-4 border-b border-[#f1f5f9] py-4 last:border-b-0"
                                    >
                                        <div>
                                            <p className="font-semibold text-[#050315]">
                                                {item.label}
                                            </p>
                                            <p className="text-sm text-[#6b7280]">
                                                {item.description}
                                            </p>
                                        </div>
                                        <Toggle
                                            checked={item.checked}
                                            onChange={item.onChange}
                                        />
                                    </div>
                                ))}
                            </div>
                        )}

                        {activeTab === 'privacy' && (
                            <div>
                                <h2 className="text-[17.6px] leading-[26.4px] font-extrabold text-[#050315]">
                                    Privacy Settings
                                </h2>
                                <p className="mt-6 font-semibold text-[#050315]">
                                    Company Profile Visibility
                                </p>
                                <label className="mt-3 flex cursor-pointer items-center gap-3">
                                    <input
                                        type="radio"
                                        name="visibility"
                                        checked={profileVisibility === 'public'}
                                        onChange={() =>
                                            setProfileVisibility('public')
                                        }
                                        className="size-3.5 accent-[#0057c8]"
                                    />
                                    <span className="text-sm text-[#050315]">
                                        Public — Visible to all job seekers
                                    </span>
                                </label>
                                <label className="mt-3 flex cursor-pointer items-center gap-3">
                                    <input
                                        type="radio"
                                        name="visibility"
                                        checked={
                                            profileVisibility === 'private'
                                        }
                                        onChange={() =>
                                            setProfileVisibility('private')
                                        }
                                        className="size-3.5 accent-[#0057c8]"
                                    />
                                    <span className="text-sm text-[#050315]">
                                        Private — Only invited candidates can
                                        see your profile
                                    </span>
                                </label>
                                <div className="mt-6 flex items-center justify-between gap-4 border-t border-[#e8d5e8] pt-6">
                                    <div>
                                        <p className="font-semibold text-[#050315]">
                                            Show Salary Range
                                        </p>
                                        <p className="text-sm text-[#6b7280]">
                                            Display salary in job listings
                                        </p>
                                    </div>
                                    <Toggle
                                        checked={showSalary}
                                        onChange={setShowSalary}
                                    />
                                </div>
                                <div className="mt-2 flex items-center justify-between gap-4 py-4">
                                    <div>
                                        <p className="font-semibold text-[#050315]">
                                            Show Contact Email
                                        </p>
                                        <p className="text-sm text-[#6b7280]">
                                            Allow candidates to see your HR
                                            email
                                        </p>
                                    </div>
                                    <Toggle
                                        checked={showContactEmail}
                                        onChange={setShowContactEmail}
                                    />
                                </div>
                            </div>
                        )}

                        {activeTab === 'language' && (
                            <div>
                                <h2 className="text-[17.6px] leading-[26.4px] font-extrabold text-[#050315]">
                                    Language
                                </h2>
                                <p className="mt-2 text-sm text-[#6b7280]">
                                    Choose your preferred interface language
                                </p>
                                <div className="mt-6 grid gap-4 md:grid-cols-2">
                                    <button
                                        type="button"
                                        onClick={() => setLocale('en')}
                                        className={cn(
                                            'flex cursor-pointer flex-col items-center rounded-2xl border px-4 py-6',
                                            locale === 'en'
                                                ? 'border-[#0057c8] bg-[#0057c8]/5'
                                                : 'border-[#e8d5e8] bg-white',
                                        )}
                                    >
                                        <span className="text-3xl">🇺🇸</span>
                                        <p className="mt-2 text-base font-bold text-[#050315]">
                                            English
                                        </p>
                                        {locale === 'en' && (
                                            <p className="text-xs font-semibold text-[#0057c8]">
                                                Active
                                            </p>
                                        )}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setLocale('ar')}
                                        className={cn(
                                            'flex cursor-pointer flex-col items-center rounded-2xl border px-4 py-6',
                                            locale === 'ar'
                                                ? 'border-[#0057c8] bg-[#0057c8]/5'
                                                : 'border-[#e8d5e8] bg-white',
                                        )}
                                    >
                                        <span className="text-3xl">🇸🇦</span>
                                        <p className="mt-2 text-base font-bold text-[#050315]">
                                            العربية
                                        </p>
                                        {locale === 'ar' && (
                                            <p className="text-xs font-semibold text-[#0057c8]">
                                                Active
                                            </p>
                                        )}
                                    </button>
                                </div>
                            </div>
                        )}

                        {activeTab === 'danger' && (
                            <div>
                                <h2 className="text-[17.6px] leading-[26.4px] font-extrabold text-[#050315]">
                                    Danger Zone
                                </h2>
                                <p className="mt-2 text-sm text-[#6b7280]">
                                    Irreversible actions — proceed with caution.
                                </p>
                                <div className="mt-6 space-y-4">
                                    <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#e8d5e8] p-4">
                                        <div>
                                            <p className="font-semibold text-[#050315]">
                                                Deactivate Account
                                            </p>
                                            <p className="text-sm text-[#6b7280]">
                                                Temporarily disable your
                                                employer account
                                            </p>
                                        </div>
                                        <button
                                            type="button"
                                            className="cursor-pointer rounded-lg border border-[#e8d5e8] px-4 py-2 text-sm font-semibold text-[#374151]"
                                        >
                                            Deactivate Account
                                        </button>
                                    </div>
                                    <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#fecaca] bg-[#fef2f2] p-4">
                                        <div>
                                            <p className="font-semibold text-[#050315]">
                                                Delete All Data
                                            </p>
                                            <p className="text-sm text-[#6b7280]">
                                                Permanently erase all company
                                                data. This cannot be undone.
                                            </p>
                                        </div>
                                        <button
                                            type="button"
                                            className="cursor-pointer rounded-lg bg-[#dc2626] px-4 py-2 text-sm font-semibold text-white"
                                        >
                                            Delete All Data
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </EmployerLayout>
    );
}
