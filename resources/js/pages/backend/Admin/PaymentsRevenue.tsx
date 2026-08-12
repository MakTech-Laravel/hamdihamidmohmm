import { Head } from '@inertiajs/react';
import {
    AlertCircle,
    Check,
    CreditCard,
    DollarSign,
    Download,
    RefreshCw,
    TrendingUp,
} from 'lucide-react';
import { useState } from 'react';

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
import { cn } from '@/lib/utils';

const revenueStats = [
    {
        label: "Today's Revenue",
        value: 'AED 9,798',
        tone: 'text-[#e57124]',
    },
    { label: 'Monthly Revenue', value: 'AED 134K', tone: 'text-[#0057c8]' },
    { label: 'Failed Payments', value: '3', tone: 'text-[#ef4444]' },
    {
        label: 'Refund Requests',
        value: '7',
        tone: 'text-[#3977a6]',
    },
];

const rangeChips = ['7D', '30D', '3M', '1Y'] as const;

const transactions = [
    {
        id: 'TXN-48291',
        employer: 'Emirates Tech Solutions',
        package: 'Enterprise',
        amount: 'AED 1,999',
        method: 'Credit Card',
        date: '2024-03-12',
        status: 'Completed',
    },
    {
        id: 'TXN-48290',
        employer: 'Gulf Construction Co.',
        package: 'Professional',
        amount: 'AED 799',
        method: 'Bank Transfer',
        date: '2024-03-12',
        status: 'Completed',
    },
    {
        id: 'TXN-48289',
        employer: 'Nova Retail LLC',
        package: 'Starter',
        amount: 'AED 299',
        method: 'Credit Card',
        date: '2024-03-11',
        status: 'Failed',
    },
    {
        id: 'TXN-48288',
        employer: 'Apex Logistics',
        package: 'Professional',
        amount: 'AED 799',
        method: 'Credit Card',
        date: '2024-03-11',
        status: 'Refund Requested',
    },
    {
        id: 'TXN-48287',
        employer: 'Bright Health Clinics',
        package: 'Starter',
        amount: 'AED 299',
        method: 'Credit Card',
        date: '2024-03-10',
        status: 'Completed',
    },
    {
        id: 'TXN-48286',
        employer: 'Horizon Media',
        package: 'Enterprise',
        amount: 'AED 1,999',
        method: 'Bank Transfer',
        date: '2024-03-10',
        status: 'Pending',
    },
    {
        id: 'TXN-48285',
        employer: 'Desert Finance Group',
        package: 'Professional',
        amount: 'AED 799',
        method: 'Credit Card',
        date: '2024-03-09',
        status: 'Completed',
    },
];

function transactionStatusTone(
    status: string,
): 'success' | 'warning' | 'danger' | 'info' | 'neutral' {
    if (status === 'Completed') {
        return 'success';
    }
    if (status === 'Pending' || status === 'Refund Requested') {
        return 'warning';
    }
    if (status === 'Failed') {
        return 'danger';
    }
    return 'neutral';
}

