import { Head, Link, usePage } from '@inertiajs/react';

import {
    EMPLOYER_QUICK_ACTIONS,
    firstName,
    getInitials,
} from '@/components/employer/demo-data';
import EmployerLayout from '@/layouts/employer-layout';
import { cn } from '@/lib/utils';
import type { SharedData } from '@/types';

type Plan = {
    slug: string | null;
    label: string | null;
    job_credits: number;
    jobs_posted: number;
    credits_remaining: number;
    expires_on: string | null;
    days_remaining: number | null;
    is_verified: boolean;
    can_post_job: boolean;
};

type Props = {
    stats: {
        total_jobs: number;
        active_jobs: number;
        total_applications: number;
        new_this_week: number;
    };
    plan: Plan;
    active_jobs: Array<{
        id: number;
        title: string;
        location: string | null;
        type: string | null;
        applications: number;
        expires_at: string | null;
        days_left: number | null;
    }>;
    recent_applications: Array<{
        id: number;
        name: string | null;
        job: string | null;
        status: string | null;
        status_value: string | null;
        date: string | null;
    }>;
    notifications: Array<{
        id: string;
        title: string;
        message: string;
        category: string;
        created_at: string | null;
    }>;
    first_name: string;
};

const cardClass =
    'rounded-2xl border border-[#e8d5e8] bg-white shadow-[0px_2px_4px_rgba(5,3,21,0.06)]';

const applicationTone: Record<
    string,
    { wrap: string; dot: string; text: string }
> = {
    interview: {
        wrap: 'bg-[#fdf4ff]',
        dot: 'bg-[#a855f7]',
        text: 'text-[#7e22ce]',
    },
    shortlisted: {
        wrap: 'bg-[#f0fdf4]',
        dot: 'bg-[#22c55e]',
        text: 'text-[#15803d]',
    },
    under_review: {
        wrap: 'bg-[#fff7ed]',
        dot: 'bg-[#e57124]',
        text: 'text-[#c2410c]',
    },
    applied: {
        wrap: 'bg-[#e6f0fb]',
        dot: 'bg-[#0057c8]',
        text: 'text-[#0057c8]',
    },
    offer: {
        wrap: 'bg-[#eef2ff]',
        dot: 'bg-[#4338ca]',
        text: 'text-[#4338ca]',
    },
    hired: {
        wrap: 'bg-[#dcfce7]',
        dot: 'bg-[#16a34a]',
        text: 'text-[#166534]',
    },
    rejected: {
        wrap: 'bg-[#fef2f2]',
        dot: 'bg-[#ef4444]',
        text: 'text-[#b91c1c]',
    },
    withdrawn: {
        wrap: 'bg-[#f3f4f6]',
        dot: 'bg-[#9ca3af]',
        text: 'text-[#6b7280]',
    },
};

const avatarTones = [
    'bg-[#0057c8] text-white',
    'bg-[#15803d] text-white',
    'bg-[#e57124] text-white',
    'bg-[#7e22ce] text-white',
];

const notificationIcon = (category: string): string => {
    const key = category.toLowerCase();

    if (key.includes('job')) {
        return '💼';
    }

    if (key.includes('bill')) {
        return '💳';
    }

    return '📩';
};

const formatJobType = (type: string | null): string => {
    if (!type) {
        return '—';
    }

    return type
        .replaceAll('-', ' ')
        .replace(/\b\w/g, (character) => character.toUpperCase());
};

