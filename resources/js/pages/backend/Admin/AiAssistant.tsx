import { Head, router, usePage } from '@inertiajs/react';
import {
    AlertTriangle,
    Bot,
    CheckCircle2,
    Globe,
    LifeBuoy,
    MessagesSquare,
    ShieldCheck,
    Sparkles,
} from 'lucide-react';
import { type FormEvent, useState } from 'react';

import {
    AdminFilterChip,
    AdminPageHeader,
    AdminPagination,
    AdminPanel,
    AdminPrimaryButton,
    AdminStatCard,
    AdminStatusBadge,
} from '@/components/admin-portal/ui';
import { useLocale } from '@/hooks/use-locale';
import AdminPortalLayout from '@/layouts/admin-portal-layout';
import { cn } from '@/lib/utils';
import type { SharedData } from '@/types';

type Settings = {
    public_chat_enabled: boolean;
    admin_assistant_enabled: boolean;
};

type ChatLogRow = {
    id: number;
    channel: 'public' | 'admin';
    channel_label: string;
    status: 'answered' | 'fallback' | 'failed';
    status_label: string;
    question: string;
    answer: string | null;
    error: string | null;
    locale: string;
    user: string | null;
    tokens: number;
    duration_ms: number | null;
    created_at: string | null;
    created_at_exact: string | null;
};

type Props = {
    settings: Settings;
    canManageSettings: boolean;
    provider: { name: string; model: string | null; configured: boolean };
    stats: {
        total: number;
        public: number;
        admin: number;
        answered: number;
        fallback: number;
        failed: number;
        tokens: number;
        sessions: number;
    };
    logs: {
        data: ChatLogRow[];
        from: number | null;
        to: number | null;
        total: number;
        links: Array<{ url: string | null; label: string; active: boolean }>;
    };
    filters: { channel: string; status: string; search: string };
};

const statusTone = {
    answered: 'success',
    fallback: 'warning',
    failed: 'danger',
} as const;

function ToggleRow({
    title,
    description,
    checked,
    disabled,
    onChange,
}: {
    title: string;
    description: string;
    checked: boolean;
    disabled: boolean;
    onChange: (value: boolean) => void;
}) {
    return (
        <div className="flex items-start justify-between gap-4 rounded-xl border border-[#e2e8f0] p-4">
            <div>
                <p className="text-sm font-bold text-[#050315]">{title}</p>
                <p className="mt-1 text-xs text-[#64748b]">{description}</p>
            </div>
            <button
                type="button"
                role="switch"
                aria-checked={checked}
                aria-label={title}
                disabled={disabled}
                onClick={() => onChange(!checked)}
                className={cn(
                    'relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-60',
                    checked ? 'bg-[#0057c8]' : 'bg-[#cbd5e1]',
                )}
            >
                <span
                    className={cn(
                        'inline-block size-5 rounded-full bg-white shadow transition-transform',
                        checked
                            ? 'translate-x-5.5 rtl:-translate-x-5.5'
                            : 'translate-x-0.5 rtl:-translate-x-0.5',
                    )}
                />
            </button>
        </div>
    );
}

