import { Head, router, usePage } from '@inertiajs/react';
import { Download, Eye, FileText } from 'lucide-react';
import { useState } from 'react';

import {
    CandidatePreviewDrawer,
    type CandidatePreview,
} from '@/components/admin-portal/candidate-preview-drawer';
import {
    AdminFilterChip,
    AdminPageHeader,
    AdminPagination,
    AdminPanel,
    AdminSecondaryButton,
    AdminStatCard,
    AdminStatusBadge,
    AdminTableShell,
} from '@/components/admin-portal/ui';
import { useLocale } from '@/hooks/use-locale';
import AdminPortalLayout from '@/layouts/admin-portal-layout';
import type { SharedData } from '@/types';

type ApplicationRow = {
    id: number;
    seeker: string | null;
    email: string | null;
    job: string | null;
    employer: string | null;
    status: string;
    status_value: string;
    date: string | null;
    resume_url: string;
    preview: CandidatePreview;
};

type Props = {
    applications: {
        data: ApplicationRow[];
        links: Array<{ url: string | null; label: string; active: boolean }>;
        from: number | null;
        to: number | null;
        total: number;
    };
    filters: {
        status: string;
        experience?: string;
        experience_sort?: string;
    };
    experience_options?: Array<{
        key: string;
        label: string;
        min: number | null;
        max: number | null;
    }>;
    stats: { total: number; today: number; interviews: number; hired: number };
    trend: Array<{ label: string; count: number }>;
};

const filterChipKeys = [
    ['all', 'common.all'],
    ['applied', 'status.applied'],
    ['under_review', 'status.under_review'],
    ['shortlisted', 'status.shortlisted'],
    ['interview', 'status.interview'],
    ['hired', 'status.hired'],
    ['rejected', 'common.rejected'],
] as const;

function statusTone(
    value: string,
): 'success' | 'warning' | 'danger' | 'info' | 'neutral' {
    if (value === 'Hired' || value === 'Offer') {
        return 'success';
    }
    if (value === 'Interview' || value === 'Shortlisted') {
        return 'info';
    }
    if (value === 'Rejected' || value === 'Withdrawn') {
        return 'danger';
    }
    if (value === 'Under Review') {
        return 'warning';
    }

    return 'neutral';
}

