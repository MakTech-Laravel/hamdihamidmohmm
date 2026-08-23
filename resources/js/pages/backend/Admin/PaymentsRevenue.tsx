import { Head, router, useForm, usePage } from '@inertiajs/react';
import { CreditCard, Download, RefreshCw } from 'lucide-react';
import { useState } from 'react';

import {
    AdminFilterChip,
    AdminPageHeader,
    AdminPagination,
    AdminPanel,
    AdminPrimaryButton,
    AdminSecondaryButton,
    AdminStatCard,
    AdminStatusBadge,
    AdminTableShell,
} from '@/components/admin-portal/ui';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { NativeSelect } from '@/components/ui/native-select';
import AdminPortalLayout from '@/layouts/admin-portal-layout';
import { cn } from '@/lib/utils';
import type { SharedData } from '@/types';

type PaymentRow = {
    id: number;
    reference: string;
    employer: string | null;
    package: string;
    amount: number;
    currency: string;
    method: string;
    status: string;
    status_value: string | null;
    date: string | null;
};

type Props = {
    payments: {
        data: PaymentRow[];
        links: Array<{ url: string | null; label: string; active: boolean }>;
        from: number | null;
        to: number | null;
        total: number;
    };
    filters: { status: string; range: string };
    stats: { today: number; monthly: number; failed: number; refunded: number };
    chart: { range: string; labels: string[]; values: number[] };
    employers: Array<{ id: number; name: string; company_name: string | null }>;
    packages: Array<{ id: number; name: string; price: number; currency: string }>;
    currency: string;
};

const rangeChips = [
    ['7d', '7D'],
    ['30d', '30D'],
    ['90d', '3M'],
    ['12m', '1Y'],
] as const;

function statusTone(
    value: string,
): 'success' | 'warning' | 'danger' | 'neutral' {
    if (value === 'Completed') {
        return 'success';
    }
    if (value === 'Pending') {
        return 'warning';
    }
    if (value === 'Failed' || value === 'Refunded') {
        return 'danger';
    }

    return 'neutral';
}

