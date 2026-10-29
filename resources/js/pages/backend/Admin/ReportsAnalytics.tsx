import { Head, router, useForm, usePage } from '@inertiajs/react';
import { Download, FileSpreadsheet, Trash2 } from 'lucide-react';

import {
    AdminPageHeader,
    AdminPagination,
    AdminPanel,
    AdminPrimaryButton,
    AdminTableShell,
} from '@/components/admin-portal/ui';
import {
    MobileListCard,
    MobileListCardActions,
    MobileListCardHeader,
    MobileListCardMeta,
} from '@/components/mobile-list-card';
import type { PortalPaginator } from '@/components/portal-pagination';
import { NativeSelect } from '@/components/ui/native-select';
import { useLocale } from '@/hooks/use-locale';
import AdminPortalLayout from '@/layouts/admin-portal-layout';
import type { SharedData } from '@/types';

type ReportRow = {
    id: number;
    name: string;
    module: string;
    format: string;
    generated_at: string | null;
    generated_by: string | null;
};

type Props = {
    reports: PortalPaginator<ReportRow>;
    modules: string[];
};

export default function ReportsAnalytics({
    reports: reportsPage,
    modules,
}: Props) {
    const { flash } = usePage<SharedData>().props;
    const { t } = useLocale();
    const reports = reportsPage.data;
    const form = useForm({ module: modules[0] ?? 'users' });

    return (
        <AdminPortalLayout>
            <Head title={t('admin.reports.title')} />

            <div className="space-y-6 p-6">
                <AdminPageHeader
                    title={t('admin.reports.title')}
                    subtitle={t('admin.reports.subtitle')}
                />

                {flash.success && (
                    <div className="rounded-xl border border-[#bbf7d0] bg-[#f0fdf4] px-4 py-3 text-sm text-[#15803d]">
                        {typeof flash.success === 'string'
                            ? flash.success
                            : t('common.saved')}
                    </div>
                )}

                <AdminPanel className="flex flex-col gap-3 sm:flex-row sm:items-end">
                    <label className="flex-1 text-sm font-semibold text-[#3977a6]">
                        {t('admin.reports.module')}
                        <NativeSelect
                            className="mt-1 w-full rounded-xl border border-[#e2e8f0] bg-[#f8faff] px-3 py-2.5 text-sm text-[#050315]"
                            value={form.data.module}
                            onChange={(event) =>
                                form.setData('module', event.target.value)
                            }
                        >
                            {modules.map((module) => (
                                <option key={module} value={module}>
                                    {module.replace('_', ' ')}
                                </option>
                            ))}
                        </NativeSelect>
                    </label>
                    <AdminPrimaryButton
                        onClick={() => form.post('/admin/reports')}
                    >
                        <FileSpreadsheet className="size-4" />
                        {t('admin.reports.build')}
                    </AdminPrimaryButton>
                </AdminPanel>

                <AdminPanel>
                    <AdminTableShell
                        headers={[
                            t('admin.reports.cols.name'),
                            t('admin.reports.cols.module'),
                            t('admin.reports.cols.format'),
                            t('admin.reports.cols.generated'),
                            t('admin.reports.cols.by'),
                            t('admin.reports.cols.actions'),
                        ]}
                        mobileCards={
                            <div className="space-y-3">
                                {reports.map((report) => (
                                    <MobileListCard key={report.id}>
                                        <MobileListCardHeader
                                            title={report.name}
                                            subtitle={report.module}
                                        />
                                        <MobileListCardMeta
                                            items={[
                                                {
                                                    label: t(
                                                        'admin.reports.cols.format',
                                                    ),
                                                    value: report.format.toUpperCase(),
                                                },
                                                {
                                                    label: t(
                                                        'admin.reports.cols.generated',
                                                    ),
                                                    value: report.generated_at,
                                                },
                                                {
                                                    label: t(
                                                        'admin.reports.cols.by',
                                                    ),
                                                    value: report.generated_by,
                                                },
                                            ]}
                                        />
                                        <MobileListCardActions
                                            primary={
                                                <a
                                                    href={`/admin/reports/${report.id}/download`}
                                                    className="inline-flex h-9 w-full items-center justify-center rounded-xl bg-[#0057c8] px-3 text-xs font-semibold text-white"
                                                >
                                                    {t('common.download')}
                                                </a>
                                            }
                                            moreItems={[
                                                {
                                                    key: 'delete',
                                                    label: t('common.delete'),
                                                    onSelect: () =>
                                                        router.delete(
                                                            `/admin/reports/${report.id}`,
                                                        ),
                                                    destructive: true,
                                                },
                                            ]}
                                        />
                                    </MobileListCard>
                                ))}
                            </div>
                        }
                    >
                        {reports.map((report) => (
                            <tr
                                key={report.id}
                                className="border-b border-[#e2e8f0] last:border-0"
                            >
                                <td className="px-3 py-3 font-semibold">
                                    {report.name}
                                </td>
                                <td className="px-3 py-3 text-[#64748b]">
                                    {report.module}
                                </td>
                                <td className="px-3 py-3 text-[#64748b]">
                                    {report.format.toUpperCase()}
                                </td>
                                <td className="px-3 py-3 text-[#64748b]">
                                    {report.generated_at}
                                </td>
                                <td className="px-3 py-3 text-[#64748b]">
                                    {report.generated_by}
                                </td>
                                <td className="px-3 py-3">
                                    <div className="flex gap-2">
                                        <a
                                            href={`/admin/reports/${report.id}/download`}
                                            className="flex size-8 items-center justify-center rounded-lg border border-[#e2e8f0] text-[#64748b]"
                                        >
                                            <Download className="size-4" />
                                        </a>
                                        <button
                                            type="button"
                                            className="flex size-8 items-center justify-center rounded-lg border border-[#fee2e2] text-[#991b1b]"
                                            onClick={() =>
                                                router.delete(
                                                    `/admin/reports/${report.id}`,
                                                )
                                            }
                                        >
                                            <Trash2 className="size-4" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </AdminTableShell>
                    {reports.length === 0 && (
                        <p className="mt-6 text-center text-sm text-[#99a1af]">
                            {t('admin.reports.empty')}
                        </p>
                    )}
                    <AdminPagination
                        showingLabel={t('common.showing_range', {
                            from: reportsPage.from ?? 0,
                            to: reportsPage.to ?? 0,
                            total: reportsPage.total,
                        })}
                        links={reportsPage.links}
                    />
                </AdminPanel>
            </div>
        </AdminPortalLayout>
    );
}