export default function AiAssistant({
    settings,
    canManageSettings,
    provider,
    stats,
    logs,
    filters,
}: Props) {
    const { flash } = usePage<SharedData>().props;
    const { t } = useLocale();
    const [values, setValues] = useState<Settings>(settings);
    const [saving, setSaving] = useState(false);
    const [search, setSearch] = useState(filters.search);

    const applyFilters = (next: Partial<Props['filters']>) => {
        router.get(
            '/admin/ai-assistant',
            { ...filters, ...next },
            { preserveScroll: true, preserveState: true, replace: true },
        );
    };

    const saveSettings = () => {
        setSaving(true);
        router.put('/admin/ai-assistant/settings', values, {
            preserveScroll: true,
            onFinish: () => setSaving(false),
        });
    };

    const onSearch = (event: FormEvent) => {
        event.preventDefault();
        applyFilters({ search });
    };

    const fallbackRate =
        stats.total > 0
            ? Math.round(((stats.fallback + stats.failed) / stats.total) * 100)
            : 0;

    return (
        <AdminPortalLayout>
            <Head title={t('admin.ai_assistant.title')} />

            <div className="space-y-6 p-6">
                <AdminPageHeader
                    title={t('admin.ai_assistant.title')}
                    subtitle={t('admin.ai_assistant.subtitle')}
                />

                {flash.success && (
                    <div className="rounded-xl border border-[#bbf7d0] bg-[#f0fdf4] px-4 py-3 text-sm text-[#15803d]">
                        {typeof flash.success === 'string'
                            ? flash.success
                            : t('common.saved')}
                    </div>
                )}

                {!provider.configured ? (
                    <div className="flex items-start gap-3 rounded-xl border border-[#fde68a] bg-[#fffbeb] px-4 py-3 text-sm text-[#92400e]">
                        <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                        <p>
                            {t('admin.ai_assistant.not_configured', {
                                provider: provider.name,
                            })}
                        </p>
                    </div>
                ) : null}

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <AdminStatCard
                        label={t('admin.ai_assistant.stats.total')}
                        value={String(stats.total)}
                        icon={MessagesSquare}
                    />
                    <AdminStatCard
                        label={t('admin.ai_assistant.stats.sessions')}
                        value={String(stats.sessions)}
                        icon={Globe}
                    />
                    <AdminStatCard
                        label={t('admin.ai_assistant.stats.fallback_rate')}
                        value={`${fallbackRate}%`}
                        icon={LifeBuoy}
                        iconClassName="bg-[#fef3c7] text-[#b45309]"
                    />
                    <AdminStatCard
                        label={t('admin.ai_assistant.stats.tokens')}
                        value={stats.tokens.toLocaleString()}
                        icon={Sparkles}
                    />
                </div>

                <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
                    <AdminPanel className="space-y-4">
                        <div className="flex items-center gap-2">
                            <Bot className="size-5 text-[#0057c8]" />
                            <h2 className="text-base font-bold text-[#050315]">
                                {t('admin.ai_assistant.availability')}
                            </h2>
                        </div>

                        <ToggleRow
                            title={t('admin.ai_assistant.public_toggle')}
                            description={t(
                                'admin.ai_assistant.public_toggle_help',
                            )}
                            checked={values.public_chat_enabled}
                            disabled={!canManageSettings}
                            onChange={(value) =>
                                setValues((current) => ({
                                    ...current,
                                    public_chat_enabled: value,
                                }))
                            }
                        />
                        <ToggleRow
                            title={t('admin.ai_assistant.admin_toggle')}
                            description={t(
                                'admin.ai_assistant.admin_toggle_help',
                            )}
                            checked={values.admin_assistant_enabled}
                            disabled={!canManageSettings}
                            onChange={(value) =>
                                setValues((current) => ({
                                    ...current,
                                    admin_assistant_enabled: value,
                                }))
                            }
                        />

                        {canManageSettings ? (
                            <AdminPrimaryButton
                                onClick={saveSettings}
                                disabled={saving}
                            >
                                {saving
                                    ? t('common.saving')
                                    : t('common.save_changes')}
                            </AdminPrimaryButton>
                        ) : (
                            <p className="text-xs text-[#64748b]">
                                {t('admin.ai_assistant.read_only')}
                            </p>
                        )}
                    </AdminPanel>

                    <AdminPanel className="space-y-3 text-sm">
                        <div className="flex items-center gap-2">
                            <ShieldCheck className="size-5 text-[#0057c8]" />
                            <h2 className="text-base font-bold text-[#050315]">
                                {t('admin.ai_assistant.provider')}
                            </h2>
                        </div>
                        <dl className="space-y-2">
                            <div className="flex justify-between gap-3">
                                <dt className="text-[#64748b]">
                                    {t('admin.ai_assistant.provider_name')}
                                </dt>
                                <dd className="font-semibold text-[#050315] capitalize">
                                    {provider.name}
                                </dd>
                            </div>
                            <div className="flex justify-between gap-3">
                                <dt className="text-[#64748b]">
                                    {t('admin.ai_assistant.model')}
                                </dt>
                                <dd className="font-semibold text-[#050315]">
                                    {provider.model ??
                                        t('admin.ai_assistant.default_model')}
                                </dd>
                            </div>
                            <div className="flex justify-between gap-3">
                                <dt className="text-[#64748b]">
                                    {t('admin.ai_assistant.api_key')}
                                </dt>
                                <dd>
                                    <AdminStatusBadge
                                        tone={
                                            provider.configured
                                                ? 'success'
                                                : 'danger'
                                        }
                                        label={
                                            provider.configured
                                                ? t(
                                                      'admin.ai_assistant.configured',
                                                  )
                                                : t(
                                                      'admin.ai_assistant.missing',
                                                  )
                                        }
                                    />
                                </dd>
                            </div>
                            <div className="flex justify-between gap-3">
                                <dt className="text-[#64748b]">
                                    {t('admin.ai_assistant.channel_split')}
                                </dt>
                                <dd className="font-semibold text-[#050315]">
                                    {stats.public} / {stats.admin}
                                </dd>
                            </div>
                        </dl>
                        <p className="flex items-start gap-2 rounded-lg bg-[#f8fafc] p-3 text-xs text-[#64748b]">
                            <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-[#16a34a]" />
                            {t('admin.ai_assistant.period_note')}
                        </p>
                    </AdminPanel>
                </div>

                <AdminPanel className="space-y-4">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                        <h2 className="text-base font-bold text-[#050315]">
                            {t('admin.ai_assistant.logs')}
                        </h2>
                        <form onSubmit={onSearch} className="flex gap-2">
                            <input
                                value={search}
                                onChange={(event) =>
                                    setSearch(event.target.value)
                                }
                                placeholder={t(
                                    'admin.ai_assistant.search_placeholder',
                                )}
                                className="w-64 rounded-lg border border-[#e2e8f0] px-3 py-2 text-sm"
                            />
                            <AdminPrimaryButton type="submit">
                                {t('common.search')}
                            </AdminPrimaryButton>
                        </form>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        {[
                            ['', 'admin.ai_assistant.filter_all_channels'],
                            ['public', 'admin.ai_assistant.channel_public'],
                            ['admin', 'admin.ai_assistant.channel_admin'],
                        ].map(([value, key]) => (
                            <AdminFilterChip
                                key={`channel-${value}`}
                                active={filters.channel === value}
                                label={t(key)}
                                onClick={() => applyFilters({ channel: value })}
                            />
                        ))}
                        <span className="mx-1 w-px bg-[#e2e8f0]" />
                        {[
                            ['', 'admin.ai_assistant.filter_all_statuses'],
                            ['answered', 'admin.ai_assistant.status_answered'],
                            ['fallback', 'admin.ai_assistant.status_fallback'],
                            ['failed', 'admin.ai_assistant.status_failed'],
                        ].map(([value, key]) => (
                            <AdminFilterChip
                                key={`status-${value}`}
                                active={filters.status === value}
                                label={t(key)}
                                onClick={() => applyFilters({ status: value })}
                            />
                        ))}
                    </div>

                    {logs.data.length === 0 ? (
                        <p className="py-10 text-center text-sm text-[#64748b]">
                            {t('admin.ai_assistant.empty')}
                        </p>
                    ) : (
                        <div className="space-y-3">
                            {logs.data.map((log) => (
                                <div
                                    key={log.id}
                                    className="space-y-2 rounded-xl border border-[#e2e8f0] p-4"
                                >
                                    <div className="flex flex-wrap items-center gap-2 text-xs text-[#64748b]">
                                        <AdminStatusBadge
                                            tone={statusTone[log.status]}
                                            label={t(
                                                `admin.ai_assistant.status_${log.status}`,
                                            )}
                                        />
                                        <AdminStatusBadge
                                            tone={
                                                log.channel === 'admin'
                                                    ? 'purple'
                                                    : 'info'
                                            }
                                            label={t(
                                                `admin.ai_assistant.channel_${log.channel}`,
                                            )}
                                        />
                                        <span>
                                            {log.user ??
                                                t('admin.ai_assistant.guest')}
                                        </span>
                                        <span>·</span>
                                        <span className="uppercase">
                                            {log.locale}
                                        </span>
                                        <span>·</span>
                                        <span>
                                            {log.created_at_exact ??
                                                log.created_at}
                                        </span>
                                        {log.tokens > 0 ? (
                                            <>
                                                <span>·</span>
                                                <span>
                                                    {t(
                                                        'admin.ai_assistant.tokens_used',
                                                        { count: log.tokens },
                                                    )}
                                                </span>
                                            </>
                                        ) : null}
                                    </div>
                                    <p className="text-sm font-semibold whitespace-pre-wrap text-[#050315]">
                                        {log.question}
                                    </p>
                                    {log.answer ? (
                                        <p className="line-clamp-4 rounded-lg bg-[#f8fafc] p-3 text-sm whitespace-pre-wrap text-[#334155]">
                                            {log.answer}
                                        </p>
                                    ) : null}
                                    {log.error ? (
                                        <p className="rounded-lg bg-[#fef2f2] p-3 text-xs text-[#991b1b]">
                                            {log.error}
                                        </p>
                                    ) : null}
                                </div>
                            ))}
                        </div>
                    )}

                    <AdminPagination
                        showingLabel={t('common.showing_range', {
                            from: logs.from ?? 0,
                            to: logs.to ?? 0,
                            total: logs.total,
                        })}
                        links={logs.links}
                    />
                </AdminPanel>
            </div>
        </AdminPortalLayout>
    );
}
