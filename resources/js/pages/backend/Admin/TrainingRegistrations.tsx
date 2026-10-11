import { Head, Link, router, usePage } from '@inertiajs/react';
import { type FormEvent, useState } from 'react';

import { TrainingSectionNav } from '@/components/admin-portal/training-section-nav';
import {
    AdminPageHeader,
    AdminPanel,
} from '@/components/admin-portal/ui';
import { useLocale } from '@/hooks/use-locale';
import AdminPortalLayout from '@/layouts/admin-portal-layout';
import type { SharedData } from '@/types';

type RegistrationRow = {
    id: number;
    number: string;
    full_name: string;
    email: string;
    course: string | null;
    status_label: string | null;
    created_at: string | null;
};

type Option = { value: string; label: string };
type CourseOption = { id: number; title: string };

export default function TrainingRegistrations({
    registrations,
    filters,
    courses,
    statuses,
}: {
    registrations: RegistrationRow[];
    filters: { course: number; status: string; search: string };
    courses: CourseOption[];
    statuses: Option[];
}) {
    const { t } = useLocale();
    const { flash } = usePage<SharedData>().props;
    const [search, setSearch] = useState(filters.search);
    const [course, setCourse] = useState(String(filters.course || ''));
    const [status, setStatus] = useState(filters.status);

    const apply = (event: FormEvent) => {
        event.preventDefault();
        router.get(
            '/admin/training/registrations',
            {
                search,
                course: course || undefined,
                status: status || undefined,
            },
            { preserveState: true, replace: true },
        );
    };

    const exportHref = `/admin/training/registrations/export?${new URLSearchParams({
        search,
        course,
        status,
    }).toString()}`;

    return (
        <AdminPortalLayout>
            <Head title={t('admin.training.registrations.title')} />
            <div className="space-y-6 p-6">
                <AdminPageHeader
                    title={t('admin.training.registrations.title')}
                    subtitle={t('admin.training.registrations.subtitle')}
                    actions={
                        <a
                            href={exportHref}
                            className="inline-flex items-center justify-center rounded-xl border border-[#dbe3ef] bg-white px-4 py-2.5 text-sm font-semibold text-[#0057c8]"
                        >
                            {t('admin.training.registrations.export')}
                        </a>
                    }
                />
                <TrainingSectionNav />
                {flash.success ? (
                    <div className="rounded-xl border border-[#bbf7d0] bg-[#f0fdf4] px-4 py-3 text-sm text-[#15803d]">
                        {String(flash.success)}
                    </div>
                ) : null}
                <form onSubmit={apply} className="flex flex-wrap gap-3">
                    <input
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder={t('admin.training.registrations.search')}
                        className="rounded-xl border border-[#e2e8f0] px-3 py-2 text-sm"
                    />
                    <select
                        value={course}
                        onChange={(event) => setCourse(event.target.value)}
                        className="rounded-xl border border-[#e2e8f0] px-3 py-2 text-sm"
                    >
                        <option value="">{t('admin.training.registrations.all_courses')}</option>
                        {courses.map((item) => (
                            <option key={item.id} value={item.id}>
                                {item.title}
                            </option>
                        ))}
                    </select>
                    <select
                        value={status}
                        onChange={(event) => setStatus(event.target.value)}
                        className="rounded-xl border border-[#e2e8f0] px-3 py-2 text-sm"
                    >
                        <option value="">{t('admin.training.registrations.all_statuses')}</option>
                        {statuses.map((item) => (
                            <option key={item.value} value={item.value}>
                                {item.label}
                            </option>
                        ))}
                    </select>
                    <button
                        type="submit"
                        className="rounded-xl bg-[#0057c8] px-4 py-2 text-sm font-semibold text-white"
                    >
                        {t('admin.training.registrations.filter')}
                    </button>
                </form>
                <AdminPanel className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                        <thead className="text-left text-[#64748b]">
                            <tr>
                                <th className="px-4 py-3">{t('admin.training.registrations.col.number')}</th>
                                <th className="px-4 py-3">{t('admin.training.registrations.col.name')}</th>
                                <th className="px-4 py-3">{t('admin.training.registrations.col.course')}</th>
                                <th className="px-4 py-3">{t('admin.training.registrations.col.status')}</th>
                                <th className="px-4 py-3" />
                            </tr>
                        </thead>
                        <tbody>
                            {registrations.length === 0 ? (
                                <tr>
                                    <td className="px-4 py-6 text-[#64748b]" colSpan={5}>
                                        {t('admin.training.registrations.empty')}
                                    </td>
                                </tr>
                            ) : (
                                registrations.map((registration) => (
                                    <tr key={registration.id} className="border-t border-[#e2e8f0]">
                                        <td className="px-4 py-3 font-semibold">{registration.number}</td>
                                        <td className="px-4 py-3">
                                            {registration.full_name}
                                            <p className="text-xs text-[#64748b]">{registration.email}</p>
                                        </td>
                                        <td className="px-4 py-3">{registration.course}</td>
                                        <td className="px-4 py-3">{registration.status_label}</td>
                                        <td className="px-4 py-3 text-right">
                                            <Link
                                                href={`/admin/training/registrations/${registration.id}`}
                                                className="font-semibold text-[#0057c8]"
                                            >
                                                {t('admin.training.registrations.view')}
                                            </Link>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </AdminPanel>
            </div>
        </AdminPortalLayout>
    );
}