export default function PaymentsRevenue() {
    const [activeRange, setActiveRange] =
        useState<(typeof rangeChips)[number]>('30D');

    return (
        <AdminPortalLayout>
            <Head title="Payments & Revenue" />

            <div className="space-y-6 p-6">
                <AdminPageHeader
                    title="Payments & Revenue"
                    subtitle="Monitor transactions, manage refunds, and track revenue performance."
                    actions={
                        <AdminSecondaryButton>
                            <Download className="size-4" />
                            Export
                        </AdminSecondaryButton>
                    }
                />

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    {revenueStats.map((stat, index) => (
                        <AdminStatCard
                            key={stat.label}
                            label={stat.label}
                            value={stat.value}
                            valueClassName={stat.tone}
                            icon={
                                [DollarSign, TrendingUp, AlertCircle, RefreshCw][
                                    index
                                ]
                            }
                        />
                    ))}
                </div>

                <AdminPanel>
                    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h2 className="text-base font-bold text-[#050315]">
                                Revenue Trend
                            </h2>
                            <p className="text-xs text-[#64748b]">
                                Daily revenue performance
                            </p>
                        </div>
                        <div className="flex gap-2">
                            {rangeChips.map((chip) => (
                                <AdminFilterChip
                                    key={chip}
                                    label={chip}
                                    active={activeRange === chip}
                                    onClick={() => setActiveRange(chip)}
                                />
                            ))}
                        </div>
                    </div>
                    <div className="relative h-52 overflow-hidden rounded-xl bg-[#f8faff]">
                        <svg
                            viewBox="0 0 640 200"
                            className="h-full w-full"
                            preserveAspectRatio="none"
                        >
                            <polyline
                                fill="none"
                                stroke="#0057c8"
                                strokeWidth="3"
                                points="20,150 80,120 140,130 200,90 260,100 320,60 380,80 440,45 500,65 560,30 620,50"
                            />
                            <polyline
                                fill="none"
                                stroke="#e57124"
                                strokeWidth="2"
                                strokeDasharray="6 4"
                                points="20,160 80,145 140,140 200,135 260,120 320,115 380,110 440,100 500,95 560,85 620,75"
                            />
                        </svg>
                    </div>
                </AdminPanel>

                <AdminPanel>
                    <AdminTableShell
                        headers={[
                            'ID',
                            'Employer',
                            'Package',
                            'Amount',
                            'Method',
                            'Date',
                            'Status',
                            'Actions',
                        ]}
                    >
                        {transactions.map((txn) => (
                            <tr
                                key={txn.id}
                                className="border-b border-[#e2e8f0] last:border-0 hover:bg-[#f8faff]"
                            >
                                <td className="px-3 py-3 font-mono text-xs text-[#64748b]">
                                    {txn.id}
                                </td>
                                <td className="px-3 py-3 font-semibold text-[#050315]">
                                    {txn.employer}
                                </td>
                                <td className="px-3 py-3 text-[#64748b]">
                                    {txn.package}
                                </td>
                                <td className="px-3 py-3 font-semibold text-[#050315]">
                                    {txn.amount}
                                </td>
                                <td className="px-3 py-3 text-[#64748b]">
                                    <span className="inline-flex items-center gap-1.5">
                                        <CreditCard className="size-3.5" />
                                        {txn.method}
                                    </span>
                                </td>
                                <td className="px-3 py-3 text-[#64748b]">
                                    {txn.date}
                                </td>
                                <td className="px-3 py-3">
                                    <AdminStatusBadge
                                        label={txn.status}
                                        tone={transactionStatusTone(
                                            txn.status,
                                        )}
                                    />
                                </td>
                                <td className="px-3 py-3">
                                    <div className="flex items-center gap-1.5">
                                        {txn.status === 'Refund Requested' && (
                                            <>
                                                <button
                                                    type="button"
                                                    className={cn(
                                                        'rounded-lg px-2.5 py-1.5 text-xs font-semibold',
                                                        'bg-[#fee2e2] text-[#991b1b] hover:bg-[#fecaca]',
                                                    )}
                                                >
                                                    Refund
                                                </button>
                                                <button
                                                    type="button"
                                                    className={cn(
                                                        'rounded-lg px-2.5 py-1.5 text-xs font-semibold',
                                                        'bg-[#d1fae5] text-[#065f46] hover:bg-[#a7f3d0]',
                                                    )}
                                                >
                                                    <Check className="mr-1 inline size-3" />
                                                    Approve
                                                </button>
                                            </>
                                        )}
                                        {txn.status === 'Failed' && (
                                            <button
                                                type="button"
                                                className="rounded-lg border border-[#e2e8f0] px-2.5 py-1.5 text-xs font-semibold text-[#64748b] hover:bg-[#f8faff]"
                                            >
                                                Retry
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </AdminTableShell>

                    <AdminPagination showingLabel="Showing 7 of 1,284" />
                </AdminPanel>
            </div>
        </AdminPortalLayout>
    );
}
