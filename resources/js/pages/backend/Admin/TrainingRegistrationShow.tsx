import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { type FormEvent } from 'react';

import { TrainingSectionNav } from '@/components/admin-portal/training-section-nav';
import { AdminPageHeader, AdminPanel, AdminPrimaryButton } from '@/components/admin-portal/ui';
import InputError from '@/components/input-error';
import { useLocale } from '@/hooks/use-locale';
import AdminPortalLayout from '@/layouts/admin-portal-layout';
import type { SharedData } from '@/types';

type Answer = {
    id: string;
    label: string;
    value: string;
};

type Registration = {
    id: number;
    number: string;
    full_name: string;
    email: string;
    phone: string;
    country_city: string;
    organization: string;
    job_title: string;
    experience: string;
    reason: string;
    answers: Answer[];
    status: string | null;
    status_label: string | null;
    course: string | null;
    consent_accepted_at: string | null;
    created_at: string | null;
};

export default function TrainingRegistrationShow({
    registration,
    statuses,
}: {
    registration: Registration;
    statuses: Array<{ value: string; label: string }>;
}) {
    const { t } = useLocale();
    const { flash } = usePage<SharedData>().props;
    const form = useForm({
        status: registration.status ?? 'pending',
    });

    const facts = [
        [t('training.register.full_name'), registration.full_name],
        [t('training.register.email'), registration.email],
        [t('training.register.phone'), registration.phone],
        [t('training.register.country_city'), registration.country_city],
        [t('training.register.organization'), registration.organization],
        [t('training.register.job_title'), registration.job_title],
        [t('training.register.experience'), registration.experience],
        [t('training.register.reason'), registration.reason],
    ];

    const submit = (event: FormEvent) => {
        event.preventDefault();
        form.patch(`/admin/training/registrations/${registration.id}`);
    };

    return (
        <AdminPortalLayout>
            <Head title={registration.number} />
            <div className="space-y-6 p-6">
                <AdminPageHeader
                    title={registration.number}
                    subtitle={registration.course ?? ''}
                />
                <TrainingSectionNav />
                <Link
                    href="/admin/training/registrations"
                    className="text-sm font-semibold text-[#0057c8]"
                >
                    {t('admin.training.registrations.back')}
                </Link>
                {flash.success ? (
                    <div className="rounded-xl border border-[#bbf7d0] bg-[#f0fdf4] px-4 py-3 text-sm text-[#15803d]">
                        {String(flash.success)}
                    </div>
                ) : null}
                <AdminPanel className="divide-y divide-[#e2e8f0]">
                    {facts.map(([label, value]) => (
                        <div key={label} className="grid gap-1 px-5 py-3 sm:grid-cols-[220px_minmax(0,1fr)]">
                            <p className="text-sm font-semibold text-[#050315]">{label}</p>
                            <p className="whitespace-pre-line text-sm text-[#4a5565]">{value}</p>
                        </div>
                    ))}
                    {registration.answers.map((answer) => (
                        <div key={answer.id} className="grid gap-1 px-5 py-3 sm:grid-cols-[220px_minmax(0,1fr)]">
                            <p className="text-sm font-semibold text-[#050315]">{answer.label}</p>
                            <p className="whitespace-pre-line text-sm text-[#4a5565]">{answer.value}</p>
                        </div>
                    ))}
                    <div className="px-5 py-3 text-xs text-[#64748b]">
                        {registration.created_at} · {registration.consent_accepted_at}
                    </div>
                </AdminPanel>
                <form onSubmit={submit} className="flex flex-wrap items-end gap-3">
                    <label className="space-y-1">
                        <span className="text-sm font-semibold">
                            {t('admin.training.registrations.col.status')}
                        </span>
                        <select
                            className="block rounded-xl border border-[#e2e8f0] px-3 py-2 text-sm"
                            value={form.data.status}
                            onChange={(event) => form.setData('status', event.target.value)}
                        >
                            {statuses.map((status) => (
                                <option key={status.value} value={status.value}>
                                    {status.label}
                                </option>
                            ))}
                        </select>
                    </label>
                    <AdminPrimaryButton type="submit" disabled={form.processing}>
                        {t('admin.training.registrations.update_status')}
                    </AdminPrimaryButton>
                    <InputError message={form.errors.status} />
                </form>
            </div>
        </AdminPortalLayout>
    );
}
