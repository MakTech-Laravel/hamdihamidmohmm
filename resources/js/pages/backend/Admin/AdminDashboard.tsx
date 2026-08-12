import { Head, Link, usePage } from '@inertiajs/react';
import {
    AlertTriangle,
    ArrowDownRight,
    ArrowUpRight,
    Briefcase,
    Building2,
    CheckCircle2,
    CreditCard,
    Shield,
    UserRound,
    Users,
} from 'lucide-react';

import AdminPortalLayout from '@/layouts/admin-portal-layout';
import { cn } from '@/lib/utils';
import type { SharedData } from '@/types';

type DashboardProps = {
    stats: {
        total_employers: number;
        total_job_seekers: number;
        active_jobs: number;
        pending_jobs: number;
        applications_today: number;
        monthly_revenue: number;
        total_revenue: number;
        pending_verifications: number;
        total_users: number;
        total_admins: number;
    };
    quickStats: {
        active_sessions: number;
        unread_alerts: number;
        tasks_today: number;
    };
    recentUsers: Array<{
        id: number;
        name: string;
        email: string;
        role_label: string;
        created_at: string | null;
    }>;
    alerts: Array<{ title: string; tone: string; detail: string }>;
    canCreateAdmins: boolean;
    firstName: string;
};

const toneStyles: Record<string, string> = {
    danger: 'border-[#fecaca] bg-[#fef2f2] text-[#b91c1c]',
    warning: 'border-[#fed7aa] bg-[#fff7ed] text-[#c2410c]',
    caution: 'border-[#fde68a] bg-[#fffbeb] text-[#b45309]',
    info: 'border-[#bfdbfe] bg-[#eff6ff] text-[#1d4ed8]',
};