export default function ApplicationsMonitoring({
    applications,
    filters,
    experience_options = [],
    stats,
    trend,
}: Props) {
    const { flash } = usePage<SharedData>().props;
    const { t } = useLocale();
    const maxTrend = Math.max(...trend.map((item) => item.count), 1);
    const [viewing, setViewing] = useState<ApplicationRow | null>(null);

    const visitApplications = (query: Record<string, string>): void => {
        router.get('/admin/applications', query, {
            preserveState: true,
            replace: true,
        });
    };

    const currentQuery = (): Record<string, string> => {
        const query: Record<string, string> = {};

        if (filters.status) {
            query.status = filters.status;
        }

        if (filters.experience) {
            query.experience = filters.experience;
        }

        if (filters.experience_sort) {
            query.experience_sort = filters.experience_sort;
        }

        return query;
    };

    return (
        <AdminPortalLayout>
            <Head title={t('admin.applications.title')} />

            <div className="space-y-6 p-6">
                <AdminPageHeader
                    title={t('admin.applications.title')}
                    subtitle={t('admin.applications.subtitle')}
                    actions={
                        <a href="/admin/applications/export">
                            <AdminSecondaryButton>
                                <Download className="size-4" />
                                {t('common.export')}
                            </AdminSecondaryButton>
                        </a>
                    }
                />

                {flash.success && (
                    <div className="rounded-xl border border-[#bbf7d0] bg-[#f0fdf4] px-4 py-3 text-sm text-[#15803d]">
                        {typeof flash.success === 'string'
                            ? flash.success
                            : t('common.saved')}
                    </div>
                )}

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <AdminStatCard
                        label={t('admin.applications.stats.total')}
                        value={stats.total.toLocaleString()}
                        valueClassName="text-[#0057c8]"
                        icon={FileText}
                    />
                    <AdminStatCard
                        label={t('admin.applications.this_week')}
                        value={stats.today.toLocaleString()}
                        valueClassName="text-[#e57124]"
                        icon={FileText}
                    />
                    <AdminStatCard
                        label={t('admin.applications.stats.interview')}
                        value={stats.interviews.toLocaleString()}
                        valueClassName="text-[#3977a6]"
                        icon={FileText}
                    />
                    <AdminStatCard
                        label={t('admin.applications.stats.hired')}
                        value={stats.hired.toLocaleString()}
                        valueClassName="text-[#10b981]"
                        icon={FileText}
                    />
                </div>

                <AdminPanel>
                    <h2 className="mb-4 text-sm font-bold text-[#050315]">
                        {t('admin.applications.this_week')}
                    </h2>
                    <div className="flex h-32 items-end gap-3">
                        {trend.map((item) => (
                            <div
                                key={item.label}
                                className="flex flex-1 flex-col items-center gap-2"
                            >
                                <div
                                    className="w-full rounded-t-lg bg-[#0057c8]"
                                    style={{
                                        height: `${Math.max((item.count / maxTrend) * 100, 6)}%`,
                                    }}
                                />
                                <span className="text-xs text-[#64748b]">
                                    {item.label}
                                </span>
                            </div>
                        ))}
                    </div>
                </AdminPanel>

                <AdminPanel>
                    <div className="mb-4 flex flex-wrap gap-2">
                        {filterChipKeys.map(([key, labelKey]) => (
                            <AdminFilterChip
                                key={key}
                                label={t(labelKey)}
                                active={(filters.status || 'all') === key}
                                onClick={() => {
                                    const query = currentQuery();
                                    delete query.status;

                                    if (key !== 'all') {
                                        query.status = key;
                                    }

                                    visitApplications(query);
                                }}
                            />
                        ))}
                    </div>
                    <div className="mb-4 flex flex-wrap gap-3">
                        <select
                            value={filters.experience ?? ''}
                            onChange={(event) => {
                                const query = currentQuery();

                                if (event.target.value) {
                                    query.experience = event.target.value;
                                } else {
                                    delete query.experience;
                                }

                                visitApplications(query);
                            }}
                            aria-label={t(
                                'admin.applications.experience_filter',
                            )}
                            className="h-9 rounded-lg border border-[#e2e8f0] bg-white px-3 text-sm text-[#050315]"
                        >
                            <option value="">
                                {t('admin.applications.experience_all')}
                            </option>
                            {experience_options.map((option) => (
                                <option key={option.key} value={option.key}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                        <select
                            value={filters.experience_sort ?? ''}
                            onChange={(event) => {
                                const query = currentQuery();

                                if (event.target.value) {
                                    query.experience_sort = event.target.value;
                                } else {
                                    delete query.experience_sort;
                                }

                                visitApplications(query);
                            }}
                            aria-label={t('admin.applications.experience_sort')}
                            className="h-9 rounded-lg border border-[#e2e8f0] bg-white px-3 text-sm text-[#050315]"
                        >
                            <option value="">
                                {t('admin.applications.sort_newest')}
                            </option>
                            <option value="asc">
                                {t('admin.applications.sort_exp_asc')}
                            </option>
                            <option value="desc">
                                {t('admin.applications.sort_exp_desc')}
                            </option>
                        </select>
                    </div>

                    <AdminTableShell
                        headers={[
                            t('admin.applications.cols.candidate'),
                            t('admin.applications.cols.email'),
                            t('admin.applications.cols.job'),
                            t('admin.applications.cols.employer'),
                            t('admin.applications.cols.status'),
                            t('admin.applications.cols.date'),
                            t('common.actions'),
                        ]}
                    >
                        {applications.data.map((row) => (
                            <tr
                                key={row.id}
                                className="border-b border-[#e2e8f0] last:border-0 hover:bg-[#f8faff]"
                            >
                                <td className="px-3 py-3 font-semibold text-[#050315]">
                                    {row.seeker}
                                </td>
                                <td className="px-3 py-3 text-[#64748b]">
                                    {row.email}
                                </td>
                                <td className="px-3 py-3 text-[#64748b]">
                                    {row.job}
                                </td>
                                <td className="px-3 py-3 text-[#64748b]">
                                    {row.employer}
                                </td>
                                <td className="px-3 py-3">
                                    <AdminStatusBadge
                                        label={row.status}
                                        tone={statusTone(row.status)}
                                    />
                                </td>
                                <td className="px-3 py-3 text-[#64748b]">
                                    {row.date ?? '—'}
                                </td>
                                <td className="px-3 py-3">
                                    <button
                                        type="button"
                                        className="inline-flex h-[30px] items-center justify-center gap-1.5 rounded-[6.4px] border border-[#bfdbfe] bg-white px-2.5 text-xs font-semibold text-[#0057c8] hover:bg-[#eff6ff]"
                                        onClick={() => setViewing(row)}
                                    >
                                        <Eye className="size-3.5" />
                                        {t('common.details')}
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </AdminTableShell>

                    {applications.data.length === 0 && (
                        <p className="mt-6 text-center text-sm text-[#99a1af]">
                            {t('admin.applications.empty')}
                        </p>
                    )}

                    <AdminPagination
                        showingLabel={t('common.showing_range', {
                            from: applications.from ?? 0,
                            to: applications.to ?? 0,
                            total: applications.total,
                        })}
                        links={applications.links}
                    />
                </AdminPanel>
            </div>

            <CandidatePreviewDrawer
                open={viewing !== null}
                onOpenChange={(open) => {
                    if (!open) {
                        setViewing(null);
                    }
                }}
                preview={viewing?.preview ?? null}
            />
        </AdminPortalLayout>
    );
}
