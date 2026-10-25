import { Form, Head, Link } from '@inertiajs/react';
import { useMemo, useState } from 'react';

import {
    RolePermissionPicker,
    type PermissionGroup,
    type PermissionOption,
} from '@/components/admin-portal/role-permission-picker';
import InputError from '@/components/input-error';
import { useLocale } from '@/hooks/use-locale';
import EmployerLayout from '@/layouts/employer-layout';

type RolePayload = {
    id: number;
    label: string;
    description: string | null;
    permissions: string[];
};

type Props = {
    role: RolePayload | null;
    permissionGroups: PermissionGroup[];
    defaultPermissions: string[];
};

export default function EmployerRoleForm({
    role,
    permissionGroups,
    defaultPermissions,
}: Props) {
    const { t } = useLocale();
    const isEdit = role !== null;
    const [search, setSearch] = useState('');
    const [selected, setSelected] = useState<string[]>(defaultPermissions);

    const title = isEdit
        ? t('employer.roles.edit_title')
        : t('employer.roles.create');

    const togglePermission = (permission: PermissionOption): void => {
        if (permission.required_for_admin) {
            return;
        }

        setSelected((current) =>
            current.includes(permission.name)
                ? current.filter((name) => name !== permission.name)
                : [...current, permission.name],
        );
    };

    const toggleGroup = (group: PermissionGroup, enabled: boolean): void => {
        const names = group.permissions.map((permission) => permission.name);

        setSelected((current) => {
            const withoutGroup = current.filter((name) => !names.includes(name));
            const required = group.permissions
                .filter((permission) => permission.required_for_admin)
                .map((permission) => permission.name);

            return enabled
                ? [...withoutGroup, ...names]
                : [...withoutGroup, ...required];
        });
    };

    const action = isEdit
        ? `/employer/roles/${role.id}`
        : '/employer/roles';

    const method = isEdit ? 'put' : 'post';

    const selectedCount = useMemo(() => selected.length, [selected]);

    return (
        <EmployerLayout title={title}>
            <Head title={title} />

            <div className="flex flex-col gap-5 px-4 py-6 sm:px-6">
                <div>
                    <Link
                        href="/employer/roles"
                        className="text-xs font-semibold text-[#0057c8]"
                    >
                        {t('employer.roles.back')}
                    </Link>
                    <h1 className="mt-2 text-2xl font-bold text-[#050315]">
                        {title}
                    </h1>
                    <p className="mt-1 text-sm text-[#475569]">
                        {t('employer.roles.form_subtitle', {
                            count: selectedCount,
                        })}
                    </p>
                </div>

                <Form action={action} method={method} className="space-y-6">
                    {({ processing, errors }) => (
                        <>
                            {selected.map((name) => (
                                <input
                                    key={name}
                                    type="hidden"
                                    name="permissions[]"
                                    value={name}
                                />
                            ))}

                            <div className="space-y-4 rounded-2xl border border-[rgba(57,119,166,0.2)] bg-white p-5">
                                <label className="block text-sm">
                                    <span className="mb-1 block font-medium text-[#050315]">
                                        {t('employer.roles.field.label')}
                                    </span>
                                    <input
                                        name="label"
                                        defaultValue={role?.label ?? ''}
                                        className="h-11 w-full rounded-xl border border-[#dbeafe] px-3"
                                    />
                                    <InputError
                                        message={errors.label}
                                        className="mt-1"
                                    />
                                </label>
                                <label className="block text-sm">
                                    <span className="mb-1 block font-medium text-[#050315]">
                                        {t('employer.roles.field.description')}
                                    </span>
                                    <textarea
                                        name="description"
                                        defaultValue={role?.description ?? ''}
                                        rows={3}
                                        className="w-full rounded-xl border border-[#dbeafe] px-3 py-2"
                                    />
                                    <InputError
                                        message={errors.description}
                                        className="mt-1"
                                    />
                                </label>
                            </div>

                            <div className="space-y-4 rounded-2xl border border-[rgba(57,119,166,0.2)] bg-white p-5">
                                <div className="flex flex-wrap items-center justify-between gap-3">
                                    <h2 className="text-sm font-bold text-[#050315]">
                                        {t('employer.roles.permissions')}
                                    </h2>
                                    <input
                                        value={search}
                                        onChange={(event) =>
                                            setSearch(event.target.value)
                                        }
                                        placeholder={t(
                                            'employer.roles.search_permissions',
                                        )}
                                        className="h-10 w-full max-w-xs rounded-xl border border-[#dbeafe] px-3 text-sm"
                                    />
                                </div>
                                <InputError
                                    message={
                                        errors.permissions ??
                                        errors['permissions.0']
                                    }
                                />
                                <RolePermissionPicker
                                    groups={permissionGroups}
                                    selected={selected}
                                    search={search}
                                    lockRequired
                                    onToggle={togglePermission}
                                    onGroupToggle={toggleGroup}
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={processing}
                                className="inline-flex h-11 cursor-pointer items-center rounded-xl bg-[#0057c8] px-5 text-sm font-semibold text-white disabled:opacity-60"
                            >
                                {isEdit
                                    ? t('employer.roles.save')
                                    : t('employer.roles.create')}
                            </button>
                        </>
                    )}
                </Form>
            </div>
        </EmployerLayout>
    );
}
