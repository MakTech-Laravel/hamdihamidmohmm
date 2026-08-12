import { Head, Link, usePage } from '@inertiajs/react';
import { Check, X } from 'lucide-react';

import {
    APPLICATIONS,
    NOTIFICATIONS,
    PROFILE_COMPLETION,
    PROFILE_SECTIONS,
    firstName,
} from '@/components/job-seeker/demo-data';
import { StatusBadge } from '@/components/job-seeker/status-badge';
import JobSeekerLayout from '@/layouts/job-seeker-layout';
import type { SharedData } from '@/types';

const stats = [
    {
        value: '5',
        label: 'Applications',
        icon: '📋',
        iconBg: 'bg-[#dbeafe]',
        valueClass: 'text-[#1d4ed8]',
    },
    {
        value: '2',
        label: 'Under Review',
        icon: '🔍',
        iconBg: 'bg-[#fed7aa]',
        valueClass: 'text-[#c2410c]',
    },
    {
        value: '1',
        label: 'Shortlisted',
        icon: '⭐',
        iconBg: 'bg-[#e9d5ff]',
        valueClass: 'text-[#7e22ce]',
    },
    {
        value: String(PROFILE_COMPLETION),
        label: 'Profile %',
        icon: '👤',
        iconBg: 'bg-[#bbf7d0]',
        valueClass: 'text-[#15803d]',
    },
];

