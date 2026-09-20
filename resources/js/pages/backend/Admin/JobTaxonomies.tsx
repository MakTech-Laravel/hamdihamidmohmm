import { Head, router, useForm, usePage } from '@inertiajs/react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';

import {
    AdminPageHeader,
    AdminPanel,
    AdminPrimaryButton,
    AdminStatusBadge,
    AdminTableShell,
} from '@/components/admin-portal/ui';
import InputError from '@/components/input-error';
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { NativeSelect } from '@/components/ui/native-select';
import { useLocale } from '@/hooks/use-locale';
import AdminPortalLayout from '@/layouts/admin-portal-layout';
import type { SharedData } from '@/types';

type TaxonomyRow = {
    id: number;
    type: string;
    type_label: string;
    name: string;
    slug: string;
    is_active: boolean;
    sort_order: number;
};

type TypeOption = {
    value: string;
    label: string;
};

type Props = {
    items: TaxonomyRow[];
    filters: {
        type: string;
    };
    types: TypeOption[];
};

const emptyForm = {
    type: 'duty_station',
    name: '',
    is_active: true,
};

export default function JobTaxonomies({ items, filters, types }: Props) {
    const { flash } = usePage<SharedData>().props;
    const { t } = useLocale();
    const [editing, setEditing] = useState<TaxonomyRow | null>(null);
    const [creating, setCreating] = useState(false);
    const form = useForm(emptyForm);

    const typeFilter = filters.type || '';

    const filteredLabel = useMemo(() => {
        if (!typeFilter) {
            return t('admin.taxonomies.all_types');
        }

        return types.find((type) => type.value === typeFilter)?.label ?? typeFilter;
    }, [typeFilter, types, t]);

    return (
        <AdminPortalLayout>
            <Head title={t('admin.taxonomies.title')} />

            <div className="space-y-6 p-6">
                <AdminPageHeader
                    title={t('admin.taxonomies.title')}
                    subtitle={t('admin.taxonomies.subtitle')}
                    actions={
                        <AdminPrimaryButton
                            onClick={() => {
                                form.setData({
                                    ...emptyForm,
                                    type: typeFilter || emptyForm.type,
                                });
                                setCreating(true);
                            }}
                        >
                            <Plus className="size-4" />
                            {t('admin.taxonomies.new')}
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

                <div className="flex flex-wrap gap-2">
                    <button
                        type="button"
                        onClick={() =>
                            router.get('/admin/job-filters', {}, { preserveState: true })
                        }
                        className={`rounded-full border px-3 py-1.5 text-sm font-medium ${
                            typeFilter === ''
                                ? 'border-[#0057c8] bg-[#0057c8] text-white'
                                : 'border-[#dbe4f0] bg-white text-[#334155]'
                        }`}
                    >
                        {t('admin.taxonomies.all_types')}
                    </button>
                    {types.map((type) => (
                        <button
                            key={type.value}
                            type="button"
                            onClick={() =>
                                router.get(
                                    '/admin/job-filters',
                                    { type: type.value },
                                    { preserveState: true },
                                )
                            }
                            className={`rounded-full border px-3 py-1.5 text-sm font-medium ${
                                typeFilter === type.value
                                    ? 'border-[#0057c8] bg-[#0057c8] text-white'
                                    : 'border-[#dbe4f0] bg-white text-[#334155]'
                            }`}
                        >
                            {type.label}
                        </button>
                    ))}
                </div>

                <AdminPanel>
                    <p className="mb-4 text-sm text-[#64748b]">
                        {t('admin.taxonomies.showing')}: {filteredLabel}
                    </p>
                    <AdminTableShell
                        headers={[
                            t('admin.taxonomies.cols.type'),
                            t('admin.taxonomies.cols.name'),
                            t('admin.taxonomies.cols.slug'),
                            t('admin.taxonomies.cols.sort'),
                            t('admin.taxonomies.cols.status'),
                            t('common.actions'),
                        ]}
                    >
                        {items.map((item) => (
                            <tr
                                key={item.id}
                                className="border-b border-[#e2e8f0] last:border-0"
                            >
                                <td className="px-3 py-3 text-[#64748b]">
                                    {item.type_label}
                                </td>
                                <td className="px-3 py-3 font-semibold">{item.name}</td>
                                <td className="px-3 py-3 font-mono text-xs text-[#64748b]">
                                    {item.slug}
                                </td>
                                <td className="px-3 py-3 text-[#64748b]">
                                    {item.sort_order}
                                </td>
                                <td className="px-3 py-3">
                                    <AdminStatusBadge
                                        label={
                                            item.is_active
                                                ? t('common.active')
                                                : t('common.inactive')
                                        }
                                        tone={item.is_active ? 'success' : 'neutral'}
                                    />
                                </td>
                                <td className="px-3 py-3">
                                    <div className="flex gap-1.5">
                                        <button
                                            type="button"
                                            className="flex size-8 items-center justify-center rounded-lg border"
                                            onClick={() => {
                                                form.setData({
                                                    type: item.type,
                                                    name: item.name,
                                                    is_active: item.is_active,
                                                });
                                                setEditing(item);
                                            }}
                                        >
                                            <Pencil className="size-4" />
                                        </button>
                                        {item.is_active ? (
                                            <button
                                                type="button"
                                                className="flex size-8 items-center justify-center rounded-lg border border-[#fee2e2] text-[#991b1b]"
                                                onClick={() =>
                                                    router.delete(
                                                        `/admin/job-filters/${item.id}`,
                                                    )
                                                }
                                            >
                                                <Trash2 className="size-4" />
                                            </button>
                                        ) : null}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </AdminTableShell>
                    {items.length === 0 && (
                        <p className="mt-6 text-center text-sm text-[#99a1af]">
                            {t('admin.taxonomies.empty')}
                        </p>
                    )}
                </AdminPanel>
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
                            {editing
                                ? t('admin.taxonomies.edit_title')
                                : t('admin.taxonomies.create_title')}
                        </DialogTitle>
                    </DialogHeader>
                    <form
                        className="space-y-3"
                        onSubmit={(event) => {
                            event.preventDefault();

                            if (editing) {
                                form.put(`/admin/job-filters/${editing.id}`, {
                                    onSuccess: () => setEditing(null),
                                });

                                return;
                            }

                            form.post('/admin/job-filters', {
                                onSuccess: () => {
                                    setCreating(false);
                                    form.reset();
                                },
                            });
                        }}
                    >
                        <div className="space-y-1.5">
                            <Label>{t('admin.taxonomies.cols.type')}</Label>
                            <NativeSelect
                                value={form.data.type}
                                onChange={(event) =>
                                    form.setData('type', event.target.value)
                                }
                            >
                                {types.map((type) => (
                                    <option key={type.value} value={type.value}>
                                        {type.label}
                                    </option>
                                ))}
                            </NativeSelect>
                            <InputError message={form.errors.type} />
                        </div>
                        <div className="space-y-1.5">
                            <Label>{t('admin.taxonomies.cols.name')}</Label>
                            <Input
                                value={form.data.name}
                                onChange={(event) =>
                                    form.setData('name', event.target.value)
                                }
                            />
                            <InputError message={form.errors.name} />
                        </div>
                        <label className="flex items-center gap-2 text-sm text-[#334155]">
                            <input
                                type="checkbox"
                                checked={form.data.is_active}
                                onChange={(event) =>
                                    form.setData('is_active', event.target.checked)
                                }
                            />
                            {t('common.active')}
                        </label>
                        <DialogFooter>
                            <button
                                type="submit"
                                disabled={form.processing}
                                className="rounded-lg bg-[#0057c8] px-4 py-2 text-sm font-semibold text-white"
                            >
                                {editing ? t('common.save') : t('common.create')}
                            </button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </AdminPortalLayout>
    );
}
