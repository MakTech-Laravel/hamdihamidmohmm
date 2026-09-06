import { Head, Link, router, usePage } from '@inertiajs/react';

import { AdminIcon } from '@/components/admin-icon';
import { useLocale } from '@/hooks/use-locale';
import AdminPortalLayout from '@/layouts/admin-portal-layout';
import { cn } from '@/lib/utils';
import type { SharedData } from '@/types';

type Trend = {
    label: string;
    up: boolean;
};

type PackageSlice = {
    value: string;
    label: string;
    count: number;
    percent: number;
    color: string;
};

type DashboardProps = {
    stats: {
        total_employers: number;
        total_job_seekers: number;
        active_employers: number;
        pending_verifications: number;
        active_job_seekers: number;
        suspended_accounts: number;
        total_users: number;
        total_admins: number;
        active_jobs: number;
        pending_jobs: number;
        applications_today: number;
        monthly_revenue: number;
        currency: string;
    };
    trends: Record<string, Trend>;
    quickStats: {
        active_sessions: number;
        unread_alerts: number;
        tasks_today: number;
    };
    chart: {
        range: string;
        labels: string[];
        employers: number[];
        job_seekers: number[];
    };
    packages: PackageSlice[];
    alerts: Array<{
        title: string;
        tone: string;
        detail: string;
        href: string;
    }>;
    activities: Array<{
        id: number;
        action_label: string;
        description: string;
        subject_name: string;
        actor_name: string | null;
        created_at: string | null;
    }>;
    canCreateAdmins: boolean;
    firstName: string;
};

const toneStyles: Record<string, string> = {
    danger: 'border-[#fecaca] bg-[#fef2f2] text-[#b91c1c]',
    warning: 'border-[#fed7aa] bg-[#fff7ed] text-[#c2410c]',
    caution: 'border-[#fde68a] bg-[#fffbeb] text-[#b45309]',
    info: 'border-[#bfdbfe] bg-[#eff6ff] text-[#1d4ed8]',
};

const rangeOptionKeys = [
    ['7d', 'admin.dashboard.range.7d'],
    ['30d', 'admin.dashboard.range.30d'],
    ['90d', 'admin.dashboard.range.90d'],
    ['12m', 'admin.dashboard.range.12m'],
] as const;

function toPoints(values: number[], width = 640, height = 200, pad = 20): string {
    const max = Math.max(...values, 1);

    return values
        .map((value, index) => {
            const x =
                pad +
                (index * (width - pad * 2)) / Math.max(values.length - 1, 1);
            const y = height - pad - (value / max) * (height - pad * 2);

            return `${x},${y}`;
        })
        .join(' ');
}

function packageGradient(packages: PackageSlice[]): string {
    let cursor = 0;
    const stops = packages.map((slice) => {
        const start = cursor;
        cursor += slice.percent;

        return `${slice.color} ${start}% ${cursor}%`;
    });

    if (stops.length === 0 || packages.every((slice) => slice.count === 0)) {
        return 'conic-gradient(#e2e8f0 0 100%)';
    }

    return `conic-gradient(${stops.join(', ')})`;
}

