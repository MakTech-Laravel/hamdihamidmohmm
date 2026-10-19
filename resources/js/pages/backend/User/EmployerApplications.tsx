import { Head, router } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';

import {
    bulkUpdate,
    exportMethod,
    index,
    update,
} from '@/actions/App/Http/Controllers/Backend/User/EmployerApplicationController';
import {
    ApplicationPreviewDrawer,
    type ApplicationPreview,
} from '@/components/employer/application-preview-drawer';
import { getInitials } from '@/components/employer/demo-data';
import { NativeSelect } from '@/components/ui/native-select';
import { useLocale } from '@/hooks/use-locale';
import EmployerLayout from '@/layouts/employer-layout';
import { cn } from '@/lib/utils';

type ApplicationRow = {
    id: number;
    name: string | null;
    email: string | null;
    phone: string | null;
    location: string | null;
    job: string | null;
    job_id: number | null;
    status: string | null;
    status_value: string | null;
    date: string | null;
    experience_years: string | null;
    cover_letter: string | null;
    headline: string | null;
    current_title: string | null;
    gender: string | null;
    gender_label: string | null;
    nationality?: string | null;
    qualification?: string | null;
    certificate_count?: number;
    industry: string | null;
    expected_salary: string | null;
    availability: string[];
    bio: string | null;
    linkedin_url: string | null;
    github_url: string | null;
    skills: string[];
    education: ApplicationPreview['education'];
    experience: ApplicationPreview['experience'];
    languages: ApplicationPreview['languages'];
    certifications: ApplicationPreview['certifications'];
    resume_name: string | null;
    resume_url: string | null;
    highest_degree_name?: string | null;
    highest_degree_url?: string | null;
    other_document_name?: string | null;
    other_document_url?: string | null;
    cover_letter_file_name?: string | null;
    cover_letter_file_url?: string | null;
    avatar_url?: string | null;
    timeline: ApplicationPreview['timeline'];
    preview_location: string | null;
    next_status: string | null;
    can_move: boolean;
    can_reject: boolean;
};

type ExperienceOption = {
    key: string;
    label: string;
    min: number | null;
    max: number | null;
};

type Props = {
    applications: ApplicationRow[];
    filters: {
        status: string;
        search: string;
        job_id?: number | null;
        job_title?: string | null;
        experience?: string;
        sort?: string;
        direction?: string;
        gender?: string;
        shortlist?: boolean;
    };
    status_counts?: Record<string, number>;
    gender_stats?: {
        total: number;
        male: number;
        female: number;
        unspecified: number;
        male_percent: number;
        female_percent: number;
    };
    experience_options?: ExperienceOption[];
    gender_options?: Array<{ value: string; label: string }>;
    stats: {
        total: number;
        new: number;
        shortlisted: number;
        interview: number;
    };
    statuses: Array<{ value: string; label: string }>;
};

const statusTone: Record<string, string> = {
    interview: 'bg-[#fdf4ff] text-[#7e22ce]',
    longlisted: 'bg-[#f0f9ff] text-[#0369a1]',
    under_consideration: 'bg-[#fefce8] text-[#a16207]',
    shortlisted: 'bg-[#f0fdf4] text-[#15803d]',
    under_review: 'bg-[#fff7ed] text-[#c2410c]',
    applied: 'bg-[#e6f0fb] text-[#0057c8]',
    offer: 'bg-[#eef2ff] text-[#4338ca]',
    hired: 'bg-[#dcfce7] text-[#166534]',
    rejected: 'bg-[#fef2f2] text-[#b91c1c]',
    withdrawn: 'bg-[#f3f4f6] text-[#6b7280]',
};

const actionClass =
    'inline-flex h-[30px] cursor-pointer items-center justify-center rounded-[6.4px] px-2.5 text-xs font-semibold';

