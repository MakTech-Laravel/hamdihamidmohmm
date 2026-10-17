import { Head, router, useForm, usePage } from '@inertiajs/react';
import { BellRing, Pencil, Plus, Trash2 } from 'lucide-react';
import { FormEvent, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { NativeSelect } from '@/components/ui/native-select';
import { useLocale } from '@/hooks/use-locale';
import JobSeekerLayout from '@/layouts/job-seeker-layout';
import { cn } from '@/lib/utils';
import type { SharedData } from '@/types';

type TaxonomyOption = { value: string; label: string };

type AlertRow = {
    id: number;
    name: string | null;
    display_name: string;
    keyword: string | null;
    country: string | null;
    location: string | null;
    category: string | null;
    employment_type: string | null;
    is_active: boolean;
    country_label: string | null;
    location_label: string | null;
    category_label: string | null;
    employment_type_label: string | null;
};

type Props = {
    alerts: AlertRow[];
    filterOptions: {
        countries: TaxonomyOption[];
        dutyStations: TaxonomyOption[];
        positionAreas: TaxonomyOption[];
        employmentTypes: TaxonomyOption[];
    };
};

type AlertForm = {
    name: string;
    keyword: string;
    country: string;
    location: string;
    category: string;
    employment_type: string;
    is_active: boolean;
};

const emptyForm = (): AlertForm => ({
    name: '',
    keyword: '',
    country: '',
    location: '',
    category: '',
    employment_type: '',
    is_active: true,
});

function fromAlert(alert: AlertRow): AlertForm {
    return {
        name: alert.name ?? '',
        keyword: alert.keyword ?? '',
        country: alert.country ?? '',
        location: alert.location ?? '',
        category: alert.category ?? '',
        employment_type: alert.employment_type ?? '',
        is_active: alert.is_active,
    };
}

export default function JobSeekerJobAlerts({ alerts, filterOptions }: Props) {
    const { flash } = usePage<SharedData>().props;
    const { t } = useLocale();
    const [editingId, setEditingId] = useState<number | null>(null);
    const [showForm, setShowForm] = useState(alerts.length === 0);
    const form = useForm<AlertForm>(emptyForm());

    const openCreate = () => {
        setEditingId(null);
        form.setData(emptyForm());
        form.clearErrors();
        setShowForm(true);
    };

    const openEdit = (alert: AlertRow) => {
        setEditingId(alert.id);
        form.setData(fromAlert(alert));
        form.clearErrors();
        setShowForm(true);
    };

    const cancelForm = () => {
        setShowForm(false);
        setEditingId(null);
        form.setData(emptyForm());
        form.clearErrors();
    };

    const submit = (event: FormEvent) => {
        event.preventDefault();

        if (editingId) {
            form.put(`/job-seeker/alerts/${editingId}`, {
                preserveScroll: true,
                onSuccess: () => cancelForm(),
            });

            return;
        }

        form.post('/job-seeker/alerts', {
            preserveScroll: true,
            onSuccess: () => cancelForm(),
        });
    };

    const remove = (alert: AlertRow) => {
        if (
            !window.confirm(
                t('job_seeker.alerts.confirm_delete', {
                    name: alert.display_name,
                }),
            )
        ) {
            return;
        }

        router.delete(`/job-seeker/alerts/${alert.id}`, {
            preserveScroll: true,
        });
    };

    return (
        <JobSeekerLayout>
            <Head title={t('job_seeker.alerts.title')} />

            <div className="space-y-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-[#050315]">
                            {t('job_seeker.alerts.title')}
                        </h1>
                        <p className="mt-1 max-w-2xl text-sm text-[#64748b]">
                            {t('job_seeker.alerts.subtitle')}
                        </p>
                    </div>
                    {!showForm ? (
                        <Button
                            type="button"
                            onClick={openCreate}
                            className="gap-2 bg-[#0057c8] hover:bg-[#0046a3]"
                        >
                            <Plus className="size-4" />
                            {t('job_seeker.alerts.create')}
                        </Button>
                    ) : null}
                </div>

                {flash?.success ? (
                    <div className="rounded-xl border border-[#bbf7d0] bg-[#f0fdf4] px-4 py-3 text-sm text-[#166534]">
                        {flash.success}
                    </div>
                ) : null}

                {showForm ? (
                    <form
                        onSubmit={submit}
                        className="space-y-4 rounded-2xl border border-[#e2e8f0] bg-white p-5 shadow-sm"
                    >
                        <div className="flex items-center gap-2 text-[#0057c8]">
                            <BellRing className="size-5" />
                            <h2 className="text-base font-bold text-[#050315]">
                                {editingId
                                    ? t('job_seeker.alerts.edit')
                                    : t('job_seeker.alerts.create')}
                            </h2>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-1.5 md:col-span-2">
                                <Label htmlFor="alert-name">
                                    {t('job_seeker.alerts.field.name')}
                                </Label>
                                <Input
                                    id="alert-name"
                                    value={form.data.name}
                                    onChange={(event) =>
                                        form.setData('name', event.target.value)
                                    }
                                    placeholder={t(
                                        'job_seeker.alerts.field.name_placeholder',
                                    )}
                                />
                            </div>

                            <div className="space-y-1.5 md:col-span-2">
                                <Label htmlFor="alert-keyword">
                                    {t('job_seeker.alerts.field.keyword')}
                                </Label>
                                <Input
                                    id="alert-keyword"
                                    value={form.data.keyword}
                                    onChange={(event) =>
                                        form.setData(
                                            'keyword',
                                            event.target.value,
                                        )
                                    }
                                    placeholder={t(
                                        'job_seeker.alerts.field.keyword_placeholder',
                                    )}
                                />
                                {form.errors.keyword ? (
                                    <p className="text-xs text-red-600">
                                        {form.errors.keyword}
                                    </p>
                                ) : (
                                    <p className="text-xs text-[#94a3b8]">
                                        {t('job_seeker.alerts.field.hint')}
                                    </p>
                                )}
                            </div>

                            <FilterSelect
                                label={t('job_seeker.alerts.field.country')}
                                value={form.data.country}
                                options={filterOptions.countries}
                                error={form.errors.country}
                                onChange={(value) =>
                                    form.setData('country', value)
                                }
                                allLabel={t('job_seeker.alerts.any')}
                            />
                            <FilterSelect
                                label={t('job_seeker.alerts.field.location')}
                                value={form.data.location}
                                options={filterOptions.dutyStations}
                                error={form.errors.location}
                                onChange={(value) =>
                                    form.setData('location', value)
                                }
                                allLabel={t('job_seeker.alerts.any')}
                            />
                            <FilterSelect
                                label={t('job_seeker.alerts.field.category')}
                                value={form.data.category}
                                options={filterOptions.positionAreas}
                                error={form.errors.category}
                                onChange={(value) =>
                                    form.setData('category', value)
                                }
                                allLabel={t('job_seeker.alerts.any')}
                            />
                            <FilterSelect
                                label={t(
                                    'job_seeker.alerts.field.employment_type',
                                )}
                                value={form.data.employment_type}
                                options={filterOptions.employmentTypes}
                                error={form.errors.employment_type}
                                onChange={(value) =>
                                    form.setData('employment_type', value)
                                }
                                allLabel={t('job_seeker.alerts.any')}
                            />
                        </div>

                        <label className="flex items-center gap-2 text-sm text-[#334155]">
                            <input
                                type="checkbox"
                                checked={form.data.is_active}
                                onChange={(event) =>
                                    form.setData(
                                        'is_active',
                                        event.target.checked,
                                    )
                                }
                                className="size-4 rounded border-[#cbd5e1]"
                            />
                            {t('job_seeker.alerts.field.active')}
                        </label>

                        <div className="flex flex-wrap gap-2">
                            <Button
                                type="submit"
                                disabled={form.processing}
                                className="bg-[#0057c8] hover:bg-[#0046a3]"
                            >
                                {editingId
                                    ? t('job_seeker.alerts.save')
                                    : t('job_seeker.alerts.create')}
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={cancelForm}
                            >
                                {t('common.cancel')}
                            </Button>
                        </div>
                    </form>
                ) : null}

                {alerts.length === 0 && !showForm ? (
                    <div className="rounded-2xl border border-dashed border-[#cbd5e1] bg-white px-6 py-12 text-center">
                        <BellRing className="mx-auto size-10 text-[#94a3b8]" />
                        <p className="mt-3 font-semibold text-[#050315]">
                            {t('job_seeker.alerts.empty_title')}
                        </p>
                        <p className="mt-1 text-sm text-[#64748b]">
                            {t('job_seeker.alerts.empty_body')}
                        </p>
                        <Button
                            type="button"
                            onClick={openCreate}
                            className="mt-4 gap-2 bg-[#0057c8] hover:bg-[#0046a3]"
                        >
                            <Plus className="size-4" />
                            {t('job_seeker.alerts.create')}
                        </Button>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {alerts.map((alert) => (
                            <div
                                key={alert.id}
                                className="flex flex-wrap items-start justify-between gap-4 rounded-2xl border border-[#e2e8f0] bg-white p-4 shadow-sm"
                            >
                                <div className="min-w-0 space-y-2">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <h3 className="font-bold text-[#050315]">
                                            {alert.display_name}
                                        </h3>
                                        <span
                                            className={cn(
                                                'rounded-full px-2.5 py-0.5 text-xs font-semibold',
                                                alert.is_active
                                                    ? 'bg-[#dcfce7] text-[#166534]'
                                                    : 'bg-[#f1f5f9] text-[#64748b]',
                                            )}
                                        >
                                            {alert.is_active
                                                ? t(
                                                      'job_seeker.alerts.status.active',
                                                  )
                                                : t(
                                                      'job_seeker.alerts.status.paused',
                                                  )}
                                        </span>
                                    </div>
                                    <div className="flex flex-wrap gap-2 text-xs text-[#475569]">
                                        {alert.keyword ? (
                                            <Chip
                                                label={`${t('job_seeker.alerts.field.keyword')}: ${alert.keyword}`}
                                            />
                                        ) : null}
                                        {alert.country_label ? (
                                            <Chip label={alert.country_label} />
                                        ) : null}
                                        {alert.location_label ? (
                                            <Chip
                                                label={alert.location_label}
                                            />
                                        ) : null}
                                        {alert.category_label ? (
                                            <Chip
                                                label={alert.category_label}
                                            />
                                        ) : null}
                                        {alert.employment_type_label ? (
                                            <Chip
                                                label={
                                                    alert.employment_type_label
                                                }
                                            />
                                        ) : null}
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        className="gap-1.5"
                                        onClick={() => openEdit(alert)}
                                    >
                                        <Pencil className="size-3.5" />
                                        {t('common.edit')}
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        className="gap-1.5 text-red-600 hover:text-red-700"
                                        onClick={() => remove(alert)}
                                    >
                                        <Trash2 className="size-3.5" />
                                        {t('common.delete')}
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </JobSeekerLayout>
    );
}

function Chip({ label }: { label: string }) {
    return (
        <span className="rounded-full bg-[#f1f5f9] px-2.5 py-1 font-medium">
            {label}
        </span>
    );
}

function FilterSelect({
    label,
    value,
    options,
    onChange,
    allLabel,
    error,
}: {
    label: string;
    value: string;
    options: TaxonomyOption[];
    onChange: (value: string) => void;
    allLabel: string;
    error?: string;
}) {
    return (
        <div className="space-y-1.5">
            <Label>{label}</Label>
            <NativeSelect
                value={value}
                onChange={(event) => onChange(event.target.value)}
            >
                <option value="">{allLabel}</option>
                {options.map((option) => (
                    <option key={option.value} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </NativeSelect>
            {error ? <p className="text-xs text-red-600">{error}</p> : null}
        </div>
    );
}
