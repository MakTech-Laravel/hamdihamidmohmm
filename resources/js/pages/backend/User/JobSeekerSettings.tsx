import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { Globe, Lock, Mail, UserRound } from 'lucide-react';
import { useState, type FormEvent } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { NativeSelect } from '@/components/ui/native-select';
import { Textarea } from '@/components/ui/textarea';
import { useLocale } from '@/hooks/use-locale';
import JobSeekerLayout from '@/layouts/job-seeker-layout';
import { cn } from '@/lib/utils';
import type { SharedData } from '@/types';

const tabs = [
    { id: 'personal', label: 'Personal', icon: UserRound },
    { id: 'security', label: 'Security', icon: Lock },
    { id: 'language', label: 'Language', icon: Globe },
    { id: 'email', label: 'Email Preferences', icon: Mail },
] as const;

type TabId = (typeof tabs)[number]['id'];

type SessionRow = {
    id: string;
    is_current: boolean;
    device: string;
    ip_address: string | null;
    last_active: string | null;
};

type Props = {
    user: {
        id: number;
        name: string;
        email: string;
        role: string | null;
        role_label: string;
        bio: string | null;
        timezone: string;
    };
    preferences: {
        email_preferences: {
            application_status: boolean;
            interview_invitations: boolean;
            job_recommendations: boolean;
            platform_announcements: boolean;
        };
    };
    two_factor_enabled: boolean;
    sessions: SessionRow[];
};