export default function AdminDashboard({
    stats,
    quickStats,
    recentUsers,
    alerts,
    canCreateAdmins,
    firstName,
}: DashboardProps) {
    const { auth } = usePage<SharedData>().props;

    const metricCards = [
        {
            label: 'Total Employers',
            value: stats.total_employers.toLocaleString(),
            trend: '+12.4%',
            up: true,
            icon: Building2,
            iconBg: 'bg-[#dbeafe] text-[#1d4ed8]',
        },
        {
            label: 'Total Job Seekers',
            value: stats.total_job_seekers.toLocaleString(),
            trend: '+8.7%',
            up: true,
            icon: UserRound,
            iconBg: 'bg-[#dcfce7] text-[#15803d]',
        },
        {
            label: 'Active Jobs',
            value: stats.active_jobs.toLocaleString(),
            trend: '+5.2%',
            up: true,
            icon: Briefcase,
            iconBg: 'bg-[#e9d5ff] text-[#7e22ce]',
        },
        {
            label: 'Pending Jobs',
            value: stats.pending_jobs.toLocaleString(),
            trend: '-3.1%',
            up: false,
            icon: AlertTriangle,
            iconBg: 'bg-[#ffedd5] text-[#c2410c]',
        },
        {
            label: 'Applications Today',
            value: stats.applications_today.toLocaleString(),
            trend: '+18.9%',
            up: true,
            icon: CheckCircle2,
            iconBg: 'bg-[#dbeafe] text-[#0057c8]',
        },
        {
            label: 'Monthly Revenue',
            value: `AED ${stats.monthly_revenue.toLocaleString()}`,
            trend: '+10.6%',
            up: true,
            icon: CreditCard,
            iconBg: 'bg-[#fef3c7] text-[#b45309]',
        },
        {
            label: 'Total Users',
            value: stats.total_users.toLocaleString(),
            trend: '+6.1%',
            up: true,
            icon: Users,
            iconBg: 'bg-[#e0e7ff] text-[#4338ca]',
        },
        {
            label: 'Total Admins',
            value: stats.total_admins.toLocaleString(),
            trend: 'Live',
            up: true,
            icon: Shield,
            iconBg: 'bg-[#fce7f3] text-[#be185d]',
        },
    ];

    return (
        <AdminPortalLayout>
            <Head title="Admin Dashboard" />

            <div className="space-y-6 p-6">
                <div
                    className="flex flex-col gap-6 rounded-2xl p-7 text-white shadow-[0px_4px_10px_rgba(0,87,200,0.2)] lg:flex-row lg:items-center lg:justify-between"
                    style={{
                        backgroundImage:
                            'linear-gradient(120deg, #0057c8 0%, #3977a6 55%, #e57124 140%)',
                    }}
                >
                    <div>
                        <h1 className="text-3xl font-extrabold text-white">
                            Welcome back, {firstName}
                        </h1>
                        <p className="mt-2 max-w-xl text-sm text-white/80">
                            Manage the entire RR Job Portal ecosystem from one
                            centralized workspace.
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                        {[
                            {
                                label: 'Active Sessions',
                                value: quickStats.active_sessions,
                            },
                            {
                                label: 'Unread Alerts',
                                value: quickStats.unread_alerts,
                            },
                            {
                                label: 'Tasks Today',
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
                                <p className="text-xs text-[#bfdbfe]">
                                    {item.label}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    {metricCards.map((card) => {
                        const Icon = card.icon;

                        return (
                            <div
                                key={card.label}
                                className="rounded-2xl border border-[#e2e8f0] bg-white p-4 shadow-[0px_1px_3px_rgba(0,0,0,0.06)]"
                            >
                                <div className="flex items-start justify-between">
                                    <div
                                        className={cn(
                                            'flex size-10 items-center justify-center rounded-xl',
                                            card.iconBg,
                                        )}
                                    >
                                        <Icon className="size-5" />
                                    </div>
                                    <span
                                        className={cn(
                                            'inline-flex items-center gap-0.5 text-xs font-semibold',
                                            card.up
                                                ? 'text-[#15803d]'
                                                : 'text-[#b91c1c]',
                                        )}
                                    >
                                        {card.up ? (
                                            <ArrowUpRight className="size-3.5" />
                                        ) : (
                                            <ArrowDownRight className="size-3.5" />
                                        )}
                                        {card.trend}
                                    </span>
                                </div>
                                <p className="mt-3 text-2xl font-extrabold text-[#101828]">
                                    {card.value}
                                </p>
                                <p className="mt-1 text-xs font-medium text-[#6a7282]">
                                    {card.label}
                                </p>
                            </div>
                        );
                    })}
                </div>

                <div className="grid gap-5 xl:grid-cols-[1.4fr_0.8fr]">
                    <div className="rounded-2xl border border-[#e2e8f0] bg-white p-5 shadow-[0px_1px_3px_rgba(0,0,0,0.06)]">
                        <div className="mb-4 flex items-center justify-between">
                            <div>
                                <h2 className="text-base font-bold text-[#101828]">
                                    Revenue Analytics
                                </h2>
                                <p className="text-xs text-[#99a1af]">
                                    Monthly revenue trend – 2024
                                </p>
                            </div>
                            <div className="flex gap-1">
                                {['7D', '30D', '90D', '12M'].map((range) => (
                                    <span
                                        key={range}
                                        className={cn(
                                            'rounded-lg px-2.5 py-1 text-[11px] font-semibold',
                                            range === '12M'
                                                ? 'bg-[#0057c8] text-white'
                                                : 'bg-[#f8faff] text-[#64748b]',
                                        )}
                                    >
                                        {range}
                                    </span>
                                ))}
                            </div>
                        </div>
                        <div className="relative h-52 overflow-hidden rounded-xl bg-[#f8faff]">
                            <svg
                                viewBox="0 0 640 200"
                                className="h-full w-full"
                                preserveAspectRatio="none"
                            >
                                <polyline
                                    fill="none"
                                    stroke="#0057c8"
                                    strokeWidth="3"
                                    points="20,150 80,130 140,140 200,100 260,110 320,70 380,90 440,55 500,75 560,40 620,60"
                                />
                                <polyline
                                    fill="none"
                                    stroke="#e57124"
                                    strokeWidth="2"
                                    strokeDasharray="6 4"
                                    points="20,160 80,155 140,150 200,145 260,130 320,125 380,120 440,110 500,105 560,95 620,90"
                                />
                            </svg>
                        </div>
                    </div>

                    <div className="rounded-2xl border border-[#e2e8f0] bg-white p-5 shadow-[0px_1px_3px_rgba(0,0,0,0.06)]">
                        <h2 className="text-base font-bold text-[#101828]">
                            Package Distribution
                        </h2>
                        <p className="text-xs text-[#99a1af]">
                            Active subscribers by plan
                        </p>
                        <div className="mt-5 flex items-center gap-5">
                            <div
                                className="size-32 rounded-full"
                                style={{
                                    background:
                                        'conic-gradient(#0057c8 0 38%, #3b82f6 38% 67%, #93c5fd 67% 85%, #e57124 85% 100%)',
                                }}
                            />
                            <div className="space-y-2 text-xs">
                                {[
                                    ['Starter', '38%', '#0057c8'],
                                    ['Professional', '29%', '#3b82f6'],
                                    ['Enterprise', '18%', '#93c5fd'],
                                    ['Premium', '15%', '#e57124'],
                                ].map(([label, value, color]) => (
                                    <div
                                        key={label}
                                        className="flex items-center gap-2"
                                    >
                                        <span
                                            className="size-2.5 rounded-full"
                                            style={{ background: color }}
                                        />
                                        <span className="text-[#64748b]">
                                            {label}
                                        </span>
                                        <span className="font-semibold text-[#101828]">
                                            {value}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid gap-5 xl:grid-cols-[1.2fr_0.9fr_0.9fr]">
                    <div className="rounded-2xl border border-[#e2e8f0] bg-white p-5 shadow-[0px_1px_3px_rgba(0,0,0,0.06)]">
                        <div className="mb-4 flex items-center justify-between">
                            <h2 className="text-base font-bold text-[#101828]">
                                Quick Actions
                            </h2>
                        </div>
                        <div className="space-y-2">
                            {[
                                {
                                    label: 'Manage Users',
                                    href: '/admin/users',
                                },
                                {
                                    label: 'Create Admin',
                                    href: canCreateAdmins
                                        ? '/admin/admins'
                                        : null,
                                },
                                {
                                    label: 'Review Roles & Permissions',
                                    href: '/admin/roles-permissions',
                                },
                                {
                                    label: 'Open Admin Portal Home',
                                    href: '/admin/dashboard',
                                },
                            ].map((action) =>
                                action.href ? (
                                    <Link
                                        key={action.label}
                                        href={action.href}
                                        className="flex items-center justify-between rounded-xl border border-[#e2e8f0] px-4 py-3 text-sm font-medium text-[#101828] transition-colors hover:bg-[#f8faff]"
                                    >
                                        {action.label}
                                        <span className="text-[#0057c8]">→</span>
                                    </Link>
                                ) : (
                                    <div
                                        key={action.label}
                                        className="flex items-center justify-between rounded-xl border border-[#e2e8f0] px-4 py-3 text-sm font-medium text-[#99a1af]"
                                    >
                                        {action.label}
                                        <span>Locked</span>
                                    </div>
                                ),
                            )}
                        </div>
                    </div>

                    <div className="rounded-2xl border border-[#e2e8f0] bg-white p-5 shadow-[0px_1px_3px_rgba(0,0,0,0.06)]">
                        <div className="mb-4 flex items-center justify-between">
                            <h2 className="text-base font-bold text-[#101828]">
                                Platform Alerts
                            </h2>
                            <span className="rounded-full bg-[#fef2f2] px-2.5 py-0.5 text-xs font-semibold text-[#b91c1c]">
                                {alerts.length} Active
                            </span>
                        </div>
                        <div className="space-y-3">
                            {alerts.map((alert) => (
                                <div
                                    key={alert.title}
                                    className={cn(
                                        'rounded-xl border px-3 py-3',
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
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="rounded-2xl border border-[#e2e8f0] bg-white p-5 shadow-[0px_1px_3px_rgba(0,0,0,0.06)]">
                        <div className="mb-4 flex items-center justify-between">
                            <h2 className="text-base font-bold text-[#101828]">
                                Activity Feed
                            </h2>
                            <Link
                                href="/admin/users"
                                className="text-xs font-bold text-[#0057c8]"
                            >
                                View All
                            </Link>
                        </div>
                        <div className="space-y-3">
                            {recentUsers.map((user) => (
                                <div
                                    key={user.id}
                                    className="flex items-start gap-3"
                                >
                                    <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#dbeafe] text-xs font-bold text-[#1d4ed8]">
                                        {user.name.slice(0, 1).toUpperCase()}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="truncate text-sm font-semibold text-[#101828]">
                                            {user.name}
                                        </p>
                                        <p className="text-xs text-[#64748b]">
                                            {user.role_label} · {user.email}
                                        </p>
                                        <p className="text-[11px] text-[#99a1af]">
                                            {user.created_at}
                                        </p>
                                    </div>
                                </div>
                            ))}
                            {recentUsers.length === 0 && (
                                <p className="text-sm text-[#99a1af]">
                                    No recent activity yet.
                                </p>
                            )}
                        </div>
                        <p className="mt-4 text-xs text-[#99a1af]">
                            Signed in as {auth.user.role_label}
                        </p>
                    </div>
                </div>
            </div>
        </AdminPortalLayout>
    );
}
