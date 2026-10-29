import { Head, Link } from '@inertiajs/react';

import {
    MobileListCard,
    MobileListCardActions,
    MobileListCardHeader,
    MobileListCardMeta,
    MobileListEmpty,
    MobileListStack,
} from '@/components/mobile-list-card';
import {
    PortalPagination,
    type PortalPaginator,
} from '@/components/portal-pagination';
import { useLocale } from '@/hooks/use-locale';
import EmployerLayout from '@/layouts/employer-layout';
import { employerListRowBg } from '@/lib/employer-list-row';
import { cn } from '@/lib/utils';

type JobReportRow = {
    id: number;
    reference: string;
    title: string;
    status: string;
    status_value: string;
    expires_at: string | null;
    total: number;
    shortlisted: number;
    interview: number;
    hired: number;
    rejected: number;
    export_url: string;
    applications_url: string;
};

type Props = {
    jobs: PortalPaginator<JobReportRow>;
};

export default function EmployerReports({ jobs: jobsPage }: Props) {
    const { t } = useLocale();
    const jobs = jobsPage.data;

    const headings = [
        t('employer.reports.col.job'),
        t('employer.reports.col.job_id'),
        t('common.status'),
        t('employer.reports.col.total'),
        t('employer.reports.col.shortlisted'),
        t('employer.reports.col.interview'),
        t('employer.reports.col.hired'),
        t('employer.reports.col.rejected'),
        t('common.actions'),
    ];

    return (
        <EmployerLayout title={t('employer.reports.title')}>
            <Head title={t('employer.reports.title')} />

            <div className="flex flex-col gap-5 px-4 py-6 sm:px-6">
                <div>
                    <h1 className="text-2xl leading-9 font-bold text-[#050315]">
                        {t('employer.reports.title')}
                    </h1>
                    <p className="mt-1 text-sm leading-[21px] text-[#475569]">
                        {t('employer.reports.subtitle')}
                    </p>
                </div>

                {jobs.length === 0 ? (
                    <MobileListEmpty>
                        {t('employer.reports.empty')}
                    </MobileListEmpty>
                ) : (
                    <MobileListStack>
                        {jobs.map((job) => (
                            <MobileListCard key={job.id}>
                                <MobileListCardHeader
                                    title={job.title}
                                    subtitle={job.reference}
                                    badge={
                                        <span className="inline-flex rounded-full bg-[#f1f5f9] px-2.5 py-0.5 text-[11px] font-semibold text-[#475569]">
                                            {job.status}
                                        </span>
                                    }
                                />
                                <MobileListCardMeta
                                    items={[
                                        {
                                            label: t(
                                                'employer.reports.col.total',
                                            ),
                                            value: String(job.total),
                                        },
                                        {
                                            label: t(
                                                'employer.reports.col.shortlisted',
                                            ),
                                            value: String(job.shortlisted),
                                        },
                                        {
                                            label: t(
                                                'employer.reports.col.interview',
                                            ),
                                            value: String(job.interview),
                                        },
                                        {
                                            label: t(
                                                'employer.reports.col.hired',
                                            ),
                                            value: String(job.hired),
                                        },
                                    ]}
                                />
                                <MobileListCardActions
                                    primary={
                                        <Link
                                            href={job.applications_url}
                                            className="inline-flex h-9 w-full items-center justify-center rounded-xl bg-[#0057c8] px-3 text-xs font-semibold text-white"
                                        >
                                            {t(
                                                'employer.reports.view_applicants',
                                            )}
                                        </Link>
                                    }
                                    moreItems={[
                                        {
                                            key: 'download',
                                            label: t(
                                                'employer.reports.download',
                                            ),
                                            href: job.export_url,
                                        },
                                    ]}
                                />
                            </MobileListCard>
                        ))}
                    </MobileListStack>
                )}

                <div className="hidden overflow-x-auto rounded-2xl border border-[rgba(57,119,166,0.2)] bg-white md:block">
                    <table className="min-w-full text-left text-sm">
                        <thead className="border-b border-[rgba(57,119,166,0.15)] bg-[#f8faff] text-xs font-semibold tracking-wide text-[#475569] uppercase">
                            <tr>
                                {headings.map((heading) => (
                                    <th
                                        key={heading}
                                        className="px-4 py-3 whitespace-nowrap"
                                    >
                                        {heading}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {jobs.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={headings.length}
                                        className="px-4 py-10 text-center text-[#64748b]"
                                    >
                                        {t('employer.reports.empty')}
                                    </td>
                                </tr>
                            ) : (
                                jobs.map((job, index) => (
                                    <tr
                                        key={job.id}
                                        className={cn(
                                            'border-b border-[rgba(57,119,166,0.1)] last:border-0',
                                            employerListRowBg(index),
                                        )}
                                    >
                                        <td className="px-4 py-3 font-medium text-[#050315]">
                                            {job.title}
                                        </td>
                                        <td className="px-4 py-3 text-[#475569]">
                                            {job.reference}
                                        </td>
                                        <td className="px-4 py-3 text-[#475569]">
                                            {job.status}
                                        </td>
                                        <td className="px-4 py-3">
                                            {job.total}
                                        </td>
                                        <td className="px-4 py-3">
                                            {job.shortlisted}
                                        </td>
                                        <td className="px-4 py-3">
                                            {job.interview}
                                        </td>
                                        <td className="px-4 py-3">
                                            {job.hired}
                                        </td>
                                        <td className="px-4 py-3">
                                            {job.rejected}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex flex-wrap gap-2">
                                                <Link
                                                    href={job.applications_url}
                                                    className="inline-flex h-8 items-center rounded-lg bg-[#e6f0fb] px-3 text-xs font-semibold text-[#0057c8]"
                                                >
                                                    {t(
                                                        'employer.reports.view_applicants',
                                                    )}
                                                </Link>
                                                <a
                                                    href={job.export_url}
                                                    className="inline-flex h-8 items-center rounded-lg bg-[#0057c8] px-3 text-xs font-semibold text-white"
                                                >
                                                    {t(
                                                        'employer.reports.download',
                                                    )}
                                                </a>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                <PortalPagination
                    showingLabel={t('common.showing_range', {
                        from: jobsPage.from ?? 0,
                        to: jobsPage.to ?? 0,
                        total: jobsPage.total,
                    })}
                    links={jobsPage.links}
                />
            </div>
        </EmployerLayout>
    );
}
