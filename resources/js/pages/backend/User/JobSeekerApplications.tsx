import { Head, router } from '@inertiajs/react';
import { useMemo, useState } from 'react';

import { ApplicationDetailDrawer } from '@/components/job-seeker/application-detail-drawer';
import { getInitials } from '@/components/job-seeker/demo-data';
import { StatusBadge } from '@/components/job-seeker/status-badge';
import type { ApplicationStatus } from '@/components/job-seeker/demo-data';
import { useLocale } from '@/hooks/use-locale';
import JobSeekerLayout from '@/layouts/job-seeker-layout';
import { cn } from '@/lib/utils';

type ApplicationRow = {
    id: number;
    title: string | null;
    company: string | null;
    location: string | null;
    salary: string | null;
    type: string | null;
    slug: string | null;
    job_url: string | null;
    status: string | null;
    status_value: string | null;
    progress: number;
    applied_at: string | null;
    can_withdraw: boolean;
    timeline: Array<{ label: string; date: string | null; state: string }>;
};

type Props = {
    applications: ApplicationRow[];
    stats: {
        total: number;
        active: number;
        interviews: number;
        offers: number;
    };
    filters: Array<{ value: string; label: string; count: number }>;
};

export default function JobSeekerApplications({
    applications,
    stats,
    filters,
}: Props) {
    const { t } = useLocale();
    const [statusFilter, setStatusFilter] = useState('all');
    const [viewing, setViewing] = useState<ApplicationRow | null>(null);

    const filtered = useMemo(() => {
        if (statusFilter === 'all') {
            return applications;
        }

        return applications.filter(
            (row) => row.status_value === statusFilter,
        );
    }, [applications, statusFilter]);

    const filterChips = [
        { value: 'all', label: t('common.all'), count: stats.total },
        ...filters,
    ];

    return (
        <JobSeekerLayout title={t('job_seeker.applications.title')}>
            <Head title={t('job_seeker.applications.title')} />

            <div className="space-y-5 p-6">
                <div>
                    <h1 className="text-2xl font-extrabold text-[#050315]">
                        {t('job_seeker.applications.title')}
                    </h1>
                    <p className="pt-1 text-sm text-[#6a7282]">
                        {t('job_seeker.applications.subtitle')}
                    </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    {(
                        [
                            [
                                t('job_seeker.applications.total'),
                                stats.total,
                                'text-[#0057c8]',
                            ],
                            [
                                t('job_seeker.applications.active'),
                                stats.active,
                                'text-[#e57124]',
                            ],
                            [
                                t('job_seeker.applications.interviews'),
                                stats.interviews,
                                'text-[#15803d]',
                            ],
                            [
                                t('job_seeker.applications.offers'),
                                stats.offers,
                                'text-[#7e22ce]',
                            ],
                        ] as const
                    ).map(([label, value, tone]) => (
                        <div
                            key={label}
                            className="rounded-2xl border border-[#e2e8f0] bg-white px-5 py-4 shadow-[0px_1px_3px_rgba(0,0,0,0.06)]"
                        >
                            <p className={cn('text-2xl font-extrabold', tone)}>
                                {value}
                            </p>
                            <p className="pt-0.5 text-sm text-[#6a7282]">
                                {label}
                            </p>
                        </div>
                    ))}
                </div>

                <div className="flex flex-wrap gap-2">
                    {filterChips.map((chip) => {
                        const active = statusFilter === chip.value;

                        return (
                            <button
                                key={chip.value}
                                type="button"
                                onClick={() => setStatusFilter(chip.value)}
                                className={cn(
                                    'cursor-pointer rounded-full px-3.5 py-1.5 text-sm font-semibold',
                                    active
                                        ? 'bg-[#0f172a] text-white'
                                        : 'bg-white text-[#475569] ring-1 ring-[#e2e8f0]',
                                )}
                            >
                                {chip.label} ({chip.count})
                            </button>
                        );
                    })}
                </div>

                <div className="space-y-4">
                    {filtered.map((application) => (
                        <div
                            key={application.id}
                            className="rounded-2xl border border-[#e2e8f0] bg-white p-5 shadow-[0px_1px_3px_rgba(0,0,0,0.06)]"
                        >
                            <div className="flex flex-wrap items-start justify-between gap-3">
                                <div className="flex min-w-0 items-start gap-3">
                                    <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[#0057c8] text-sm font-bold text-white">
                                        {getInitials(
                                            application.company || 'JP',
                                        )}
                                    </div>
                                    <div className="min-w-0">
                                        <h2 className="text-base font-bold text-[#050315]">
                                            {application.title}
                                        </h2>
                                        <p className="text-sm text-[#64748b]">
                                            {application.company}
                                            {application.location
                                                ? ` · ${application.location}`
                                                : ''}
                                        </p>
                                        <p className="pt-1 text-xs text-[#99a1af]">
                                            {t('job_seeker.applications.applied')}
                                            : {application.applied_at}
                                            {application.salary
                                                ? ` · ${application.salary}`
                                                : ''}
                                        </p>
                                    </div>
                                </div>
                                <StatusBadge
                                    status={
                                        (application.status ||
                                            'Applied') as ApplicationStatus
                                    }
                                />
                            </div>

                            <div className="mt-4 flex gap-1.5">
                                {Array.from({ length: 5 }).map((_, index) => (
                                    <span
                                        key={index}
                                        className={cn(
                                            'h-1.5 flex-1 rounded-full',
                                            index < application.progress
                                                ? 'bg-[#0f172a]'
                                                : 'bg-[#e2e8f0]',
                                        )}
                                    />
                                ))}
                            </div>

                            <div className="mt-4 flex flex-wrap gap-2">
                                <button
                                    type="button"
                                    className="inline-flex h-[34px] cursor-pointer items-center rounded-lg bg-[#0057c8] px-3.5 text-sm font-semibold text-white hover:bg-[#0046a3]"
                                    onClick={() => setViewing(application)}
                                >
                                    {t('job_seeker.applications.view_details')}
                                </button>
                                {application.can_withdraw && (
                                    <button
                                        type="button"
                                        className="inline-flex h-[34px] cursor-pointer items-center rounded-lg border border-[#bfdbfe] bg-white px-3.5 text-sm font-semibold text-[#0057c8] hover:bg-[#f8faff]"
                                        onClick={() =>
                                            router.post(
                                                `/job-seeker/applications/${application.id}/withdraw`,
                                            )
                                        }
                                    >
                                        {t('job_seeker.applications.withdraw')}
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                    {filtered.length === 0 && (
                        <p className="rounded-2xl border border-[#e2e8f0] bg-white py-10 text-center text-sm text-[#99a1af]">
                            {t('job_seeker.applications.empty')}
                        </p>
                    )}
                </div>
            </div>

            <ApplicationDetailDrawer
                open={viewing !== null}
                onOpenChange={(open) => {
                    if (!open) {
                        setViewing(null);
                    }
                }}
                application={viewing}
            />
        </JobSeekerLayout>
    );
}
