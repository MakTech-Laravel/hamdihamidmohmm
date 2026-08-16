import { Head, router, useForm, usePage } from '@inertiajs/react';
import { CreditCard, Package, Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';

import {
    AdminPageHeader,
    AdminPanel,
    AdminPrimaryButton,
    AdminStatCard,
    AdminStatusBadge,
} from '@/components/admin-portal/ui';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AdminPortalLayout from '@/layouts/admin-portal-layout';
import type { SharedData } from '@/types';

type PackageRow = {
    id: number;
    slug: string;
    name: string;
    price: number;
    currency: string;
    billing_period: string;
    job_credits: number;
    featured_credits: number;
    is_active: boolean;
    subscribers: number;
    revenue: number;
};

type Props = {
    packages: PackageRow[];
    stats: {
        total: number;
        subscribers: number;
        monthly_sales: number;
        most_popular: string;
    };
};

const emptyForm = {
    slug: '',
    name: '',
    price: 0,
    billing_period: 'month',
    job_credits: 0,
    featured_credits: 0,
    is_active: true,
};

export default function PackagesPricing({ packages, stats }: Props) {
    const { flash } = usePage<SharedData>().props;
    const [editing, setEditing] = useState<PackageRow | null>(null);
    const [creating, setCreating] = useState(false);
    const form = useForm(emptyForm);

    const openCreate = (): void => {
        form.reset();
        form.setData(emptyForm);
        setCreating(true);
    };

    const openEdit = (row: PackageRow): void => {
        form.setData({
            slug: row.slug,
            name: row.name,
            price: row.price,
            billing_period: row.billing_period,
            job_credits: row.job_credits,
            featured_credits: row.featured_credits,
            is_active: row.is_active,
        });
        setEditing(row);
    };

    return (
        <AdminPortalLayout>
            <Head title="Packages & Pricing" />

            <div className="space-y-6 p-6">
                <AdminPageHeader
                    title="Packages & Pricing"
                    subtitle="Manage employer subscription packages."
                    actions={
                        <AdminPrimaryButton onClick={openCreate}>
                            <Plus className="size-4" />
                            Add Package
                        </AdminPrimaryButton>
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
                        label="Total Packages"
                        value={String(stats.total)}
                        valueClassName="text-[#0057c8]"
                        icon={Package}
                    />
                    <AdminStatCard
                        label="Active Subscribers"
                        value={stats.subscribers.toLocaleString()}
                        valueClassName="text-[#e57124]"
                        icon={CreditCard}
                    />
                    <AdminStatCard
                        label="Completed Sales"
                        value={`AED ${stats.monthly_sales.toLocaleString()}`}
                        valueClassName="text-[#0057c8]"
                        icon={CreditCard}
                    />
                    <AdminStatCard
                        label="Most Popular"
                        value={stats.most_popular}
                        valueClassName="text-[#3977a6]"
                        icon={Package}
                    />
                </div>

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {packages.map((item) => (
                        <AdminPanel key={item.id} className="space-y-3">
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <h2 className="text-lg font-bold text-[#050315]">
                                        {item.name}
                                    </h2>
                                    <p className="text-sm text-[#64748b]">
                                        {item.currency} {item.price} /{' '}
                                        {item.billing_period}
                                    </p>
                                </div>
                                <AdminStatusBadge
                                    label={item.is_active ? 'Active' : 'Archived'}
                                    tone={item.is_active ? 'success' : 'neutral'}
                                />
                            </div>
                            <p className="text-sm text-[#475569]">
                                {item.job_credits} job credits ·{' '}
                                {item.featured_credits} featured
                            </p>
                            <p className="text-sm font-semibold text-[#050315]">
                                {item.subscribers} subscribers · AED{' '}
                                {item.revenue.toLocaleString()}
                            </p>
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    className="flex size-8 items-center justify-center rounded-lg border border-[#e2e8f0] text-[#64748b]"
                                    onClick={() => openEdit(item)}
                                >
                                    <Pencil className="size-4" />
                                </button>
                                <button
                                    type="button"
                                    className="flex size-8 items-center justify-center rounded-lg border border-[#fee2e2] text-[#991b1b]"
                                    onClick={() =>
                                        router.delete(
                                            `/admin/packages/${item.id}`,
                                        )
                                    }
                                >
                                    <Trash2 className="size-4" />
                                </button>
                            </div>
                        </AdminPanel>
                    ))}
                    {packages.length === 0 && (
                        <p className="text-sm text-[#99a1af]">
                            No packages yet.
                        </p>
                    )}
                </div>
            </div>

            <Dialog
                open={creating || editing !== null}
                onOpenChange={(open) => {
                    if (!open) {
                        setCreating(false);
                        setEditing(null);
                    }
                }}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {editing ? 'Edit package' : 'Create package'}
                        </DialogTitle>
                    </DialogHeader>
                    <form
                        className="space-y-3"
                        onSubmit={(event) => {
                            event.preventDefault();

                            if (editing) {
                                form.put(`/admin/packages/${editing.id}`, {
                                    onSuccess: () => setEditing(null),
                                });

                                return;
                            }

                            form.post('/admin/packages', {
                                onSuccess: () => setCreating(false),
                            });
                        }}
                    >
                        <div className="grid gap-3 sm:grid-cols-2">
                            <div>
                                <Label>Slug</Label>
                                <Input
                                    value={form.data.slug}
                                    onChange={(event) =>
                                        form.setData('slug', event.target.value)
                                    }
                                />
                            </div>
                            <div>
                                <Label>Name</Label>
                                <Input
                                    value={form.data.name}
                                    onChange={(event) =>
                                        form.setData('name', event.target.value)
                                    }
                                />
                            </div>
                            <div>
                                <Label>Price (AED)</Label>
                                <Input
                                    type="number"
                                    value={form.data.price}
                                    onChange={(event) =>
                                        form.setData(
                                            'price',
                                            Number(event.target.value),
                                        )
                                    }
                                />
                            </div>
                            <div>
                                <Label>Billing period</Label>
                                <Input
                                    value={form.data.billing_period}
                                    onChange={(event) =>
                                        form.setData(
                                            'billing_period',
                                            event.target.value,
                                        )
                                    }
                                />
                            </div>
                            <div>
                                <Label>Job credits</Label>
                                <Input
                                    type="number"
                                    value={form.data.job_credits}
                                    onChange={(event) =>
                                        form.setData(
                                            'job_credits',
                                            Number(event.target.value),
                                        )
                                    }
                                />
                            </div>
                            <div>
                                <Label>Featured credits</Label>
                                <Input
                                    type="number"
                                    value={form.data.featured_credits}
                                    onChange={(event) =>
                                        form.setData(
                                            'featured_credits',
                                            Number(event.target.value),
                                        )
                                    }
                                />
                            </div>
                        </div>
                        <label className="flex items-center gap-2 text-sm">
                            <input
                                type="checkbox"
                                checked={form.data.is_active}
                                onChange={(event) =>
                                    form.setData(
                                        'is_active',
                                        event.target.checked,
                                    )
                                }
                            />
                            Active
                        </label>
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