export default function JobSeekerSettings({
    user,
    preferences,
    two_factor_enabled,
    sessions,
}: Props) {
    const { flash } = usePage<SharedData>().props;
    const { locale, setLocale } = useLocale();
    const [tab, setTab] = useState<TabId>('personal');
    const [pendingLocale, setPendingLocale] = useState(locale);
    const profileForm = useForm({
        name: user.name,
        bio: user.bio ?? '',
        timezone: user.timezone || 'Asia/Riyadh',
    });
    const passwordForm = useForm({
        current_password: '',
        password: '',
        password_confirmation: '',
    });
    const emailForm = useForm({
        application_status: preferences.email_preferences.application_status,
        interview_invitations:
            preferences.email_preferences.interview_invitations,
        job_recommendations: preferences.email_preferences.job_recommendations,
        platform_announcements:
            preferences.email_preferences.platform_announcements,
    });

    const savePersonal = (event: FormEvent): void => {
        event.preventDefault();
        profileForm.put('/job-seeker/settings', { preserveScroll: true });
    };

    const saveEmail = (event: FormEvent): void => {
        event.preventDefault();
        emailForm.put('/job-seeker/settings/email-preferences', {
            preserveScroll: true,
        });
    };

    return (
        <JobSeekerLayout title="Account Settings">
            <Head title="Account Settings" />

            <div className="space-y-6 p-6">
                <div>
                    <h1 className="text-2xl font-extrabold text-[#0057c8]">
                        Account Settings
                    </h1>
                    <p className="mt-1 text-sm text-[#6a7282]">
                        Manage your preferences and security settings.
                    </p>
                </div>

                <div className="rounded-2xl border border-[#e2e8f0] bg-white p-6 shadow-[0px_1px_3px_rgba(0,0,0,0.06)]">
                    <div className="mb-6 flex flex-wrap gap-2">
                        {tabs.map((item) => {
                            const Icon = item.icon;
                            const active = tab === item.id;

                            return (
                                <button
                                    key={item.id}
                                    type="button"
                                    onClick={() => setTab(item.id)}
                                    className={cn(
                                        'inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors',
                                        active
                                            ? 'bg-[#0057c8] text-white'
                                            : 'bg-[#f8faff] text-[#64748b] hover:bg-[#eff6ff]',
                                    )}
                                >
                                    <Icon className="size-4" />
                                    {item.label}
                                </button>
                            );
                        })}
                    </div>

                    {flash.success && (
                        <div className="mb-4 rounded-xl border border-[#bbf7d0] bg-[#f0fdf4] px-4 py-3 text-sm text-[#15803d]">
                            {typeof flash.success === 'string'
                                ? flash.success
                                : 'Saved successfully.'}
                        </div>
                    )}

                    {tab === 'personal' && (
                        <form
                            className="max-w-xl space-y-5"
                            onSubmit={savePersonal}
                        >
                            <h2 className="text-base font-bold text-[#101828]">
                                Personal Settings
                            </h2>
                            <div className="space-y-1.5">
                                <Label className="text-xs text-[#99a1af]">
                                    Display Name
                                </Label>
                                <Input
                                    value={profileForm.data.name}
                                    onChange={(event) =>
                                        profileForm.setData(
                                            'name',
                                            event.target.value,
                                        )
                                    }
                                    className="rounded-xl border-[#e2e8f0]"
                                />
                                {profileForm.errors.name && (
                                    <p className="text-xs text-[#dc2626]">
                                        {profileForm.errors.name}
                                    </p>
                                )}
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs text-[#99a1af]">
                                    Short Bio
                                </Label>
                                <Textarea
                                    value={profileForm.data.bio}
                                    onChange={(event) =>
                                        profileForm.setData(
                                            'bio',
                                            event.target.value,
                                        )
                                    }
                                    placeholder="A brief description about yourself..."
                                    className="min-h-24 rounded-xl border-[#e2e8f0]"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs text-[#99a1af]">
                                    Timezone
                                </Label>
                                <NativeSelect
                                    value={profileForm.data.timezone}
                                    onChange={(event) =>
                                        profileForm.setData(
                                            'timezone',
                                            event.target.value,
                                        )
                                    }
                                >
                                    <option value="Asia/Riyadh">
                                        Asia/Riyadh (GMT+3)
                                    </option>
                                    <option value="Asia/Dubai">
                                        Asia/Dubai (GMT+4)
                                    </option>
                                    <option value="UTC">UTC</option>
                                </NativeSelect>
                            </div>
                            <Button
                                type="submit"
                                className="rounded-xl bg-[#0057c8] text-white hover:bg-[#0046a3]"
                                disabled={profileForm.processing}
                            >
                                Save Changes
                            </Button>
                        </form>
                    )}

                    {tab === 'security' && (
                        <div className="max-w-xl space-y-8">
                            <form
                                className="space-y-5"
                                onSubmit={(event) => {
                                    event.preventDefault();
                                    passwordForm.put('/settings/password', {
                                        onSuccess: () => passwordForm.reset(),
                                    });
                                }}
                            >
                                <h2 className="text-base font-bold text-[#101828]">
                                    Security Settings
                                </h2>
                                <div className="space-y-1.5">
                                    <Label className="text-xs text-[#99a1af]">
                                        Current Password
                                    </Label>
                                    <Input
                                        type="password"
                                        value={
                                            passwordForm.data.current_password
                                        }
                                        onChange={(event) =>
                                            passwordForm.setData(
                                                'current_password',
                                                event.target.value,
                                            )
                                        }
                                        className="rounded-xl border-[#e2e8f0]"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-xs text-[#99a1af]">
                                        New Password
                                    </Label>
                                    <Input
                                        type="password"
                                        value={passwordForm.data.password}
                                        onChange={(event) =>
                                            passwordForm.setData(
                                                'password',
                                                event.target.value,
                                            )
                                        }
                                        className="rounded-xl border-[#e2e8f0]"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-xs text-[#99a1af]">
                                        Confirm New Password
                                    </Label>
                                    <Input
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
                                        className="rounded-xl border-[#e2e8f0]"
                                    />
                                </div>
                                <Button
                                    type="submit"
                                    className="rounded-xl bg-[#0057c8] text-white hover:bg-[#0046a3]"
                                    disabled={passwordForm.processing}
                                >
                                    Change Password
                                </Button>
                            </form>

                            <div className="flex items-start justify-between gap-4 border-t border-[#f1f5f9] pt-6">
                                <div>
                                    <h3 className="text-base font-bold text-[#101828]">
                                        Two-Factor Authentication
                                    </h3>
                                    <p className="mt-1 text-sm text-[#6a7282]">
                                        {two_factor_enabled
                                            ? 'Two-factor authentication is enabled on your account.'
                                            : 'Add an extra layer of security to your account.'}
                                    </p>
                                    <p className="mt-2 text-xs font-semibold text-[#0057c8]">
                                        Status:{' '}
                                        {two_factor_enabled
                                            ? 'Enabled'
                                            : 'Disabled'}
                                    </p>
                                </div>
                                <Link
                                    href="/settings/two-factor"
                                    className="rounded-xl bg-[#0057c8] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0046a3]"
                                >
                                    Manage
                                </Link>
                            </div>

                            <div className="border-t border-[#f1f5f9] pt-6">
                                <h3 className="text-base font-bold text-[#101828]">
                                    Active Sessions
                                </h3>
                                <div className="mt-4 space-y-3">
                                    {sessions.length === 0 ? (
                                        <p className="text-sm text-[#99a1af]">
                                            No active sessions found.
                                        </p>
                                    ) : (
                                        sessions.map((session) => (
                                            <div
                                                key={session.id}
                                                className="flex items-center justify-between rounded-xl border border-[#e2e8f0] p-4"
                                            >
                                                <div>
                                                    <p className="text-sm font-semibold text-[#101828]">
                                                        {session.is_current
                                                            ? 'This Device'
                                                            : session.device}
                                                    </p>
                                                    <p className="text-xs text-[#99a1af]">
                                                        {session.device}
                                                        {session.ip_address
                                                            ? ` · ${session.ip_address}`
                                                            : ''}
                                                        {session.last_active
                                                            ? ` · ${session.last_active}`
                                                            : ''}
                                                    </p>
                                                </div>
                                                {session.is_current && (
                                                    <span className="rounded-full bg-[#f0fdf4] px-2.5 py-0.5 text-xs font-semibold text-[#15803d]">
                                                        Active
                                                    </span>
                                                )}
                                            </div>
                                        ))
                                    )}
                                </div>
                                <button
                                    type="button"
                                    onClick={() =>
                                        router.delete(
                                            '/job-seeker/settings/sessions',
                                            { preserveScroll: true },
                                        )
                                    }
                                    className="mt-3 text-sm font-semibold text-[#ef4444]"
                                >
                                    Revoke All Other Sessions
                                </button>
                            </div>
                        </div>
                    )}

                    {tab === 'language' && (
                        <div className="max-w-xl space-y-5">
                            <h2 className="text-base font-bold text-[#101828]">
                                Language Settings
                            </h2>
                            <div className="space-y-1.5">
                                <Label className="text-xs text-[#99a1af]">
                                    Preferred Language
                                </Label>
                                <NativeSelect
                                    value={pendingLocale}
                                    onChange={(event) =>
                                        setPendingLocale(event.target.value)
                                    }
                                >
                                    <option value="en">English</option>
                                    <option value="ar">العربية</option>
                                </NativeSelect>
                            </div>
                            <Button
                                type="button"
                                onClick={() => setLocale(pendingLocale)}
                                className="rounded-xl bg-[#0057c8] text-white hover:bg-[#0046a3]"
                            >
                                Save Changes
                            </Button>
                        </div>
                    )}

                    {tab === 'email' && (
                        <form
                            className="max-w-xl space-y-5"
                            onSubmit={saveEmail}
                        >
                            <h2 className="text-base font-bold text-[#101828]">
                                Email Preferences
                            </h2>
                            {(
                                [
                                    {
                                        key: 'application_status' as const,
                                        label: 'Application status updates',
                                    },
                                    {
                                        key: 'interview_invitations' as const,
                                        label: 'Interview invitations',
                                    },
                                    {
                                        key: 'job_recommendations' as const,
                                        label: 'Job recommendations',
                                    },
                                    {
                                        key: 'platform_announcements' as const,
                                        label: 'Platform announcements',
                                    },
                                ] as const
                            ).map((item) => (
                                <label
                                    key={item.key}
                                    className="flex items-center justify-between gap-4 rounded-xl border border-[#e2e8f0] p-4"
                                >
                                    <span className="text-sm font-medium text-[#101828]">
                                        {item.label}
                                    </span>
                                    <input
                                        type="checkbox"
                                        checked={emailForm.data[item.key]}
                                        onChange={(event) =>
                                            emailForm.setData(
                                                item.key,
                                                event.target.checked,
                                            )
                                        }
                                        className="size-4 rounded border-[#e2e8f0] accent-[#0057c8]"
                                    />
                                </label>
                            ))}
                            <Button
                                type="submit"
                                disabled={emailForm.processing}
                                className="rounded-xl bg-[#0057c8] text-white hover:bg-[#0046a3]"
                            >
                                Save Preferences
                            </Button>
                        </form>
                    )}
                </div>
            </div>
        </JobSeekerLayout>
    );
}
