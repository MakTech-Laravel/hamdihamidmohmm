import { Head, Link, usePage } from '@inertiajs/react';

import { firstName, getInitials } from '@/components/job-seeker/demo-data';
import { StatusBadge } from '@/components/job-seeker/status-badge';
import JobSeekerLayout from '@/layouts/job-seeker-layout';
import type { SharedData } from '@/types';
import type { ApplicationStatus } from '@/components/job-seeker/demo-data';

type Props = {
    first_name: string;
    completion: number;
    stats: {
        total: number;
        active: number;
        interviews: number;
        offers: number;
    };
    applications: Array<{
        id: number;
        title: string | null;
        company: string | null;
        status: string | null;
        date: string | null;
    }>;
    notifications: Array<{
        id: string;
        title: string;
        message: string;
        created_at: string | null;
    }>;
};

export default function JobSeekerDashboard({
    first_name,
    completion,
    stats,
    applications,
    notifications,
}: Props) {
    const { auth } = usePage<SharedData>().props;
    const name = firstName(auth.user.name) || first_name;
    const today = new Intl.DateTimeFormat('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
    }).format(new Date());

    const statCards = [
        {
            value: String(stats.total),
            label: 'Applications',
            icon: '📋',
            iconBg: 'bg-[#dbeafe]',
            valueClass: 'text-[#1d4ed8]',
        },
        {
            value: String(stats.active),
            label: 'Active',
            icon: '🔍',
            iconBg: 'bg-[#fed7aa]',
            valueClass: 'text-[#c2410c]',
        },
        {
            value: String(stats.interviews),
            label: 'Interviews',
            icon: '⭐',
            iconBg: 'bg-[#e9d5ff]',
            valueClass: 'text-[#7e22ce]',
        },
        {
            value: String(completion),
            label: 'Profile %',
            icon: '👤',
            iconBg: 'bg-[#bbf7d0]',
            valueClass: 'text-[#15803d]',
        },
    ];

    return (
        <JobSeekerLayout title="Dashboard">
            <Head title="Job Seeker Dashboard" />

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
                            Welcome back, {name}!
                        </h1>
                        <p className="mt-1 text-sm text-[#bfdbfe]">
                            Let&apos;s help you find your next opportunity.
                        </p>
                        <div className="mt-3 flex items-center gap-3">
                            <div className="h-1.5 w-32 max-w-[128px] overflow-hidden rounded-full bg-white/32">
                                <div
                                    className="h-full rounded-full bg-[#0057c8]"
                                    style={{ width: `${completion}%` }}
                                />
                            </div>
                            <p className="text-xs font-semibold text-[#bedbff]">
                                {completion}% Profile Completion
                            </p>
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <Link
                            href="/jobs"
                            className="inline-flex items-center justify-center rounded-xl bg-[#e57124] px-4 py-2.5 text-base font-medium text-white"
                        >
                            Browse Jobs
                        </Link>
                        <Link
                            href="/job-seeker/profile"
                            className="inline-flex items-center justify-center rounded-xl border border-white/30 px-4 py-2.5 text-base font-medium text-white"
                        >
                            Complete Profile
                        </Link>
                    </div>
                </div>

                <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
                    {statCards.map((stat) => (
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
                    <div className="rounded-2xl border border-[#e2e8f0] bg-white">
                        <div className="flex items-center justify-between border-b border-[#f1f5f9] p-5">
                            <h2 className="text-base font-bold">
                                Recent Applications
                            </h2>
                            <Link
                                href="/job-seeker/applications"
                                className="text-xs font-bold text-[#0057c8]"
                            >
                                View All →
                            </Link>
                        </div>
                        <div className="space-y-3 p-4">
                            {applications.map((application) => (
                                <div
                                    key={application.id}
                                    className="flex items-center gap-3 rounded-xl border border-[#f1f5f9] p-3"
                                >
                                    <div className="flex size-9 items-center justify-center rounded-lg bg-[#0057c8] text-xs font-bold text-white">
                                        {getInitials(
                                            application.company || 'JP',
                                        )}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-sm font-semibold">
                                            {application.title}
                                        </p>
                                        <p className="text-xs text-[#99a1af]">
                                            {application.company}
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
                                    You have not applied to any jobs yet.
                                </p>
                            )}
                        </div>
                    </div>
                    <div className="rounded-2xl border border-[#e2e8f0] bg-white p-5">
                        <h3 className="text-base font-bold">Notifications</h3>
                        <div className="mt-4 space-y-3">
                            {notifications.map((item) => (
                                <div key={item.id}>
                                    <p className="text-sm font-semibold">
                                        {item.title}
                                    </p>
                                    <p className="text-xs text-[#99a1af]">
                                        {item.created_at}
                                    </p>
                                </div>
                            ))}
                            {notifications.length === 0 && (
                                <p className="text-sm text-[#99a1af]">
                                    No notifications yet.
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </JobSeekerLayout>
    );
}
