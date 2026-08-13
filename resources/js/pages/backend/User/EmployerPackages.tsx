import { Head } from '@inertiajs/react';
import { Download } from 'lucide-react';

import {
    CURRENT_PACKAGE,
    INVOICE_HISTORY,
    PACKAGE_PLANS,
} from '@/components/employer/demo-data';
import EmployerLayout from '@/layouts/employer-layout';
import { cn } from '@/lib/utils';

export default function EmployerPackages() {
    const creditPercent =
        (CURRENT_PACKAGE.creditsUsed / CURRENT_PACKAGE.creditsTotal) * 100;
    const breakdownTotal = CURRENT_PACKAGE.creditsTotal;

    return (
        <EmployerLayout title="Packages & Billing">
            <Head title="Packages & Billing" />

            <div className="space-y-6 px-4 py-6 sm:px-6">
                <div>
                    <h1 className="text-[28px] font-extrabold tracking-tight text-[#050315]">
                        Billing & Packages
                    </h1>
                    <p className="mt-1 text-sm text-[#3977a6]">
                        Manage your subscription, credits, and invoices
                    </p>
                </div>

                <div className="rounded-2xl border border-[#e57124] bg-[#fff9f5] p-6 shadow-[0px_2px_4px_rgba(5,3,21,0.06)]">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                            <h2 className="text-lg font-bold text-[#050315]">
                                {CURRENT_PACKAGE.name}
                            </h2>
                            <span className="mt-2 inline-flex rounded-full bg-[#dcfce7] px-3 py-0.5 text-xs font-bold text-[#166534]">
                                {CURRENT_PACKAGE.status}
                            </span>
                        </div>
                        <div className="text-right">
                            <p className="text-sm text-[#6b7280]">
                                Expires {CURRENT_PACKAGE.expiresOn}
                            </p>
                            <p className="mt-1 text-sm font-bold text-[#e57124]">
                                {CURRENT_PACKAGE.daysLeft} days left
                            </p>
                        </div>
                    </div>

                    <div className="mt-6">
                        <div className="flex items-center justify-between text-sm">
                            <span className="font-medium text-[#050315]">
                                Credits Used
                            </span>
                            <span className="text-[#6b7280]">
                                {CURRENT_PACKAGE.creditsUsed} /{' '}
                                {CURRENT_PACKAGE.creditsTotal}
                            </span>
                        </div>
                        <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-[#f3f4f6]">
                            <div
                                className="h-full rounded-full bg-[#e57124]"
                                style={{ width: `${creditPercent}%` }}
                            />
                        </div>
                        <p className="mt-2 text-sm font-semibold text-[#e57124]">
                            {CURRENT_PACKAGE.creditsRemaining} credits remaining
                        </p>
                    </div>

                    <div className="mt-6">
                        <h3 className="text-sm font-bold text-[#050315]">
                            Credit Usage Breakdown
                        </h3>
                        <div className="mt-3 space-y-3">
                            {[
                                {
                                    label: 'Jobs Posted',
                                    value: CURRENT_PACKAGE.creditBreakdown
                                        .jobsPosted,
                                    color: 'bg-[#323981]',
                                },
                                {
                                    label: 'Featured',
                                    value: CURRENT_PACKAGE.creditBreakdown
                                        .featured,
                                    color: 'bg-[#e57124]',
                                },
                                {
                                    label: 'Remaining',
                                    value: CURRENT_PACKAGE.creditBreakdown
                                        .remaining,
                                    color: 'bg-[#22c55e]',
                                },
                            ].map((item) => (
                                <div key={item.label}>
                                    <div className="mb-1 flex justify-between text-xs">
                                        <span className="text-[#6b7280]">
                                            {item.label}
                                        </span>
                                        <span className="font-semibold text-[#050315]">
                                            {item.value}
                                        </span>
                                    </div>
                                    <div className="h-2 overflow-hidden rounded-full bg-[#f3f4f6]">
                                        <div
                                            className={cn(
                                                'h-full rounded-full',
                                                item.color,
                                            )}
                                            style={{
                                                width: `${(item.value / breakdownTotal) * 100}%`,
                                            }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div>
                    <h2 className="text-base font-bold text-[#050315]">
                        Available Plans
                    </h2>
                    <div className="mt-4 grid gap-4 lg:grid-cols-3">
                        {PACKAGE_PLANS.map((plan) => (
                            <div
                                key={plan.id}
                                className={cn(
                                    'relative rounded-2xl border bg-white p-6 shadow-[0px_2px_4px_rgba(5,3,21,0.06)]',
                                    plan.isCurrent
                                        ? 'border-[#e57124] ring-1 ring-[#e57124]/30'
                                        : 'border-[#e8d5e8]',
                                )}
                            >
                                {plan.isCurrent && (
                                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[#e57124] px-3 py-0.5 text-xs font-bold text-white">
                                        Current Plan
                                    </span>
                                )}
                                <h3 className="text-lg font-bold text-[#050315]">
                                    {plan.name}
                                </h3>
                                <p className="mt-2 text-2xl font-extrabold text-[#0057c8]">
                                    {plan.currency} {plan.price.toLocaleString()}
                                    <span className="text-sm font-normal text-[#6b7280]">
                                        {' '}
                                        / month
                                    </span>
                                </p>
                                <ul className="mt-4 space-y-2">
                                    {plan.features.map((feature) => (
                                        <li
                                            key={feature}
                                            className="flex items-start gap-2 text-sm text-[#050315]"
                                        >
                                            <span className="text-[#166534]">
                                                ✓
                                            </span>
                                            {feature}
                                        </li>
                                    ))}
                                </ul>
                                <button
                                    type="button"
                                    className={cn(
                                        'mt-6 w-full rounded-lg px-4 py-2.5 text-sm font-semibold transition-opacity hover:opacity-90',
                                        plan.isCurrent
                                            ? 'border border-[#e57124] bg-[#fff9f5] text-[#e57124]'
                                            : 'bg-[#0057c8] text-white',
                                    )}
                                >
                                    {plan.isCurrent
                                        ? 'Current Plan'
                                        : 'Select Plan'}
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="rounded-2xl border border-[#e8d5e8] bg-white p-6 shadow-[0px_2px_4px_rgba(5,3,21,0.06)]">
                    <h2 className="text-base font-bold text-[#050315]">
                        Invoice History
                    </h2>
                    <div className="mt-4 overflow-x-auto">
                        <table className="w-full min-w-[640px] text-left text-sm">
                            <thead>
                                <tr className="border-b border-[#e8d5e8] text-xs text-[#6b7280]">
                                    <th className="pb-3 font-semibold">ID</th>
                                    <th className="pb-3 font-semibold">
                                        Date
                                    </th>
                                    <th className="pb-3 font-semibold">
                                        Description
                                    </th>
                                    <th className="pb-3 font-semibold">
                                        Amount
                                    </th>
                                    <th className="pb-3 font-semibold">
                                        Status
                                    </th>
                                    <th className="pb-3 font-semibold">
                                        Action
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {INVOICE_HISTORY.map((invoice) => (
                                    <tr
                                        key={invoice.id}
                                        className="border-b border-[#f1f5f9] last:border-0"
                                    >
                                        <td className="py-3 font-medium text-[#050315]">
                                            {invoice.id}
                                        </td>
                                        <td className="py-3 text-[#6b7280]">
                                            {invoice.date}
                                        </td>
                                        <td className="py-3 text-[#050315]">
                                            {invoice.description}
                                        </td>
                                        <td className="py-3 font-semibold text-[#050315]">
                                            {invoice.amount}
                                        </td>
                                        <td className="py-3">
                                            <span className="rounded-full bg-[#dcfce7] px-2.5 py-0.5 text-xs font-semibold text-[#166534]">
                                                {invoice.status}
                                            </span>
                                        </td>
                                        <td className="py-3">
                                            <button
                                                type="button"
                                                className="inline-flex items-center gap-1 text-xs font-semibold text-[#0057c8] hover:underline"
                                            >
                                                <Download className="size-3.5" />
                                                Download
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </EmployerLayout>
    );
}
