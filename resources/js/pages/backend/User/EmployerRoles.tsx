import { Head, Link, router } from '@inertiajs/react';

import {
    MobileListCard,
    MobileListCardActions,
    MobileListCardHeader,
    MobileListCardMeta,
    MobileListEmpty,
    MobileListStack,
} from '@/components/mobile-list-card';
import { useLocale } from '@/hooks/use-locale';
import EmployerLayout from '@/layouts/employer-layout';

type RoleRow = {
    id: number;
    value: string;
    label: string;
    description: string | null;
    users_count: number;
    permissions: string[];
    can_delete: boolean;
};

type Props = {
    roles: RoleRow[];
};

export default function EmployerRoles({ roles }: Props) {
    const { t } = useLocale();

    return (
        <EmployerLayout title={t('employer.roles.title')}>
            <Head title={t('employer.roles.title')} />

            <div className="flex flex-col gap-5 px-4 py-6 sm:px-6">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl leading-9 font-bold text-[#050315]">
                            {t('employer.roles.title')}
                        </h1>
                        <p className="mt-1 text-sm leading-[21px] text-[#475569]">
                            {t('employer.roles.subtitle')}
                        </p>
                    </div>
                    <Link
                        href="/employer/roles/create"
                        className="inline-flex cursor-pointer items-center rounded-xl bg-[#0057c8] px-6 py-3 text-base font-medium text-white"
                    >
                        {t('employer.roles.create')}
                    </Link>
                </div>

                {roles.length === 0 ? (
                    <MobileListEmpty>
                        {t('employer.roles.empty')}
                    </MobileListEmpty>
                ) : (
                    <MobileListStack>
                        {roles.map((role) => (
                            <MobileListCard key={role.id}>
                                <MobileListCardHeader
                                    title={role.label}
                                    subtitle={role.description || undefined}
                                />
                                <MobileListCardMeta
                                    items={[
                                        {
                                            label: t(
                                                'employer.roles.col.members',
                                            ),
                                            value: String(role.users_count),
                                        },
                                        {
                                            label: t(
                                                'employer.roles.col.permissions',
                                            ),
                                            value: String(
                                                role.permissions.length,
                                            ),
                                        },
                                    ]}
                                />
                                <MobileListCardActions
                                    primary={
                                        <Link
                                            href={`/employer/roles/${role.id}/edit`}
                                            className="inline-flex h-9 w-full items-center justify-center rounded-xl bg-[#0057c8] px-3 text-xs font-semibold text-white"
                                        >
                                            {t('common.edit')}
                                        </Link>
                                    }
                                    moreItems={
                                        role.can_delete
                                            ? [
                                                  {
                                                      key: 'delete',
                                                      label: t(
                                                          'common.delete',
                                                      ),
                                                      destructive: true,
                                                      onSelect: () => {
                                                          if (
                                                              !window.confirm(
                                                                  t(
                                                                      'employer.roles.delete_confirm',
                                                                  ),
                                                              )
                                                          ) {
                                                              return;
                                                          }

                                                          router.delete(
                                                              `/employer/roles/${role.id}`,
                                                          );
                                                      },
                                                  },
                                              ]
                                            : []
                                    }
                                />
                            </MobileListCard>
                        ))}
                    </MobileListStack>
                )}

                <div className="hidden overflow-x-auto rounded-2xl border border-[rgba(57,119,166,0.2)] bg-white md:block">
                    <table className="min-w-full text-left text-sm">
                        <thead className="border-b border-[rgba(57,119,166,0.15)] bg-[#f8faff] text-xs font-semibold tracking-wide text-[#475569] uppercase">
                            <tr>
                                <th className="px-4 py-3">
                                    {t('employer.roles.col.role')}
                                </th>
                                <th className="px-4 py-3">
                                    {t('employer.roles.col.members')}
                                </th>
                                <th className="px-4 py-3">
                                    {t('employer.roles.col.permissions')}
                                </th>
                                <th className="px-4 py-3">
                                    {t('common.actions')}
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {roles.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={4}
                                        className="px-4 py-10 text-center text-[#64748b]"
                                    >
                                        {t('employer.roles.empty')}
                                    </td>
                                </tr>
                            ) : (
                                roles.map((role) => (
                                    <tr
                                        key={role.id}
                                        className="border-b border-[rgba(57,119,166,0.1)] last:border-0"
                                    >
                                        <td className="px-4 py-3">
                                            <p className="font-medium text-[#050315]">
                                                {role.label}
                                            </p>
                                            {role.description ? (
                                                <p className="mt-0.5 text-xs text-[#64748b]">
                                                    {role.description}
                                                </p>
                                            ) : null}
                                        </td>
                                        <td className="px-4 py-3 text-[#475569]">
                                            {role.users_count}
                                        </td>
                                        <td className="px-4 py-3 text-[#475569]">
                                            {role.permissions.length}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex flex-wrap gap-3">
                                                <Link
                                                    href={`/employer/roles/${role.id}/edit`}
                                                    className="text-xs font-semibold text-[#0057c8]"
                                                >
                                                    {t('common.edit')}
                                                </Link>
                                                {role.can_delete ? (
                                                    <button
                                                        type="button"
                                                        className="text-xs font-semibold text-[#b91c1c]"
                                                        onClick={() => {
                                                            if (
                                                                window.confirm(
                                                                    t(
                                                                        'employer.roles.delete_confirm',
                                                                    ),
                                                                )
                                                            ) {
                                                                router.delete(
                                                                    `/employer/roles/${role.id}`,
                                                                );
                                                            }
                                                        }}
                                                    >
                                                        {t('common.delete')}
                                                    </button>
                                                ) : null}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </EmployerLayout>
    );
}
