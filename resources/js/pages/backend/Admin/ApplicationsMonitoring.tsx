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
    filters: { status: string };
    stats: { total: number; today: number; interviews: number; hired: number };
    trend: Array<{ label: string; count: number }>;
};

const filterChips = [
    ['all', 'All'],
    ['applied', 'Applied'],
    ['under_review', 'Under Review'],
    ['shortlisted', 'Shortlisted'],
    ['interview', 'Interview'],
    ['hired', 'Hired'],
    ['rejected', 'Rejected'],
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
    stats,
    trend,
}: Props) {
    const { flash } = usePage<SharedData>().props;
    const maxTrend = Math.max(...trend.map((item) => item.count), 1);
    const [viewing, setViewing] = useState<ApplicationRow | null>(null);

    return (
        <AdminPortalLayout>
            <Head title="Applications Monitoring" />

            <div className="space-y-6 p-6">
                <AdminPageHeader
                    title="Applications Monitoring"
                    subtitle="Track every application across the platform."
                    actions={
                        <a href="/admin/applications/export">
                            <AdminSecondaryButton>
                                <Download className="size-4" />
                                Export
                            </AdminSecondaryButton>
                        </a>
                    }
                />

                {flash.success && (
                    <div className="rounded-xl border border-[#bbf7d0] bg-[#f0fdf4] px-4 py-3 text-sm text-[#15803d]">
                        {typeof flash.success === 'string'
                            ? flash.success
                            : 'Saved successfully.'}
                    </div>
                )}

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <AdminStatCard
                        label="Total Applications"
                        value={stats.total.toLocaleString()}
                        valueClassName="text-[#0057c8]"
                        icon={FileText}
                    />
                    <AdminStatCard
                        label="Today"
                        value={stats.today.toLocaleString()}
                        valueClassName="text-[#e57124]"
                        icon={FileText}
                    />
                    <AdminStatCard
                        label="Interviews"
                        value={stats.interviews.toLocaleString()}
                        valueClassName="text-[#3977a6]"
                        icon={FileText}
                    />
                    <AdminStatCard
                        label="Hired"
                        value={stats.hired.toLocaleString()}
                        valueClassName="text-[#10b981]"
                        icon={FileText}
                    />
                </div>

                <AdminPanel>
                    <h2 className="mb-4 text-sm font-bold text-[#050315]">
                        Applications this week
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
                        {filterChips.map(([key, label]) => (
                            <AdminFilterChip
                                key={key}
                                label={label}
                                active={(filters.status || 'all') === key}
                                onClick={() =>
                                    router.get(
                                        '/admin/applications',
                                        key === 'all' ? {} : { status: key },
                                        { preserveState: true, replace: true },
                                    )
                                }
                            />
                        ))}
                    </div>

                    <AdminTableShell
                        headers={[
                            'Candidate',
                            'Email',
                            'Job',
                            'Employer',
                            'Status',
                            'Date',
                            'Actions',
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
                                        Details
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </AdminTableShell>

                    {applications.data.length === 0 && (
                        <p className="mt-6 text-center text-sm text-[#99a1af]">
                            No applications yet.
                        </p>
                    )}

                    <AdminPagination
                        showingLabel={`Showing ${applications.from ?? 0}-${applications.to ?? 0} of ${applications.total}`}
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
