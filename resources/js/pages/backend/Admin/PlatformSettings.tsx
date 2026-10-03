import { Head, router, useForm, usePage } from '@inertiajs/react';
import {
    Building2,
    Filter,
    Globe,
    Mail,
    Plus,
    RotateCcw,
    Save,
    Settings,
    Share2,
    Shield,
    Trash2,
} from 'lucide-react';
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

type ExperienceRange = {
    key: string;
    label: string;
    min: number | null;
    max: number | null;
    enabled: boolean;
};

type EmailTemplate = {
    id: number;
    key: string;
    name: string;
    subject: string;
    body: string;
};

type TabId =
    | 'general'
    | 'email'
    | 'social'
    | 'payments'
    | 'security'
    | 'language'
    | 'experience_filters'
    | 'email_templates';

export default function PlatformSettings({
    settings,
    experience_ranges = [],
    email_template,
}: {
    settings: SettingsMap;
    experience_ranges?: ExperienceRange[];
    email_template?: EmailTemplate | null;
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
            id: 'email_templates' as const,
            label: t('admin.settings.tabs.email_templates'),
            icon: Mail,
        },
        {
            id: 'experience_filters' as const,
            label: t('admin.settings.tabs.experience_filters'),
            icon: Filter,
        },
        {
            id: 'social' as const,
            label: t('admin.settings.tabs.social'),
            icon: Share2,
        },
        {
            id: 'payments' as const,
            label: t('admin.settings.tabs.payments'),
            icon: Building2,
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
    const [activeTab, setActiveTab] = useState<TabId>('general');
    const [ranges, setRanges] = useState<ExperienceRange[]>(experience_ranges);
    const form = useForm({
        group: 'general' as TabId,
        values: settings.general ?? {},
    });

    const switchTab = (id: TabId): void => {
        setActiveTab(id);
        form.setData({
            group: id,
            values:
                id === 'experience_filters'
                    ? { ranges }
                    : id === 'email_templates'
                      ? {
                            subject: email_template?.subject ?? '',
                            body: email_template?.body ?? '',
                        }
                      : (settings[id] ?? {}),
        });
    };

    const setValue = (key: string, value: string | number | boolean): void => {
        form.setData('values', {
            ...form.data.values,
            [key]: value,
        });
    };

    const values = form.data.values as Record<string, string | number | boolean>;

    const fieldLabel = (key: string): string => {
        const translationKey = `admin.settings.fields.${key}`;
        const translated = t(translationKey);

        return translated === translationKey
            ? key.replaceAll('_', ' ')
            : translated;
    };

    const updateRange = (
        index: number,
        key: keyof ExperienceRange,
        value: string | number | boolean | null,
    ): void => {
        const next = ranges.map((range, rangeIndex) =>
            rangeIndex === index ? { ...range, [key]: value } : range,
        );
        setRanges(next);
        form.setData('values', { ranges: next });
    };

    const addRange = (): void => {
        const next = [
            ...ranges,
            {
                key: `range-${ranges.length + 1}`,
                label: `Range ${ranges.length + 1}`,
                min: 0,
                max: null,
                enabled: true,
            },
        ];
        setRanges(next);
        form.setData({
            group: 'experience_filters',
            values: { ranges: next },
        });
    };

    const removeRange = (index: number): void => {
        const next = ranges.filter((_, rangeIndex) => rangeIndex !== index);
        setRanges(next);
        form.setData('values', { ranges: next });
    };

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

                                if (activeTab === 'experience_filters') {
                                    router.put('/admin/settings', {
                                        group: 'experience_filters',
                                        values: { ranges },
                                    });

                                    return;
                                }

                                form.put('/admin/settings');
                            }}
                        >
                            {activeTab === 'social' && (
                                <p className="rounded-xl border border-[#dbeafe] bg-[#eff6ff] px-4 py-3 text-sm text-[#1e3a8a]">
                                    {t('admin.settings.social_help')}
                                </p>
                            )}
                            {activeTab === 'payments' && (
                                <p className="rounded-xl border border-[#ffedd5] bg-[#fff7ed] px-4 py-3 text-sm text-[#9a3412]">
                                    {t('admin.settings.payments_help')}
                                </p>
                            )}
                            {activeTab === 'experience_filters' && (
                                <>
                                    <p className="rounded-xl border border-[#dbeafe] bg-[#eff6ff] px-4 py-3 text-sm text-[#1e3a8a]">
                                        {t(
                                            'admin.settings.experience_filters_help',
                                        )}
                                    </p>
                                    <div className="space-y-3">
                                        {ranges.map((range, index) => (
                                            <div
                                                key={`${range.key}-${index}`}
                                                className="grid gap-2 rounded-xl border border-[#e2e8f0] p-3 sm:grid-cols-5"
                                            >
                                                <input
                                                    value={range.key}
                                                    onChange={(event) =>
                                                        updateRange(
                                                            index,
                                                            'key',
                                                            event.target.value,
                                                        )
                                                    }
                                                    placeholder={t(
                                                        'admin.settings.experience.key',
                                                    )}
                                                    className="rounded-lg border border-[#e2e8f0] px-2 py-2 text-sm"
                                                />
                                                <input
                                                    value={range.label}
                                                    onChange={(event) =>
                                                        updateRange(
                                                            index,
                                                            'label',
                                                            event.target.value,
                                                        )
                                                    }
                                                    placeholder={t(
                                                        'admin.settings.experience.label',
                                                    )}
                                                    className="rounded-lg border border-[#e2e8f0] px-2 py-2 text-sm"
                                                />
                                                <input
                                                    type="number"
                                                    value={range.min ?? ''}
                                                    onChange={(event) =>
                                                        updateRange(
                                                            index,
                                                            'min',
                                                            event.target
                                                                .value === ''
                                                                ? null
                                                                : Number(
                                                                      event
                                                                          .target
                                                                          .value,
                                                                  ),
                                                        )
                                                    }
                                                    placeholder={t(
                                                        'admin.settings.experience.min',
                                                    )}
                                                    className="rounded-lg border border-[#e2e8f0] px-2 py-2 text-sm"
                                                />
                                                <input
                                                    type="number"
                                                    value={range.max ?? ''}
                                                    onChange={(event) =>
                                                        updateRange(
                                                            index,
                                                            'max',
                                                            event.target
                                                                .value === ''
                                                                ? null
                                                                : Number(
                                                                      event
                                                                          .target
                                                                          .value,
                                                                  ),
                                                        )
                                                    }
                                                    placeholder={t(
                                                        'admin.settings.experience.max',
                                                    )}
                                                    className="rounded-lg border border-[#e2e8f0] px-2 py-2 text-sm"
                                                />
                                                <div className="flex items-center justify-between gap-2">
                                                    <label className="flex items-center gap-2 text-sm">
                                                        <input
                                                            type="checkbox"
                                                            checked={
                                                                range.enabled
                                                            }
                                                            onChange={(
                                                                event,
                                                            ) =>
                                                                updateRange(
                                                                    index,
                                                                    'enabled',
                                                                    event.target
                                                                        .checked,
                                                                )
                                                            }
                                                        />
                                                        {t(
                                                            'admin.settings.experience.enabled',
                                                        )}
                                                    </label>
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            removeRange(index)
                                                        }
                                                        className="text-[#b91c1c]"
                                                        aria-label={t(
                                                            'admin.settings.experience.remove',
                                                        )}
                                                    >
                                                        <Trash2 className="size-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <AdminSecondaryButton
                                        type="button"
                                        onClick={addRange}
                                    >
                                        <Plus className="size-4" />
                                        {t(
                                            'admin.settings.experience.add_range',
                                        )}
                                    </AdminSecondaryButton>
                                </>
                            )}
                            {activeTab === 'email_templates' && (
                                <>
                                    <p className="rounded-xl border border-[#dbeafe] bg-[#eff6ff] px-4 py-3 text-sm text-[#1e3a8a]">
                                        {t(
                                            'admin.settings.email_templates_help',
                                        )}
                                    </p>
                                    <p className="text-xs text-[#64748b]">
                                        {t(
                                            'admin.settings.email_template.placeholders',
                                        )}
                                    </p>
                                    <div>
                                        <label className="mb-1.5 block text-xs font-semibold text-[#3977a6]">
                                            {t(
                                                'admin.settings.email_template.subject',
                                            )}
                                        </label>
                                        <input
                                            value={String(
                                                values.subject ?? '',
                                            )}
                                            onChange={(event) =>
                                                setValue(
                                                    'subject',
                                                    event.target.value,
                                                )
                                            }
                                            className="w-full rounded-xl border border-[#e2e8f0] bg-[#f8faff] px-3 py-2.5 text-sm text-[#050315] outline-none focus:border-[#0057c8]"
                                        />
                                    </div>
                                    <div>
                                        <label className="mb-1.5 block text-xs font-semibold text-[#3977a6]">
                                            {t(
                                                'admin.settings.email_template.body',
                                            )}
                                        </label>
                                        <textarea
                                            value={String(values.body ?? '')}
                                            rows={10}
                                            onChange={(event) =>
                                                setValue(
                                                    'body',
                                                    event.target.value,
                                                )
                                            }
                                            className="w-full rounded-xl border border-[#e2e8f0] bg-[#f8faff] px-3 py-2.5 text-sm text-[#050315] outline-none focus:border-[#0057c8]"
                                        />
                                    </div>
                                </>
                            )}
                            {activeTab !== 'experience_filters' &&
                                activeTab !== 'email_templates' &&
                                Object.entries(values).map(([key, value]) => (
                                    <div key={key}>
                                        <label className="mb-1.5 block text-xs font-semibold text-[#3977a6]">
                                            {fieldLabel(key)}
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
                                        ) : key === 'bank_instructions' ? (
                                            <textarea
                                                value={String(value ?? '')}
                                                rows={4}
                                                onChange={(event) =>
                                                    setValue(
                                                        key,
                                                        event.target.value,
                                                    )
                                                }
                                                className="w-full rounded-xl border border-[#e2e8f0] bg-[#f8faff] px-3 py-2.5 text-sm text-[#050315] outline-none focus:border-[#0057c8]"
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
                                                        typeof value ===
                                                            'number'
                                                            ? Number(
                                                                  event.target
                                                                      .value,
                                                              )
                                                            : event.target
                                                                  .value,
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
