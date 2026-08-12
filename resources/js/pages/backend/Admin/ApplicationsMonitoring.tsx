import { Head } from '@inertiajs/react';
import {
    Activity,
    Calendar,
    Download,
    Eye,
    FileText,
    TrendingUp,
} from 'lucide-react';

import {
    AdminPageHeader,
    AdminPagination,
    AdminPanel,
    AdminSecondaryButton,
    AdminStatCard,
    AdminStatusBadge,
    AdminTableShell,
} from '@/components/admin-portal/ui';
import AdminPortalLayout from '@/layouts/admin-portal-layout';

const applicationStats = [
    { label: 'Total Applications', value: '184,291', tone: 'text-[#0057c8]' },
    { label: 'This Month', value: '12,840', tone: 'text-[#e57124]' },
    { label: 'Today', value: '1,203', tone: 'text-[#0057c8]' },
    { label: 'Avg / Job', value: '36', tone: 'text-[#3977a6]' },
];

const statusDistribution = [
    { label: 'Applied', percent: 42, color: '#0057c8' },
    { label: 'Under Review', percent: 28, color: '#3977a6' },
    { label: 'Shortlisted', percent: 15, color: '#10b981' },
    { label: 'Interview', percent: 8, color: '#e57124' },
    { label: 'Hired', percent: 5, color: '#0ea5e9' },
    { label: 'Rejected', percent: 2, color: '#ef4444' },
];

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'];

const applicationRows = [
    {
        id: 'APP-92841',
        candidate: 'Rania Ahmed',
        employer: 'Emirates Tech Solutions',
        job: 'Senior React Developer',
        date: '2024-03-12',
        status: 'Under Review',
    },
    {
        id: 'APP-92840',
        candidate: 'Ali Khan',
        employer: 'Gulf Construction Co.',
        job: 'Site Engineer',
        date: '2024-03-12',
        status: 'Applied',
    },
    {
        id: 'APP-92839',
        candidate: 'Mariam Hassan',
        employer: 'Desert Finance Group',
        job: 'Financial Analyst',
        date: '2024-03-11',
        status: 'Shortlisted',
    },
    {
        id: 'APP-92838',
        candidate: 'Omar Saleh',
        employer: 'Apex Logistics',
        job: 'Logistics Coordinator',
        date: '2024-03-11',
        status: 'Interview',
    },
    {
        id: 'APP-92837',
        candidate: 'Layla Nour',
        employer: 'Bright Health Clinics',
        job: 'Registered Nurse',
        date: '2024-03-10',
        status: 'Hired',
    },
    {
        id: 'APP-92836',
        candidate: 'Hassan Farid',
        employer: 'Nova Retail LLC',
        job: 'Store Manager',
        date: '2024-03-10',
        status: 'Rejected',
    },
    {
        id: 'APP-92835',
        candidate: 'Noor Yasin',
        employer: 'Horizon Media',
        job: 'Content Producer',
        date: '2024-03-09',
        status: 'Applied',
    },
];

function applicationStatusTone(
    status: string,
): 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'orange' {
    if (status === 'Hired') {
        return 'success';
    }
    if (status === 'Shortlisted' || status === 'Interview') {
        return 'orange';
    }
    if (status === 'Under Review') {
        return 'info';
    }
    if (status === 'Rejected') {
        return 'danger';
    }
    return 'neutral';
}

export default function ApplicationsMonitoring() {
    return (
        <AdminPortalLayout>
            <Head title="Applications Monitoring" />

            <div className="space-y-6 p-6">
                <AdminPageHeader
                    title="Applications Monitoring"
                    subtitle="Platform-wide application visibility and health monitoring."
                    actions={
                        <AdminSecondaryButton>
                            <Download className="size-4" />
                            Export
                        </AdminSecondaryButton>
                    }
                />

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    {applicationStats.map((stat, index) => (
                        <AdminStatCard
                            key={stat.label}
                            label={stat.label}
                            value={stat.value}
                            valueClassName={stat.tone}
                            icon={
                                [FileText, TrendingUp, Calendar, Activity][
                                    index
                                ]
                            }
                        />
                    ))}
                </div>

                <div className="grid gap-5 xl:grid-cols-2">
                    <AdminPanel>
                        <h2 className="text-base font-bold text-[#050315]">
                            Application Trends
                        </h2>
                        <p className="text-xs text-[#64748b]">
                            Monthly application volume — Jan to Aug 2024
                        </p>
                        <div className="mt-5 flex h-48 items-end gap-2">
                            {[42, 55, 48, 62, 58, 71, 68, 84].map(
                                (height, index) => (
                                    <div
                                        key={months[index]}
                                        className="flex flex-1 flex-col items-center gap-2"
                                    >
                                        <div
                                            className="w-full rounded-t-md bg-[#0057c8]/80"
                                            style={{ height: `${height}%` }}
                                        />
                                        <span className="text-[10px] font-semibold text-[#64748b]">
                                            {months[index]}
                                        </span>
                                    </div>
                                ),
                            )}
                        </div>
                    </AdminPanel>

                    <AdminPanel>
                        <h2 className="text-base font-bold text-[#050315]">
                            Status Distribution
                        </h2>
                        <p className="text-xs text-[#64748b]">
                            Current pipeline breakdown
                        </p>
                        <div className="mt-5 space-y-3">
                            {statusDistribution.map((item) => (
                                <div key={item.label}>
                                    <div className="mb-1 flex items-center justify-between text-xs">
                                        <span className="font-semibold text-[#050315]">
                                            {item.label}
                                        </span>
                                        <span className="text-[#64748b]">
                                            {item.percent}%
                                        </span>
                                    </div>
                                    <div className="h-2 overflow-hidden rounded-full bg-[#f1f5f9]">
                                        <div
                                            className="h-full rounded-full"
                                            style={{
                                                width: `${item.percent}%`,
                                                backgroundColor: item.color,
                                            }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </AdminPanel>
                </div>

                <AdminPanel>
                    <AdminTableShell
                        headers={[
                            'ID',
                            'Candidate',
                            'Employer',
                            'Job',
                            'Date',
                            'Status',
                            'Actions',
                        ]}
                    >
                        {applicationRows.map((row) => (
                            <tr
                                key={row.id}
                                className="border-b border-[#e2e8f0] last:border-0 hover:bg-[#f8faff]"
                            >
                                <td className="px-3 py-3 font-mono text-xs text-[#64748b]">
                                    {row.id}
                                </td>
                                <td className="px-3 py-3 font-semibold text-[#050315]">
                                    {row.candidate}
                                </td>
                                <td className="px-3 py-3 text-[#64748b]">
                                    {row.employer}
                                </td>
                                <td className="px-3 py-3 text-[#64748b]">
                                    {row.job}
                                </td>
                                <td className="px-3 py-3 text-[#64748b]">
                                    {row.date}
                                </td>
                                <td className="px-3 py-3">
                                    <AdminStatusBadge
                                        label={row.status}
                                        tone={applicationStatusTone(
                                            row.status,
                                        )}
                                    />
                                </td>
                                <td className="px-3 py-3">
                                    <button
                                        type="button"
                                        className="flex size-8 items-center justify-center rounded-lg border border-[#e2e8f0] text-[#64748b] hover:bg-[#f8faff]"
                                        aria-label="View application"
                                    >
                                        <Eye className="size-4" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </AdminTableShell>

                    <AdminPagination showingLabel="Showing 7 of 184,291" />
                </AdminPanel>
            </div>
        </AdminPortalLayout>
    );
}
