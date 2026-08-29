import { Head, router, useForm, usePage } from '@inertiajs/react';
import { useMemo, useRef, useState, type ChangeEvent, type FormEvent } from 'react';

import { getInitials } from '@/components/employer/demo-data';
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

type Preferences = {
    notifications: {
        new_applications: boolean;
        job_expiry: boolean;
        billing_alerts: boolean;
        system_updates: boolean;
        weekly_report: boolean;
    };
    privacy: {
        profile_visibility: 'public' | 'private';
        show_salary: boolean;
        show_contact_email: boolean;
    };
};

type Profile = {
    name: string | null;
    contact_name: string | null;
    email: string | null;
    phone: string | null;
    company_name: string | null;
    photo_url: string | null;
    personal_initials: string;
};

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
    preferences,
}: {
    profile: Profile;
    preferences: Preferences;
}) {
    const { auth, flash } = usePage<SharedData>().props;
    const { locale, setLocale, t } = useLocale();
    const tabs: { id: SettingsTab; label: string; danger?: boolean }[] = [
        { id: 'account', label: t('employer.settings.tab.account') },
        { id: 'notifications', label: t('employer.settings.tab.notifications') },
        { id: 'privacy', label: t('employer.settings.tab.privacy') },
        { id: 'language', label: t('employer.settings.tab.language') },
        { id: 'danger', label: t('employer.settings.tab.danger'), danger: true },
    ];
    const [activeTab, setActiveTab] = useState<SettingsTab>('account');
    const [uploadingPhoto, setUploadingPhoto] = useState(false);
    const photoInputRef = useRef<HTMLInputElement>(null);
    const accountForm = useForm({
        name: profile?.name || auth.user.name || '',
        email: profile?.email || auth.user.email,
        phone: profile?.phone || auth.user.phone || '',
    });
    const passwordForm = useForm({
        current_password: '',
        password: '',
        password_confirmation: '',
    });
    const notificationForm = useForm({
        new_applications: preferences.notifications.new_applications,
        job_expiry: preferences.notifications.job_expiry,
        billing_alerts: preferences.notifications.billing_alerts,
        system_updates: preferences.notifications.system_updates,
        weekly_report: preferences.notifications.weekly_report,
    });
    const privacyForm = useForm({
        profile_visibility: preferences.privacy.profile_visibility,
        show_salary: preferences.privacy.show_salary,
        show_contact_email: preferences.privacy.show_contact_email,
    });
    const deactivateForm = useForm({ password: '' });
    const deleteForm = useForm({ password: '' });

    const strength = useMemo(
        () => passwordStrength(passwordForm.data.password),
        [passwordForm.data.password],
    );

    const onPhotoChange = (event: ChangeEvent<HTMLInputElement>): void => {
        const file = event.target.files?.[0];

        if (!file) {
            return;
        }

        const data = new FormData();
        data.append('photo', file);
        setUploadingPhoto(true);
        router.post('/employer/profile/photo', data, {
            forceFormData: true,
            preserveScroll: true,
            onFinish: () => {
                setUploadingPhoto(false);
                event.target.value = '';
            },
        });
    };

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

    const saveNotifications = (event: FormEvent): void => {
        event.preventDefault();
        notificationForm.put('/employer/settings/notifications', {
            preserveScroll: true,
        });
    };

    const savePrivacy = (event: FormEvent): void => {
        event.preventDefault();
        privacyForm.put('/employer/settings/privacy', {
            preserveScroll: true,
        });
    };

    return (
        <EmployerLayout title={t('employer.settings.title')}>
            <Head title={t('employer.settings.title')} />

            <div className="flex flex-col px-6 py-6">
                <div>
                    <h1 className="text-2xl leading-9 font-extrabold text-[#050315]">
                        {t('employer.settings.title')}
                    </h1>
                    <p className="pt-1 text-sm leading-[21px] text-[#6b7280]">
                        {t('employer.settings.subtitle')}
                    </p>
                </div>

                <div className="flex flex-col items-start gap-6 pt-6 lg:flex-row">
                    <nav className="flex w-full shrink-0 flex-row gap-1 overflow-x-auto rounded-2xl border border-[#e8d5e8] bg-white p-2 shadow-[0px_2px_4px_rgba(5,3,21,0.06)] lg:w-[180px] lg:flex-col">
                        {tabs.map((tab) => (
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
                        {flash.success && (
                            <div className="mb-5 rounded-xl border border-[#bbf7d0] bg-[#f0fdf4] px-4 py-3 text-sm text-[#15803d]">
                                {typeof flash.success === 'string'
                                    ? flash.success
                                    : t('common.saved')}
                            </div>
                        )}

                        {activeTab === 'account' && (
                            <form className="space-y-0" onSubmit={saveAccount}>
                                <h2 className="text-[17.6px] leading-[26.4px] font-extrabold text-[#050315]">
                                    {t('employer.settings.account_information')}
                                </h2>

                                <div className="mt-5 rounded-xl border border-[#e8d5e8] bg-[#f8faff] p-4">
                                    <p className="text-[14.4px] font-bold text-[#050315]">
                                        {t('employer.settings.personal_information')}
                                    </p>
                                    <p className="mt-1 text-xs text-[#6b7280]">
                                        {t('employer.settings.personal_hint')}
                                    </p>

                                    <input
                                        ref={photoInputRef}
                                        type="file"
                                        accept="image/jpeg,image/png,image/webp"
                                        className="hidden"
                                        onChange={onPhotoChange}
                                    />

                                    <div className="mt-4 flex flex-wrap items-center gap-4">
                                        {profile.photo_url ? (
                                            <img
                                                src={profile.photo_url}
                                                alt={
                                                    profile.name ||
                                                    t('employer.settings.profile_photo')
                                                }
                                                className="size-16 rounded-full object-cover"
                                            />
                                        ) : (
                                            <div className="flex size-16 items-center justify-center rounded-full bg-[#0057c8] text-lg font-bold text-white">
                                                {profile.personal_initials ||
                                                    getInitials(
                                                        profile.name ||
                                                        accountForm.data
                                                            .name ||
                                                        'E',
                                                    )}
                                            </div>
                                        )}
                                        <div className="min-w-0">
                                            <p className="text-sm font-semibold text-[#050315]">
                                                {t('employer.settings.profile_photo')}
                                            </p>
                                            <p className="text-xs text-[#6b7280]">
                                                {t('employer.settings.photo_hint')}
                                            </p>
                                            <div className="mt-2 flex flex-wrap gap-2">
                                                <button
                                                    type="button"
                                                    disabled={uploadingPhoto}
                                                    onClick={() =>
                                                        photoInputRef.current?.click()
                                                    }
                                                    className="cursor-pointer rounded-lg border border-[#0057c8] px-3 py-1.5 text-xs font-semibold text-[#0057c8]"
                                                >
                                                    {uploadingPhoto
                                                        ? t('common.uploading')
                                                        : profile.photo_url
                                                            ? t('employer.settings.replace_photo')
                                                            : t('employer.settings.upload_photo')}
                                                </button>
                                                {profile.photo_url && (
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            router.delete(
                                                                '/employer/profile/photo',
                                                                {
                                                                    preserveScroll: true,
                                                                },
                                                            )
                                                        }
                                                        className="cursor-pointer rounded-lg px-3 py-1.5 text-xs font-semibold text-[#b91c1c]"
                                                    >
                                                        {t('common.remove')}
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <label className="mt-4 block max-w-[550px]">
                                        <span className="text-[12.8px] font-semibold text-[#374151]">
                                            {t('employer.settings.full_name')}
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
                                            className={cn(fieldClass, 'mt-1.5')}
                                            placeholder={t('employer.settings.full_name_placeholder')}
                                        />
                                        {accountForm.errors.name && (
                                            <p className="mt-1 text-xs text-[#dc2626]">
                                                {accountForm.errors.name}
                                            </p>
                                        )}
                                    </label>
                                </div>

                                <label className="mt-5 block max-w-[550px]">
                                    <span className="text-[12.8px] font-semibold text-[#374151]">
                                        {t('employer.settings.email')}
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
                                        {t('employer.settings.phone')}
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
                                        {t('employer.settings.change_password')}
                                    </h3>
                                    <label className="mt-4 block max-w-[550px]">
                                        <span className="text-[12.8px] font-semibold text-[#374151]">
                                            {t('employer.settings.current_password')}
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
                                            {t('employer.settings.new_password')}
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
                                            {t('employer.settings.confirm_password')}
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
                                    {t('common.save_changes')}
                                </button>
                            </form>
                        )}

                        {activeTab === 'notifications' && (
                            <form onSubmit={saveNotifications}>
                                <h2 className="text-[17.6px] leading-[26.4px] font-extrabold text-[#050315]">
                                    {t('employer.settings.notification_preferences')}
                                </h2>
                                {(
                                    [
                                        {
                                            key: 'new_applications' as const,
                                            label: t('employer.settings.notif.new_applications'),
                                            description: t(
                                                'employer.settings.notif.new_applications_desc',
                                            ),
                                        },
                                        {
                                            key: 'job_expiry' as const,
                                            label: t('employer.settings.notif.job_expiry'),
                                            description: t(
                                                'employer.settings.notif.job_expiry_desc',
                                            ),
                                        },
                                        {
                                            key: 'billing_alerts' as const,
                                            label: t('employer.settings.notif.billing'),
                                            description: t(
                                                'employer.settings.notif.billing_desc',
                                            ),
                                        },
                                        {
                                            key: 'system_updates' as const,
                                            label: t('employer.settings.notif.system'),
                                            description: t(
                                                'employer.settings.notif.system_desc',
                                            ),
                                        },
                                        {
                                            key: 'weekly_report' as const,
                                            label: t('employer.settings.notif.weekly'),
                                            description: t(
                                                'employer.settings.notif.weekly_desc',
                                            ),
                                        },
                                    ] as const
                                ).map((item) => (
                                    <div
                                        key={item.key}
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
                                            checked={
                                                notificationForm.data[item.key]
                                            }
                                            onChange={(value) =>
                                                notificationForm.setData(
                                                    item.key,
                                                    value,
                                                )
                                            }
                                        />
                                    </div>
                                ))}
                                <button
                                    type="submit"
                                    disabled={notificationForm.processing}
                                    className="mt-6 inline-flex h-[42px] cursor-pointer items-center rounded-lg bg-[#0057c8] px-7 text-[14.4px] font-bold text-white"
                                >
                                    {t('employer.settings.save_preferences')}
                                </button>
                            </form>
                        )}

                        {activeTab === 'privacy' && (
                            <form onSubmit={savePrivacy}>
                                <h2 className="text-[17.6px] leading-[26.4px] font-extrabold text-[#050315]">
                                    {t('employer.settings.privacy_title')}
                                </h2>
                                <p className="mt-6 font-semibold text-[#050315]">
                                    {t('employer.settings.profile_visibility')}
                                </p>
                                <label className="mt-3 flex cursor-pointer items-center gap-3">
                                    <input
                                        type="radio"
                                        name="visibility"
                                        checked={
                                            privacyForm.data
                                                .profile_visibility === 'public'
                                        }
                                        onChange={() =>
                                            privacyForm.setData(
                                                'profile_visibility',
                                                'public',
                                            )
                                        }
                                        className="size-3.5 accent-[#0057c8]"
                                    />
                                    <span className="text-sm text-[#050315]">
                                        {t('employer.settings.visibility_public')}
                                    </span>
                                </label>
                                <label className="mt-3 flex cursor-pointer items-center gap-3">
                                    <input
                                        type="radio"
                                        name="visibility"
                                        checked={
                                            privacyForm.data
                                                .profile_visibility ===
                                            'private'
                                        }
                                        onChange={() =>
                                            privacyForm.setData(
                                                'profile_visibility',
                                                'private',
                                            )
                                        }
                                        className="size-3.5 accent-[#0057c8]"
                                    />
                                    <span className="text-sm text-[#050315]">
                                        {t('employer.settings.visibility_private')}
                                    </span>
                                </label>
                                <div className="mt-6 flex items-center justify-between gap-4 border-t border-[#e8d5e8] pt-6">
                                    <div>
                                        <p className="font-semibold text-[#050315]">
                                            {t('employer.settings.show_salary')}
                                        </p>
                                    </div>
                                    <Toggle
                                        checked={privacyForm.data.show_salary}
                                        onChange={(value) =>
                                            privacyForm.setData(
                                                'show_salary',
                                                value,
                                            )
                                        }
                                    />
                                </div>
                                <div className="mt-2 flex items-center justify-between gap-4 py-4">
                                    <div>
                                        <p className="font-semibold text-[#050315]">
                                            {t('employer.settings.show_contact_email')}
                                        </p>
                                    </div>
                                    <Toggle
                                        checked={
                                            privacyForm.data.show_contact_email
                                        }
                                        onChange={(value) =>
                                            privacyForm.setData(
                                                'show_contact_email',
                                                value,
                                            )
                                        }
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={privacyForm.processing}
                                    className="mt-4 inline-flex h-[42px] cursor-pointer items-center rounded-lg bg-[#0057c8] px-7 text-[14.4px] font-bold text-white"
                                >
                                    {t('employer.settings.save_privacy')}
                                </button>
                            </form>
                        )}

                        {activeTab === 'language' && (
                            <div>
                                <h2 className="text-[17.6px] leading-[26.4px] font-extrabold text-[#050315]">
                                    {t('employer.settings.language_title')}
                                </h2>
                                <p className="mt-2 text-sm text-[#6b7280]">
                                    {t('employer.settings.language_hint')}
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
                                            {t('lang.english')}
                                        </p>
                                        {locale === 'en' && (
                                            <p className="text-xs font-semibold text-[#0057c8]">
                                                {t('employer.settings.language_active')}
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
                                            {t('lang.arabic')}
                                        </p>
                                        {locale === 'ar' && (
                                            <p className="text-xs font-semibold text-[#0057c8]">
                                                {t('employer.settings.language_active')}
                                            </p>
                                        )}
                                    </button>
                                </div>
                            </div>
                        )}

                        {activeTab === 'danger' && (
                            <div>
                                <h2 className="text-[17.6px] leading-[26.4px] font-extrabold text-[#050315]">
                                    {t('employer.settings.danger_title')}
                                </h2>
                                <p className="mt-2 text-sm text-[#6b7280]">
                                    {t('employer.settings.danger_hint')}
                                </p>
                                <div className="mt-6 space-y-4">
                                    <div className="rounded-2xl border border-[#e8d5e8] p-4">
                                        <div className="flex flex-wrap items-center justify-between gap-4">
                                            <div>
                                                <p className="font-semibold text-[#050315]">
                                                    {t('employer.settings.deactivate')}
                                                </p>
                                                <p className="text-sm text-[#6b7280]">
                                                    {t('employer.settings.deactivate_desc')}
                                                </p>
                                            </div>
                                        </div>
                                        <form
                                            className="mt-4 flex flex-wrap items-end gap-3"
                                            onSubmit={(event) => {
                                                event.preventDefault();
                                                deactivateForm.post(
                                                    '/employer/settings/deactivate',
                                                );
                                            }}
                                        >
                                            <label className="block min-w-[220px] flex-1">
                                                <span className="text-xs font-semibold text-[#374151]">
                                                    {t('employer.settings.confirm_password_label')}
                                                </span>
                                                <input
                                                    type="password"
                                                    value={
                                                        deactivateForm.data
                                                            .password
                                                    }
                                                    onChange={(event) =>
                                                        deactivateForm.setData(
                                                            'password',
                                                            event.target.value,
                                                        )
                                                    }
                                                    className={cn(
                                                        fieldClass,
                                                        'mt-1.5 max-w-none',
                                                    )}
                                                />
                                                {deactivateForm.errors
                                                    .password && (
                                                        <p className="mt-1 text-xs text-[#dc2626]">
                                                            {
                                                                deactivateForm
                                                                    .errors
                                                                    .password
                                                            }
                                                        </p>
                                                    )}
                                            </label>
                                            <button
                                                type="submit"
                                                disabled={
                                                    deactivateForm.processing
                                                }
                                                className="cursor-pointer rounded-lg border border-[#e8d5e8] px-4 py-2 text-sm font-semibold text-[#374151]"
                                            >
                                                {t('employer.settings.deactivate')}
                                            </button>
                                        </form>
                                    </div>
                                    <div className="rounded-2xl border border-[#fecaca] bg-[#fef2f2] p-4">
                                        <div>
                                            <p className="font-semibold text-[#050315]">
                                                {t('employer.settings.delete')}
                                            </p>
                                            <p className="text-sm text-[#6b7280]">
                                                {t('employer.settings.delete_desc')}
                                            </p>
                                        </div>
                                        <form
                                            className="mt-4 flex flex-wrap items-end gap-3"
                                            onSubmit={(event) => {
                                                event.preventDefault();
                                                deleteForm.delete(
                                                    '/employer/settings',
                                                );
                                            }}
                                        >
                                            <label className="block min-w-[220px] flex-1">
                                                <span className="text-xs font-semibold text-[#374151]">
                                                    {t('employer.settings.confirm_password_label')}
                                                </span>
                                                <input
                                                    type="password"
                                                    value={
                                                        deleteForm.data.password
                                                    }
                                                    onChange={(event) =>
                                                        deleteForm.setData(
                                                            'password',
                                                            event.target.value,
                                                        )
                                                    }
                                                    className={cn(
                                                        fieldClass,
                                                        'mt-1.5 max-w-none',
                                                    )}
                                                />
                                                {deleteForm.errors.password && (
                                                    <p className="mt-1 text-xs text-[#dc2626]">
                                                        {
                                                            deleteForm.errors
                                                                .password
                                                        }
                                                    </p>
                                                )}
                                            </label>
                                            <button
                                                type="submit"
                                                disabled={deleteForm.processing}
                                                className="cursor-pointer rounded-lg bg-[#dc2626] px-4 py-2 text-sm font-semibold text-white"
                                            >
                                                {t('employer.settings.delete')}
                                            </button>
                                        </form>
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