export default function AdminDashboard({
    stats,
    trends,
    quickStats,
    chart,
    packages,
    alerts,
    activities,
    canCreateAdmins,
    firstName,
}: DashboardProps) {
    const { auth } = usePage<SharedData>().props;
    const { t } = useLocale();
    const chartHasData =
        chart.employers.some((value) => value > 0) ||
        chart.job_seekers.some((value) => value > 0);
    const packageTotal = packages.reduce((sum, slice) => sum + slice.count, 0);

    const metricCards = [
        {
            key: 'total_employers',
            label: t('admin.dashboard.total_employers'),
            value: stats.total_employers.toLocaleString(),
            href: '/admin/employers',
            icon: '/images/admin/stat-employers.svg',
            iconBg: 'bg-[#eef2ff]',
        },
        {
            key: 'total_job_seekers',
            label: t('admin.dashboard.total_seekers'),
            value: stats.total_job_seekers.toLocaleString(),
            href: '/admin/job-seekers',
            icon: '/images/admin/stat-job-seekers.svg',
            iconBg: 'bg-[#f0f9ff]',
        },
        {
            key: 'active_jobs',
            label: t('admin.dashboard.active_jobs'),
            value: stats.active_jobs.toLocaleString(),
            href: '/admin/jobs?status=active',
            icon: '/images/admin/stat-active-jobs.svg',
            iconBg: 'bg-[#f0fdf4]',
        },
        {
            key: 'pending_jobs',
            label: t('admin.dashboard.pending_jobs'),
            value: stats.pending_jobs.toLocaleString(),
            href: '/admin/jobs?status=pending',
            icon: '/images/admin/stat-pending-jobs.svg',
            iconBg: 'bg-[#fffbeb]',
        },
        {
            key: 'applications_today',
            label: t('admin.dashboard.applications_today'),
            value: stats.applications_today.toLocaleString(),
            href: '/admin/applications',
            icon: '/images/admin/stat-applications.svg',
            iconBg: 'bg-[#f5f3ff]',
        },
        {
            key: 'monthly_revenue',
            label: t('admin.dashboard.monthly_revenue'),
            value: `${stats.currency} ${stats.monthly_revenue.toLocaleString()}`,
            href: '/admin/payments',
            icon: '/images/admin/stat-monthly-revenue.svg',
            iconBg: 'bg-[#fff1f2]',
        },
        {
            key: 'pending_verifications',
            label: t('admin.dashboard.pending_verifications'),
            value: stats.pending_verifications.toLocaleString(),
            href: '/admin/verifications',
            icon: '/images/admin/stat-verifications.svg',
            iconBg: 'bg-[#fff7ed]',
        },
        {
            key: 'total_users',
            label: t('admin.dashboard.total_users'),
            value: stats.total_users.toLocaleString(),
            href: '/admin/users' as string | null,
            icon: '/images/admin/stat-job-seekers.svg',
            iconBg: 'bg-[#e0e7ff]',
        },
    ];

    return (
        <AdminPortalLayout>
            <Head title={t('admin.dashboard.title')} />

            <div className="space-y-6 p-6">
                <div
                    className="flex flex-col gap-6 rounded-2xl p-7 text-white shadow-[0px_4px_10px_rgba(0,87,200,0.2)] lg:flex-row lg:items-center lg:justify-between"
                    style={{
                        backgroundImage:
                            'linear-gradient(176deg, rgb(50, 57, 129) 0%, rgb(229, 113, 36) 100%)',
                    }}
                >
                    <div>
                        <h1 className="text-3xl font-extrabold text-white">
                            {t('admin.dashboard.welcome', { name: firstName })}
                        </h1>
                        <p className="mt-2 max-w-xl text-sm text-[#d1f6ff]">
                            {t('admin.dashboard.subtitle')}
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                        {[
                            {
                                label: t('admin.dashboard.active_sessions'),
                                value: quickStats.active_sessions,
                            },
                            {
                                label: t('admin.dashboard.unread_alerts'),
                                value: quickStats.unread_alerts,
                            },
                            {
                                label: t('admin.dashboard.tasks_today'),
                                value: quickStats.tasks_today,
                            },
                        ].map((item) => (
                            <div
                                key={item.label}
                                className="rounded-xl bg-white/10 px-4 py-3 backdrop-blur"
                            >
                                <p className="text-xl font-extrabold">
                                    {item.value}
                                </p>
                                <p className="text-xs text-[#d1f6ff]">
                                    {item.label}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    {metricCards.map((card) => {
                        const trend = trends[card.key] ?? {
                            label: '—',
                            up: true,
                        };
                        const content = (
                            <>
                                <div className="flex items-start justify-between">
                                    <div
                                        className={cn(
                                            'flex size-9 items-center justify-center rounded-lg',
                                            card.iconBg,
                                        )}
                                    >
                                        <AdminIcon src={card.icon} size={18} />
                                    </div>
                                    <span
                                        className={cn(
                                            'inline-flex items-center gap-1 text-[11px] font-semibold',
                                            trend.up
                                                ? 'text-[#10b981]'
                                                : 'text-[#ef4444]',
                                        )}
                                    >
                                        <AdminIcon
                                            src={
                                                trend.up
                                                    ? '/images/admin/stat-trend-up.svg'
                                                    : '/images/admin/stat-trend-down.svg'
                                            }
                                            size={12}
                                        />
                                        {trend.label}
                                    </span>
                                </div>
                                <p className="mt-3 text-2xl font-extrabold text-[#101828]">
                                    {card.value}
                                </p>
                                <p className="mt-1 text-xs font-medium text-[#6a7282]">
                                    {card.label}
                                </p>
                            </>
                        );

                        return card.href ? (
                            <Link
                                key={card.key}
                                href={card.href}
                                className="rounded-2xl border border-[#e2e8f0] bg-white p-4 shadow-[0px_1px_3px_rgba(0,0,0,0.06)] transition-colors hover:border-[#bfdbfe] hover:bg-[#f8faff]"
                            >
                                {content}
                            </Link>
                        ) : (
                            <div
                                key={card.key}
                                className="rounded-2xl border border-[#e2e8f0] bg-white p-4 shadow-[0px_1px_3px_rgba(0,0,0,0.06)]"
                            >
                                {content}
                            </div>
                        );
                    })}
                </div>

                <div className="grid gap-5 xl:grid-cols-[1.4fr_0.8fr]">
                    <div className="rounded-2xl border border-[#e2e8f0] bg-white p-5 shadow-[0px_1px_3px_rgba(0,0,0,0.06)]">
                        <div className="mb-4 flex items-center justify-between gap-3">
                            <div>
                                <h2 className="text-base font-bold text-[#101828]">
                                    {t('admin.dashboard.registration_analytics')}
                                </h2>
                                <p className="text-xs text-[#99a1af]">
                                    {t('admin.dashboard.registration_subtitle')}
                                </p>
                            </div>
                            <div className="flex gap-1">
                                {rangeOptionKeys.map(([value, labelKey]) => (
                                    <button
                                        key={value}
                                        type="button"
                                        className={cn(
                                            'rounded-lg px-2.5 py-1 text-[11px] font-semibold',
                                            chart.range === value
                                                ? 'bg-[#0057c8] text-white'
                                                : 'bg-[#f8faff] text-[#64748b] hover:bg-[#eef2ff]',
                                        )}
                                        onClick={() =>
                                            router.get(
                                                '/admin/dashboard',
                                                { range: value },
                                                {
                                                    preserveState: true,
                                                    replace: true,
                                                },
                                            )
                                        }
                                    >
                                        {t(labelKey)}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="relative h-52 overflow-hidden rounded-xl bg-[#f8faff]">
                            {chartHasData ? (
                                <svg
                                    viewBox="0 0 640 200"
                                    className="h-full w-full"
                                    preserveAspectRatio="none"
                                >
                                    <polyline
                                        fill="none"
                                        stroke="#0057c8"
                                        strokeWidth="3"
                                        points={toPoints(chart.employers)}
                                    />
                                    <polyline
                                        fill="none"
                                        stroke="#e57124"
                                        strokeWidth="2"
                                        strokeDasharray="6 4"
                                        points={toPoints(chart.job_seekers)}
                                    />
                                </svg>
                            ) : (
                                <div className="flex h-full items-center justify-center text-sm text-[#99a1af]">
                                    {t('admin.dashboard.no_registrations')}
                                </div>
                            )}
                        </div>
                        <div className="mt-3 flex gap-4 text-xs text-[#64748b]">
                            <span className="inline-flex items-center gap-1.5">
                                <span className="size-2 rounded-full bg-[#0057c8]" />
                                {t('admin.dashboard.legend.employers')}
                            </span>
                            <span className="inline-flex items-center gap-1.5">
                                <span className="size-2 rounded-full bg-[#e57124]" />
                                {t('admin.dashboard.legend.job_seekers')}
                            </span>
                        </div>
                    </div>

                    <div className="rounded-2xl border border-[#e2e8f0] bg-white p-5 shadow-[0px_1px_3px_rgba(0,0,0,0.06)]">
                        <h2 className="text-base font-bold text-[#101828]">
                            {t('admin.dashboard.package_distribution')}
                        </h2>
                        <p className="text-xs text-[#99a1af]">
                            {t('admin.dashboard.package_subtitle')}
                        </p>
                        {packageTotal === 0 ? (
                            <p className="mt-8 text-sm text-[#99a1af]">
                                {t('admin.dashboard.no_packages')}
                            </p>
                        ) : (
                            <div className="mt-5 flex items-center gap-5">
                                <div
                                    className="size-32 rounded-full"
                                    style={{
                                        background: packageGradient(packages),
                                    }}
                                />
                                <div className="space-y-2 text-xs">
                                    {packages.map((slice) => (
                                        <div
                                            key={slice.value}
                                            className="flex items-center gap-2"
                                        >
                                            <span
                                                className="size-2.5 rounded-full"
                                                style={{
                                                    background: slice.color,
                                                }}
                                            />
                                            <span className="text-[#64748b]">
                                                {slice.label}
                                            </span>
                                            <span className="font-semibold text-[#101828]">
                                                {slice.percent}%
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="grid gap-5 xl:grid-cols-[1.2fr_0.9fr_0.9fr]">
                    <div className="rounded-2xl border border-[#e2e8f0] bg-white p-5 shadow-[0px_1px_3px_rgba(0,0,0,0.06)]">
                        <div className="mb-4 flex items-center justify-between">
                            <h2 className="text-base font-bold text-[#101828]">
                                {t('admin.dashboard.quick_actions')}
                            </h2>
                        </div>
                        <div className="space-y-2">
                            {[
                                {
                                    label: t('admin.dashboard.manage_employers'),
                                    href: '/admin/employers',
                                },
                                {
                                    label: t('admin.dashboard.manage_job_seekers'),
                                    href: '/admin/job-seekers',
                                },
                                {
                                    label: t('admin.dashboard.manage_users'),
                                    href: '/admin/users',
                                },
                                {
                                    label: t('admin.dashboard.create_admin'),
                                    href: canCreateAdmins
                                        ? '/admin/admins'
                                        : null,
                                },
                                {
                                    label: t('admin.dashboard.review_roles'),
                                    href: '/admin/roles-permissions',
                                },
                            ].map((action) =>
                                action.href ? (
                                    <Link
                                        key={action.label}
                                        href={action.href}
                                        className="flex items-center justify-between rounded-xl border border-[#e2e8f0] px-4 py-3 text-sm font-medium text-[#101828] transition-colors hover:bg-[#f8faff]"
                                    >
                                        {action.label}
                                        <span className="text-[#0057c8]">
                                            →
                                        </span>
                                    </Link>
                                ) : (
                                    <div
                                        key={action.label}
                                        className="flex items-center justify-between rounded-xl border border-[#e2e8f0] px-4 py-3 text-sm font-medium text-[#99a1af]"
                                    >
                                        {action.label}
                                        <span>{t('status.locked')}</span>
                                    </div>
                                ),
                            )}
                        </div>
                    </div>

                    <div className="rounded-2xl border border-[#e2e8f0] bg-white p-5 shadow-[0px_1px_3px_rgba(0,0,0,0.06)]">
                        <div className="mb-4 flex items-center justify-between">
                            <h2 className="text-base font-bold text-[#101828]">
                                {t('admin.dashboard.platform_alerts')}
                            </h2>
                            <span
                                className={cn(
                                    'rounded-full px-2.5 py-0.5 text-xs font-semibold',
                                    alerts.length > 0
                                        ? 'bg-[#fef2f2] text-[#b91c1c]'
                                        : 'bg-[#f0fdf4] text-[#15803d]',
                                )}
                            >
                                {alerts.length > 0
                                    ? t('admin.dashboard.alerts_active', { count: alerts.length })
                                    : t('admin.dashboard.all_clear')}
                            </span>
                        </div>
                        <div className="space-y-3">
                            {alerts.length === 0 && (
                                <p className="text-sm text-[#99a1af]">
                                    {t('admin.dashboard.no_alerts')}
                                </p>
                            )}
                            {alerts.map((alert) => (
                                <Link
                                    key={alert.title}
                                    href={alert.href}
                                    className={cn(
                                        'block rounded-xl border px-3 py-3',
                                        toneStyles[alert.tone] ??
                                        toneStyles.info,
                                    )}
                                >
                                    <p className="text-sm font-semibold">
                                        {alert.title}
                                    </p>
                                    <p className="mt-0.5 text-xs opacity-80">
                                        {alert.detail}
                                    </p>
                                </Link>
                            ))}
                        </div>
                    </div>

                    <div className="rounded-2xl border border-[#e2e8f0] bg-white p-5 shadow-[0px_1px_3px_rgba(0,0,0,0.06)]">
                        <div className="mb-4 flex items-center justify-between">
                            <h2 className="text-base font-bold text-[#101828]">
                                {t('admin.dashboard.activity_feed')}
                            </h2>
                            <Link
                                href="/admin/users"
                                className="text-xs font-bold text-[#0057c8]"
                            >
                                {t('common.view_all')}
                            </Link>
                        </div>
                        <div className="space-y-3">
                            {activities.map((item) => (
                                <div
                                    key={item.id}
                                    className="flex items-start gap-3"
                                >
                                    <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#dbeafe] text-xs font-bold text-[#1d4ed8]">
                                        {item.subject_name
                                            .slice(0, 1)
                                            .toUpperCase()}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="truncate text-sm font-semibold text-[#101828]">
                                            {item.action_label}
                                        </p>
                                        <p className="truncate text-xs text-[#64748b]">
                                            {item.subject_name}
                                            {item.description
                                                ? ` · ${item.description}`
                                                : ''}
                                        </p>
                                        <p className="text-[11px] text-[#99a1af]">
                                            {item.actor_name ?? t('common.system')} ·{' '}
                                            {item.created_at}
                                        </p>
                                    </div>
                                </div>
                            ))}
                            {activities.length === 0 && (
                                <p className="text-sm text-[#99a1af]">
                                    {t('admin.dashboard.no_activity')}
                                </p>
                            )}
                        </div>
                        <p className="mt-4 text-xs text-[#99a1af]">
                            {t('admin.dashboard.signed_in_as', { role: auth.user.role_label ?? '' })}
                        </p>
                    </div>
                </div>
            </div>
        </AdminPortalLayout>
    );
}
