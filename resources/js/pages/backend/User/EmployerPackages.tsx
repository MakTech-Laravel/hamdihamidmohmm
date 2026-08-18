import { Head, Link, router, usePage } from '@inertiajs/react';
import { Check, Download } from 'lucide-react';
import { useState } from 'react';

import EmployerLayout from '@/layouts/employer-layout';
import { cn } from '@/lib/utils';
import type { SharedData } from '@/types';

type Plan = {
    slug: string | null;
    label: string | null;
    job_credits: number;
    jobs_posted: number;
    credits_remaining: number;
    expires_on: string | null;
    days_remaining: number | null;
    subscription_status: string | null;
    can_manage_billing: boolean;
};

type PackageRow = {
    id: number;
    slug: string;
    name: string;
    price: number;
    currency: string;
    billing_period: string;
    job_credits: number;
    featured_credits: number;
    is_featured: boolean;
    current: boolean;
    features: Array<{ key: string; label: string; included: boolean }>;
};

type Invoice = {
    id: number;
    reference: string;
    package: string;
    amount: number;
    currency: string;
    status: string;
    status_value: string | null;
    date: string | null;
    invoice_url: string | null;
};

type Props = {
    plan: Plan;
    packages: PackageRow[];
    invoices: Invoice[];
    billing: {
        enabled: boolean;
        can_manage: boolean;
    };
};

