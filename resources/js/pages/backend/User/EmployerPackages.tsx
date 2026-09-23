import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { Check, Download } from 'lucide-react';
import { FormEvent, useState } from 'react';

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useLocale } from '@/hooks/use-locale';
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
    pending_change: {
        slug: string;
        label: string | null;
        at: string | null;
    } | null;
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
    action: 'select' | 'current' | 'upgrade' | 'downgrade';
    scheduled: boolean;
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

type BankDetails = {
    bank_name: string;
    bank_account_name: string;
    bank_account_number: string;
    bank_iban: string;
    bank_instructions: string;
};

type Props = {
    plan: Plan;
    packages: PackageRow[];
    invoices: Invoice[];
    billing: {
        enabled: boolean;
        provider?: string | null;
        manual_enabled?: boolean;
    };
    bankDetails?: BankDetails;
};

function planButtonLabel(
    item: PackageRow,
    isSelecting: boolean,
    t: (key: string, replacements?: Record<string, string | number>) => string,
): string {
    if (item.current) {
        return t('employer.packages.btn.current');
    }

    if (item.scheduled) {
        return isSelecting
            ? t('employer.packages.btn.scheduling')
            : t('employer.packages.btn.scheduled');
    }

    if (isSelecting) {
        if (item.action === 'upgrade') {
            return t('employer.packages.btn.upgrading');
        }

        if (item.action === 'downgrade') {
            return t('employer.packages.btn.scheduling');
        }

        if (item.price < 1) {
            return t('employer.packages.btn.redirecting');
        }

        return t('employer.packages.btn.pay_transfer');
    }

    if (item.action === 'upgrade') {
        return t('employer.packages.btn.upgrade');
    }

    if (item.action === 'downgrade') {
        return t('employer.packages.btn.downgrade');
    }

    if (item.price >= 1) {
        return t('employer.packages.btn.pay_transfer');
    }

    return t('employer.packages.btn.select');
}

