import { Head, router, useForm, usePage } from '@inertiajs/react';
import { Globe, Mail, RotateCcw, Save, Settings, Shield } from 'lucide-react';
import { useState } from 'react';

import {
    AdminPageHeader,
    AdminPanel,
    AdminPrimaryButton,
    AdminSecondaryButton,
} from '@/components/admin-portal/ui';
import { useLocale } from '@/hooks/use-locale';
import AdminPortalLayout from '@/layouts/admin-portal-layout';
import { cn } from '@/lib/utils';
import type { SharedData } from '@/types';

type SettingsMap = Record<string, Record<string, string | number | boolean>>;

export default function PlatformSettings({
    settings,
}: {
    settings: SettingsMap;
}) {
    const { flash } = usePage<SharedData>().props;
    const { t } = useLocale();
    const settingsTabs = [
        {
            id: 'general' as const,
            label: t('admin.settings.tabs.general'),
            icon: Settings,
        },
        {
            id: 'email' as const,
            label: t('admin.settings.tabs.email'),
            icon: Mail,
        },
        {
            id: 'security' as const,
            label: t('admin.settings.tabs.security'),
            icon: Shield,
        },
        {
            id: 'language' as const,
            label: t('admin.settings.tabs.language'),
            icon: Globe,
        },
    ];
    const [activeTab, setActiveTab] =
        useState<(typeof settingsTabs)[number]['id']>('general');
    const form = useForm({
        group: 'general',
        values: settings.general ?? {},
    });

    const switchTab = (id: (typeof settingsTabs)[number]['id']): void => {
        setActiveTab(id);
        form.setData({
            group: id,
            values: settings[id] ?? {},
        });
    };

    const setValue = (key: string, value: string | number | boolean): void => {
        form.setData('values', {
            ...form.data.values,
            [key]: value,
        });
    };

    const values = form.data.values as Record<string, string | number | boolean>;

    return (
        <AdminPortalLayout>
            <Head title={t('admin.settings.title')} />

            <div className="space-y-6 p-6">
                <AdminPageHeader title={t('admin.settings.title')} />

                {flash.success && (
                    <div className="rounded-xl border border-[#bbf7d0] bg-[#f0fdf4] px-4 py-3 text-sm text-[#15803d]">
                        {typeof flash.success === 'string'
                            ? flash.success
                            : t('common.saved')}
                    </div>
                )}

                <div className="grid gap-5 lg:grid-cols-[240px_1fr]">
                    <AdminPanel className="h-fit space-y-1 p-3">
                        {settingsTabs.map((tab) => {
                            const Icon = tab.icon;

                            return (
                                <button
                                    key={tab.id}
                                    type="button"
                                    onClick={() => switchTab(tab.id)}
                                    className={cn(
                                        'flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors',
                                        activeTab === tab.id
                                            ? 'bg-[#0057c8] text-white'
                                            : 'text-[#64748b] hover:bg-[#f8faff]',
                                    )}
                                >
                                    <Icon className="size-4" />
                                    {tab.label}
                                </button>
                            );
                        })}
                    </AdminPanel>

                    <AdminPanel>
                        <form
                            className="space-y-4"
                            onSubmit={(event) => {
                                event.preventDefault();
                                form.put('/admin/settings');
                            }}
                        >
                            {Object.entries(values).map(([key, value]) => (
                                <div key={key}>
                                    <label className="mb-1.5 block text-xs font-semibold text-[#3977a6]">
                                        {key.replaceAll('_', ' ')}
                                    </label>
                                    {typeof value === 'boolean' ? (
                                        <input
                                            type="checkbox"
                                            checked={value}
                                            onChange={(event) =>
                                                setValue(
                                                    key,
                                                    event.target.checked,
                                                )
                                            }
                                        />
                                    ) : (
                                        <input
                                            type={
                                                typeof value === 'number'
                                                    ? 'number'
                                                    : 'text'
                                            }
                                            value={String(value ?? '')}
                                            onChange={(event) =>
                                                setValue(
                                                    key,
                                                    typeof value === 'number'
                                                        ? Number(
                                                              event.target
                                                                  .value,
                                                          )
                                                        : event.target.value,
                                                )
                                            }
                                            className="w-full rounded-xl border border-[#e2e8f0] bg-[#f8faff] px-3 py-2.5 text-sm text-[#050315] outline-none focus:border-[#0057c8]"
                                        />
                                    )}
                                </div>
                            ))}
                            <div className="flex gap-2">
                                <AdminPrimaryButton type="submit">
                                    <Save className="size-4" />
                                    {t('common.save')}
                                </AdminPrimaryButton>
                                <AdminSecondaryButton
                                    onClick={() =>
                                        router.post('/admin/settings/reset')
                                    }
                                >
                                    <RotateCcw className="size-4" />
                                    {t('common.reset')}
                                </AdminSecondaryButton>
                            </div>
                        </form>
                    </AdminPanel>
                </div>
            </div>
        </AdminPortalLayout>
    );
}
