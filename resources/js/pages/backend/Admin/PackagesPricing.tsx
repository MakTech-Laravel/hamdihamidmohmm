import { Head, router, useForm, usePage } from '@inertiajs/react';
import { Archive, CreditCard, Package, Pencil, Plus, Trash2 } from 'lucide-react';
import { type ReactNode, useState } from 'react';

import {
    AdminPageHeader,
    AdminPanel,
    AdminPrimaryButton,
    AdminSecondaryButton,
    AdminStatCard,
    AdminStatusBadge,
} from '@/components/admin-portal/ui';
import InputError from '@/components/input-error';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useLocale } from '@/hooks/use-locale';
import AdminPortalLayout from '@/layouts/admin-portal-layout';
import { cn } from '@/lib/utils';
import type { SharedData } from '@/types';

type PackageRow = {
    id: number;
    slug: string;
    name: string;
    description: string | null;
    price: number;
    currency: string;
    billing_period: string;
    job_credits: number;
    featured_credits: number;
    features: string[];
    excluded_features: string[];
    is_active: boolean;
    is_featured: boolean;
    is_public: boolean;
    sort_order: number;
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
    description: '',
    price: 0,
    currency: 'SDG',
    billing_period: 'month',
    job_credits: 0,
    featured_credits: 0,
    features: '',
    excluded_features: '',
    sort_order: 0,
    is_active: true,
    is_featured: false,
    is_public: true,
};