export default function JobSeekerDashboard() {
    const { auth } = usePage<SharedData>().props;
    const name = firstName(auth.user.name);
    const today = new Intl.DateTimeFormat('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
    }).format(new Date());

    const recentApplications = APPLICATIONS.slice(0, 4);
    const latestNotifications = NOTIFICATIONS.slice(0, 3);

    return (
        <JobSeekerLayout title="Dashboard">
            <Head title="Job Seeker Dashboard" />

            <div className="space-y-6 p-6">
                <div
                    className="flex flex-col gap-6 rounded-2xl p-7 shadow-[0px_4px_10px_rgba(30,58,138,0.2)] lg:flex-row lg:items-center lg:justify-between"
                    style={{
                        backgroundImage:
                            'linear-gradient(174deg, rgb(57, 119, 166) 0%, rgb(30, 58, 138) 100%)',
                    }}
                >
                    <div>
                        <p className="text-sm text-[#93c5fd]">{today}</p>
                        <h1 className="mt-1 text-2xl font-extrabold text-white">
                            Welcome back, {name}!
                        </h1>
                        <p className="mt-1 text-sm text-[#bfdbfe]">
                            Let&apos;s help you find your next opportunity.
                        </p>
                        <div className="mt-3 flex items-center gap-3">
                            <div className="h-1.5 w-32 max-w-[128px] overflow-hidden rounded-full bg-white/32">
                                <div
                                    className="h-full rounded-full bg-[#0057c8]"
                                    style={{ width: `${PROFILE_COMPLETION}%` }}
                                />
                            </div>
                            <p className="text-xs font-semibold text-[#bedbff]">
                                {PROFILE_COMPLETION}% Profile Completion
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        <Link
                            href="/jobs"
                            className="inline-flex items-center justify-center rounded-xl bg-[#e57124] px-4 py-2.5 text-base font-medium text-white transition-opacity hover:opacity-90"
                        >
                            Browse Jobs
                        </Link>
                        <Link
                            href="/job-seeker/profile"
                            className="inline-flex items-center justify-center rounded-xl border border-white/30 px-4 py-2.5 text-base font-medium text-white transition-colors hover:bg-white/10"
                        >
                            Complete Profile
                        </Link>
                    </div>
                </div>

                <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
                    {stats.map((stat) => (
                        <div
                            key={stat.label}
                            className="rounded-2xl border border-[#e2e8f0] bg-white p-5 shadow-[0px_1px_3px_rgba(0,0,0,0.06)]"
                        >
                            <div
                                className={`flex size-10 items-center justify-center rounded-xl text-lg ${stat.iconBg}`}
                            >
                                {stat.icon}
                            </div>
                            <p
                                className={`mt-3 text-[30px] leading-9 font-extrabold ${stat.valueClass}`}
                            >
                                {stat.value}
                            </p>
                            <p className="mt-0.5 text-xs font-medium text-[#6a7282]">
                                {stat.label}
                            </p>
                        </div>
                    ))}
                </div>

                <div className="grid gap-5 xl:grid-cols-[1fr_414px]">
                    <div className="rounded-2xl border border-[#e2e8f0] bg-white shadow-[0px_1px_3px_rgba(0,0,0,0.06)]">
                        <div className="flex items-center justify-between border-b border-[#f1f5f9] p-5">
                            <h2 className="text-base font-bold text-[#101828]">
                                Recent Applications
                            </h2>
                            <Link
                                href="/job-seeker/applications"
                                className="text-xs font-bold text-[#1e3a8a]"
                            >
                                View All →
                            </Link>
                        </div>
                        <div className="space-y-3 p-4">
                            {recentApplications.map((application) => (
                                <div
                                    key={application.id}
                                    className="flex items-center gap-3 rounded-xl border border-[#f1f5f9] p-3"
                                >
                                    <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#1e3a8a] to-[#2563eb] text-xs font-bold text-white">
                                        {application.initials}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-sm font-semibold text-[#101828]">
                                            {application.title}
                                        </p>
                                        <p className="text-xs text-[#99a1af]">
                                            {application.company}
                                        </p>
                                    </div>
                                    <div className="hidden items-center gap-3 sm:flex">
                                        <span className="text-xs text-[#99a1af]">
                                            {application.appliedAt}
                                        </span>
                                        <StatusBadge
                                            status={application.status}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-5">
                        <div className="rounded-2xl border border-[#e2e8f0] bg-white shadow-[0px_1px_3px_rgba(0,0,0,0.06)]">
                            <div className="border-b border-[#f1f5f9] p-5">
                                <h3 className="text-base font-bold text-[#101828]">
                                    Profile Completion
                                </h3>
                                <div className="mt-3 flex items-center gap-3">
                                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-[#f3f4f6]">
                                        <div
                                            className="h-full rounded-full bg-gradient-to-r from-[#1e3a8a] to-[#3b82f6]"
                                            style={{
                                                width: `${PROFILE_COMPLETION}%`,
                                            }}
                                        />
                                    </div>
                                    <span className="text-sm font-extrabold text-[#1e3a8a]">
                                        {PROFILE_COMPLETION}%
                                    </span>
                                </div>
                            </div>
                            <div className="space-y-2 p-4">
                                {PROFILE_SECTIONS.map((section) => (
                                    <div
                                        key={section.id}
                                        className="flex items-center gap-3"
                                    >
                                        <span
                                            className={`flex size-4 items-center justify-center rounded-full ${
                                                section.complete
                                                    ? 'bg-[#dcfce7] text-[#15803d]'
                                                    : 'bg-[#fee2e2] text-[#b91c1c]'
                                            }`}
                                        >
                                            {section.complete ? (
                                                <Check className="size-2.5" />
                                            ) : (
                                                <X className="size-2.5" />
                                            )}
                                        </span>
                                        <span className="flex-1 text-xs text-[#4a5565]">
                                            {section.label}
                                        </span>
                                        {!section.complete && (
                                            <Link
                                                href="/job-seeker/profile"
                                                className="text-xs font-semibold text-[#ef4444]"
                                            >
                                                Complete Now
                                            </Link>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="rounded-2xl border border-[#e2e8f0] bg-white shadow-[0px_1px_3px_rgba(0,0,0,0.06)]">
                            <div className="flex items-center justify-between border-b border-[#f1f5f9] p-5">
                                <h3 className="text-base font-bold text-[#101828]">
                                    Latest Notifications
                                </h3>
                                <Link
                                    href="/job-seeker/notifications"
                                    className="text-xs font-bold text-[#1e3a8a]"
                                >
                                    View All
                                </Link>
                            </div>
                            <div className="space-y-3 p-4">
                                {latestNotifications.map((notification) => (
                                    <div
                                        key={notification.id}
                                        className="flex gap-3"
                                    >
                                        <div className="mt-0.5 size-2 shrink-0 rounded-full bg-[#0057c8]" />
                                        <div className="min-w-0 flex-1">
                                            <p className="text-sm font-semibold text-[#101828]">
                                                {notification.title}
                                            </p>
                                            <p className="mt-0.5 text-xs text-[#99a1af]">
                                                {notification.time}
                                            </p>
                                        </div>
                                        {notification.unread && (
                                            <span className="mt-1 size-2 shrink-0 rounded-full bg-[#0057c8]" />
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </JobSeekerLayout>
    );
}
