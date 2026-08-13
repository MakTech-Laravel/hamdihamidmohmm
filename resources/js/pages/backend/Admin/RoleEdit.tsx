import { Form, Head, Link } from '@inertiajs/react';
import { useMemo, useState } from 'react';

import { AdminIcon } from '@/components/admin-icon';
import InputError from '@/components/input-error';
import {
    RolePermissionPicker,
    type PermissionGroup,
    type PermissionOption,
} from '@/components/admin-portal/role-permission-picker';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import AdminPortalLayout from '@/layouts/admin-portal-layout';

type ManagedRole = {
    id: number;
    value: string;
    label: string;
    description: string | null;
    permissions: string[];
    kind: 'admin-panel' | 'portal';
};

type Props = {
    managedRole: ManagedRole;
    permissionGroups: PermissionGroup[];
};

export default function RoleEdit({ managedRole, permissionGroups }: Props) {
    const lockRequired = managedRole.kind !== 'portal';
    const allPermissionNames = useMemo(
        () =>
            permissionGroups.flatMap((group) =>
                group.permissions.map((permission) => permission.name),
            ),
        [permissionGroups],
    );
    const [search, setSearch] = useState('');
    const [selected, setSelected] = useState<string[]>(managedRole.permissions);

    const togglePermission = (permission: PermissionOption): void => {
        if (lockRequired && permission.required_for_admin) {
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
            const required = lockRequired
                ? group.permissions
                      .filter((permission) => permission.required_for_admin)
                      .map((permission) => permission.name)
                : [];

            return enabled
                ? [...withoutGroup, ...names]
                : [...withoutGroup, ...required];
        });
    };

    return (
        <AdminPortalLayout>
            <Head title={`Edit ${managedRole.label}`} />

            <div className="space-y-6 p-6">
                <div>
                    <Link
                        href={`/admin/roles-permissions/${managedRole.id}`}
                        className="text-xs font-semibold text-[#0057c8]"
                    >
                        ← Role details
                    </Link>
                    <h1 className="mt-2 text-[28px] font-extrabold tracking-tight text-[#050315]">
                        Edit {managedRole.label}
                    </h1>
                    <p className="mt-1 text-sm text-[#3977a6]">
                        Update the role name and choose which modules it can
                        access.
                    </p>
                </div>

                <Form
                    action={`/admin/roles-permissions/${managedRole.id}`}
                    method="put"
                    className="space-y-6"
                >
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

                            <div className="rounded-2xl border border-[#e2e8f0] bg-white p-5 shadow-[0px_1px_3px_rgba(0,0,0,0.06)]">
                                <h2 className="mb-4 text-base font-bold text-[#101828]">
                                    Role details
                                </h2>
                                <div className="space-y-4">
                                    <div className="space-y-1.5">
                                        <Label htmlFor="label">Role name</Label>
                                        <Input
                                            id="label"
                                            name="label"
                                            defaultValue={managedRole.label}
                                            className="rounded-xl"
                                        />
                                        <InputError message={errors.label} />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="description">
                                            Description
                                        </Label>
                                        <Textarea
                                            id="description"
                                            name="description"
                                            defaultValue={
                                                managedRole.description ?? ''
                                            }
                                            className="min-h-24 rounded-xl"
                                        />
                                        <InputError
                                            message={errors.description}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="rounded-2xl border border-[#e2e8f0] bg-white p-5 shadow-[0px_1px_3px_rgba(0,0,0,0.06)]">
                                <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                                    <div className="flex items-start gap-2">
                                        <AdminIcon
                                            src="/images/admin/nav-verification.svg"
                                            size={16}
                                            tint
                                            className="mt-0.5 text-[#0057c8]"
                                        />
                                        <div>
                                            <h2 className="text-base font-bold text-[#101828]">
                                                Permissions
                                            </h2>
                                            <p className="text-xs text-[#99a1af]">
                                                {lockRequired
                                                    ? 'Access Admin Panel stays required for this role.'
                                                    : 'Turn modules on only if this portal role should use them.'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        <Input
                                            value={search}
                                            onChange={(event) =>
                                                setSearch(event.target.value)
                                            }
                                            placeholder="Search permissions…"
                                            className="w-full rounded-xl sm:w-56"
                                        />
                                        <Button
                                            type="button"
                                            variant="outline"
                                            className="rounded-xl"
                                            onClick={() =>
                                                setSelected(allPermissionNames)
                                            }
                                        >
                                            Enable all
                                        </Button>
                                    </div>
                                </div>
                                <RolePermissionPicker
                                    groups={permissionGroups}
                                    selected={selected}
                                    lockRequired={lockRequired}
                                    search={search}
                                    onToggle={togglePermission}
                                    onGroupToggle={toggleGroup}
                                />
                            </div>

                            <Button
                                type="submit"
                                disabled={processing}
                                className="rounded-xl bg-[#0057c8] text-white hover:bg-[#0046a3]"
                            >
                                {processing ? 'Saving…' : 'Save role'}
                            </Button>
                        </>
                    )}
                </Form>
            </div>
        </AdminPortalLayout>
    );
}
