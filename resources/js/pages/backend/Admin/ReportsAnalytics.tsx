import { Head } from '@inertiajs/react';
import {
    Briefcase,
    Building2,
    Download,
    FileSpreadsheet,
    FileText,
    Plus,
    RefreshCw,
    ShieldCheck,
    Trash2,
    UserRound,
    Wallet,
} from 'lucide-react';

import {
    AdminPageHeader,
    AdminPanel,
    AdminPrimaryButton,
    AdminSecondaryButton,
    AdminTableShell,
} from '@/components/admin-portal/ui';
import AdminPortalLayout from '@/layouts/admin-portal-layout';

const reportTypes = [
    {
        title: 'Employer Report',
        description: 'Account growth, verification, and subscription metrics.',
        icon: Building2,
        iconBg: 'bg-[#dbeafe] text-[#0057c8]',
    },
    {
        title: 'Job Seeker Report',
        description: 'Registration trends, activity, and engagement data.',
        icon: UserRound,
        iconBg: 'bg-[#dcfce7] text-[#065f46]',
    },
    {
        title: 'Job Report',
        description: 'Listing performance, approvals, and category breakdown.',
        icon: Briefcase,
        iconBg: 'bg-[#ffedd5] text-[#c2410c]',
    },
    {
        title: 'Revenue Report',
        description: 'Transactions, refunds, and package revenue analysis.',
        icon: Wallet,
        iconBg: 'bg-[#fef3c7] text-[#92400e]',
    },
    {
        title: 'Application Report',
        description: 'Pipeline funnel, conversion rates, and status trends.',
        icon: FileText,
        iconBg: 'bg-[#e0e7ff] text-[#4338ca]',
    },
    {
        title: 'Verification Report',
        description: 'Review times, approval rates, and document compliance.',
        icon: ShieldCheck,
        iconBg: 'bg-[#fce7f3] text-[#be185d]',
    },
];

const recentReports = [
    {
        name: 'Monthly Employer Summary',
        module: 'Employer',
        lastGenerated: '2024-03-12 09:30',
        size: '2.4 MB',
    },
    {
        name: 'Q1 Revenue Analysis',
        module: 'Revenue',
        lastGenerated: '2024-03-11 14:15',
        size: '1.8 MB',
    },
    {
        name: 'Job Seeker Activity Report',
        module: 'Job Seeker',
        lastGenerated: '2024-03-10 11:00',
        size: '3.1 MB',
    },
    {
        name: 'Verification Compliance Audit',
        module: 'Verification',
        lastGenerated: '2024-03-09 16:45',
        size: '890 KB',
    },
    {
        name: 'Weekly Application Funnel',
        module: 'Application',
        lastGenerated: '2024-03-08 08:00',
        size: '1.2 MB',
    },
];

const exportFormats = ['PDF', 'CSV', 'Excel'];

export default function ReportsAnalytics() {
    return (
        <AdminPortalLayout>
            <Head title="Reports & Analytics" />

            <div className="space-y-6 p-6">
                <AdminPageHeader
                    title="Reports & Analytics"
                    subtitle="Generate, export, and analyze platform reports."
                    actions={
                        <AdminPrimaryButton>
                            <Plus className="size-4" />
                            Build Report
                        </AdminPrimaryButton>
                    }
                />

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {reportTypes.map((report) => {
                        const Icon = report.icon;

                        return (
                            <AdminPanel
                                key={report.title}
                                className="flex flex-col gap-3"
                            >
                                <div className="flex items-start gap-3">
                                    <div
                                        className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${report.iconBg}`}
                                    >
                                        <Icon className="size-5" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-[#050315]">
                                            {report.title}
                                        </h3>
                                        <p className="mt-0.5 text-xs text-[#64748b]">
                                            {report.description}
                                        </p>
                                    </div>
                                </div>
                                <div className="mt-auto flex flex-wrap gap-1.5">
                                    {exportFormats.map((format) => (
                                        <button
                                            key={format}
                                            type="button"
                                            className="inline-flex items-center gap-1 rounded-lg border border-[#e2e8f0] px-2.5 py-1 text-xs font-semibold text-[#64748b] hover:bg-[#f8faff]"
                                        >
                                            {format === 'PDF' && (
                                                <FileText className="size-3" />
                                            )}
                                            {format === 'CSV' && (
                                                <FileSpreadsheet className="size-3" />
                                            )}
                                            {format === 'Excel' && (
                                                <FileSpreadsheet className="size-3" />
                                            )}
                                            {format}
                                        </button>
                                    ))}
                                </div>
                            </AdminPanel>
                        );
                    })}
                </div>

                <AdminPanel>
                    <h2 className="mb-4 text-base font-bold text-[#050315]">
                        Recent Reports
                    </h2>
                    <AdminTableShell
                        headers={[
                            'Report Name',
                            'Module',
                            'Last Generated',
                            'Size',
                            'Actions',
                        ]}
                    >
                        {recentReports.map((report) => (
                            <tr
                                key={report.name}
                                className="border-b border-[#e2e8f0] last:border-0 hover:bg-[#f8faff]"
                            >
                                <td className="px-3 py-3 font-semibold text-[#050315]">
                                    {report.name}
                                </td>
                                <td className="px-3 py-3 text-[#64748b]">
                                    {report.module}
                                </td>
                                <td className="px-3 py-3 text-[#64748b]">
                                    {report.lastGenerated}
                                </td>
                                <td className="px-3 py-3 text-[#64748b]">
                                    {report.size}
                                </td>
                                <td className="px-3 py-3">
                                    <div className="flex items-center gap-1.5">
                                        <button
                                            type="button"
                                            className="inline-flex items-center gap-1 rounded-lg border border-[#e2e8f0] px-2.5 py-1.5 text-xs font-semibold text-[#0057c8] hover:bg-[#f8faff]"
                                        >
                                            <Download className="size-3.5" />
                                            Download
                                        </button>
                                        <button
                                            type="button"
                                            className="inline-flex items-center gap-1 rounded-lg border border-[#e2e8f0] px-2.5 py-1.5 text-xs font-semibold text-[#64748b] hover:bg-[#f8faff]"
                                        >
                                            <RefreshCw className="size-3.5" />
                                            Regenerate
                                        </button>
                                        <button
                                            type="button"
                                            className="flex size-8 items-center justify-center rounded-lg border border-[#fee2e2] text-[#991b1b] hover:bg-[#fef2f2]"
                                            aria-label="Delete report"
                                        >
                                            <Trash2 className="size-4" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </AdminTableShell>
                </AdminPanel>
            </div>
        </AdminPortalLayout>
    );
}
