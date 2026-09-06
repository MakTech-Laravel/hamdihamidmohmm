import { Form, Head, usePage } from '@inertiajs/react';

import { AdminIcon } from '@/components/admin-icon';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PasswordInput } from '@/components/ui/password-input';
import { useLocale } from '@/hooks/use-locale';
import AdminPortalLayout from '@/layouts/admin-portal-layout';
import type { SharedData } from '@/types';

type AdminRow = {
    id: number;
    name: string;
    email: string;
    role: number;
    role_label: string;
    created_at: string | null;
};

export default function AdminManagement({
    admins,
}: {
    admins: AdminRow[];
    canCreateAdmins: boolean;
}) {
    const { flash } = usePage<SharedData>().props;
    const { t } = useLocale();

    return (
        <AdminPortalLayout>
            <Head title={t('admin.admins.title')} />

            <div className="space-y-6 p-6">
                <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#3977a6]">
                        {t('admin.admins.super_admin_badge')}
                    </p>
                    <h1 className="mt-2 text-[28px] font-extrabold tracking-tight text-[#050315]">
                        {t('admin.admins.title')}
                    </h1>
                    <p className="mt-2 max-w-2xl text-sm text-[#3977a6]">
                        {t('admin.admins.subtitle')}
                    </p>
                </div>

                {flash.success && (
                    <div className="rounded-xl border border-[#bbf7d0] bg-[#f0fdf4] px-4 py-3 text-sm text-[#15803d]">
                        {typeof flash.success === 'string'
                            ? flash.success
                            : t('admin.admins.created')}
                    </div>
                )}

                <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
                    <div className="rounded-2xl border border-[#e2e8f0] bg-white p-6 shadow-[0px_1px_3px_rgba(0,0,0,0.06)]">
                        <div className="mb-5 flex items-center gap-2">
                            <AdminIcon
                                src="/images/admin/nav-admins.svg"
                                size={16}
                                tint
                                className="text-[#0057c8]"
                            />
                            <h2 className="text-lg font-bold text-[#101828]">
                                {t('admin.admins.create')}
                            </h2>
                        </div>

                        <Form
                            action="/admin/admins"
                            method="post"
                            className="space-y-4"
                            resetOnSuccess
                        >
                            {({ processing, errors }) => (
                                <>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="name">
                                            {t('admin.admins.fields.full_name')}
                                        </Label>
                                        <Input
                                            id="name"
                                            name="name"
                                            required
                                            className="rounded-xl"
                                            placeholder={t(
                                                'admin.admins.fields.name_placeholder',
                                            )}
                                        />
                                        <InputError message={errors.name} />
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label htmlFor="email">
                                            {t('admin.admins.fields.email')}
                                        </Label>
                                        <Input
                                            id="email"
                                            type="email"
                                            name="email"
                                            required
                                            className="rounded-xl"
                                            placeholder={t('admin.admins.fields.email_placeholder')}
                                        />
                                        <InputError message={errors.email} />
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label htmlFor="password">
                                            {t('admin.admins.fields.password')}
                                        </Label>
                                        <PasswordInput
                                            id="password"
                                            name="password"
                                            required
                                            className="rounded-xl"
                                        />
                                        <InputError message={errors.password} />
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label htmlFor="password_confirmation">
                                            {t(
                                                'admin.admins.fields.confirm_password',
                                            )}
                                        </Label>
                                        <PasswordInput
                                            id="password_confirmation"
                                            name="password_confirmation"
                                            required
                                            className="rounded-xl"
                                        />
                                    </div>

                                    <Button
                                        type="submit"
                                        disabled={processing}
                                        className="w-full rounded-xl bg-[#0057c8] text-white hover:bg-[#0046a3]"
                                    >
                                        {processing
                                            ? t('common.creating')
                                            : t('admin.admins.create')}
                                    </Button>
                                </>
                            )}
                        </Form>
                    </div>

                    <div className="rounded-2xl border border-[#e2e8f0] bg-white p-6 shadow-[0px_1px_3px_rgba(0,0,0,0.06)]">
                        <div className="mb-5 flex items-center gap-2">
                            <AdminIcon
                                src="/images/admin/nav-job-seekers.svg"
                                size={16}
                                tint
                                className="text-[#0057c8]"
                            />
                            <h2 className="text-lg font-bold text-[#101828]">
                                {t('admin.admins.list_title')}
                            </h2>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="min-w-full text-left text-sm">
                                <thead className="border-b border-[#e2e8f0] text-[#64748b]">
                                    <tr>
                                        <th className="px-3 py-2 font-semibold">
                                            {t('common.name')}
                                        </th>
                                        <th className="px-3 py-2 font-semibold">
                                            {t('admin.admins.fields.email')}
                                        </th>
                                        <th className="px-3 py-2 font-semibold">
                                            {t('admin.admins.fields.role')}
                                        </th>
                                        <th className="px-3 py-2 font-semibold">
                                            {t('common.created')}
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {admins.map((admin) => (
                                        <tr
                                            key={admin.id}
                                            className="border-b border-[#f1f5f9]"
                                        >
                                            <td className="px-3 py-3 font-medium text-[#101828]">
                                                {admin.name}
                                            </td>
                                            <td className="px-3 py-3 text-[#64748b]">
                                                {admin.email}
                                            </td>
                                            <td className="px-3 py-3">
                                                <span className="rounded-full bg-[#eff6ff] px-2.5 py-1 text-xs font-semibold text-[#1d4ed8]">
                                                    {admin.role_label}
                                                </span>
                                            </td>
                                            <td className="px-3 py-3 text-[#99a1af]">
                                                {admin.created_at ?? '—'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </AdminPortalLayout>
    );
}