export default function EmployerPackages({
    plan,
    packages,
    invoices,
    billing,
    bankDetails = {
        bank_name: '',
        bank_account_name: '',
        bank_account_number: '',
        bank_iban: '',
        bank_instructions: '',
    },
}: Props) {
    const { t } = useLocale();
    const { flash } = usePage<SharedData>().props;
    const [selectingPackageId, setSelectingPackageId] = useState<number | null>(
        null,
    );
    const [manualPackage, setManualPackage] = useState<PackageRow | null>(null);
    const manualForm = useForm<{ remarks: string; receipt: File | null }>({
        remarks: '',
        receipt: null,
    });
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

    const openPackageAction = (item: PackageRow): void => {
        if (item.price >= 1 && billing.manual_enabled !== false) {
            setManualPackage(item);
            manualForm.setData({
                remarks: t('employer.packages.manual.remarks_default', {
                    amount: `${item.currency} ${item.price.toLocaleString()}`,
                    package: item.name,
                }),
                receipt: null,
            });
            manualForm.clearErrors();

            return;
        }

        setSelectingPackageId(item.id);
        router.post(
            route('employer.packages.select', item.id),
            {},
            {
                onFinish: () => setSelectingPackageId(null),
            },
        );
    };

    const submitManualPayment = (event: FormEvent): void => {
        event.preventDefault();

        if (!manualPackage) {
            return;
        }

        manualForm.post(
            route('employer.packages.manual-payment', manualPackage.id),
            {
                forceFormData: true,
                onSuccess: () => {
                    setManualPackage(null);
                    manualForm.reset();
                },
            },
        );
    };

    return (
        <EmployerLayout title={t('employer.packages.title')}>
            <Head title={t('employer.packages.title')} />

            <div className="space-y-6 px-4 py-6 sm:px-6">
                <h1 className="text-[28px] font-extrabold tracking-tight text-[#050315]">
                    {t('employer.packages.title')}
                </h1>

                {flash.success && (
                    <div className="rounded-xl border border-[#bbf7d0] bg-[#f0fdf4] px-4 py-3 text-sm text-[#15803d]">
                        {typeof flash.success === 'string'
                            ? flash.success
                            : t('common.saved')}
                    </div>
                )}

                {flash.error && (
                    <div className="rounded-xl border border-[#fecaca] bg-[#fef2f2] px-4 py-3 text-sm text-[#b91c1c]">
                        {typeof flash.error === 'string'
                            ? flash.error
                            : t('common.error')}
                    </div>
                )}

                {plan.pending_change && (
                    <div className="rounded-xl border border-[#ffedd5] bg-[#fff7ed] px-4 py-3 text-sm text-[#c2410c]">
                        {t('employer.packages.pending_change', {
                            label: plan.pending_change.label ?? '',
                            when: plan.pending_change.at
                                ? t('employer.packages.pending_change_at', {
                                      date: plan.pending_change.at,
                                  })
                                : t('employer.packages.pending_change_end'),
                            current: plan.label ?? '',
                        })}
                    </div>
                )}

                <section className="rounded-2xl border border-[#e8d5e8] bg-white p-6 shadow-[0px_2px_4px_rgba(5,3,21,0.06)]">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                            <div className="flex flex-wrap items-center gap-2">
                                <h2 className="text-xl font-bold text-[#050315]">
                                    {plan.label ||
                                        t('employer.packages.no_package')}
                                </h2>
                                {plan.slug && (
                                    <span className="rounded-full bg-[#dcfce7] px-2.5 py-0.5 text-xs font-semibold text-[#166534]">
                                        {plan.subscription_status === 'active'
                                            ? t('common.active')
                                            : plan.subscription_status ===
                                                'past_due'
                                              ? t('employer.packages.past_due')
                                              : plan.subscription_status ===
                                                  'canceled'
                                                ? t(
                                                      'employer.packages.canceled',
                                                  )
                                                : t('common.active')}
                                    </span>
                                )}
                            </div>
                            <p className="mt-1 text-sm text-[#64748b]">
                                {plan.expires_on
                                    ? t('employer.packages.expires', {
                                          date: plan.expires_on,
                                      })
                                    : t('employer.packages.no_renewal')}
                                {plan.days_remaining !== null
                                    ? ` · ${t('employer.packages.days_remaining', { count: plan.days_remaining })}`
                                    : ''}
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <Link
                                href="#available-plans"
                                className="inline-flex cursor-pointer items-center rounded-xl bg-[#0057c8] px-5 py-2.5 text-sm font-semibold text-white"
                            >
                                {t('common.upgrade')}
                            </Link>
                        </div>
                    </div>
                    <div className="mt-6">
                        <div className="mb-2 flex items-center justify-between text-sm">
                            <span className="text-[#64748b]">
                                {t('employer.packages.credits_used')}
                            </span>
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
                            {t('employer.packages.credits_remaining', {
                                count: plan.credits_remaining,
                            })}
                        </p>
                    </div>
                </section>

                <section className="rounded-2xl border border-[#e8d5e8] bg-white p-6 shadow-[0px_2px_4px_rgba(5,3,21,0.06)]">
                    <h2 className="mb-5 text-base font-bold text-[#050315]">
                        {t('employer.packages.credit_usage')}
                    </h2>
                    <div className="space-y-4">
                        {[
                            [
                                t('employer.packages.jobs_posted'),
                                `${plan.jobs_posted}/${plan.job_credits}`,
                                jobsPercent,
                                'bg-[#0057c8]',
                            ],
                            [
                                t('employer.packages.remaining_credits'),
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
                        {t('employer.packages.available_plans')}
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
                                        {t(
                                            'employer.packages.current_plan_badge',
                                        )}
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
                                            item.scheduled ||
                                            selectingPackageId !== null
                                        }
                                        onClick={() => openPackageAction(item)}
                                        className={cn(
                                            'w-full cursor-pointer rounded-xl px-4 py-2.5 text-sm font-semibold disabled:cursor-wait',
                                            item.current || item.scheduled
                                                ? 'bg-[#ffedd5] text-[#c2410c]'
                                                : 'bg-[#0057c8] text-white hover:opacity-90',
                                        )}
                                    >
                                        {planButtonLabel(
                                            item,
                                            selectingPackageId === item.id,
                                            t,
                                        )}
                                    </button>
                                    {billing.enabled &&
                                        item.price >= 1 &&
                                        !item.current &&
                                        !item.scheduled && (
                                            <button
                                                type="button"
                                                disabled={
                                                    selectingPackageId !== null
                                                }
                                                onClick={() => {
                                                    setSelectingPackageId(
                                                        item.id,
                                                    );
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
                                                className="mt-2 w-full rounded-xl border border-[#bfdbfe] bg-white px-4 py-2 text-sm font-semibold text-[#0057c8] hover:bg-[#eff6ff] disabled:cursor-wait"
                                            >
                                                {t(
                                                    'employer.packages.btn.pay_online',
                                                )}
                                            </button>
                                        )}
                                </div>
                            </article>
                        ))}
                        {packages.length === 0 && (
                            <p className="text-sm text-[#99a1af]">
                                {t('employer.packages.no_plans')}
                            </p>
                        )}
                    </div>
                </section>

                <section className="rounded-2xl border border-[#e8d5e8] bg-white p-6 shadow-[0px_2px_4px_rgba(5,3,21,0.06)]">
                    <h2 className="mb-4 text-base font-bold text-[#050315]">
                        {t('employer.packages.invoice_history')}
                    </h2>
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[640px] text-left text-sm">
                            <thead className="text-xs tracking-wide text-[#64748b] uppercase">
                                <tr>
                                    <th className="pb-3 font-semibold">
                                        {t('employer.packages.invoice_id')}
                                    </th>
                                    <th className="pb-3 font-semibold">
                                        {t('employer.packages.date')}
                                    </th>
                                    <th className="pb-3 font-semibold">
                                        {t('employer.packages.description')}
                                    </th>
                                    <th className="pb-3 font-semibold">
                                        {t('employer.packages.amount')}
                                    </th>
                                    <th className="pb-3 font-semibold">
                                        {t('common.status')}
                                    </th>
                                    <th className="pb-3 font-semibold">
                                        {t('employer.packages.action')}
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
                                {t('employer.packages.no_invoices')}
                            </p>
                        )}
                    </div>
                </section>
            </div>

            <Dialog
                open={manualPackage !== null}
                onOpenChange={(open) => {
                    if (!open) {
                        setManualPackage(null);
                        manualForm.reset();
                        manualForm.clearErrors();
                    }
                }}
            >
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>
                            {t('employer.packages.manual.title')}
                        </DialogTitle>
                        <DialogDescription>
                            {manualPackage
                                ? t('employer.packages.manual.subtitle', {
                                      package: manualPackage.name,
                                      amount: `${manualPackage.currency} ${manualPackage.price.toLocaleString()}`,
                                  })
                                : null}
                        </DialogDescription>
                    </DialogHeader>

                    <form className="space-y-4" onSubmit={submitManualPayment}>
                        <div className="rounded-xl border border-[#e2e8f0] bg-[#f8faff] p-4 text-sm text-[#364153]">
                            <p className="font-semibold text-[#050315]">
                                {t('employer.packages.manual.bank_details')}
                            </p>
                            {bankDetails.bank_instructions ? (
                                <p className="mt-2 text-[#64748b]">
                                    {bankDetails.bank_instructions}
                                </p>
                            ) : null}
                            <dl className="mt-3 space-y-1.5">
                                {bankDetails.bank_name ? (
                                    <div className="flex justify-between gap-3">
                                        <dt className="text-[#64748b]">
                                            {t(
                                                'employer.packages.manual.bank_name',
                                            )}
                                        </dt>
                                        <dd className="font-medium text-[#050315]">
                                            {bankDetails.bank_name}
                                        </dd>
                                    </div>
                                ) : null}
                                {bankDetails.bank_account_name ? (
                                    <div className="flex justify-between gap-3">
                                        <dt className="text-[#64748b]">
                                            {t(
                                                'employer.packages.manual.account_name',
                                            )}
                                        </dt>
                                        <dd className="font-medium text-[#050315]">
                                            {bankDetails.bank_account_name}
                                        </dd>
                                    </div>
                                ) : null}
                                {bankDetails.bank_account_number ? (
                                    <div className="flex justify-between gap-3">
                                        <dt className="text-[#64748b]">
                                            {t(
                                                'employer.packages.manual.account_number',
                                            )}
                                        </dt>
                                        <dd className="font-medium text-[#050315]">
                                            {bankDetails.bank_account_number}
                                        </dd>
                                    </div>
                                ) : null}
                                {bankDetails.bank_iban ? (
                                    <div className="flex justify-between gap-3">
                                        <dt className="text-[#64748b]">
                                            {t(
                                                'employer.packages.manual.iban',
                                            )}
                                        </dt>
                                        <dd className="font-medium text-[#050315]">
                                            {bankDetails.bank_iban}
                                        </dd>
                                    </div>
                                ) : null}
                                {!bankDetails.bank_name &&
                                !bankDetails.bank_account_number ? (
                                    <p className="text-[#b45309]">
                                        {t(
                                            'employer.packages.manual.bank_missing',
                                        )}
                                    </p>
                                ) : null}
                            </dl>
                        </div>

                        <div>
                            <Label htmlFor="manual-remarks">
                                {t('employer.packages.manual.remarks')}
                            </Label>
                            <Textarea
                                id="manual-remarks"
                                className="mt-1.5"
                                rows={3}
                                value={manualForm.data.remarks}
                                onChange={(event) =>
                                    manualForm.setData(
                                        'remarks',
                                        event.target.value,
                                    )
                                }
                            />
                            {manualForm.errors.remarks ? (
                                <p className="mt-1 text-xs text-[#b91c1c]">
                                    {manualForm.errors.remarks}
                                </p>
                            ) : null}
                        </div>

                        <div>
                            <Label htmlFor="manual-receipt">
                                {t('employer.packages.manual.receipt')}
                            </Label>
                            <input
                                id="manual-receipt"
                                type="file"
                                accept=".jpg,.jpeg,.png,.webp,.pdf,image/*,application/pdf"
                                className="mt-1.5 block w-full rounded-xl border border-[#e2e8f0] bg-white px-3 py-2 text-sm"
                                onChange={(event) =>
                                    manualForm.setData(
                                        'receipt',
                                        event.target.files?.[0] ?? null,
                                    )
                                }
                            />
                            <p className="mt-1 text-xs text-[#64748b]">
                                {t('employer.packages.manual.receipt_hint')}
                            </p>
                            {manualForm.errors.receipt ? (
                                <p className="mt-1 text-xs text-[#b91c1c]">
                                    {manualForm.errors.receipt}
                                </p>
                            ) : null}
                        </div>

                        <DialogFooter>
                            <button
                                type="button"
                                onClick={() => {
                                    setManualPackage(null);
                                    manualForm.reset();
                                }}
                                className="rounded-xl border border-[#e2e8f0] px-4 py-2 text-sm font-semibold text-[#64748b]"
                            >
                                {t('common.cancel')}
                            </button>
                            <button
                                type="submit"
                                disabled={manualForm.processing}
                                className="rounded-xl bg-[#0057c8] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                            >
                                {manualForm.processing
                                    ? t('employer.packages.manual.submitting')
                                    : t('employer.packages.manual.submit')}
                            </button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </EmployerLayout>
    );
}
