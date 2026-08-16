import { Head, router } from '@inertiajs/react';

import { StatusBadge } from '@/components/job-seeker/status-badge';
import type { ApplicationStatus } from '@/components/job-seeker/demo-data';
import JobSeekerLayout from '@/layouts/job-seeker-layout';

type ApplicationRow = {
    id: number;
    title: string | null;
    company: string | null;
    location: string | null;
    salary: string | null;
    type: string | null;
    status: string | null;
    status_value: string | null;
    progress: number;
    applied_at: string | null;
    can_withdraw: boolean;
    timeline: Array<{ label: string; date: string | null; state: string }>;
};

type Props = {
    applications: ApplicationRow[];
    stats: { total: number; active: number; interviews: number; offers: number };
};

export default function JobSeekerApplications({ applications, stats }: Props) {
    return (
        <JobSeekerLayout title="My Applications">
            <Head title="My Applications" />

            <div className="space-y-5 p-6">
                <h1 className="text-2xl font-extrabold text-[#1e3a8a]">
                    My Applications
                </h1>
                <div className="grid gap-4 sm:grid-cols-4">
                    {[
                        ['Total', stats.total],
                        ['Active', stats.active],
                        ['Interviews', stats.interviews],
                        ['Offers', stats.offers],
                    ].map(([label, value]) => (
                        <div
                            key={label}
                            className="rounded-2xl border bg-white p-4"
                        >
                            <p className="text-2xl font-bold text-[#1e3a8a]">
                                {value}
                            </p>
                            <p className="text-sm text-[#6a7282]">{label}</p>
                        </div>
                    ))}
                </div>
                <div className="space-y-4">
                    {applications.map((application) => (
                        <div
                            key={application.id}
                            className="rounded-2xl border bg-white p-5"
                        >
                            <div className="flex flex-wrap items-start justify-between gap-3">
                                <div>
                                    <h2 className="text-base font-bold">
                                        {application.title}
                                    </h2>
                                    <p className="text-sm text-[#64748b]">
                                        {application.company} ·{' '}
                                        {application.location}
                                    </p>
                                    <p className="text-xs text-[#99a1af]">
                                        Applied {application.applied_at}
                                    </p>
                                </div>
                                <StatusBadge
                                    status={
                                        (application.status ||
                                            'Applied') as ApplicationStatus
                                    }
                                />
                            </div>
                            <div className="mt-4 flex flex-wrap gap-2">
                                {application.timeline.map((step) => (
                                    <span
                                        key={step.label}
                                        className="rounded-full bg-[#f8faff] px-2.5 py-1 text-xs text-[#475569]"
                                    >
                                        {step.label}
                                    </span>
                                ))}
                            </div>
                            {application.can_withdraw && (
                                <button
                                    type="button"
                                    className="mt-4 text-sm font-semibold text-[#ef4444]"
                                    onClick={() =>
                                        router.post(
                                            `/job-seeker/applications/${application.id}/withdraw`,
                                        )
                                    }
                                >
                                    Withdraw
                                </button>
                            )}
                        </div>
                    ))}
                    {applications.length === 0 && (
                        <p className="text-center text-sm text-[#99a1af]">
                            You have not applied to any jobs yet.
                        </p>
                    )}
                </div>
            </div>
        </JobSeekerLayout>
    );
}