function toPreview(
    row: ApplicationRow,
    t: (key: string, replacements?: Record<string, string | number>) => string,
): ApplicationPreview {
    return {
        id: row.id,
        name: row.name || t('employer.applications.candidate'),
        title:
            row.headline ||
            row.job ||
            t('employer.applications.applicant'),
        status: row.status || t('employer.applications.applied'),
        status_value: row.status_value || 'applied',
        email: row.email || '—',
        phone: row.phone || '—',
        location: row.preview_location || row.location || '—',
        current_title: row.current_title,
        gender: row.gender_label || row.gender,
        experience_years: row.experience_years,
        industry: row.industry,
        expected_salary: row.expected_salary,
        availability: row.availability ?? [],
        bio: row.bio,
        linkedin_url: row.linkedin_url,
        github_url: row.github_url,
        skills: row.skills ?? [],
        education: row.education ?? [],
        experience: row.experience ?? [],
        languages: row.languages ?? [],
        certifications: row.certifications ?? [],
        cover_letter: row.cover_letter,
        resume_name: row.resume_name,
        resume_url: row.resume_url,
        highest_degree_name: row.highest_degree_name ?? null,
        highest_degree_url: row.highest_degree_url ?? null,
        other_document_name: row.other_document_name ?? null,
        other_document_url: row.other_document_url ?? null,
        cover_letter_file_name: row.cover_letter_file_name ?? null,
        cover_letter_file_url: row.cover_letter_file_url ?? null,
        avatar_url: row.avatar_url ?? null,
        timeline: row.timeline ?? [],
    };
}

function CandidateAvatar({
    name,
    avatarUrl,
}: {
    name: string;
    avatarUrl?: string | null;
}) {
    const [failed, setFailed] = useState(false);
    const showPhoto = Boolean(avatarUrl) && !failed;

    if (showPhoto) {
        return (
            <img
                src={avatarUrl ?? undefined}
                alt={name}
                onError={() => setFailed(true)}
                className="size-8 shrink-0 rounded-full border border-[#e2e8f0] object-cover"
            />
        );
    }

    return (
        <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#0057c8] text-[10.4px] leading-[15.6px] font-bold text-white">
            {getInitials(name || 'A')}
        </div>
    );
}

