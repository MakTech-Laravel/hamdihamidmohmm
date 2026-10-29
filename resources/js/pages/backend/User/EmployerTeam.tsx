import { Head, router, useForm } from '@inertiajs/react';
import { useState, type FormEvent } from 'react';

import {
    MobileListCard,
    MobileListCardActions,
    MobileListCardHeader,
    MobileListEmpty,
    MobileListStack,
} from '@/components/mobile-list-card';
import { useLocale } from '@/hooks/use-locale';
import EmployerLayout from '@/layouts/employer-layout';
import { employerListRowBg } from '@/lib/employer-list-row';
import { cn } from '@/lib/utils';

type Member = {
    id: number;
    name: string;
    email: string;
    role: string | null;
    role_label: string;
    created_at: string | null;
};

type RoleOption = {
    value: string;
    label: string;
};

type Props = {
    members: Member[];
    roleOptions: RoleOption[];
};

export default function EmployerTeam({ members, roleOptions }: Props) {
    const { t } = useLocale();
    const [showInvite, setShowInvite] = useState(false);
    const form = useForm({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
        role: roleOptions[0]?.value ?? '',
    });

    const submit = (event: FormEvent): void => {
        event.preventDefault();
        form.post('/employer/team', {
            onSuccess: () => {
                form.reset();
                setShowInvite(false);
            },
        });
    };

    return (
        <EmployerLayout title={t('employer.team.title')}>
            <Head title={t('employer.team.title')} />

            <div className="flex flex-col gap-5 px-4 py-6 sm:px-6">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl leading-9 font-bold text-[#050315]">
                            {t('employer.team.title')}
                        </h1>
                        <p className="mt-1 text-sm leading-[21px] text-[#475569]">
                            {t('employer.team.subtitle')}
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={() => setShowInvite((open) => !open)}
                        className="inline-flex cursor-pointer items-center rounded-xl bg-[#0057c8] px-6 py-3 text-base font-medium text-white"
                    >
                        {t('employer.team.invite')}
                    </button>
                </div>

                {showInvite ? (
                    <form
                        onSubmit={submit}
                        className="space-y-4 rounded-2xl border border-[rgba(57,119,166,0.2)] bg-white p-5"
                    >
                        <div className="grid gap-4 sm:grid-cols-2">
                            <label className="block text-sm">
                                <span className="mb-1 block font-medium text-[#050315]">
                                    {t('employer.team.field.name')}
                                </span>
                                <input
                                    value={form.data.name}
                                    onChange={(event) =>
                                        form.setData('name', event.target.value)
                                    }
                                    className="h-11 w-full rounded-xl border border-[#dbeafe] px-3"
                                />
                                {form.errors.name ? (
                                    <span className="mt-1 block text-xs text-[#b91c1c]">
                                        {form.errors.name}
                                    </span>
                                ) : null}
                            </label>
                            <label className="block text-sm">
                                <span className="mb-1 block font-medium text-[#050315]">
                                    {t('employer.team.field.email')}
                                </span>
                                <input
                                    type="email"
                                    value={form.data.email}
                                    onChange={(event) =>
                                        form.setData('email', event.target.value)
                                    }
                                    className="h-11 w-full rounded-xl border border-[#dbeafe] px-3"
                                />
                                {form.errors.email ? (
                                    <span className="mt-1 block text-xs text-[#b91c1c]">
                                        {form.errors.email}
                                    </span>
                                ) : null}
                            </label>
                            <label className="block text-sm">
                                <span className="mb-1 block font-medium text-[#050315]">
                                    {t('employer.team.field.password')}
                                </span>
                                <input
                                    type="password"
                                    value={form.data.password}
                                    onChange={(event) =>
                                        form.setData(
                                            'password',
                                            event.target.value,
                                        )
                                    }
                                    className="h-11 w-full rounded-xl border border-[#dbeafe] px-3"
                                />
                                {form.errors.password ? (
                                    <span className="mt-1 block text-xs text-[#b91c1c]">
                                        {form.errors.password}
                                    </span>
                                ) : null}
                            </label>
                            <label className="block text-sm">
                                <span className="mb-1 block font-medium text-[#050315]">
                                    {t(
                                        'employer.team.field.password_confirmation',
                                    )}
                                </span>
                                <input
                                    type="password"
                                    value={form.data.password_confirmation}
                                    onChange={(event) =>
                                        form.setData(
                                            'password_confirmation',
                                            event.target.value,
                                        )
                                    }
                                    className="h-11 w-full rounded-xl border border-[#dbeafe] px-3"
                                />
                            </label>
                            <label className="block text-sm sm:col-span-2">
                                <span className="mb-1 block font-medium text-[#050315]">
                                    {t('employer.team.field.role')}
                                </span>
                                {roleOptions.length === 0 ? (
                                    <p className="rounded-xl border border-dashed border-[#dbeafe] px-3 py-3 text-sm text-[#475569]">
                                        {t('employer.team.no_roles')}
                                    </p>
                                ) : (
                                    <select
                                        value={form.data.role}
                                        onChange={(event) =>
                                            form.setData(
                                                'role',
                                                event.target.value,
                                            )
                                        }
                                        className="h-11 w-full rounded-xl border border-[#dbeafe] px-3"
                                    >
                                        {roleOptions.map((option) => (
                                            <option
                                                key={option.value}
                                                value={option.value}
                                            >
                                                {option.label}
                                            </option>
                                        ))}
                                    </select>
                                )}
                                {form.errors.role ? (
                                    <span className="mt-1 block text-xs text-[#b91c1c]">
                                        {form.errors.role}
                                    </span>
                                ) : null}
                            </label>
                        </div>
                        <button
                            type="submit"
                            disabled={
                                form.processing || roleOptions.length === 0
                            }
                            className="inline-flex h-11 cursor-pointer items-center rounded-xl bg-[#0057c8] px-5 text-sm font-semibold text-white disabled:opacity-60"
                        >
                            {t('employer.team.submit')}
                        </button>
                    </form>
                ) : null}

                {members.length === 0 ? (
                    <MobileListEmpty>
                        {t('employer.team.empty')}
                    </MobileListEmpty>
                ) : (
                    <MobileListStack>
                        {members.map((member) => (
                            <MobileListCard key={member.id}>
                                <MobileListCardHeader
                                    title={member.name}
                                    subtitle={member.email}
                                />
                                <label className="mt-3 block text-xs font-semibold text-[#64748b]">
                                    {t('employer.team.col.role')}
                                    <select
                                        value={member.role ?? ''}
                                        onChange={(event) =>
                                            router.put(
                                                `/employer/team/${member.id}`,
                                                {
                                                    role: event.target.value,
                                                },
                                                {
                                                    preserveScroll: true,
                                                },
                                            )
                                        }
                                        className="mt-1 h-9 w-full rounded-lg border border-[#dbeafe] px-2 text-sm font-medium text-[#050315]"
                                    >
                                        {roleOptions.map((option) => (
                                            <option
                                                key={option.value}
                                                value={option.value}
                                            >
                                                {option.label}
                                            </option>
                                        ))}
                                    </select>
                                </label>
                                <MobileListCardActions
                                    moreItems={[
                                        {
                                            key: 'remove',
                                            label: t('common.remove'),
                                            destructive: true,
                                            onSelect: () => {
                                                if (
                                                    !window.confirm(
                                                        t(
                                                            'employer.team.remove_confirm',
                                                        ),
                                                    )
                                                ) {
                                                    return;
                                                }

                                                router.delete(
                                                    `/employer/team/${member.id}`,
                                                    {
                                                        preserveScroll: true,
                                                    },
                                                );
                                            },
                                        },
                                    ]}
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
                                    {t('employer.team.col.name')}
                                </th>
                                <th className="px-4 py-3">
                                    {t('employer.team.col.email')}
                                </th>
                                <th className="px-4 py-3">
                                    {t('employer.team.col.role')}
                                </th>
                                <th className="px-4 py-3">
                                    {t('common.actions')}
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {members.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={4}
                                        className="px-4 py-10 text-center text-[#64748b]"
                                    >
                                        {t('employer.team.empty')}
                                    </td>
                                </tr>
                            ) : (
                                members.map((member, index) => (
                                    <tr
                                        key={member.id}
                                        className={cn(
                                            'border-b border-[rgba(57,119,166,0.1)] last:border-0',
                                            employerListRowBg(index),
                                        )}
                                    >
                                        <td className="px-4 py-3 font-medium text-[#050315]">
                                            {member.name}
                                        </td>
                                        <td className="px-4 py-3 text-[#475569]">
                                            {member.email}
                                        </td>
                                        <td className="px-4 py-3">
                                            <select
                                                value={member.role ?? ''}
                                                onChange={(event) =>
                                                    router.put(
                                                        `/employer/team/${member.id}`,
                                                        {
                                                            role: event.target
                                                                .value,
                                                        },
                                                        {
                                                            preserveScroll:
                                                                true,
                                                        },
                                                    )
                                                }
                                                className="h-9 rounded-lg border border-[#dbeafe] px-2 text-sm"
                                            >
                                                {roleOptions.map((option) => (
                                                    <option
                                                        key={option.value}
                                                        value={option.value}
                                                    >
                                                        {option.label}
                                                    </option>
                                                ))}
                                            </select>
                                        </td>
                                        <td className="px-4 py-3">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    if (
                                                        window.confirm(
                                                            t(
                                                                'employer.team.remove_confirm',
                                                            ),
                                                        )
                                                    ) {
                                                        router.delete(
                                                            `/employer/team/${member.id}`,
                                                            {
                                                                preserveScroll:
                                                                    true,
                                                            },
                                                        );
                                                    }
                                                }}
                                                className="text-xs font-semibold text-[#b91c1c]"
                                            >
                                                {t('common.remove')}
                                            </button>
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
