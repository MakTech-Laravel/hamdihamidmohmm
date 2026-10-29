import { Head, Link, usePage } from '@inertiajs/react';

import { TrainingSectionNav } from '@/components/admin-portal/training-section-nav';
import {
    AdminPageHeader,
    AdminPagination,
    AdminPanel,
} from '@/components/admin-portal/ui';
import {
    MobileListCard,
    MobileListCardActions,
    MobileListCardHeader,
    MobileListCardMeta,
    MobileListEmpty,
} from '@/components/mobile-list-card';
import type { PortalPaginator } from '@/components/portal-pagination';
import { useLocale } from '@/hooks/use-locale';
import AdminPortalLayout from '@/layouts/admin-portal-layout';
import type { SharedData } from '@/types';

type CourseRow = {
    id: number;
    title: string;
    starts_on: string | null;
    registration_deadline: string | null;
    seats: number;
    available_seats: number;
    registrations_count: number;
    is_published: boolean;
};

export default function TrainingCourses({
    courses: coursesPage,
}: {
    courses: PortalPaginator<CourseRow>;
}) {
    const { t } = useLocale();
    const { flash } = usePage<SharedData>().props;
    const courses = coursesPage.data;

    return (
        <AdminPortalLayout>
            <Head title={t('admin.training.courses.title')} />
            <div className="space-y-6 p-6">
                <AdminPageHeader
                    title={t('admin.training.courses.title')}
                    subtitle={t('admin.training.courses.subtitle')}
                    actions={
                        <Link
                            href="/admin/training/courses/create"
                            className="inline-flex items-center justify-center rounded-xl bg-[#0057c8] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#0046a3]"
                        >
                            {t('admin.training.courses.create')}
                        </Link>
                    }
                />
                <TrainingSectionNav />
                {flash.success ? (
                    <div className="rounded-xl border border-[#bbf7d0] bg-[#f0fdf4] px-4 py-3 text-sm text-[#15803d]">
                        {String(flash.success)}
                    </div>
                ) : null}
                <AdminPanel>
                    {courses.length === 0 ? (
                        <MobileListEmpty>
                            {t('admin.training.courses.empty')}
                        </MobileListEmpty>
                    ) : (
                        <div className="space-y-3 md:hidden">
                            {courses.map((course) => (
                                <MobileListCard key={course.id}>
                                    <MobileListCardHeader
                                        title={course.title}
                                        subtitle={t(
                                            'admin.training.courses.registrations',
                                            {
                                                count: course.registrations_count,
                                            },
                                        )}
                                        badge={
                                            <span className="rounded-full bg-[#eff6ff] px-2 py-0.5 text-[11px] font-semibold text-[#1d4ed8]">
                                                {course.is_published
                                                    ? t(
                                                          'admin.training.courses.published',
                                                      )
                                                    : t(
                                                          'admin.training.courses.draft',
                                                      )}
                                            </span>
                                        }
                                    />
                                    <MobileListCardMeta
                                        items={[
                                            {
                                                label: t(
                                                    'admin.training.courses.col.dates',
                                                ),
                                                value: course.starts_on,
                                            },
                                            {
                                                label: t(
                                                    'admin.training.courses.col.seats',
                                                ),
                                                value: `${course.available_seats} / ${course.seats}`,
                                            },
                                        ]}
                                    />
                                    <MobileListCardActions
                                        primary={
                                            <Link
                                                href={`/admin/training/courses/${course.id}/edit`}
                                                className="inline-flex h-9 w-full items-center justify-center rounded-xl bg-[#0057c8] px-3 text-xs font-semibold text-white"
                                            >
                                                {t(
                                                    'admin.training.courses.edit',
                                                )}
                                            </Link>
                                        }
                                    />
                                </MobileListCard>
                            ))}
                        </div>
                    )}

                    <div className="hidden overflow-x-auto md:block">
                        <table className="min-w-full text-sm">
                            <thead className="text-left text-[#64748b]">
                                <tr>
                                    <th className="px-4 py-3">
                                        {t('admin.training.courses.col.title')}
                                    </th>
                                    <th className="px-4 py-3">
                                        {t('admin.training.courses.col.dates')}
                                    </th>
                                    <th className="px-4 py-3">
                                        {t('admin.training.courses.col.seats')}
                                    </th>
                                    <th className="px-4 py-3">
                                        {t('admin.training.courses.col.status')}
                                    </th>
                                    <th className="px-4 py-3" />
                                </tr>
                            </thead>
                            <tbody>
                                {courses.length === 0 ? (
                                    <tr>
                                        <td
                                            className="px-4 py-6 text-[#64748b]"
                                            colSpan={5}
                                        >
                                            {t('admin.training.courses.empty')}
                                        </td>
                                    </tr>
                                ) : (
                                    courses.map((course) => (
                                        <tr
                                            key={course.id}
                                            className="border-t border-[#e2e8f0]"
                                        >
                                            <td className="px-4 py-3 font-semibold text-[#050315]">
                                                {course.title}
                                                <p className="text-xs font-normal text-[#64748b]">
                                                    {t(
                                                        'admin.training.courses.registrations',
                                                        {
                                                            count: course.registrations_count,
                                                        },
                                                    )}
                                                </p>
                                            </td>
                                            <td className="px-4 py-3 text-[#4a5565]">
                                                {course.starts_on}
                                                <p className="text-xs text-[#64748b]">
                                                    {
                                                        course.registration_deadline
                                                    }
                                                </p>
                                            </td>
                                            <td className="px-4 py-3 text-[#4a5565]">
                                                {course.available_seats} /{' '}
                                                {course.seats}
                                            </td>
                                            <td className="px-4 py-3">
                                                {course.is_published
                                                    ? t(
                                                          'admin.training.courses.published',
                                                      )
                                                    : t(
                                                          'admin.training.courses.draft',
                                                      )}
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <Link
                                                    href={`/admin/training/courses/${course.id}/edit`}
                                                    className="font-semibold text-[#0057c8]"
                                                >
                                                    {t(
                                                        'admin.training.courses.edit',
                                                    )}
                                                </Link>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                    <AdminPagination
                        showingLabel={t('common.showing_range', {
                            from: coursesPage.from ?? 0,
                            to: coursesPage.to ?? 0,
                            total: coursesPage.total,
                        })}
                        links={coursesPage.links}
                    />
                </AdminPanel>
            </div>
        </AdminPortalLayout>
    );
}