export default function EmployerApplications({
    applications,
    filters,
    experience_options = [],
    gender_options = [],
    status_counts = {},
    gender_stats,
    stats,
    statuses,
}: Props) {
    const { t } = useLocale();
    const [search, setSearch] = useState(filters.search ?? '');
    const [status, setStatus] = useState(filters.status ?? '');
    const [experience, setExperience] = useState(filters.experience ?? '');
    const [gender, setGender] = useState(filters.gender ?? '');
    const [sort, setSort] = useState(filters.sort || 'experience');
    const [direction, setDirection] = useState(filters.direction || 'desc');
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [bulkStatus, setBulkStatus] = useState(
        filters.shortlist ? 'shortlisted' : '',
    );
    const [viewingId, setViewingId] = useState<number | null>(
        () =>
            filters.job_id && applications.length === 1
                ? applications[0].id
                : null,
    );

    useEffect(() => {
        if (filters.job_id && applications.length === 1) {
            setViewingId(applications[0].id);
        }
    }, [applications, filters.job_id]);

    const viewing = useMemo(
        () =>
            viewingId === null
                ? null
                : (applications.find((row) => row.id === viewingId) ?? null),
        [applications, viewingId],
    );

    const filtered = useMemo(() => {
        const query = search.toLowerCase();

        return applications.filter((row) => {
            const matchesQuery =
                query === '' ||
                (row.name ?? '').toLowerCase().includes(query) ||
                (row.email ?? '').toLowerCase().includes(query) ||
                (row.job ?? '').toLowerCase().includes(query);

            const matchesStatus = status === '' || row.status_value === status;

            return matchesQuery && matchesStatus;
        });
    }, [applications, search, status]);

    const applyFilters = (overrides: {
        status?: string;
        experience?: string;
        sort?: string;
        direction?: string;
        gender?: string;
        search?: string;
    }): void => {
        router.get(
            index.url({
                query: {
                    status: (overrides.status ?? status) || undefined,
                    experience:
                        (overrides.experience ?? experience) || undefined,
                    sort: overrides.sort ?? sort,
                    direction: overrides.direction ?? direction,
                    gender: (overrides.gender ?? gender) || undefined,
                    search: (overrides.search ?? search) || undefined,
                    job_id: filters.job_id || undefined,
                    shortlist: filters.shortlist ? 1 : undefined,
                },
            }),
            {},
            { preserveState: true, preserveScroll: true },
        );
    };

    const setStatusFilter = (value: string): void => {
        setStatus(value);
        applyFilters({ status: value });
    };

    const setExperienceFilter = (value: string): void => {
        setExperience(value);
        applyFilters({ experience: value });
    };

    const setGenderFilter = (value: string): void => {
        setGender(value);
        applyFilters({ gender: value });
    };

    const setSortFilter = (value: string): void => {
        setSort(value);
        applyFilters({ sort: value });
    };

    const setDirectionFilter = (value: string): void => {
        setDirection(value);
        applyFilters({ direction: value });
    };

    const allSelected =
        filtered.length > 0 &&
        filtered.every((row) => selectedIds.includes(row.id));

    const toggleAll = (): void => {
        setSelectedIds(allSelected ? [] : filtered.map((row) => row.id));
    };

    const toggleRow = (rowId: number): void => {
        setSelectedIds((current) =>
            current.includes(rowId)
                ? current.filter((id) => id !== rowId)
                : [...current, rowId],
        );
    };

    const applyBulkStatus = (): void => {
        if (selectedIds.length === 0 || bulkStatus === '') {
            return;
        }

        router.put(
            bulkUpdate.url(),
            { ids: selectedIds, status: bulkStatus },
            {
                preserveScroll: true,
                onSuccess: () => setSelectedIds([]),
            },
        );
    };

    const exportUrl = exportMethod.url({
        query: { job_id: filters.job_id || undefined },
    });

    const updateStatus = (rowId: number, nextStatus: string): void => {
        router.put(
            update.url(rowId),
            { status: nextStatus },
            { preserveScroll: true },
        );
    };

    return (
        <EmployerLayout title={t('employer.applications.title')}>
            <Head title={t('employer.applications.title')} />

            <div className="flex flex-col px-6 py-6">
                <div className="flex min-h-[85px] flex-wrap items-center justify-between gap-3 pb-6">
                    <div>
                        <h1 className="text-2xl leading-9 font-extrabold text-[#050315]">
                            {t('employer.applications.title')}
                        </h1>
                        <p className="pt-1 text-sm leading-[21px] text-[#6b7280]">
                            {filters.job_title
                                ? t('employer.applications.filtered_job', {
                                      job: filters.job_title,
                                  })
                                : t('employer.applications.subtitle')}
                        </p>
                    </div>
                    <a
                        href={exportUrl}
                        className="inline-flex h-10 cursor-pointer items-center rounded-xl bg-[#0057c8] px-5 text-sm font-semibold text-white"
                    >
                        {t('employer.applications.recruitment_report')}
                    </a>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    {[
                        [t('employer.dashboard.total_applications'), stats.total],
                        [t('employer.dashboard.new_this_week'), stats.new],
                        [
                            t('employer.applications.stat.shortlisted'),
                            stats.shortlisted,
                        ],
                        [
                            t('employer.applications.stat.interviews'),
                            stats.interview,
                        ],
                    ].map(([label, value]) => (
                        <div
                            key={label}
                            className="flex min-w-0 flex-1 items-center gap-3 rounded-2xl border border-[#e8d5e8] bg-white px-5 py-3 shadow-[0px_2px_4px_rgba(5,3,21,0.06)]"
                        >
                            <p className="text-2xl leading-9 font-extrabold text-[#0057c8]">
                                {value}
                            </p>
                            <p className="text-[12.8px] leading-[19.2px] font-medium text-[#6b7280]">
                                {label}
                            </p>
                        </div>
                    ))}
                </div>

                {gender_stats && (
                    <div className="grid grid-cols-1 gap-3 pt-3 sm:grid-cols-2 xl:grid-cols-4">
                        {[
                            [
                                t('employer.applications.gender_stats.total'),
                                String(gender_stats.total),
                                '',
                            ],
                            [
                                t('employer.applications.gender_stats.male'),
                                String(gender_stats.male),
                                `${gender_stats.male_percent}%`,
                            ],
                            [
                                t('employer.applications.gender_stats.female'),
                                String(gender_stats.female),
                                `${gender_stats.female_percent}%`,
                            ],
                            [
                                t('employer.applications.gender_stats.ratio'),
                                `${gender_stats.male} : ${gender_stats.female}`,
                                gender_stats.unspecified > 0
                                    ? t(
                                          'employer.applications.gender_stats.unspecified',
                                          { count: gender_stats.unspecified },
                                      )
                                    : '',
                            ],
                        ].map(([label, value, hint]) => (
                            <div
                                key={label}
                                className="flex min-w-0 flex-1 items-center gap-3 rounded-2xl border border-[#e8d5e8] bg-[#f8faff] px-5 py-3"
                            >
                                <p className="text-2xl leading-9 font-extrabold text-[#050315]">
                                    {value}
                                </p>
                                <div>
                                    <p className="text-[12.8px] leading-[19.2px] font-medium text-[#6b7280]">
                                        {label}
                                    </p>
                                    {hint !== '' && (
                                        <p className="text-xs font-semibold text-[#0057c8]">
                                            {hint}
                                        </p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                <div className="flex flex-wrap gap-2 pt-3">
                    {statuses.map((item) => (
                        <button
                            key={item.value}
                            type="button"
                            onClick={() => setStatusFilter(item.value)}
                            className={cn(
                                'inline-flex cursor-pointer items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold',
                                statusTone[item.value] ??
                                    'bg-[#f8faff] text-[#0057c8]',
                                status === item.value &&
                                    'ring-2 ring-[#0057c8]/40',
                            )}
                        >
                            {item.label}
                            <span className="rounded-full bg-white/70 px-1.5">
                                {status_counts[item.value] ?? 0}
                            </span>
                        </button>
                    ))}
                </div>

                <div className="pt-5">
                    <div className="overflow-hidden rounded-2xl border border-[#e8d5e8] bg-white shadow-[0px_2px_4px_rgba(5,3,21,0.06)]">
                        <div className="flex flex-wrap items-center gap-3 border-b border-[#e8d5e8] p-4">
                            <div className="relative min-w-[180px] flex-1">
                                <img
                                    src="/images/jobs/search.svg"
                                    alt=""
                                    width={20}
                                    height={20}
                                    className="pointer-events-none absolute top-1/2 left-3 size-5 -translate-y-1/2"
                                />
                                <input
                                    value={search}
                                    onChange={(event) =>
                                        setSearch(event.target.value)
                                    }
                                    placeholder={t(
                                        'employer.applications.search',
                                    )}
                                    className="h-[39px] w-full rounded-lg border border-[#e8d5e8] bg-white py-2 pr-3 pl-11 text-sm text-[#050315] outline-none placeholder:text-[#050315]/50"
                                />
                            </div>
                            <NativeSelect
                                variant="filter"
                                wrapperClassName="w-[180px] shrink-0"
                                className="border-[#e8d5e8]"
                                value={status}
                                onChange={(event) =>
                                    setStatusFilter(event.target.value)
                                }
                                aria-label={t(
                                    'employer.applications.filter_status',
                                )}
                            >
                                <option value="">{t('common.all')}</option>
                                {statuses.map((item) => (
                                    <option key={item.value} value={item.value}>
                                        {item.label}
                                    </option>
                                ))}
                            </NativeSelect>
                            <NativeSelect
                                variant="filter"
                                wrapperClassName="w-[160px] shrink-0"
                                className="border-[#e8d5e8]"
                                value={gender}
                                onChange={(event) =>
                                    setGenderFilter(event.target.value)
                                }
                                aria-label={t(
                                    'employer.applications.gender_filter',
                                )}
                            >
                                <option value="">
                                    {t('employer.applications.gender_all')}
                                </option>
                                {gender_options.map((option) => (
                                    <option
                                        key={option.value}
                                        value={option.value}
                                    >
                                        {t(
                                            `employer.applications.gender_${option.value}`,
                                        )}
                                    </option>
                                ))}
                            </NativeSelect>
                            <NativeSelect
                                variant="filter"
                                wrapperClassName="w-[180px] shrink-0"
                                className="border-[#e8d5e8]"
                                value={experience}
                                onChange={(event) =>
                                    setExperienceFilter(event.target.value)
                                }
                                aria-label={t(
                                    'employer.applications.experience_filter',
                                )}
                            >
                                <option value="">
                                    {t(
                                        'employer.applications.experience_all',
                                    )}
                                </option>
                                {experience_options.map((option) => (
                                    <option
                                        key={option.key}
                                        value={option.key}
                                    >
                                        {option.label}
                                    </option>
                                ))}
                            </NativeSelect>
                            <NativeSelect
                                variant="filter"
                                wrapperClassName="w-[200px] shrink-0"
                                className="border-[#e8d5e8]"
                                value={sort}
                                onChange={(event) =>
                                    setSortFilter(event.target.value)
                                }
                                aria-label={t('employer.applications.sort_by')}
                            >
                                <option value="experience">
                                    {t('employer.applications.sort.experience')}
                                </option>
                                <option value="certificates">
                                    {t(
                                        'employer.applications.sort.certificates',
                                    )}
                                </option>
                                <option value="qualification">
                                    {t(
                                        'employer.applications.sort.qualification',
                                    )}
                                </option>
                                <option value="gender">
                                    {t('employer.applications.sort.gender')}
                                </option>
                            </NativeSelect>
                            <NativeSelect
                                variant="filter"
                                wrapperClassName="w-[160px] shrink-0"
                                className="border-[#e8d5e8]"
                                value={direction}
                                onChange={(event) =>
                                    setDirectionFilter(event.target.value)
                                }
                                aria-label={t(
                                    'employer.applications.sort_direction',
                                )}
                            >
                                <option value="desc">
                                    {t('employer.applications.sort_desc')}
                                </option>
                                <option value="asc">
                                    {t('employer.applications.sort_asc')}
                                </option>
                            </NativeSelect>
                        </div>

                        {selectedIds.length > 0 && (
                            <div className="flex flex-wrap items-center gap-3 border-b border-[#e8d5e8] bg-[#f8faff] px-4 py-3">
                                <p className="text-sm font-semibold text-[#050315]">
                                    {t('employer.applications.selected', {
                                        count: selectedIds.length,
                                    })}
                                </p>
                                <NativeSelect
                                    variant="filter"
                                    wrapperClassName="w-[200px] shrink-0"
                                    className="border-[#e8d5e8]"
                                    value={bulkStatus}
                                    onChange={(event) =>
                                        setBulkStatus(event.target.value)
                                    }
                                    aria-label={t(
                                        'employer.applications.bulk_status',
                                    )}
                                >
                                    <option value="">
                                        {t('employer.applications.bulk_status')}
                                    </option>
                                    {statuses.map((item) => (
                                        <option
                                            key={item.value}
                                            value={item.value}
                                        >
                                            {item.label}
                                        </option>
                                    ))}
                                </NativeSelect>
                                <button
                                    type="button"
                                    disabled={bulkStatus === ''}
                                    onClick={applyBulkStatus}
                                    className="inline-flex h-[34px] cursor-pointer items-center rounded-lg bg-[#0057c8] px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {t('employer.applications.bulk_apply')}
                                </button>
                            </div>
                        )}

                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[1280px] text-left">
                                <thead>
                                    <tr className="border-b border-[#d1f6ff] bg-white">
                                        <th className="w-10 px-4 py-3">
                                            <input
                                                type="checkbox"
                                                checked={allSelected}
                                                onChange={toggleAll}
                                                aria-label={t(
                                                    'employer.applications.select_all',
                                                )}
                                                className="size-4 cursor-pointer"
                                            />
                                        </th>
                                        {[
                                            t(
                                                'employer.applications.col.candidate',
                                            ),
                                            t('employer.applications.col.job'),
                                            t('common.status'),
                                            t('employer.applications.col.date'),
                                            t(
                                                'employer.applications.col.experience',
                                            ),
                                            t(
                                                'employer.applications.col.qualification',
                                            ),
                                            t(
                                                'employer.applications.col.certificates',
                                            ),
                                            t(
                                                'employer.applications.col.location',
                                            ),
                                            t('common.actions'),
                                        ].map((heading) => (
                                            <th
                                                key={heading}
                                                className="px-4 py-3 text-sm font-bold text-[#050315]"
                                            >
                                                {heading}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {filtered.map((row) => (
                                        <tr
                                            key={row.id}
                                            className="border-b border-[#f3e8f3] last:border-b-0"
                                        >
                                            <td className="px-4 py-[13px]">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedIds.includes(
                                                        row.id,
                                                    )}
                                                    onChange={() =>
                                                        toggleRow(row.id)
                                                    }
                                                    aria-label={row.name ?? ''}
                                                    className="size-4 cursor-pointer"
                                                />
                                            </td>
                                            <td className="px-4 py-[13px]">
                                                <div className="flex items-center gap-2">
                                                    <CandidateAvatar
                                                        name={row.name || 'A'}
                                                        avatarUrl={row.avatar_url}
                                                    />
                                                    <p className="text-sm leading-[21px] font-semibold text-[#050315]">
                                                        {row.name}
                                                    </p>
                                                </div>
                                            </td>
                                            <td className="px-4 py-[13px] text-sm leading-[21px] text-[#374151]">
                                                {row.job || '—'}
                                            </td>
                                            <td className="px-4 py-[13px]">
                                                <span
                                                    className={cn(
                                                        'inline-flex rounded-full px-2.5 py-px text-xs font-semibold',
                                                        statusTone[
                                                        row.status_value ??
                                                        ''
                                                        ] ??
                                                        'bg-[#f8faff] text-[#0057c8]',
                                                    )}
                                                >
                                                    {row.status}
                                                </span>
                                            </td>
                                            <td className="px-4 py-[13px] text-sm leading-[21px] text-[#6b7280]">
                                                {row.date || '—'}
                                            </td>
                                            <td className="px-4 py-[13px] text-sm leading-[21px] text-[#374151]">
                                                {row.experience_years || '—'}
                                            </td>
                                            <td className="px-4 py-[13px] text-sm leading-[21px] text-[#374151]">
                                                {row.qualification || '—'}
                                            </td>
                                            <td className="px-4 py-[13px] text-sm leading-[21px] text-[#374151]">
                                                {row.certificate_count ?? 0}
                                            </td>
                                            <td className="px-4 py-[13px] text-sm leading-[21px] text-[#374151]">
                                                {row.location || '—'}
                                            </td>
                                            <td className="px-4 py-[13px]">
                                                <div className="flex items-center gap-1.5">
                                                    <button
                                                        type="button"
                                                        className={cn(
                                                            actionClass,
                                                            'border border-[#e8d5e8] bg-white text-[#0057c8]',
                                                        )}
                                                        onClick={() =>
                                                            setViewingId(row.id)
                                                        }
                                                    >
                                                        {t('common.view')}
                                                    </button>
                                                    {row.can_move &&
                                                        row.next_status && (
                                                            <button
                                                                type="button"
                                                                className={cn(
                                                                    actionClass,
                                                                    'border border-[#0057c8] bg-[#0057c8] text-white',
                                                                )}
                                                                onClick={() => {
                                                                    if (
                                                                        row.next_status
                                                                    ) {
                                                                        updateStatus(
                                                                            row.id,
                                                                            row.next_status,
                                                                        );
                                                                    }
                                                                }}
                                                            >
                                                                {t(
                                                                    'employer.applications.move',
                                                                )}
                                                            </button>
                                                        )}
                                                    {row.can_reject && (
                                                        <button
                                                            type="button"
                                                            className={cn(
                                                                actionClass,
                                                                'border border-[#fecaca] bg-white text-[#dc2626]',
                                                            )}
                                                            onClick={() =>
                                                                updateStatus(
                                                                    row.id,
                                                                    'rejected',
                                                                )
                                                            }
                                                        >
                                                            {t('common.reject')}
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {filtered.length === 0 && (
                                <p className="px-5 py-10 text-center text-sm text-[#99a1af]">
                                    {filters.job_title
                                        ? t(
                                              'employer.applications.empty_for_job',
                                              { job: filters.job_title },
                                          )
                                        : t('employer.applications.empty_yet')}
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <ApplicationPreviewDrawer
                open={viewing !== null}
                onOpenChange={(open) => {
                    if (!open) {
                        setViewingId(null);
                    }
                }}
                preview={viewing ? toPreview(viewing, t) : null}
                statuses={statuses}
                onUpdateStatus={updateStatus}
            />
        </EmployerLayout>
    );
}
