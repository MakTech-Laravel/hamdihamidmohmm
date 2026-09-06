import { Head, Link, usePage } from '@inertiajs/react';
import {
    Briefcase,
    Check,
    FileText,
    Search,
    Star,
    UserRound,
    X,
} from 'lucide-react';

import {
    firstName,
    getInitials,
    type ApplicationStatus,
} from '@/components/job-seeker/demo-data';
import { StatusBadge } from '@/components/job-seeker/status-badge';
import { useLocale } from '@/hooks/use-locale';
import JobSeekerLayout from '@/layouts/job-seeker-layout';
import { cn } from '@/lib/utils';
import type { SharedData } from '@/types';

type ChecklistItem = {
    id: string;
    label: string;
    complete: boolean;
};

type Props = {
    first_name: string;
    completion: number;
    stats: {
        total: number;
        under_review: number;
        shortlisted: number;
        completion: number;
    };
    checklist: ChecklistItem[];
    applications: Array<{
        id: number;
        title: string | null;
        company: string | null;
        status: string | null;
        status_value: string | null;
        date: string | null;
    }>;
    notifications: Array<{
        id: string;
        title: string;
        message: string;
        created_at: string | null;
        read: boolean;
    }>;
};

export default function JobSeekerDashboard({
    first_name,
    completion,
    stats,
    checklist,
    applications,
    notifications,
}: Props) {
    const { auth } = usePage<SharedData>().props;
    const { t } = useLocale();
    const name = firstName(auth.user.name) || first_name;
    const today = new Intl.DateTimeFormat('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
    }).format(new Date());

    const statCards = [
        {
            value: String(stats.total),
            label: t('job_seeker.dashboard.applications'),
            icon: FileText,
            iconBg: 'bg-[#dbeafe]',
            iconClass: 'text-[#1d4ed8]',
            valueClass: 'text-[#1d4ed8]',
        },
        {
            value: String(stats.under_review),
            label: t('job_seeker.dashboard.under_review'),
            icon: Search,
            iconBg: 'bg-[#ffedd5]',
            iconClass: 'text-[#c2410c]',
            valueClass: 'text-[#c2410c]',
        },
        {
            value: String(stats.shortlisted),
            label: t('job_seeker.dashboard.shortlisted'),
            icon: Star,
            iconBg: 'bg-[#f3e8ff]',
            iconClass: 'text-[#7e22ce]',
            valueClass: 'text-[#7e22ce]',
        },
        {
            value: String(stats.completion),
            label: t('job_seeker.dashboard.profile_percent'),
            icon: UserRound,
            iconBg: 'bg-[#dcfce7]',
            iconClass: 'text-[#15803d]',
            valueClass: 'text-[#15803d]',
        },
    ];

    return (
        <JobSeekerLayout title={t('job_seeker.dashboard.title')}>
            <Head title={t('job_seeker.dashboard.title')} />

            <div className="space-y-6 p-6">
                <div
                    className="flex flex-col gap-6 rounded-2xl p-7 shadow-[0px_4px_10px_rgba(30,58,138,0.2)] lg:flex-row lg:items-center lg:justify-between"
                    style={{
                        backgroundImage:
                            'linear-gradient(174deg, rgb(57, 119, 166) 0%, rgb(0, 87, 200) 100%)',
                    }}
                >
                    <div>
                        <p className="text-sm text-[#93c5fd]">{today}</p>
                        <h1 className="mt-1 text-2xl font-extrabold text-white">
                            {t('job_seeker.dashboard.welcome', { name })}
                        </h1>
                        <p className="mt-1 text-sm text-[#bfdbfe]">
                            {t('job_seeker.dashboard.tagline')}
                        </p>
                        <div className="mt-3 flex items-center gap-3">
                            <div className="h-1.5 w-32 max-w-[128px] overflow-hidden rounded-full bg-white/32">
                                <div
                                    className="h-full rounded-full bg-[#93c5fd]"
                                    style={{ width: `${completion}%` }}
                                />
                            </div>
                            <p className="text-xs font-semibold text-[#bedbff]">
                                {t('job_seeker.profile.completion', {
                                    percent: completion,
                                })}
                            </p>
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <Link
                            href="/jobs"
                            className="inline-flex items-center justify-center rounded-xl bg-[#e57124] px-4 py-2.5 text-base font-medium text-white hover:brightness-110"
                        >
                            {t('job_seeker.dashboard.browse_jobs')}
                        </Link>
                        <Link
                            href="/job-seeker/profile"
                            className="inline-flex items-center justify-center rounded-xl border border-white/30 px-4 py-2.5 text-base font-medium text-white hover:bg-white/10"
                        >
                            {t('job_seeker.dashboard.complete_profile')}
                        </Link>
                    </div>
                </div>

                <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
                    {statCards.map((stat) => {
                        const Icon = stat.icon;

                        return (
                            <div
                                key={stat.label}
                                className="rounded-2xl border border-[#e2e8f0] bg-white p-5 shadow-[0px_1px_3px_rgba(0,0,0,0.06)]"
                            >
                                <div
                                    className={cn(
                                        'flex size-10 items-center justify-center rounded-xl',
                                        stat.iconBg,
                                    )}
                                >
                                    <Icon
                                        className={cn('size-5', stat.iconClass)}
                                        strokeWidth={1.75}
                                    />
                                </div>
                                <p
                                    className={cn(
                                        'mt-3 text-[30px] leading-9 font-extrabold',
                                        stat.valueClass,
                                    )}
                                >
                                    {stat.value}
                                </p>
                                <p className="mt-0.5 text-xs font-medium text-[#6a7282]">
                                    {stat.label}
                                </p>
                            </div>
                        );
                    })}
                </div>

                <div className="grid gap-5 xl:grid-cols-[1fr_414px]">
                    <div className="space-y-5">
                        <div className="rounded-2xl border border-[#e2e8f0] bg-white shadow-[0px_1px_3px_rgba(0,0,0,0.06)]">
                            <div className="flex items-center justify-between border-b border-[#f1f5f9] p-5">
                                <h2 className="text-base font-bold text-[#050315]">
                                    {t('job_seeker.dashboard.recent_applications')}
                                </h2>
                                <Link
                                    href="/job-seeker/applications"
                                    className="text-xs font-bold text-[#0057c8]"
                                >
                                    {t('job_seeker.dashboard.view_all')} →
                                </Link>
                            </div>
                            <div className="space-y-3 p-4">
                                {applications.map((application) => (
                                    <div
                                        key={application.id}
                                        className="flex items-center gap-3 rounded-xl border border-[#f1f5f9] p-3"
                                    >
                                        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[#0057c8] text-xs font-bold text-white">
                                            {getInitials(
                                                application.company || 'JP',
                                            )}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-sm font-semibold text-[#050315]">
                                                {application.title}
                                            </p>
                                            <p className="text-xs text-[#99a1af]">
                                                {application.company}
                                                {application.date
                                                    ? ` · ${application.date}`
                                                    : ''}
                                            </p>
                                        </div>
                                        <StatusBadge
                                            status={
                                                (application.status ||
                                                    'Applied') as ApplicationStatus
                                            }
                                        />
                                    </div>
                                ))}
                                {applications.length === 0 && (
                                    <p className="text-sm text-[#99a1af]">
                                        {t('job_seeker.dashboard.no_applications')}
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="rounded-2xl border border-[#e2e8f0] bg-white p-5 shadow-[0px_1px_3px_rgba(0,0,0,0.06)]">
                            <h2 className="text-base font-bold text-[#050315]">
                                {t('job_seeker.dashboard.quick_actions')}
                            </h2>
                            <div className="mt-4 grid gap-3 sm:grid-cols-3">
                                <Link
                                    href="/job-seeker/profile"
                                    className="flex items-center gap-3 rounded-xl border border-[#e2e8f0] bg-[#f8faff] px-4 py-3 text-sm font-semibold text-[#0057c8] hover:bg-white"
                                >
                                    <UserRound className="size-4" />
                                    {t('job_seeker.dashboard.update_profile')}
                                </Link>
                                <Link
                                    href="/jobs"
                                    className="flex items-center gap-3 rounded-xl border border-[#e2e8f0] bg-[#f8faff] px-4 py-3 text-sm font-semibold text-[#0057c8] hover:bg-white"
                                >
                                    <Briefcase className="size-4" />
                                    {t('job_seeker.dashboard.browse_jobs')}
                                </Link>
                                <Link
                                    href="/job-seeker/applications"
                                    className="flex items-center gap-3 rounded-xl border border-[#e2e8f0] bg-[#f8faff] px-4 py-3 text-sm font-semibold text-[#0057c8] hover:bg-white"
                                >
                                    <FileText className="size-4" />
                                    {t('job_seeker.nav.applications')}
                                </Link>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-5">
                        <div className="rounded-2xl border border-[#e2e8f0] bg-white p-5 shadow-[0px_1px_3px_rgba(0,0,0,0.06)]">
                            <div className="flex items-center justify-between">
                                <h3 className="text-base font-bold text-[#050315]">
                                    {t('job_seeker.dashboard.checklist')}
                                </h3>
                                <p className="text-sm font-bold text-[#0057c8]">
                                    {completion}%
                                </p>
                            </div>
                            <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#e2e8f0]">
                                <div
                                    className="h-full rounded-full bg-[#0057c8]"
                                    style={{ width: `${completion}%` }}
                                />
                            </div>
                            <ul className="mt-4 space-y-2.5">
                                {checklist.map((item) => (
                                    <li
                                        key={item.id}
                                        className="flex items-center justify-between gap-2"
                                    >
                                        <div className="flex min-w-0 items-center gap-2">
                                            <span
                                                className={cn(
                                                    'flex size-5 shrink-0 items-center justify-center rounded-full',
                                                    item.complete
                                                        ? 'bg-[#dcfce7] text-[#15803d]'
                                                        : 'bg-[#fee2e2] text-[#b91c1c]',
                                                )}
                                            >
                                                {item.complete ? (
                                                    <Check
                                                        className="size-3"
                                                        strokeWidth={3}
                                                    />
                                                ) : (
                                                    <X
                                                        className="size-3"
                                                        strokeWidth={3}
                                                    />
                                                )}
                                            </span>
                                            <span className="truncate text-sm text-[#374151]">
                                                {item.label}
                                            </span>
                                        </div>
                                        {!item.complete && (
                                            <Link
                                                href="/job-seeker/profile"
                                                className="shrink-0 text-xs font-bold text-[#0057c8]"
                                            >
                                                {t('job_seeker.dashboard.complete_now')}
                                            </Link>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="rounded-2xl border border-[#e2e8f0] bg-white p-5 shadow-[0px_1px_3px_rgba(0,0,0,0.06)]">
                            <div className="flex items-center justify-between">
                                <h3 className="text-base font-bold text-[#050315]">
                                    {t('job_seeker.dashboard.notifications')}
                                </h3>
                                <Link
                                    href="/job-seeker/notifications"
                                    className="text-xs font-bold text-[#0057c8]"
                                >
                                    {t('job_seeker.dashboard.view_all')} →
                                </Link>
                            </div>
                            <div className="mt-4 space-y-2">
                                {notifications.map((item) => (
                                    <div
                                        key={item.id}
                                        className={cn(
                                            'rounded-xl px-3 py-2.5',
                                            item.read
                                                ? 'bg-white'
                                                : 'bg-[#eff6ff]',
                                        )}
                                    >
                                        <div className="flex items-start gap-2">
                                            {!item.read && (
                                                <span className="mt-1.5 size-2 shrink-0 rounded-full bg-[#0057c8]" />
                                            )}
                                            <div className="min-w-0 flex-1">
                                                <p className="text-sm font-semibold text-[#050315]">
                                                    {item.title}
                                                </p>
                                                <p className="truncate text-xs text-[#99a1af]">
                                                    {item.message ||
                                                        item.created_at}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {notifications.length === 0 && (
                                    <p className="text-sm text-[#99a1af]">
                                        {t('job_seeker.dashboard.no_notifications')}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </JobSeekerLayout>
    );
}
