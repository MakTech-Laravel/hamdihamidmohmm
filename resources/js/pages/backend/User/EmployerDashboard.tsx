import { Head, Link, usePage } from '@inertiajs/react';
import { Clock3, Hourglass, MapPin, Users } from 'lucide-react';

import {
    EMPLOYER_ACTIVE_JOBS,
    EMPLOYER_NOTIFICATIONS,
    EMPLOYER_QUICK_ACTIONS,
    EMPLOYER_RECENT_APPLICATIONS,
    EMPLOYER_STATS,
    applicationToneClass,
    firstName,
    getInitials,
} from '@/components/employer/demo-data';
import EmployerLayout from '@/layouts/employer-layout';
import { cn } from '@/lib/utils';
import type { SharedData } from '@/types';

export default function EmployerDashboard() {
    const { auth } = usePage<SharedData>().props;
    const name = firstName(auth.user.name);
    const companyName = auth.user.company_name || 'Your Company';

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
                        <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-[11px] font-semibold">
                            ✔ Verified
                        </span>
                    </div>
                    <p className="mt-3 text-sm text-white/80">
                        5 job credits remaining · Business Package · Expires Aug
                        31, 2026
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
                    {EMPLOYER_STATS.map((stat) => (
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

                <div className="rounded-2xl border border-[#e8d5e8] bg-white p-6 shadow-[0px_2px_4px_rgba(5,3,21,0.06)]">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                            <h2 className="text-base font-bold text-[#050315]">
                                Business Package
                            </h2>
                            <p className="mt-1 text-[12.8px] text-[#6b7280]">
                                5 used / 10 total
                            </p>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                            <span className="rounded-full bg-[#fff7ed] px-3 py-0.5 text-[12.8px] font-bold text-[#e57124]">
                                ⏳ 23 days remaining
                            </span>
                            <Link
                                href="/employer/packages"
                                className="text-[12.8px] font-semibold text-[#323981] underline"
                            >
                                Upgrade Plan
                            </Link>
                        </div>
                    </div>
                    <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-[#f3f4f6]">
                        <div className="h-full w-1/2 rounded-full bg-linear-to-r from-[#e57124] to-[#f59e0b]" />
                    </div>
                </div>

                <section className="rounded-2xl border border-[#e8d5e8] bg-white p-6 shadow-[0px_2px_4px_rgba(5,3,21,0.06)]">
                    <div className="mb-4 flex items-center justify-between">
                        <h2 className="text-base font-bold text-[#050315]">
                            Active Jobs
                        </h2>
                        <Link
                            href="/employer/jobs"
                            className="text-sm font-semibold text-[#0057c8]"
                        >
                            View All →
                        </Link>
                    </div>
                    <div className="space-y-3">
                        {EMPLOYER_ACTIVE_JOBS.map((job) => (
                            <div
                                key={job.title}
                                className="flex flex-col gap-3 rounded-xl border border-[#f1f5f9] bg-[#f8faff] p-4 lg:flex-row lg:items-center lg:justify-between"
                            >
                                <div>
                                    <p className="font-semibold text-[#050315]">
                                        {job.title}
                                    </p>
                                    <div className="mt-2 flex flex-wrap gap-3 text-xs text-[#64748b]">
                                        <span className="inline-flex items-center gap-1">
                                            <MapPin className="size-3.5" />
                                            {job.location}
                                        </span>
                                        <span className="inline-flex items-center gap-1">
                                            <Clock3 className="size-3.5" />
                                            {job.type}
                                        </span>
                                        <span className="inline-flex items-center gap-1">
                                            <Users className="size-3.5" />
                                            {job.applications} applications
                                        </span>
                                        <span className="inline-flex items-center gap-1">
                                            <Hourglass className="size-3.5" />
                                            {job.remaining}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <Link
                                        href="/employer/applications"
                                        className="rounded-lg bg-[#0057c8] px-3 py-2 text-xs font-semibold text-white"
                                    >
                                        Applications
                                    </Link>
                                    <Link
                                        href="/employer/jobs"
                                        className="rounded-lg border border-[#e2e8f0] bg-white px-3 py-2 text-xs font-semibold text-[#64748b]"
                                    >
                                        Edit
                                    </Link>
                                </div>
                            </div>
                        ))}
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
                        {EMPLOYER_RECENT_APPLICATIONS.map((application) => (
                            <div
                                key={`${application.name}-${application.job}`}
                                className="flex flex-wrap items-center justify-between gap-3 border-b border-[#f1f5f9] pb-3 last:border-0 last:pb-0"
                            >
                                <div className="flex items-center gap-3">
                                    <div
                                        className={cn(
                                            'flex size-10 items-center justify-center rounded-full text-xs font-bold',
                                            application.avatar,
                                        )}
                                    >
                                        {getInitials(application.name)}
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
                                <span
                                    className={cn(
                                        'rounded-full px-2.5 py-1 text-xs font-semibold',
                                        applicationToneClass[application.tone],
                                    )}
                                >
                                    {application.status}
                                </span>
                            </div>
                        ))}
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
                        {EMPLOYER_NOTIFICATIONS.map((notification) => (
                            <div
                                key={notification.title}
                                className="flex gap-3 rounded-xl border border-[#fed7aa]/60 bg-[#fff7ed] p-4"
                            >
                                <span className="text-xl leading-none">
                                    {notification.icon}
                                </span>
                                <div>
                                    <p className="font-semibold text-[#050315]">
                                        {notification.title}
                                    </p>
                                    <p className="mt-0.5 text-sm text-[#6b7280]">
                                        {notification.detail}
                                    </p>
                                    <p className="mt-1 text-xs text-[#94a3b8]">
                                        {notification.time}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            </div>
        </EmployerLayout>
    );
}
