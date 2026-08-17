import { Head, router, useForm, usePage } from '@inertiajs/react';
import { Download, FileSpreadsheet, Trash2 } from 'lucide-react';

import {
    AdminPageHeader,
    AdminPanel,
    AdminPrimaryButton,
    AdminTableShell,
} from '@/components/admin-portal/ui';
import { NativeSelect } from '@/components/ui/native-select';
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
    reports: ReportRow[];
    modules: string[];
};

export default function ReportsAnalytics({ reports, modules }: Props) {
    const { flash } = usePage<SharedData>().props;
    const form = useForm({ module: modules[0] ?? 'users' });

    return (
        <AdminPortalLayout>
            <Head title="Reports & Analytics" />

            <div className="space-y-6 p-6">
                <AdminPageHeader
                    title="Reports & Analytics"
                    subtitle="Generate CSV exports from live platform data."
                />

                {flash.success && (
                    <div className="rounded-xl border border-[#bbf7d0] bg-[#f0fdf4] px-4 py-3 text-sm text-[#15803d]">
                        {typeof flash.success === 'string'
                            ? flash.success
                            : 'Saved successfully.'}
                    </div>
                )}

                <AdminPanel className="flex flex-col gap-3 sm:flex-row sm:items-end">
                    <label className="flex-1 text-sm font-semibold text-[#3977a6]">
                        Module
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
                        Build report
                    </AdminPrimaryButton>
                </AdminPanel>

                <AdminPanel>
                    <AdminTableShell
                        headers={[
                            'Name',
                            'Module',
                            'Format',
                            'Generated',
                            'By',
                            'Actions',
                        ]}
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
                            No reports generated yet.
                        </p>
                    )}
                </AdminPanel>
            </div>
        </AdminPortalLayout>
    );
}