function packageSlug(value: string): string {
    return value
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

function PackageField({
    label,
    hint,
    error,
    children,
}: {
    label: string;
    hint?: string;
    error?: string;
    children: ReactNode;
}) {
    return (
        <div className="space-y-1.5">
            <Label className="text-sm font-semibold text-[#050315]">{label}</Label>
            {children}
            {hint ? <p className="text-xs text-[#64748b]">{hint}</p> : null}
            <InputError message={error} />
        </div>
    );
}

function VisibilityToggle({
    label,
    hint,
    checked,
    onChange,
}: {
    label: string;
    hint: string;
    checked: boolean;
    onChange: (value: boolean) => void;
}) {
    return (
        <button
            type="button"
            onClick={() => onChange(!checked)}
            aria-pressed={checked}
            className={cn(
                'flex items-start justify-between gap-3 rounded-xl border p-3 text-start transition',
                checked
                    ? 'border-[#0057c8] bg-[#eff6ff]'
                    : 'border-[#e2e8f0] bg-white hover:border-[#cbd5e1]',
            )}
        >
            <div>
                <p className="text-sm font-semibold text-[#050315]">{label}</p>
                <p className="mt-0.5 text-xs text-[#64748b]">{hint}</p>
            </div>
            <span
                className={cn(
                    'relative mt-0.5 h-5 w-9 shrink-0 rounded-full transition',
                    checked ? 'bg-[#0057c8]' : 'bg-[#cbd5e1]',
                )}
            >
                <span
                    className={cn(
                        'absolute top-0.5 size-4 rounded-full bg-white shadow-sm transition-[inset-inline-start]',
                        checked ? 'start-4' : 'start-0.5',
                    )}
                />
            </span>
        </button>
    );
}

export default function PackagesPricing({ packages, stats }: Props) {
    const { flash } = usePage<SharedData>().props;
    const { t } = useLocale();
    const [editing, setEditing] = useState<PackageRow | null>(null);
    const [creating, setCreating] = useState(false);
    const [deleting, setDeleting] = useState<PackageRow | null>(null);
    const form = useForm(emptyForm);
    const dialogOpen = creating || editing !== null;

    const closeDialog = (): void => {
        setCreating(false);
        setEditing(null);
    };

    const archivePackage = (row: PackageRow): void => {
        router.delete(`/admin/packages/${row.id}`);
    };

    const permanentlyDeletePackage = (row: PackageRow): void => {
        router.delete(`/admin/packages/${row.id}`, {
            data: { permanent: true },
            onSuccess: () => setDeleting(null),
        });
    };

    const openCreate = (): void => {
        form.reset();
        form.clearErrors();
        form.setData(emptyForm);
        setEditing(null);
        setCreating(true);
    };

    const openEdit = (row: PackageRow): void => {
        form.clearErrors();
        form.setData({
            slug: row.slug,
            name: row.name,
            description: row.description ?? '',
            price: row.price,
            currency: row.currency,
            billing_period: row.billing_period,
            job_credits: row.job_credits,
            featured_credits: row.featured_credits,
            features: row.features.join('\n'),
            excluded_features: row.excluded_features.join('\n'),
            sort_order: row.sort_order,
            is_active: row.is_active,
            is_featured: row.is_featured,
            is_public: row.is_public,
        });
        setCreating(false);
        setEditing(row);
    };

    return (
        <AdminPortalLayout>
            <Head title={t('admin.packages.title')} />

            <div className="space-y-6 p-6">
                <AdminPageHeader
                    title={t('admin.packages.title')}
                    subtitle={t('admin.packages.subtitle')}
                    actions={
                        <AdminPrimaryButton onClick={openCreate}>
                            <Plus className="size-4" />
                            {t('admin.packages.add')}
                        </AdminPrimaryButton>
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
                        label={t('admin.packages.stats.total')}
                        value={String(stats.total)}
                        valueClassName="text-[#0057c8]"
                        icon={Package}
                    />
                    <AdminStatCard
                        label={t('admin.packages.stats.subscribers')}
                        value={stats.subscribers.toLocaleString()}
                        valueClassName="text-[#e57124]"
                        icon={CreditCard}
                    />
                    <AdminStatCard
                        label={t('admin.packages.stats.sales')}
                        value={`${packages[0]?.currency ?? 'SDG'} ${stats.monthly_sales.toLocaleString()}`}
                        valueClassName="text-[#0057c8]"
                        icon={CreditCard}
                    />
                    <AdminStatCard
                        label={t('admin.packages.most_popular')}
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
                                    {item.is_featured && (
                                        <p className="mt-1 text-xs font-semibold text-[#e57124]">
                                            {t('admin.packages.most_popular')}
                                        </p>
                                    )}
                                    <p className="text-sm text-[#64748b]">
                                        {item.currency} {item.price} /{' '}
                                        {item.billing_period}
                                    </p>
                                </div>
                                <AdminStatusBadge
                                    label={item.is_active ? t('common.active') : t('status.archived')}
                                    tone={item.is_active ? 'success' : 'neutral'}
                                />
                            </div>
                            <p className="text-sm text-[#475569]">
                                {item.job_credits} {t('admin.packages.job_credits_unit')} ·{' '}
                                {item.featured_credits} {t('admin.packages.featured_unit')}
                            </p>
                            {item.description && (
                                <p className="line-clamp-2 text-sm text-[#64748b]">
                                    {item.description}
                                </p>
                            )}
                            <p className="text-sm font-semibold text-[#050315]">
                                {item.subscribers} {t('admin.packages.subscribers_unit')} · {item.currency}{' '}
                                {item.revenue.toLocaleString()}
                            </p>
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    className="flex size-8 items-center justify-center rounded-lg border border-[#e2e8f0] text-[#64748b]"
                                    title={t('common.edit')}
                                    onClick={() => openEdit(item)}
                                >
                                    <Pencil className="size-4" />
                                </button>
                                {item.is_active && (
                                    <button
                                        type="button"
                                        className="flex size-8 items-center justify-center rounded-lg border border-[#e2e8f0] text-[#64748b]"
                                        title={t('common.archive')}
                                        onClick={() => archivePackage(item)}
                                    >
                                        <Archive className="size-4" />
                                    </button>
                                )}
                                <button
                                    type="button"
                                    className="flex size-8 items-center justify-center rounded-lg border border-[#fee2e2] text-[#991b1b]"
                                    title={t('admin.packages.delete')}
                                    onClick={() => setDeleting(item)}
                                >
                                    <Trash2 className="size-4" />
                                </button>
                            </div>
                        </AdminPanel>
                    ))}
                    {packages.length === 0 && (
                        <p className="text-sm text-[#99a1af]">
                            {t('admin.packages.empty')}
                        </p>
                    )}
                </div>
            </div>

            <Dialog
                open={dialogOpen}
                onOpenChange={(open) => {
                    if (!open) {
                        closeDialog();
                    }
                }}
            >
                <DialogContent className="max-h-[90vh] gap-0 overflow-hidden p-0 sm:max-w-2xl">
                    <div className="border-b border-[#dbeafe] bg-linear-to-r from-[#eff6ff] to-white px-6 py-5">
                        <DialogHeader className="gap-1 text-start">
                            <DialogTitle className="text-xl font-extrabold tracking-tight text-[#050315]">
                                {editing ? t('admin.packages.edit_title') : t('admin.packages.add_title')}
                            </DialogTitle>
                            <DialogDescription className="text-sm text-[#3977a6]">
                                {editing
                                    ? t('admin.packages.edit_desc')
                                    : t('admin.packages.add_desc')}
                            </DialogDescription>
                        </DialogHeader>
                    </div>

                    <form
                        className="flex max-h-[calc(90vh-5.5rem)] flex-col"
                        onSubmit={(event) => {
                            event.preventDefault();

                            if (editing) {
                                form.put(`/admin/packages/${editing.id}`, {
                                    onSuccess: closeDialog,
                                });

                                return;
                            }

                            form.post('/admin/packages', {
                                preserveScroll: true,
                                onSuccess: closeDialog,
                            });
                        }}
                    >
                        <div className="space-y-6 overflow-y-auto px-6 py-5">
                            {form.hasErrors && (
                                <div className="rounded-xl border border-[#fecaca] bg-[#fef2f2] px-4 py-3 text-sm text-[#991b1b]">
                                    {t('common.fix_errors')}
                                </div>
                            )}
                            <section className="space-y-3">
                                <p className="text-xs font-bold tracking-wide text-[#3977a6] uppercase">
                                    {t('admin.packages.section.basics')}
                                </p>
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <PackageField
                                        label={t('common.name')}
                                        error={form.errors.name}
                                    >
                                        <Input
                                            value={form.data.name}
                                            placeholder={t('admin.packages.placeholders.name')}
                                            onChange={(event) => {
                                                const name = event.target.value;
                                                const nextSlug = packageSlug(name);

                                                if (
                                                    !editing &&
                                                    (form.data.slug === '' ||
                                                        form.data.slug ===
                                                        packageSlug(
                                                            form.data.name,
                                                        ))
                                                ) {
                                                    form.setData({
                                                        ...form.data,
                                                        name,
                                                        slug: nextSlug,
                                                    });

                                                    return;
                                                }

                                                form.setData('name', name);
                                            }}
                                        />
                                    </PackageField>
                                    <PackageField
                                        label={t('admin.packages.slug')}
                                        hint={t('admin.packages.slug_hint')}
                                        error={form.errors.slug}
                                    >
                                        <Input
                                            value={form.data.slug}
                                            placeholder={t('admin.packages.placeholders.slug')}
                                            onChange={(event) =>
                                                form.setData(
                                                    'slug',
                                                    event.target.value,
                                                )
                                            }
                                        />
                                    </PackageField>
                                </div>
                                <PackageField
                                    label={t('common.description')}
                                    hint={t('admin.packages.description_hint')}
                                    error={form.errors.description}
                                >
                                    <Textarea
                                        rows={3}
                                        value={form.data.description}
                                        placeholder={t('admin.packages.placeholders.description')}
                                        onChange={(event) =>
                                            form.setData(
                                                'description',
                                                event.target.value,
                                            )
                                        }
                                    />
                                </PackageField>
                            </section>

                            <section className="space-y-3">
                                <p className="text-xs font-bold tracking-wide text-[#3977a6] uppercase">
                                    {t('admin.packages.section.pricing')}
                                </p>
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <PackageField
                                        label={t('admin.packages.price')}
                                        error={form.errors.price}
                                    >
                                        <Input
                                            type="number"
                                            min={0}
                                            value={form.data.price}
                                            onChange={(event) =>
                                                form.setData(
                                                    'price',
                                                    Number(event.target.value),
                                                )
                                            }
                                        />
                                    </PackageField>
                                    <PackageField
                                        label={t('admin.packages.currency')}
                                        error={form.errors.currency}
                                    >
                                        <Input
                                            value={form.data.currency}
                                            maxLength={3}
                                            onChange={(event) =>
                                                form.setData(
                                                    'currency',
                                                    event.target.value.toUpperCase(),
                                                )
                                            }
                                        />
                                    </PackageField>
                                    <PackageField
                                        label={t('admin.packages.billing_period')}
                                        error={form.errors.billing_period}
                                    >
                                        <Input
                                            value={form.data.billing_period}
                                            placeholder={t('admin.packages.placeholders.billing_period')}
                                            onChange={(event) =>
                                                form.setData(
                                                    'billing_period',
                                                    event.target.value,
                                                )
                                            }
                                        />
                                    </PackageField>
                                    <PackageField
                                        label={t('admin.packages.sort_order')}
                                        hint={t('admin.packages.sort_order_hint')}
                                        error={form.errors.sort_order}
                                    >
                                        <Input
                                            type="number"
                                            min={0}
                                            value={form.data.sort_order}
                                            onChange={(event) =>
                                                form.setData(
                                                    'sort_order',
                                                    Number(event.target.value),
                                                )
                                            }
                                        />
                                    </PackageField>
                                    <PackageField
                                        label={t('admin.packages.job_credits')}
                                        error={form.errors.job_credits}
                                    >
                                        <Input
                                            type="number"
                                            min={0}
                                            value={form.data.job_credits}
                                            onChange={(event) =>
                                                form.setData(
                                                    'job_credits',
                                                    Number(event.target.value),
                                                )
                                            }
                                        />
                                    </PackageField>
                                    <PackageField
                                        label={t('admin.packages.featured_credits')}
                                        error={form.errors.featured_credits}
                                    >
                                        <Input
                                            type="number"
                                            min={0}
                                            value={form.data.featured_credits}
                                            onChange={(event) =>
                                                form.setData(
                                                    'featured_credits',
                                                    Number(event.target.value),
                                                )
                                            }
                                        />
                                    </PackageField>
                                </div>
                            </section>

                            <section className="space-y-3">
                                <p className="text-xs font-bold tracking-wide text-[#3977a6] uppercase">
                                    {t('common.features')}
                                </p>
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <PackageField
                                        label={t('admin.packages.included')}
                                        hint={t('admin.packages.included_hint')}
                                        error={form.errors.features}
                                    >
                                        <Textarea
                                            rows={6}
                                            value={form.data.features}
                                            placeholder={t('admin.packages.placeholders.included')}
                                            onChange={(event) =>
                                                form.setData(
                                                    'features',
                                                    event.target.value,
                                                )
                                            }
                                        />
                                    </PackageField>
                                    <PackageField
                                        label={t('admin.packages.excluded')}
                                        hint={t('admin.packages.excluded_hint')}
                                        error={form.errors.excluded_features}
                                    >
                                        <Textarea
                                            rows={6}
                                            value={form.data.excluded_features}
                                            placeholder={t('admin.packages.placeholders.excluded')}
                                            onChange={(event) =>
                                                form.setData(
                                                    'excluded_features',
                                                    event.target.value,
                                                )
                                            }
                                        />
                                    </PackageField>
                                </div>
                            </section>

                            <section className="space-y-3">
                                <p className="text-xs font-bold tracking-wide text-[#3977a6] uppercase">
                                    {t('admin.packages.section.visibility')}
                                </p>
                                <div className="grid gap-3 sm:grid-cols-3">
                                    <VisibilityToggle
                                        label={t('common.active')}
                                        hint={t('admin.packages.active_hint')}
                                        checked={form.data.is_active}
                                        onChange={(value) =>
                                            form.setData('is_active', value)
                                        }
                                    />
                                    <VisibilityToggle
                                        label={t('admin.packages.most_popular')}
                                        hint={t('admin.packages.featured_hint')}
                                        checked={form.data.is_featured}
                                        onChange={(value) =>
                                            form.setData('is_featured', value)
                                        }
                                    />
                                    <VisibilityToggle
                                        label={t('admin.packages.show_publicly')}
                                        hint={t('admin.packages.public_hint')}
                                        checked={form.data.is_public}
                                        onChange={(value) =>
                                            form.setData('is_public', value)
                                        }
                                    />
                                </div>
                            </section>
                        </div>

                        <DialogFooter className="border-t border-[#e2e8f0] bg-[#f8fafc] px-6 py-4 sm:justify-between">
                            <AdminSecondaryButton
                                type="button"
                                onClick={closeDialog}
                            >
                                {t('common.cancel')}
                            </AdminSecondaryButton>
                            <AdminPrimaryButton
                                type="submit"
                                className={
                                    form.processing
                                        ? 'pointer-events-none opacity-60'
                                        : ''
                                }
                            >
                                {form.processing
                                    ? t('common.saving')
                                    : editing
                                        ? t('common.save_changes')
                                        : t('admin.packages.create')}
                            </AdminPrimaryButton>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog
                open={deleting !== null}
                onOpenChange={(open) => {
                    if (!open) {
                        setDeleting(null);
                    }
                }}
            >
                <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-md">
                    <div className="border-b border-[#fee2e2] bg-[#fef2f2] px-6 py-5">
                        <DialogHeader className="gap-1 text-start">
                            <DialogTitle className="text-xl font-extrabold tracking-tight text-[#991b1b]">
                                {t('admin.packages.delete_confirm_title')}
                            </DialogTitle>
                            <DialogDescription className="text-sm text-[#7f1d1d]">
                                {deleting
                                    ? t('admin.packages.delete_confirm', { name: deleting.name })
                                    : t('admin.packages.delete_confirm_generic')}
                            </DialogDescription>
                        </DialogHeader>
                    </div>
                    <div className="space-y-3 px-6 py-5 text-sm text-[#475569]">
                        <p>
                            {t('admin.packages.delete_warning')}
                        </p>
                    </div>
                    <DialogFooter className="border-t border-[#e2e8f0] bg-[#f8fafc] px-6 py-4 sm:justify-between">
                        <AdminSecondaryButton
                            type="button"
                            onClick={() => setDeleting(null)}
                        >
                            {t('common.cancel')}
                        </AdminSecondaryButton>
                        <button
                            type="button"
                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#991b1b] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#7f1d1d]"
                            onClick={() => {
                                if (deleting) {
                                    permanentlyDeletePackage(deleting);
                                }
                            }}
                        >
                            <Trash2 className="size-4" />
                            {t('admin.packages.delete')}
                        </button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AdminPortalLayout>
    );
}
