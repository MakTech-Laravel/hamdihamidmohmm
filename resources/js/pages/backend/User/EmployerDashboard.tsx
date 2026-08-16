import { Head, Link, usePage } from '@inertiajs/react';
import { Clock3, Hourglass, MapPin, Users } from 'lucide-react';

import {
    EMPLOYER_QUICK_ACTIONS,
    firstName,
    getInitials,
} from '@/components/employer/demo-data';
import EmployerLayout from '@/layouts/employer-layout';
import type { SharedData } from '@/types';

type Props = {
    stats: {
        total_jobs: number;
        active_jobs: number;
        total_applications: number;
        new_this_week: number;
    };
    package_label: string | null;
    active_jobs: Array<{
        id: number;
        title: string;
        location: string | null;
        type: string | null;
        applications: number;
        expires_at: string | null;
    }>;
    recent_applications: Array<{
        id: number;
        name: string | null;
        job: string | null;
        status: string | null;
        date: string | null;
    }>;
    notifications: Array<{
        id: string;
        title: string;
        message: string;
        created_at: string | null;
    }>;
    first_name: string;
};

export default function EmployerDashboard({
    stats,
    package_label,
    active_jobs,
    recent_applications,
    notifications,
    first_name,
}: Props) {
    const { auth } = usePage<SharedData>().props;
    const name = firstName(auth.user.name) || first_name;
    const companyName = auth.user.company_name || 'Your Company';

    const statCards = [
        { value: stats.total_jobs, label: 'Total Jobs', icon: '💼' },
        { value: stats.active_jobs, label: 'Active Jobs', icon: '✅' },
        { value: stats.total_applications, label: 'Applications', icon: '📥' },
        { value: stats.new_this_week, label: 'New this week', icon: '🆕' },
    ];

    return (
        <EmployerLayout title="Dashboard">
            <Head title="Employer Dashboard" />

            <div className="space-y-6 px-4 py-6 sm:px-6">
                <div
                    className="rounded-2xl px-8 pt-8 pb-7 text-white shadow-[0px_4px_10px_rgba(50,57,129,0.2)]"
                    style={{
                        backgroundImage:
                            'linear-gradient(172deg, rgb(50, 57, 129) 0%, rgb(57, 119, 166) 50%, rgb(229, 113, 36) 100%)',
                    }}
                >
                    <h1 className="text-2xl font-bold">
                        Welcome back, {name}! 👋
                    </h1>
                    <div className="mt-1 flex flex-wrap items-center gap-2 opacity-90">
                        <p className="text-base font-semibold">{companyName}</p>
                    </div>
                    <p className="mt-3 text-sm text-white/80">
                        {package_label || 'No package assigned'}
                    </p>
                    <div className="mt-5 flex flex-wrap gap-3">
                        <Link
                            href="/employer/jobs"
                            className="inline-flex items-center justify-center rounded-[9.6px] bg-[#e57124] px-5 py-2.5 text-base font-medium text-white transition-opacity hover:opacity-90"
                        >
                            + Post a New Job
                        </Link>
                        <Link
                            href="/employer/applications"
                            className="inline-flex items-center justify-center rounded-[9.6px] border border-white/70 px-5 py-2.5 text-base font-medium text-white transition-colors hover:bg-white/10"
                        >
                            View Applications
                        </Link>
                    </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    {statCards.map((stat) => (
                        <div
                            key={stat.label}
                            className="rounded-2xl border border-[#e8d5e8] bg-white p-6 shadow-[0px_2px_4px_rgba(5,3,21,0.06)]"
                        >
                            <p className="text-[32px] leading-none">
                                {stat.icon}
                            </p>
                            <p className="mt-2 text-[32px] font-bold leading-8 text-[#e57124]">
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
                                href={action.href}
                                className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-[#e8d5e8] bg-white px-4 py-5 text-center shadow-[0px_2px_4px_rgba(5,3,21,0.06)] transition-colors hover:bg-[#fff7ed]"
                            >
                                <span className="text-[32px] leading-none text-[#e57124]">
                                    {action.icon}
                                </span>
                                <span className="text-[13.6px] font-semibold text-[#050315]">
                                    {action.label}
                                </span>
                            </Link>
                        ))}
                    </div>
                </div>

                <section className="rounded-2xl border border-[#e8d5e8] bg-white p-6 shadow-[0px_2px_4px_rgba(5,3,21,0.06)]">
                    <div className="mb-4 flex items-center justify-between">
                        <h2 className="text-base font-bold text-[#050315]">
                            Latest Jobs
                        </h2>
                        <Link
                            href="/employer/jobs"
                            className="text-sm font-semibold text-[#0057c8]"
                        >
                            View All →
                        </Link>
                    </div>
                    <div className="space-y-3">
                        {active_jobs.map((job) => (
                            <div
                                key={job.id}
                                className="flex flex-col gap-3 rounded-xl border border-[#f1f5f9] bg-[#f8faff] p-4 lg:flex-row lg:items-center lg:justify-between"
                            >
                                <div>
                                    <p className="font-semibold text-[#050315]">
                                        {job.title}
                                    </p>
                                    <div className="mt-2 flex flex-wrap gap-3 text-xs text-[#64748b]">
                                        <span className="inline-flex items-center gap-1">
                                            <MapPin className="size-3.5" />
                                            {job.location || '—'}
                                        </span>
                                        <span className="inline-flex items-center gap-1">
                                            <Clock3 className="size-3.5" />
                                            {job.type || '—'}
                                        </span>
                                        <span className="inline-flex items-center gap-1">
                                            <Users className="size-3.5" />
                                            {job.applications} applications
                                        </span>
                                        <span className="inline-flex items-center gap-1">
                                            <Hourglass className="size-3.5" />
                                            {job.expires_at || '—'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {active_jobs.length === 0 && (
                            <p className="text-sm text-[#99a1af]">
                                You have not posted any jobs yet.
                            </p>
                        )}
                    </div>
                </section>

                <section className="rounded-2xl border border-[#e8d5e8] bg-white p-6 shadow-[0px_2px_4px_rgba(5,3,21,0.06)]">
                    <div className="mb-4 flex items-center justify-between">
                        <h2 className="text-base font-bold text-[#050315]">
                            Recent Applications
                        </h2>
                        <Link
                            href="/employer/applications"
                            className="text-sm font-semibold text-[#0057c8]"
                        >
                            View All →
                        </Link>
                    </div>
                    <div className="space-y-3">
                        {recent_applications.map((application) => (
                            <div
                                key={application.id}
                                className="flex flex-wrap items-center justify-between gap-3 border-b border-[#f1f5f9] pb-3 last:border-0 last:pb-0"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="flex size-10 items-center justify-center rounded-full bg-[#eef2ff] text-xs font-bold text-[#323981]">
                                        {getInitials(application.name || 'A')}
                                    </div>
                                    <div>
                                        <p className="font-semibold text-[#050315]">
                                            {application.name}
                                        </p>
                                        <p className="text-xs text-[#64748b]">
                                            {application.job} ·{' '}
                                            {application.date}
                                        </p>
                                    </div>
                                </div>
                                <span className="rounded-full bg-[#f8faff] px-2.5 py-1 text-xs font-semibold text-[#323981]">
                                    {application.status}
                                </span>
                            </div>
                        ))}
                        {recent_applications.length === 0 && (
                            <p className="text-sm text-[#99a1af]">
                                No applications yet.
                            </p>
                        )}
                    </div>
                </section>

                <section className="rounded-2xl border border-[#e8d5e8] bg-white p-6 shadow-[0px_2px_4px_rgba(5,3,21,0.06)]">
                    <div className="mb-4 flex items-center justify-between">
                        <h2 className="text-base font-bold text-[#050315]">
                            Recent Notifications
                        </h2>
                        <Link
                            href="/employer/notifications"
                            className="text-sm font-semibold text-[#0057c8]"
                        >
                            View All →
                        </Link>
                    </div>
                    <div className="space-y-3">
                        {notifications.map((notification) => (
                            <div
                                key={notification.id}
                                className="rounded-xl border border-[#fed7aa]/60 bg-[#fff7ed] p-4"
                            >
                                <p className="font-semibold text-[#050315]">
                                    {notification.title}
                                </p>
                                <p className="mt-0.5 text-sm text-[#6b7280]">
                                    {notification.message}
                                </p>
                                <p className="mt-1 text-xs text-[#94a3b8]">
                                    {notification.created_at}
                                </p>
                            </div>
                        ))}
                        {notifications.length === 0 && (
                            <p className="text-sm text-[#99a1af]">
                                No notifications yet.
                            </p>
                        )}
                    </div>
                </section>
            </div>
        </EmployerLayout>
    );
}