export default function EmployerPackages({
    plan,
    packages,
    invoices,
    billing,
}: Props) {
    const { flash } = usePage<SharedData>().props;
    const [selectingPackageId, setSelectingPackageId] = useState<number | null>(
        null,
    );
    const [openingPortal, setOpeningPortal] = useState(false);
    const usagePercent =
        plan.job_credits > 0
            ? Math.min(100, Math.round((plan.jobs_posted / plan.job_credits) * 100))
            : 0;
    const jobsPercent =
        plan.job_credits > 0
            ? Math.min(100, Math.round((plan.jobs_posted / plan.job_credits) * 100))
            : 0;
    const remainingPercent =
        plan.job_credits > 0
            ? Math.min(
                100,
                Math.round((plan.credits_remaining / plan.job_credits) * 100),
            )
            : 0;

    return (
        <EmployerLayout title="Packages & Billing">
            <Head title="Packages & Billing" />

            <div className="space-y-6 px-4 py-6 sm:px-6">
                <h1 className="text-[28px] font-extrabold tracking-tight text-[#050315]">
                    Billing & Packages
                </h1>

                {flash.success && (
                    <div className="rounded-xl border border-[#bbf7d0] bg-[#f0fdf4] px-4 py-3 text-sm text-[#15803d]">
                        {typeof flash.success === 'string'
                            ? flash.success
                            : 'Saved successfully.'}
                    </div>
                )}

                {flash.error && (
                    <div className="rounded-xl border border-[#fecaca] bg-[#fef2f2] px-4 py-3 text-sm text-[#b91c1c]">
                        {typeof flash.error === 'string'
                            ? flash.error
                            : 'Something went wrong.'}
                    </div>
                )}

                <section className="rounded-2xl border border-[#e8d5e8] bg-white p-6 shadow-[0px_2px_4px_rgba(5,3,21,0.06)]">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                            <div className="flex flex-wrap items-center gap-2">
                                <h2 className="text-xl font-bold text-[#050315]">
                                    {plan.label || 'No package assigned'}
                                </h2>
                                {plan.slug && (
                                    <span className="rounded-full bg-[#dcfce7] px-2.5 py-0.5 text-xs font-semibold text-[#166534]">
                                        {plan.subscription_status === 'active'
                                            ? 'Active'
                                            : plan.subscription_status ===
                                                'past_due'
                                              ? 'Past due'
                                              : plan.subscription_status ===
                                                  'canceled'
                                                ? 'Canceled'
                                                : 'Active'}
                                    </span>
                                )}
                            </div>
                            <p className="mt-1 text-sm text-[#64748b]">
                                {plan.expires_on
                                    ? `Expires ${plan.expires_on}`
                                    : 'No renewal date yet'}
                                {plan.days_remaining !== null
                                    ? ` · ${plan.days_remaining} days remaining`
                                    : ''}
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {billing.can_manage ? (
                                <button
                                    type="button"
                                    disabled={openingPortal}
                                    onClick={() => {
                                        setOpeningPortal(true);
                                        router.post(
                                            route(
                                                'employer.packages.portal',
                                            ),
                                            {},
                                            {
                                                onFinish: () =>
                                                    setOpeningPortal(false),
                                            },
                                        );
                                    }}
                                    className="inline-flex cursor-pointer items-center rounded-xl border border-[#0057c8] px-5 py-2.5 text-sm font-semibold text-[#0057c8] disabled:opacity-60"
                                >
                                    {openingPortal
                                        ? 'Opening…'
                                        : 'Manage Billing'}
                                </button>
                            ) : null}
                            <Link
                                href="#available-plans"
                                className="inline-flex cursor-pointer items-center rounded-xl bg-[#0057c8] px-5 py-2.5 text-sm font-semibold text-white"
                            >
                                Upgrade
                            </Link>
                        </div>
                    </div>
                    <div className="mt-6">
                        <div className="mb-2 flex items-center justify-between text-sm">
                            <span className="text-[#64748b]">Credits used</span>
                            <span className="font-semibold text-[#050315]">
                                {plan.jobs_posted} / {plan.job_credits}
                            </span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-[#f1f5f9]">
                            <div
                                className="h-full rounded-full bg-[#e57124]"
                                style={{ width: `${usagePercent}%` }}
                            />
                        </div>
                        <p className="mt-2 text-xs text-[#64748b]">
                            {plan.credits_remaining} credits remaining
                        </p>
                    </div>
                </section>

                <section className="rounded-2xl border border-[#e8d5e8] bg-white p-6 shadow-[0px_2px_4px_rgba(5,3,21,0.06)]">
                    <h2 className="mb-5 text-base font-bold text-[#050315]">
                        Credit Usage
                    </h2>
                    <div className="space-y-4">
                        {[
                            [
                                'Jobs Posted',
                                `${plan.jobs_posted}/${plan.job_credits}`,
                                jobsPercent,
                                'bg-[#0057c8]',
                            ],
                            [
                                'Remaining Credits',
                                `${plan.credits_remaining}/${plan.job_credits}`,
                                remainingPercent,
                                'bg-[#16a34a]',
                            ],
                        ].map(([label, value, percent, bar]) => (
                            <div key={label as string}>
                                <div className="mb-1.5 flex items-center justify-between text-sm">
                                    <span className="text-[#64748b]">
                                        {label}
                                    </span>
                                    <span className="font-semibold text-[#050315]">
                                        {value}
                                    </span>
                                </div>
                                <div className="h-2 overflow-hidden rounded-full bg-[#f1f5f9]">
                                    <div
                                        className={cn('h-full rounded-full', bar)}
                                        style={{ width: `${percent}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                <section id="available-plans">
                    <h2 className="mb-4 text-base font-bold text-[#050315]">
                        Available Plans
                    </h2>
                    <div className="grid gap-4 lg:grid-cols-3">
                        {packages.map((item) => (
                            <article
                                key={item.id}
                                className={cn(
                                    'relative flex h-full flex-col rounded-2xl border bg-white p-6 shadow-[0px_2px_4px_rgba(5,3,21,0.06)]',
                                    item.current
                                        ? 'border-[#e57124]'
                                        : 'border-[#e8d5e8]',
                                )}
                            >
                                {item.current && (
                                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[#e57124] px-3 py-1 text-xs font-semibold text-white">
                                        Current Plan
                                    </span>
                                )}
                                <h3 className="text-lg font-bold text-[#050315]">
                                    {item.name}
                                </h3>
                                <p className="mt-1 text-2xl font-extrabold text-[#050315]">
                                    {item.currency} {item.price.toLocaleString()}
                                    <span className="text-sm font-medium text-[#64748b]">
                                        {' '}
                                        / {item.billing_period}
                                    </span>
                                </p>
                                <ul className="mt-4 flex-1 space-y-2">
                                    {item.features
                                        .filter((feature) => feature.included)
                                        .map((feature) => (
                                            <li
                                                key={feature.key}
                                                className="flex items-start gap-2 text-sm text-[#364153]"
                                            >
                                                <Check className="mt-0.5 size-4 shrink-0 text-[#16a34a]" />
                                                {feature.label}
                                            </li>
                                        ))}
                                </ul>
                                <div className="mt-auto pt-6">
                                    <button
                                        type="button"
                                        disabled={
                                            item.current ||
                                            selectingPackageId !== null
                                        }
                                        onClick={() => {
                                            setSelectingPackageId(item.id);
                                            router.post(
                                                route(
                                                    'employer.packages.select',
                                                    item.id,
                                                ),
                                                {},
                                                {
                                                    onFinish: () =>
                                                        setSelectingPackageId(
                                                            null,
                                                        ),
                                                },
                                            );
                                        }}
                                        className={cn(
                                            'w-full cursor-pointer rounded-xl px-4 py-2.5 text-sm font-semibold disabled:cursor-wait',
                                            item.current
                                                ? 'bg-[#ffedd5] text-[#c2410c]'
                                                : 'bg-[#0057c8] text-white hover:opacity-90',
                                        )}
                                    >
                                        {item.current
                                            ? 'Current Plan'
                                            : selectingPackageId === item.id
                                              ? 'Redirecting…'
                                              : 'Select Plan'}
                                    </button>
                                </div>
                            </article>
                        ))}
                        {packages.length === 0 && (
                            <p className="text-sm text-[#99a1af]">
                                No public plans are available yet.
                            </p>
                        )}
                    </div>
                </section>

                <section className="rounded-2xl border border-[#e8d5e8] bg-white p-6 shadow-[0px_2px_4px_rgba(5,3,21,0.06)]">
                    <h2 className="mb-4 text-base font-bold text-[#050315]">
                        Invoice History
                    </h2>
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[640px] text-left text-sm">
                            <thead className="text-xs tracking-wide text-[#64748b] uppercase">
                                <tr>
                                    <th className="pb-3 font-semibold">
                                        Invoice ID
                                    </th>
                                    <th className="pb-3 font-semibold">Date</th>
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
                                {invoices.map((invoice) => (
                                    <tr
                                        key={invoice.id}
                                        className="border-t border-[#f1f5f9]"
                                    >
                                        <td className="py-3 font-medium text-[#050315]">
                                            {invoice.reference}
                                        </td>
                                        <td className="py-3 text-[#64748b]">
                                            {invoice.date}
                                        </td>
                                        <td className="py-3 text-[#364153]">
                                            {invoice.package}
                                        </td>
                                        <td className="py-3 font-semibold text-[#050315]">
                                            {invoice.currency}{' '}
                                            {invoice.amount.toLocaleString()}
                                        </td>
                                        <td className="py-3">
                                            <span
                                                className={cn(
                                                    'rounded-full px-2.5 py-0.5 text-xs font-semibold',
                                                    invoice.status_value ===
                                                        'completed'
                                                        ? 'bg-[#dcfce7] text-[#166534]'
                                                        : 'bg-[#fff7ed] text-[#c2410c]',
                                                )}
                                            >
                                                {invoice.status}
                                            </span>
                                        </td>
                                        <td className="py-3">
                                            {invoice.invoice_url ? (
                                                <a
                                                    href={invoice.invoice_url}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="inline-flex text-[#0057c8]"
                                                >
                                                    <Download className="size-4" />
                                                </a>
                                            ) : (
                                                <Download className="size-4 text-[#94a3b8]" />
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {invoices.length === 0 && (
                            <p className="py-6 text-sm text-[#99a1af]">
                                No invoices yet.
                            </p>
                        )}
                    </div>
                </section>
            </div>
        </EmployerLayout>
    );
}
