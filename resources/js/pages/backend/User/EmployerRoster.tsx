import { Head, router } from '@inertiajs/react';
import { useMemo, useState } from 'react';

import {
    RosterCandidateDrawer,
    type RosterCandidateDrawerEntry,
    type RosterCandidatePreview,
    type RosterApplicationSummary,
} from '@/components/employer/roster-candidate-drawer';
import { NativeSelect } from '@/components/ui/native-select';
import { useLocale } from '@/hooks/use-locale';
import EmployerLayout from '@/layouts/employer-layout';

type RosterEntry = {
    id: number;
    name: string | null;
    email: string | null;
    phone?: string | null;
    location?: string | null;
    experience_years?: string | null;
    current_title?: string | null;
    job: string | null;
    job_application_id: number;
    application_status?: string | null;
    application_status_value?: string | null;
    category: string;
    comments: string | null;
    added_by: string | null;
    created_at: string | null;
    applications_count?: number;
    applications: RosterApplicationSummary[];
    candidate: RosterCandidatePreview | null;
};

type Props = {
    entries: RosterEntry[];
    categories: string[];
    filters: {
        category?: string;
    };
};

export default function EmployerRoster({
    entries,
    categories,
    filters,
}: Props) {
    const { t } = useLocale();
    const [category, setCategory] = useState(filters.category ?? '');
    const [viewingId, setViewingId] = useState<number | null>(null);

    const viewing = useMemo(
        () => entries.find((entry) => entry.id === viewingId) ?? null,
        [entries, viewingId],
    );

    const drawerEntry: RosterCandidateDrawerEntry | null = viewing
        ? {
              id: viewing.id,
              category: viewing.category,
              comments: viewing.comments,
              added_by: viewing.added_by,
              created_at: viewing.created_at,
              applications: viewing.applications ?? [],
              candidate: viewing.candidate,
          }
        : null;

    const applyFilter = (nextCategory: string): void => {
        setCategory(nextCategory);
        router.get(
            '/employer/roster',
            nextCategory ? { category: nextCategory } : {},
            { preserveState: true, replace: true },
        );
    };

    const headings = [
        t('employer.roster.col.name'),
        t('employer.roster.col.email'),
        t('employer.roster.col.job'),
        t('employer.roster.col.status'),
        t('employer.roster.col.applications'),
        t('employer.roster.col.category'),
        t('employer.roster.col.comments'),
        t('employer.roster.col.added_by'),
        t('employer.roster.col.date'),
        t('common.actions'),
    ];

    return (
        <EmployerLayout title={t('employer.roster.title')}>
            <Head title={t('employer.roster.title')} />

            <div className="flex flex-col gap-5 px-4 py-6 sm:px-6">
                <div className="flex flex-wrap items-end justify-between gap-4">
                    <div>
                        <h1 className="text-2xl leading-9 font-bold text-[#050315]">
                            {t('employer.roster.title')}
                        </h1>
                        <p className="mt-1 text-sm leading-[21px] text-[#475569]">
                            {t('employer.roster.subtitle')}
                        </p>
                    </div>
                    {categories.length > 0 ? (
                        <label className="block text-sm">
                            <span className="mb-1 block font-medium text-[#050315]">
                                {t('employer.roster.filter.category')}
                            </span>
                            <NativeSelect
                                value={category}
                                onChange={(event) =>
                                    applyFilter(event.target.value)
                                }
                                className="h-11 min-w-[180px] rounded-xl border border-[#dbeafe] px-3"
                            >
                                <option value="">
                                    {t('employer.roster.filter.all')}
                                </option>
                                {categories.map((item) => (
                                    <option key={item} value={item}>
                                        {item}
                                    </option>
                                ))}
                            </NativeSelect>
                        </label>
                    ) : null}
                </div>

                <div className="overflow-x-auto rounded-2xl border border-[rgba(57,119,166,0.2)] bg-white">
                    <table className="min-w-full text-left text-sm">
                        <thead className="border-b border-[rgba(57,119,166,0.15)] bg-[#f8faff] text-xs font-semibold tracking-wide text-[#475569] uppercase">
                            <tr>
                                {headings.map((heading) => (
                                    <th
                                        key={heading}
                                        className="px-4 py-3 whitespace-nowrap"
                                    >
                                        {heading}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {entries.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={headings.length}
                                        className="px-4 py-10 text-center text-[#64748b]"
                                    >
                                        {t('employer.roster.empty')}
                                    </td>
                                </tr>
                            ) : (
                                entries.map((entry) => (
                                    <tr
                                        key={entry.id}
                                        className="border-b border-[rgba(57,119,166,0.08)] last:border-0"
                                    >
                                        <td className="px-4 py-3">
                                            <div className="font-medium text-[#050315]">
                                                {entry.name || '—'}
                                            </div>
                                            {entry.current_title ? (
                                                <div className="text-xs text-[#64748b]">
                                                    {entry.current_title}
                                                </div>
                                            ) : null}
                                        </td>
                                        <td className="px-4 py-3 text-[#475569]">
                                            <div>{entry.email || '—'}</div>
                                            {entry.phone &&
                                            entry.phone !== '—' ? (
                                                <div className="text-xs text-[#64748b]">
                                                    {entry.phone}
                                                </div>
                                            ) : null}
                                        </td>
                                        <td className="px-4 py-3 text-[#475569]">
                                            {entry.job || '—'}
                                        </td>
                                        <td className="px-4 py-3">
                                            {entry.application_status ? (
                                                <span className="inline-flex rounded-full bg-[#fdf4ff] px-2.5 py-0.5 text-xs font-semibold text-[#7e22ce]">
                                                    {entry.application_status}
                                                </span>
                                            ) : (
                                                '—'
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-[#475569]">
                                            {entry.applications_count ??
                                                entry.applications?.length ??
                                                0}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className="inline-flex rounded-full bg-[#eff6ff] px-2.5 py-0.5 text-xs font-semibold text-[#0057c8]">
                                                {entry.category}
                                            </span>
                                        </td>
                                        <td className="max-w-[240px] px-4 py-3 text-[#475569]">
                                            <span className="line-clamp-2">
                                                {entry.comments || '—'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-[#475569]">
                                            {entry.added_by || '—'}
                                        </td>
                                        <td className="px-4 py-3 text-[#475569]">
                                            {entry.created_at || '—'}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setViewingId(entry.id)
                                                    }
                                                    className="text-xs font-semibold text-[#0057c8]"
                                                >
                                                    {t('common.view')}
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        if (
                                                            window.confirm(
                                                                t(
                                                                    'employer.roster.remove_confirm',
                                                                ),
                                                            )
                                                        ) {
                                                            router.delete(
                                                                `/employer/roster/${entry.id}`,
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
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <RosterCandidateDrawer
                open={viewing !== null}
                onOpenChange={(open) => {
                    if (!open) {
                        setViewingId(null);
                    }
                }}
                entry={drawerEntry}
            />
        </EmployerLayout>
    );
}
