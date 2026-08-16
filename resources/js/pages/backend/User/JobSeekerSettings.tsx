import { Head, useForm, usePage } from '@inertiajs/react';
import { Globe, Lock, Mail, UserRound } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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

export default function JobSeekerSettings() {
    const { auth, flash } = usePage<SharedData>().props;
    const [tab, setTab] = useState<TabId>('personal');
    const [twoFactor, setTwoFactor] = useState(false);
    const profileForm = useForm({
        name: auth.user.name,
    });
    const passwordForm = useForm({
        current_password: '',
        password: '',
        password_confirmation: '',
    });

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
                            onSubmit={(event) => {
                                event.preventDefault();
                                profileForm.put('/job-seeker/profile');
                            }}
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
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs text-[#99a1af]">
                                    Short Bio
                                </Label>
                                <Textarea
                                    placeholder="A brief description about yourself..."
                                    className="min-h-24 rounded-xl border-[#e2e8f0]"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs text-[#99a1af]">
                                    Timezone
                                </Label>
                                <select className="flex h-10 w-full rounded-xl border border-[#e2e8f0] bg-white px-3 text-sm text-[#101828]">
                                    <option>Asia/Riyadh (GMT+3)</option>
                                    <option>Asia/Dubai (GMT+4)</option>
                                    <option>UTC</option>
                                </select>
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
                                        value={passwordForm.data.current_password}
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
                                        Add an extra layer of security to your
                                        account.
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    role="switch"
                                    aria-checked={twoFactor}
                                    onClick={() => setTwoFactor((value) => !value)}
                                    className={cn(
                                        'relative h-7 w-12 shrink-0 rounded-full transition-colors',
                                        twoFactor ? 'bg-[#0057c8]' : 'bg-[#e2e8f0]',
                                    )}
                                >
                                    <span
                                        className={cn(
                                            'absolute top-1 size-5 rounded-full bg-white shadow transition-all',
                                            twoFactor ? 'left-6' : 'left-1',
                                        )}
                                    />
                                </button>
                            </div>

                            <div className="border-t border-[#f1f5f9] pt-6">
                                <h3 className="text-base font-bold text-[#101828]">
                                    Active Sessions
                                </h3>
                                <div className="mt-4 flex items-center justify-between rounded-xl border border-[#e2e8f0] p-4">
                                    <div>
                                        <p className="text-sm font-semibold text-[#101828]">
                                            This Device
                                        </p>
                                        <p className="text-xs text-[#99a1af]">
                                            Chrome on macOS · Riyadh, Saudi
                                            Arabia
                                        </p>
                                    </div>
                                    <span className="rounded-full bg-[#f0fdf4] px-2.5 py-0.5 text-xs font-semibold text-[#15803d]">
                                        Active
                                    </span>
                                </div>
                                <button
                                    type="button"
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
                                <select className="flex h-10 w-full rounded-xl border border-[#e2e8f0] bg-white px-3 text-sm text-[#101828]">
                                    <option>English</option>
                                    <option>العربية</option>
                                </select>
                            </div>
                            <Button
                                type="button"
                                className="rounded-xl bg-[#0057c8] text-white hover:bg-[#0046a3]"
                            >
                                Save Changes
                            </Button>
                        </div>
                    )}

                    {tab === 'email' && (
                        <div className="max-w-xl space-y-5">
                            <h2 className="text-base font-bold text-[#101828]">
                                Email Preferences
                            </h2>
                            {[
                                'Application status updates',
                                'Interview invitations',
                                'Job recommendations',
                                'Platform announcements',
                            ].map((label) => (
                                <label
                                    key={label}
                                    className="flex items-center justify-between gap-4 rounded-xl border border-[#e2e8f0] p-4"
                                >
                                    <span className="text-sm font-medium text-[#101828]">
                                        {label}
                                    </span>
                                    <input
                                        type="checkbox"
                                        defaultChecked
                                        className="size-4 rounded border-[#e2e8f0] accent-[#0057c8]"
                                    />
                                </label>
                            ))}
                            <Button
                                type="button"
                                className="rounded-xl bg-[#0057c8] text-white hover:bg-[#0046a3]"
                            >
                                Save Preferences
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </JobSeekerLayout>
    );
}
