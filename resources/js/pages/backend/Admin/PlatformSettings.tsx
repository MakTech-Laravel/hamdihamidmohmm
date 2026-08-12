import { Head } from '@inertiajs/react';
import { Globe, Mail, RotateCcw, Save, Settings, Shield } from 'lucide-react';
import { useState } from 'react';

import {
    AdminPageHeader,
    AdminPanel,
    AdminPrimaryButton,
    AdminSecondaryButton,
} from '@/components/admin-portal/ui';
import AdminPortalLayout from '@/layouts/admin-portal-layout';
import { cn } from '@/lib/utils';

const settingsTabs = [
    { id: 'general', label: 'General', icon: Settings },
    { id: 'email', label: 'Email', icon: Mail },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'language', label: 'Language', icon: Globe },
] as const;

const defaultSettings = {
    platformName: 'RR Job Portal',
    supportPhone: '+971 4 123 4567',
    companyAddress: 'Dubai Internet City, Building 12, Dubai, UAE',
    supportEmail: 'support@rrjobportal.ae',
    websiteUrl: 'https://www.rrjobportal.ae',
    contactEmail: 'contact@rrjobportal.ae',
};

export default function PlatformSettings() {
    const [activeTab, setActiveTab] =
        useState<(typeof settingsTabs)[number]['id']>('general');
    const [settings, setSettings] = useState(defaultSettings);

    const updateField = (field: keyof typeof settings, value: string) => {
        setSettings((prev) => ({ ...prev, [field]: value }));
    };

    const handleReset = () => {
        setSettings(defaultSettings);
    };

    return (
        <AdminPortalLayout>
            <Head title="Platform Settings" />

            <div className="space-y-6 p-6">
                <AdminPageHeader title="Platform Settings" />

                <div className="grid gap-5 lg:grid-cols-[240px_1fr]">
                    <AdminPanel className="h-fit space-y-1 p-3">
                        {settingsTabs.map((tab) => {
                            const Icon = tab.icon;

                            return (
                                <button
                                    key={tab.id}
                                    type="button"
                                    onClick={() => setActiveTab(tab.id)}
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
                        {activeTab === 'general' && (
                            <>
                                <h2 className="mb-5 text-base font-bold text-[#050315]">
                                    General Settings
                                </h2>
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div>
                                        <label className="mb-1.5 block text-xs font-semibold text-[#3977a6]">
                                            Platform Name
                                        </label>
                                        <input
                                            type="text"
                                            value={settings.platformName}
                                            onChange={(event) =>
                                                updateField(
                                                    'platformName',
                                                    event.target.value,
                                                )
                                            }
                                            className="w-full rounded-xl border border-[#e2e8f0] bg-[#f8faff] px-3 py-2.5 text-sm text-[#050315] outline-none focus:border-[#0057c8]"
                                        />
                                    </div>
                                    <div>
                                        <label className="mb-1.5 block text-xs font-semibold text-[#3977a6]">
                                            Support Phone
                                        </label>
                                        <input
                                            type="text"
                                            value={settings.supportPhone}
                                            onChange={(event) =>
                                                updateField(
                                                    'supportPhone',
                                                    event.target.value,
                                                )
                                            }
                                            className="w-full rounded-xl border border-[#e2e8f0] bg-[#f8faff] px-3 py-2.5 text-sm text-[#050315] outline-none focus:border-[#0057c8]"
                                        />
                                    </div>
                                    <div className="sm:col-span-2">
                                        <label className="mb-1.5 block text-xs font-semibold text-[#3977a6]">
                                            Company Address
                                        </label>
                                        <input
                                            type="text"
                                            value={settings.companyAddress}
                                            onChange={(event) =>
                                                updateField(
                                                    'companyAddress',
                                                    event.target.value,
                                                )
                                            }
                                            className="w-full rounded-xl border border-[#e2e8f0] bg-[#f8faff] px-3 py-2.5 text-sm text-[#050315] outline-none focus:border-[#0057c8]"
                                        />
                                    </div>
                                    <div>
                                        <label className="mb-1.5 block text-xs font-semibold text-[#3977a6]">
                                            Support Email
                                        </label>
                                        <input
                                            type="email"
                                            value={settings.supportEmail}
                                            onChange={(event) =>
                                                updateField(
                                                    'supportEmail',
                                                    event.target.value,
                                                )
                                            }
                                            className="w-full rounded-xl border border-[#e2e8f0] bg-[#f8faff] px-3 py-2.5 text-sm text-[#050315] outline-none focus:border-[#0057c8]"
                                        />
                                    </div>
                                    <div>
                                        <label className="mb-1.5 block text-xs font-semibold text-[#3977a6]">
                                            Website URL
                                        </label>
                                        <input
                                            type="url"
                                            value={settings.websiteUrl}
                                            onChange={(event) =>
                                                updateField(
                                                    'websiteUrl',
                                                    event.target.value,
                                                )
                                            }
                                            className="w-full rounded-xl border border-[#e2e8f0] bg-[#f8faff] px-3 py-2.5 text-sm text-[#050315] outline-none focus:border-[#0057c8]"
                                        />
                                    </div>
                                    <div className="sm:col-span-2">
                                        <label className="mb-1.5 block text-xs font-semibold text-[#3977a6]">
                                            Contact Email
                                        </label>
                                        <input
                                            type="email"
                                            value={settings.contactEmail}
                                            onChange={(event) =>
                                                updateField(
                                                    'contactEmail',
                                                    event.target.value,
                                                )
                                            }
                                            className="w-full rounded-xl border border-[#e2e8f0] bg-[#f8faff] px-3 py-2.5 text-sm text-[#050315] outline-none focus:border-[#0057c8]"
                                        />
                                    </div>
                                </div>

                                <div className="mt-6 flex gap-2">
                                    <AdminPrimaryButton>
                                        <Save className="size-4" />
                                        Save Changes
                                    </AdminPrimaryButton>
                                    <AdminSecondaryButton onClick={handleReset}>
                                        <RotateCcw className="size-4" />
                                        Reset to Default
                                    </AdminSecondaryButton>
                                </div>
                            </>
                        )}

                        {activeTab !== 'general' && (
                            <div className="flex flex-col items-center justify-center py-16 text-center">
                                <Settings className="size-10 text-[#94a3b8]" />
                                <h2 className="mt-3 text-base font-bold text-[#050315]">
                                    {settingsTabs.find(
                                        (t) => t.id === activeTab,
                                    )?.label}{' '}
                                    Settings
                                </h2>
                                <p className="mt-1 text-sm text-[#64748b]">
                                    Configuration options for this section will
                                    be available soon.
                                </p>
                            </div>
                        )}
                    </AdminPanel>
                </div>
            </div>
        </AdminPortalLayout>
    );
}