export default function PaymentsRevenue({
    payments,
    filters,
    stats,
    chart,
    employers,
    packages,
    currency,
}: Props) {
    const { flash } = usePage<SharedData>().props;
    const [creating, setCreating] = useState(false);
    const form = useForm({
        employer_id: '',
        package_id: '',
        amount: 0,
        method: 'bank_transfer',
        status: 'completed',
        reference: '',
    });
    const maxValue = Math.max(...chart.values, 1);

    const visit = (status: string, range = filters.range): void => {
        router.get(
            '/admin/payments',
            {
                ...(status && status !== 'all' ? { status } : {}),
                range,
            },
            { preserveState: true, replace: true },
        );
    };

    return (
        <AdminPortalLayout>
            <Head title="Payments & Revenue" />

            <div className="space-y-6 p-6">
                <AdminPageHeader
                    title="Payments & Revenue"
                    subtitle="Record, approve, refund, and retry in-app payments."
                    actions={
                        <div className="flex gap-2">
                            <a href="/admin/payments/export">
                                <AdminSecondaryButton>
                                    <Download className="size-4" />
                                    Export
                                </AdminSecondaryButton>
                            </a>
                            <AdminPrimaryButton onClick={() => setCreating(true)}>
                                Record payment
                            </AdminPrimaryButton>
                        </div>
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
                        label="Today's Revenue"
                        value={`${currency} ${stats.today.toLocaleString()}`}
                        valueClassName="text-[#e57124]"
                        icon={CreditCard}
                    />
                    <AdminStatCard
                        label="Monthly Revenue"
                        value={`${currency} ${stats.monthly.toLocaleString()}`}
                        valueClassName="text-[#0057c8]"
                        icon={CreditCard}
                    />
                    <AdminStatCard
                        label="Failed Payments"
                        value={String(stats.failed)}
                        valueClassName="text-[#ef4444]"
                        icon={CreditCard}
                    />
                    <AdminStatCard
                        label="Refunded"
                        value={String(stats.refunded)}
                        valueClassName="text-[#3977a6]"
                        icon={CreditCard}
                    />
                </div>

                <AdminPanel>
                    <div className="mb-4 flex flex-wrap gap-2">
                        {rangeChips.map(([key, label]) => (
                            <AdminFilterChip
                                key={key}
                                label={label}
                                active={(filters.range || '30d') === key}
                                onClick={() => visit(filters.status, key)}
                            />
                        ))}
                    </div>
                    <div className="flex h-40 items-end gap-1">
                        {chart.values.map((value, index) => (
                            <div
                                key={`${chart.labels[index]}-${index}`}
                                className="flex flex-1 flex-col items-center gap-1"
                            >
                                <div
                                    className="w-full rounded-t bg-[#0057c8]"
                                    style={{
                                        height: `${Math.max((value / maxValue) * 100, 4)}%`,
                                    }}
                                />
                            </div>
                        ))}
                    </div>
                </AdminPanel>

                <AdminPanel>
                    <div className="mb-4 flex flex-wrap gap-2">
                        {[
                            ['all', 'All'],
                            ['pending', 'Pending'],
                            ['completed', 'Completed'],
                            ['failed', 'Failed'],
                            ['refunded', 'Refunded'],
                        ].map(([key, label]) => (
                            <AdminFilterChip
                                key={key}
                                label={label}
                                active={(filters.status || 'all') === key}
                                onClick={() => visit(key)}
                            />
                        ))}
                    </div>

                    <AdminTableShell
                        headers={[
                            'Reference',
                            'Employer',
                            'Package',
                            'Amount',
                            'Method',
                            'Status',
                            'Date',
                            'Actions',
                        ]}
                    >
                        {payments.data.map((row) => (
                            <tr
                                key={row.id}
                                className="border-b border-[#e2e8f0] last:border-0 hover:bg-[#f8faff]"
                            >
                                <td className="px-3 py-3 font-semibold text-[#050315]">
                                    {row.reference}
                                </td>
                                <td className="px-3 py-3 text-[#64748b]">
                                    {row.employer}
                                </td>
                                <td className="px-3 py-3 text-[#64748b]">
                                    {row.package}
                                </td>
                                <td className="px-3 py-3 font-semibold">
                                    {row.currency} {row.amount.toLocaleString()}
                                </td>
                                <td className="px-3 py-3 text-[#64748b]">
                                    {row.method}
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
                                    <div className="flex gap-1">
                                        {row.status_value !== 'completed' && (
                                            <button
                                                type="button"
                                                className="rounded-lg border border-[#d1fae5] px-2 py-1 text-xs text-[#065f46]"
                                                onClick={() =>
                                                    router.post(
                                                        `/admin/payments/${row.id}/approve`,
                                                    )
                                                }
                                            >
                                                Approve
                                            </button>
                                        )}
                                        {row.status_value === 'completed' && (
                                            <button
                                                type="button"
                                                className="rounded-lg border border-[#fee2e2] px-2 py-1 text-xs text-[#991b1b]"
                                                onClick={() =>
                                                    router.post(
                                                        `/admin/payments/${row.id}/refund`,
                                                    )
                                                }
                                            >
                                                Refund
                                            </button>
                                        )}
                                        {row.status_value === 'failed' && (
                                            <button
                                                type="button"
                                                className={cn(
                                                    'rounded-lg border border-[#e2e8f0] px-2 py-1 text-xs',
                                                )}
                                                onClick={() =>
                                                    router.post(
                                                        `/admin/payments/${row.id}/retry`,
                                                    )
                                                }
                                            >
                                                <RefreshCw className="inline size-3" />{' '}
                                                Retry
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </AdminTableShell>

                    {payments.data.length === 0 && (
                        <p className="mt-6 text-center text-sm text-[#99a1af]">
                            No payments recorded.
                        </p>
                    )}

                    <AdminPagination
                        showingLabel={`Showing ${payments.from ?? 0}-${payments.to ?? 0} of ${payments.total}`}
                        links={payments.links}
                    />
                </AdminPanel>
            </div>

            <Dialog open={creating} onOpenChange={setCreating}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Record payment</DialogTitle>
                    </DialogHeader>
                    <form
                        className="space-y-3"
                        onSubmit={(event) => {
                            event.preventDefault();
                            form.post('/admin/payments', {
                                onSuccess: () => setCreating(false),
                            });
                        }}
                    >
                        <div>
                            <Label>Employer</Label>
                            <NativeSelect
                                className="mt-1 w-full rounded-xl border border-[#e2e8f0] px-3 py-2 text-sm"
                                value={form.data.employer_id}
                                onChange={(event) =>
                                    form.setData(
                                        'employer_id',
                                        event.target.value,
                                    )
                                }
                            >
                                <option value="">Select employer</option>
                                {employers.map((employer) => (
                                    <option key={employer.id} value={employer.id}>
                                        {employer.company_name || employer.name}
                                    </option>
                                ))}
                            </NativeSelect>
                        </div>
                        <div>
                            <Label>Package</Label>
                            <NativeSelect
                                className="mt-1 w-full rounded-xl border border-[#e2e8f0] px-3 py-2 text-sm"
                                value={form.data.package_id}
                                onChange={(event) => {
                                    const packageId = event.target.value;
                                    const selected = packages.find(
                                        (item) => String(item.id) === packageId,
                                    );
                                    form.setData({
                                        ...form.data,
                                        package_id: packageId,
                                        amount: selected?.price ?? form.data.amount,
                                    });
                                }}
                            >
                                <option value="">None</option>
                                {packages.map((item) => (
                                    <option key={item.id} value={item.id}>
                                        {item.name} ({item.currency} {item.price})
                                    </option>
                                ))}
                            </NativeSelect>
                        </div>
                        <div>
                            <Label>Amount</Label>
                            <Input
                                type="number"
                                value={form.data.amount}
                                onChange={(event) =>
                                    form.setData(
                                        'amount',
                                        Number(event.target.value),
                                    )
                                }
                            />
                        </div>
                        <div>
                            <Label>Method</Label>
                            <Input
                                value={form.data.method}
                                onChange={(event) =>
                                    form.setData('method', event.target.value)
                                }
                            />
                        </div>
                        <div>
                            <Label>Status</Label>
                            <NativeSelect
                                className="mt-1 w-full rounded-xl border border-[#e2e8f0] px-3 py-2 text-sm"
                                value={form.data.status}
                                onChange={(event) =>
                                    form.setData('status', event.target.value)
                                }
                            >
                                <option value="pending">Pending</option>
                                <option value="completed">Completed</option>
                                <option value="failed">Failed</option>
                            </NativeSelect>
                        </div>
                        <DialogFooter>
                            <Button type="submit" disabled={form.processing}>
                                Save
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </AdminPortalLayout>
    );
}