export default function EmployerDashboard({
    stats,
    plan,
    active_jobs,
    recent_applications,
    notifications,
    first_name,
}: Props) {
    const { auth } = usePage<SharedData>().props;
    const name =
        first_name ||
        firstName(auth.user.contact_name || auth.user.name) ||
        'there';
    const companyName = auth.user.company_name || 'Your Company';
    const usagePercent =
        plan.job_credits > 0
            ? Math.min(100, (plan.jobs_posted / plan.job_credits) * 100)
            : 0;

    const statCards = [
        {
            value: stats.total_jobs,
            label: 'Total Jobs Posted',
            icon: '💼',
            iconWrap: 'bg-[#fff7ed]',
        },
        {
            value: stats.active_jobs,
            label: 'Active Jobs',
            icon: '✅',
            iconWrap: 'bg-[#f0fdf4]',
        },
        {
            value: stats.total_applications,
            label: 'Total Applications',
            icon: '👥',
            iconWrap: 'bg-[#e6f0fb]',
        },
        {
            value: stats.new_this_week,
            label: 'New This Week',
            icon: '🆕',
            iconWrap: 'bg-[#d1f6ff]',
        },
    ];

    return (
        <EmployerLayout title="Dashboard">
            <Head title="Employer Dashboard" />

            <div className="flex flex-col gap-6 px-4 py-6 sm:px-6">
                <div
                    className="overflow-hidden rounded-2xl px-8 pt-8 pb-7 text-white shadow-[0px_4px_10px_rgba(0,87,200,0.2)]"
                    style={{
                        backgroundImage:
                            'linear-gradient(172.42deg, rgb(0, 87, 200) 0%, rgb(57, 119, 166) 50%, rgb(229, 113, 36) 100%)',
                    }}
                >
                    <h1 className="text-2xl leading-9 font-bold">
                        Welcome back, {name}! 👋
                    </h1>
                    <div className="mt-1 flex flex-wrap items-center gap-2 opacity-90">
                        <p className="text-base leading-6 font-semibold">
                            {companyName}
                        </p>
                        {plan.is_verified && (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 py-[2.4px] pr-[9.6px] pl-1 text-[11.2px] leading-[16.8px] font-semibold">
                                <span className="flex size-4 items-center justify-center rounded-full bg-[#0057c8] text-[10px] leading-none text-white">
                                    ✓
                                </span>
                                Verified
                            </span>
                        )}
                    </div>
                    <p className="mt-3 text-[13.6px] leading-[20.4px] text-white/80">
                        {plan.credits_remaining} job credits remaining ·{' '}
                        {plan.label || 'No package assigned'}
                        {plan.expires_on ? ` · Expires ${plan.expires_on}` : ''}
                    </p>
                    <div className="mt-5 flex flex-wrap gap-3">
                        <Link
                            href="/employer/jobs/create"
                            className="inline-flex h-[42px] cursor-pointer items-center justify-center rounded-[9.6px] bg-[#e57124] px-5 text-base font-medium tracking-[-0.18px] text-white transition-opacity hover:opacity-90"
                        >
                            + Post a New Job
                        </Link>
                        <Link
                            href="/employer/applications"
                            className="inline-flex h-[42px] cursor-pointer items-center justify-center rounded-[9.6px] border border-white/70 px-5 text-base font-medium tracking-[-0.18px] text-white transition-colors hover:bg-white/10"
                        >
                            View Applications
                        </Link>
                    </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    {statCards.map((stat) => (
                        <div key={stat.label} className={cn(cardClass, 'p-6')}>
                            <div
                                className={cn(
                                    'flex size-10 items-center justify-center rounded-xl text-lg',
                                    stat.iconWrap,
                                )}
                            >
                                {stat.icon}
                            </div>
                            <p className="mt-3 text-[32px] leading-8 font-bold text-[#e57124]">
                                {stat.value}
                            </p>
                            <p className="mt-1 text-sm text-[#6b7280]">
                                {stat.label}
                            </p>
                        </div>
                    ))}
                </div>

                <div>
                    <h2 className="text-base font-bold text-[#050315]">
                        Quick Actions
                    </h2>
                    <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                        {EMPLOYER_QUICK_ACTIONS.map((action) => (
                            <Link
                                key={action.label}
                                href={
                                    action.label === 'Post Job'
                                        ? '/employer/jobs/create'
                                        : action.href
                                }
                                className={cn(
                                    cardClass,
                                    'flex flex-col items-center justify-center gap-2 px-4 py-5 text-center transition-colors hover:bg-[#fff7ed]',
                                )}
                            >
                                <span className="text-[32px] leading-12 text-[#e57124]">
                                    {action.icon}
                                </span>
                                <span className="text-[13.6px] leading-[20.4px] font-semibold text-[#050315]">
                                    {action.label}
                                </span>
                            </Link>
                        ))}
                    </div>
                </div>

                <section className={cn(cardClass, 'p-6')}>
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <h2 className="text-base font-bold text-[#050315]">
                                {plan.label || 'Current Package'}
                            </h2>
                            <p className="mt-0.5 text-[12.8px] leading-[19.2px] text-[#6b7280]">
                                {plan.jobs_posted} used / {plan.job_credits}{' '}
                                total
                            </p>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                            <span className="rounded-full bg-[#fff7ed] px-3 py-[2.4px] text-[12.8px] leading-[19.2px] font-bold text-[#e57124]">
                                ⏳{' '}
                                {plan.days_remaining !== null
                                    ? `${plan.days_remaining} days remaining`
                                    : 'No renewal date'}
                            </span>
                            <Link
                                href="/employer/packages"
                                className="text-[12.8px] leading-[19.2px] font-semibold text-[#0057c8] underline"
                            >
                                Upgrade Plan
                            </Link>
                        </div>
                    </div>
                    <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-[#f3f4f6]">
                        <div
                            className="h-full rounded-full bg-linear-to-r from-[#e57124] to-[#f59e0b]"
                            style={{ width: `${usagePercent}%` }}
                        />
                    </div>
                    <div className="mt-1.5 flex justify-between text-xs text-[#6b7280]">
                        <span>0</span>
                        <span>{plan.job_credits}</span>
                    </div>
                </section>

                <section className={cn(cardClass, 'p-6')}>
                    <div className="flex items-center justify-between">
                        <h2 className="text-base font-bold text-[#050315]">
                            Active Jobs
                        </h2>
                        <Link
                            href="/employer/jobs"
                            className="text-[13.6px] leading-[20.4px] font-semibold text-[#0057c8]"
                        >
                            View All →
                        </Link>
                    </div>
                    <div className="mt-4 flex flex-col gap-3">
                        {active_jobs.map((job) => (
                            <div
                                key={job.id}
                                className="flex flex-col gap-3 rounded-xl border border-[#f0e8f0] bg-[#fafafa] p-4 lg:flex-row lg:items-center lg:justify-between"
                            >
                                <div className="min-w-0">
                                    <p className="text-[15.2px] leading-[22.8px] font-bold text-[#050315]">
                                        {job.title}
                                    </p>
                                    <div className="mt-1 flex flex-wrap gap-3 text-[12.48px] leading-[18.72px] text-[#6b7280]">
                                        <span>📍 {job.location || '—'}</span>
                                        <span>🕐 {formatJobType(job.type)}</span>
                                        <span>
                                            👥 {job.applications} applications
                                        </span>
                                        <span>
                                            ⏳{' '}
                                            {job.days_left !== null
                                                ? `${job.days_left} days left`
                                                : job.expires_at || '—'}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex shrink-0 flex-wrap gap-2">
                                    <Link
                                        href="/employer/applications"
                                        className="inline-flex cursor-pointer items-center rounded-lg bg-[#0057c8] px-[13.6px] py-[6.4px] text-[12.48px] leading-[18.72px] font-semibold text-white"
                                    >
                                        Applications
                                    </Link>
                                    <Link
                                        href={`/employer/jobs/${job.id}/edit`}
                                        className="inline-flex cursor-pointer items-center rounded-lg border border-[#0057c8] px-[13.6px] py-[6.4px] text-[12.48px] leading-[18.72px] font-semibold text-[#0057c8]"
                                    >
                                        Edit
                                    </Link>
                                </div>
                            </div>
                        ))}
                        {active_jobs.length === 0 && (
                            <div className="rounded-xl border border-dashed border-[#f0e8f0] bg-[#fafafa] px-4 py-6 text-center">
                                <p className="text-sm text-[#99a1af]">
                                    You have not posted any jobs yet.
                                </p>
                                <Link
                                    href="/employer/jobs/create"
                                    className="mt-2 inline-flex text-sm font-semibold text-[#0057c8]"
                                >
                                    + Post a New Job
                                </Link>
                            </div>
                        )}
                    </div>
                </section>

                <section className={cn(cardClass, 'p-6')}>
                    <div className="flex items-center justify-between">
                        <h2 className="text-base font-bold text-[#050315]">
                            Recent Applications
                        </h2>
                        <Link
                            href="/employer/applications"
                            className="text-[13.6px] leading-[20.4px] font-semibold text-[#0057c8]"
                        >
                            View All →
                        </Link>
                    </div>
                    <div className="mt-4 flex flex-col gap-3">
                        {recent_applications.map((application, index) => {
                            const tone =
                                applicationTone[
                                application.status_value ?? ''
                                ] ?? applicationTone.applied;

                            return (
                                <div
                                    key={application.id}
                                    className="flex flex-wrap items-center gap-3 rounded-xl border border-[#f0e8f0] bg-[#fafafa] p-3"
                                >
                                    <div
                                        className={cn(
                                            'flex size-10 shrink-0 items-center justify-center rounded-full text-[12.8px] font-bold',
                                            avatarTones[
                                            index % avatarTones.length
                                            ],
                                        )}
                                    >
                                        {getInitials(application.name || 'A')}
                                    </div>
                                    <div className="min-w-[120px] flex-1">
                                        <p className="text-[14.4px] leading-[21.6px] font-semibold text-[#050315]">
                                            {application.name}
                                        </p>
                                        <p className="text-[12.48px] leading-[18.72px] text-[#6b7280]">
                                            {application.job}
                                        </p>
                                    </div>
                                    <p className="text-xs text-[#9ca3af]">
                                        {application.date}
                                    </p>
                                    <span
                                        className={cn(
                                            'inline-flex items-center gap-[4.8px] rounded-full px-3 py-[3.2px] text-xs font-semibold',
                                            tone.wrap,
                                            tone.text,
                                        )}
                                    >
                                        <span
                                            className={cn(
                                                'size-1.5 rounded-[3px]',
                                                tone.dot,
                                            )}
                                        />
                                        {application.status}
                                    </span>
                                </div>
                            );
                        })}
                        {recent_applications.length === 0 && (
                            <div className="rounded-xl border border-dashed border-[#f0e8f0] bg-[#fafafa] px-4 py-6 text-center">
                                <p className="text-sm text-[#99a1af]">
                                    No applications yet.
                                </p>
                            </div>
                        )}
                    </div>
                </section>

                <section className={cn(cardClass, 'p-6')}>
                    <div className="flex items-center justify-between">
                        <h2 className="text-base font-bold text-[#050315]">
                            Recent Notifications
                        </h2>
                        <Link
                            href="/employer/notifications"
                            className="text-[13.6px] leading-[20.4px] font-semibold text-[#0057c8]"
                        >
                            View All →
                        </Link>
                    </div>
                    <div className="mt-4 flex flex-col gap-3">
                        {notifications.map((notification) => (
                            <div
                                key={notification.id}
                                className="flex items-start gap-3 rounded-xl border border-[#fde8cc] bg-[#fff7ed] p-3"
                            >
                                <p className="text-2xl leading-9">
                                    {notificationIcon(notification.category)}
                                </p>
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm font-bold text-[#050315]">
                                        {notification.title}
                                    </p>
                                    <p className="mt-0.5 text-[12.48px] leading-[18.72px] text-[#6b7280]">
                                        {notification.message}
                                    </p>
                                </div>
                                <p className="shrink-0 text-[11.52px] leading-[17.28px] text-[#9ca3af]">
                                    {notification.created_at}
                                </p>
                            </div>
                        ))}
                        {notifications.length === 0 && (
                            <div className="rounded-xl border border-dashed border-[#fde8cc] bg-[#fff7ed] px-4 py-6 text-center">
                                <p className="text-sm text-[#99a1af]">
                                    No notifications yet.
                                </p>
                            </div>
                        )}
                    </div>
                </section>
            </div>
        </EmployerLayout>
    );
}
