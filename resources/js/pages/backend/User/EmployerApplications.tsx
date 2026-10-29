import { Head, router, usePoll } from '@inertiajs/react';
import { RefreshCw, Sparkles } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import {
    bulkUpdate,
    exportMethod,
    index,
    rescore,
    rescoreJob,
    update,
} from '@/actions/App/Http/Controllers/Backend/User/EmployerApplicationController';
import { AddToRosterDialog } from '@/components/employer/add-to-roster-dialog';
import {
    ApplicationPreviewDrawer,
    type ApplicationPreview,
} from '@/components/employer/application-preview-drawer';
import {
    AtsScoreBadge,
    atsScoreTone,
    formatAtsScore,
    type AtsMatch,
    type AtsThresholds,
} from '@/components/employer/ats-score';
import { getInitials } from '@/components/employer/demo-data';
import {
    MobileListCard,
    MobileListCardActions,
    MobileListCardHeader,
    MobileListCardMeta,
    MobileListEmpty,
    MobileListStack,
} from '@/components/mobile-list-card';
import {
    PortalPagination,
    type PortalPaginator,
} from '@/components/portal-pagination';
import { NativeSelect } from '@/components/ui/native-select';
import { useLocale } from '@/hooks/use-locale';
import EmployerLayout from '@/layouts/employer-layout';
import { employerListRowBg } from '@/lib/employer-list-row';
import { cn } from '@/lib/utils';

type ApplicationRow = AtsMatch & {
    id: number;
    name: string | null;
    email: string | null;
    phone: string | null;
    location: string | null;
    job: string | null;
    job_id: number | null;
    status: string | null;
    status_value: string | null;
    status_changed_by?: string | null;
    status_history?: Array<{
        status: string;
        changed_by: string;
        at: string | null;
    }>;
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
    on_roster: boolean;
    roster_entry_id: number | null;
};

type ShortlistSuggestion = {
    id: number;
    name: string;
    ai_score: number | null;
    ai_source: string | null;
    ai_summary: string | null;
    status: string | null;
};

type AtsProps = {
    enabled: boolean;
    ai_enabled: boolean;
    has_pending: boolean;
    rescore_url: string | null;
    thresholds: AtsThresholds;
    suggested_shortlist: ShortlistSuggestion[];
};

const AI_BANDS = [
    'strong',
    'possible',
    'weak',
    'pending',
    'no_cv',
    'failed',
    'unreadable',
] as const;

type ExperienceOption = {
    key: string;
    label: string;
    min: number | null;
    max: number | null;
};

type Props = {
    applications: PortalPaginator<ApplicationRow>;
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
        ai_sort?: string;
        ai_band?: string;
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
    ats?: AtsProps;
    experience_options?: ExperienceOption[];
    gender_options?: Array<{ value: string; label: string }>;
    stats: {
        total: number;
        new: number;
        shortlisted: number;
        interview: number;
    };
    statuses: Array<{ value: string; label: string }>;
    roster_categories?: string[];
    is_owner?: boolean;
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
    'inline-flex h-[30px] shrink-0 cursor-pointer items-center justify-center rounded-[6.4px] px-2.5 text-xs font-semibold whitespace-nowrap';

function toPreview(
    row: ApplicationRow,
    t: (key: string, replacements?: Record<string, string | number>) => string,
    atsEnabled: boolean,
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
        status_changed_by: row.status_changed_by ?? null,
        status_history: row.status_history ?? [],
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
        on_roster: row.on_roster,
        roster_entry_id: row.roster_entry_id,
        ai:
            row.ai_score != null || row.ai_status != null
                ? {
                      ai_score: row.ai_score,
                      ai_status: row.ai_status,
                      ai_source: row.ai_source,
                      ai_recommendation: row.ai_recommendation,
                      ai_summary: row.ai_summary,
                      ai_breakdown: row.ai_breakdown,
                      ai_scored_at: row.ai_scored_at,
                      ai_outdated: atsEnabled ? row.ai_outdated : false,
                      ai_cv_name: row.ai_cv_name,
                      ai_error: row.ai_error,
                      ai_rescore_url: atsEnabled ? row.ai_rescore_url : null,
                  }
                : null,
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
                className="size-15 shrink-0 rounded-full border border-[#e2e8f0] object-cover"
            />
        );
    }

    return (
        <div className="flex size-15 shrink-0 items-center justify-center rounded-full bg-[#0057c8] text-lg font-bold text-white">
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
    ats,
    roster_categories = [],
    is_owner = false,
}: Props) {
    const { t } = useLocale();
    const rows = applications.data;
    const atsEnabled = ats?.enabled === true;
    const showAtsScores =
        atsEnabled ||
        rows.some((row) => row.ai_score != null || row.ai_status != null);
    const [search, setSearch] = useState(filters.search ?? '');
    const [status, setStatus] = useState(
        filters.status || (filters.shortlist ? 'shortlisted' : ''),
    );
    const [experience, setExperience] = useState(filters.experience ?? '');
    const [gender, setGender] = useState(filters.gender ?? '');
    const [sort, setSort] = useState(filters.sort || 'experience');
    const [direction, setDirection] = useState(filters.direction || 'desc');
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [bulkStatus, setBulkStatus] = useState(
        filters.shortlist ? 'shortlisted' : '',
    );
    const [rosterApplicationId, setRosterApplicationId] = useState<
        number | null
    >(null);
    const pageTitle = t('employer.applications.title');
    const rosterCandidate = rows.find((row) => row.id === rosterApplicationId);
    const [aiSort, setAiSort] = useState(filters.ai_sort ?? '');
    const [aiBand, setAiBand] = useState(filters.ai_band ?? '');
    const { start: startPolling, stop: stopPolling } = usePoll(
        5000,
        { only: ['applications', 'ats'] },
        { autoStart: false },
    );

    useEffect(() => {
        if (atsEnabled && ats?.has_pending) {
            startPolling();
        } else {
            stopPolling();
        }

        return () => stopPolling();
    }, [atsEnabled, ats?.has_pending, startPolling, stopPolling]);

    useEffect(() => {
        setSearch(filters.search ?? '');
        setStatus(filters.status || (filters.shortlist ? 'shortlisted' : ''));
        setExperience(filters.experience ?? '');
        setGender(filters.gender ?? '');
        setSort(filters.sort || 'experience');
        setDirection(filters.direction || 'desc');
        setAiSort(filters.ai_sort ?? '');
        setAiBand(filters.ai_band ?? '');
    }, [filters]);

    useEffect(() => {
        setSelectedIds([]);
    }, [
        applications.current_page,
        filters.status,
        filters.search,
        filters.experience,
        filters.gender,
        filters.sort,
        filters.direction,
        filters.ai_sort,
        filters.ai_band,
        filters.job_id,
    ]);

    const [viewingId, setViewingId] = useState<number | null>(
        () =>
            filters.job_id && rows.length === 1 ? rows[0].id : null,
    );

    useEffect(() => {
        if (filters.job_id && rows.length === 1) {
            setViewingId(rows[0].id);
        }
    }, [rows, filters.job_id]);

    const viewing = useMemo(
        () =>
            viewingId === null
                ? null
                : (rows.find((row) => row.id === viewingId) ?? null),
        [rows, viewingId],
    );

    const applyFilters = (overrides: {
        status?: string;
        experience?: string;
        sort?: string;
        direction?: string;
        gender?: string;
        ai_sort?: string;
        ai_band?: string;
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
                    ai_sort: (overrides.ai_sort ?? aiSort) || undefined,
                    ai_band: (overrides.ai_band ?? aiBand) || undefined,
                    search: (overrides.search ?? search) || undefined,
                    job_id: filters.job_id || undefined,
                    shortlist: filters.shortlist ? 1 : undefined,
                },
            }),
            {},
            { preserveState: true, preserveScroll: true },
        );
    };

    useEffect(() => {
        const handle = window.setTimeout(() => {
            const next = search.trim();
            const current = (filters.search ?? '').trim();

            if (next === current) {
                return;
            }

            applyFilters({ search: next });
        }, 300);

        return () => window.clearTimeout(handle);
        // eslint-disable-next-line react-hooks/exhaustive-deps -- debounce search only
    }, [search]);

    const setAiSortFilter = (value: string): void => {
        setAiSort(value);
        applyFilters({ ai_sort: value });
    };

    const setAiBandFilter = (value: string): void => {
        setAiBand(value);
        applyFilters({ ai_band: value });
    };

    const rescoreApplication = (rowId: number): void => {
        router.post(rescore.url(rowId), {}, { preserveScroll: true });
    };

    const rescoreAll = (
        mode: 'all' | 'unscored' | 'failed' | 'rules',
    ): void => {
        if (!filters.job_id) {
            return;
        }

        if (
            mode === 'all' &&
            !window.confirm(t('employer.ats.rescore_all_confirm'))
        ) {
            return;
        }

        router.post(
            rescoreJob.url(filters.job_id),
            { mode },
            { preserveScroll: true },
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
        setAiSort('');
        applyFilters({ sort: value, ai_sort: '' });
    };

    const setDirectionFilter = (value: string): void => {
        setDirection(value);
        setAiSort('');
        applyFilters({ direction: value, ai_sort: '' });
    };

    const allSelected =
        rows.length > 0 &&
        rows.every((row) => selectedIds.includes(row.id));

    const toggleAll = (): void => {
        setSelectedIds(allSelected ? [] : rows.map((row) => row.id));
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

    const removeFromRoster = (entryId: number): void => {
        const url = is_owner
            ? `/employer/roster/${entryId}?purge_all=1`
            : `/employer/roster/${entryId}`;

        router.delete(url, { preserveScroll: true });
    };

    const toggleRoster = (
        applicationId: number,
        onRoster: boolean,
        entryId: number | null,
    ): void => {
        if (onRoster && entryId) {
            removeFromRoster(entryId);

            return;
        }

        setRosterApplicationId(applicationId);
    };

    return (
        <EmployerLayout title={pageTitle}>
            <Head title={pageTitle} />

            <div className="flex flex-col px-6 py-6">
                <div className="flex min-h-[85px] flex-wrap items-center justify-between gap-3 pb-6">
                    <div>
                        <h1 className="text-2xl leading-9 font-extrabold text-[#050315]">
                            {pageTitle}
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

                {atsEnabled && filters.job_id ? (
                    <div className="pt-5">
                        <div className="rounded-2xl border border-[#d1f6ff] bg-white p-4 shadow-[0px_2px_4px_rgba(5,3,21,0.06)]">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                                <div>
                                    <h2 className="flex items-center gap-1.5 text-base font-extrabold text-[#050315]">
                                        <Sparkles
                                            className="size-4 text-[#0057c8]"
                                            strokeWidth={2}
                                        />
                                        {t('employer.ats.shortlist_title')}
                                    </h2>
                                    <p className="pt-0.5 text-[12.8px] text-[#6b7280]">
                                        {ats?.ai_enabled
                                            ? t(
                                                  'employer.ats.shortlist_subtitle',
                                              )
                                            : t(
                                                  'employer.ats.shortlist_subtitle_basic',
                                              )}
                                    </p>
                                </div>
                                {ats?.rescore_url ? (
                                    <div className="flex flex-wrap items-center gap-2">
                                        {ats.has_pending ? (
                                            <span className="animate-pulse text-xs font-semibold text-[#0057c8]">
                                                {t(
                                                    'employer.ats.scoring_in_progress',
                                                )}
                                            </span>
                                        ) : null}
                                        <button
                                            type="button"
                                            className={cn(
                                                actionClass,
                                                'gap-1 border border-[#e8d5e8] bg-white text-[#0057c8]',
                                            )}
                                            onClick={() =>
                                                rescoreAll('unscored')
                                            }
                                        >
                                            {t('employer.ats.score_unscored')}
                                        </button>
                                        <button
                                            type="button"
                                            className={cn(
                                                actionClass,
                                                'gap-1 border border-[#e8d5e8] bg-white text-[#0057c8]',
                                            )}
                                            onClick={() => rescoreAll('failed')}
                                        >
                                            {t('employer.ats.retry_failed')}
                                        </button>
                                        {ats.ai_enabled ? (
                                            <button
                                                type="button"
                                                className={cn(
                                                    actionClass,
                                                    'gap-1 border border-[#e8d5e8] bg-white text-[#334155]',
                                                )}
                                                onClick={() =>
                                                    rescoreAll('rules')
                                                }
                                            >
                                                {t(
                                                    'employer.ats.upgrade_basic',
                                                )}
                                            </button>
                                        ) : null}
                                        <button
                                            type="button"
                                            className={cn(
                                                actionClass,
                                                'gap-1 border border-[#0057c8] bg-[#0057c8] text-white',
                                            )}
                                            onClick={() => rescoreAll('all')}
                                        >
                                            <RefreshCw
                                                className="size-3"
                                                strokeWidth={2}
                                            />
                                            {t('employer.ats.rescore_all')}
                                        </button>
                                    </div>
                                ) : null}
                            </div>

                            {(ats?.suggested_shortlist ?? []).length === 0 ? (
                                <p className="pt-3 text-sm text-[#99a1af]">
                                    {t('employer.ats.shortlist_empty')}
                                </p>
                            ) : (
                                <ul className="flex flex-col gap-2 pt-3">
                                    {(ats?.suggested_shortlist ?? []).map(
                                        (candidate) => (
                                            <li
                                                key={candidate.id}
                                                className="flex flex-wrap items-center gap-3 rounded-xl border border-[#f3e8f3] px-3 py-2"
                                            >
                                                <span
                                                    className={cn(
                                                        'inline-flex min-w-[72px] justify-center rounded-full px-3.5 py-1.5 text-base font-bold',
                                                        atsScoreTone(
                                                            candidate.ai_score ??
                                                                0,
                                                            ats?.thresholds,
                                                        ),
                                                    )}
                                                >
                                                    {formatAtsScore(
                                                        candidate.ai_score ?? 0,
                                                    )}
                                                </span>
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-sm font-semibold text-[#050315]">
                                                        {candidate.name}
                                                    </p>
                                                    {candidate.ai_summary ? (
                                                        <p className="line-clamp-1 text-xs text-[#6b7280]">
                                                            {
                                                                candidate.ai_summary
                                                            }
                                                        </p>
                                                    ) : null}
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                    <button
                                                        type="button"
                                                        className={cn(
                                                            actionClass,
                                                            'border border-[#e8d5e8] bg-white text-[#0057c8]',
                                                        )}
                                                        onClick={() =>
                                                            setViewingId(
                                                                candidate.id,
                                                            )
                                                        }
                                                    >
                                                        {t('common.view')}
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className={cn(
                                                            actionClass,
                                                            'border border-[#15803d] bg-[#15803d] text-white',
                                                        )}
                                                        onClick={() =>
                                                            updateStatus(
                                                                candidate.id,
                                                                'shortlisted',
                                                            )
                                                        }
                                                    >
                                                        {t(
                                                            'employer.ats.shortlist_action',
                                                        )}
                                                    </button>
                                                </div>
                                            </li>
                                        ),
                                    )}
                                </ul>
                            )}
                        </div>
                    </div>
                ) : null}

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
                            {atsEnabled ? (
                                <>
                                    <NativeSelect
                                        variant="filter"
                                        wrapperClassName="w-[180px] shrink-0"
                                        className="border-[#e8d5e8]"
                                        value={aiBand}
                                        onChange={(event) =>
                                            setAiBandFilter(event.target.value)
                                        }
                                        aria-label={t(
                                            'employer.ats.band_filter',
                                        )}
                                    >
                                        <option value="">
                                            {t('employer.ats.band.all')}
                                        </option>
                                        {AI_BANDS.map((band) => (
                                            <option key={band} value={band}>
                                                {t(`employer.ats.band.${band}`)}
                                            </option>
                                        ))}
                                    </NativeSelect>
                                    <NativeSelect
                                        variant="filter"
                                        wrapperClassName="w-[190px] shrink-0"
                                        className="border-[#e8d5e8]"
                                        value={aiSort}
                                        onChange={(event) =>
                                            setAiSortFilter(event.target.value)
                                        }
                                        aria-label={t('employer.ats.sort')}
                                    >
                                        <option value="">
                                            {t('employer.ats.sort_none')}
                                        </option>
                                        <option value="desc">
                                            {t('employer.ats.sort_desc')}
                                        </option>
                                        <option value="asc">
                                            {t('employer.ats.sort_asc')}
                                        </option>
                                    </NativeSelect>
                                </>
                            ) : null}
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

                        {rows.length === 0 ? (
                            <MobileListEmpty>
                                {filters.job_title
                                    ? t(
                                          'employer.applications.empty_for_job',
                                          { job: filters.job_title },
                                      )
                                    : t('employer.applications.empty_yet')}
                            </MobileListEmpty>
                        ) : (
                            <MobileListStack className="p-3">
                                {rows.map((row) => (
                                    <MobileListCard key={row.id}>
                                        <div className="mb-2 flex items-start gap-2">
                                            <input
                                                type="checkbox"
                                                checked={selectedIds.includes(
                                                    row.id,
                                                )}
                                                onChange={() =>
                                                    toggleRow(row.id)
                                                }
                                                aria-label={row.name ?? ''}
                                                className="mt-1 size-4 shrink-0 cursor-pointer"
                                            />
                                            <div className="min-w-0 flex-1">
                                                <MobileListCardHeader
                                                    leading={
                                                        <CandidateAvatar
                                                            name={
                                                                row.name || 'A'
                                                            }
                                                            avatarUrl={
                                                                row.avatar_url
                                                            }
                                                        />
                                                    }
                                                    title={row.name || '—'}
                                                    subtitle={row.job || undefined}
                                                    badge={
                                                        <div className="flex flex-col items-end gap-0.5">
                                                            <span
                                                                className={cn(
                                                                    'inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold',
                                                                    statusTone[
                                                                        row.status_value ??
                                                                            ''
                                                                    ] ??
                                                                        'bg-[#f8faff] text-[#0057c8]',
                                                                )}
                                                            >
                                                                {row.status}
                                                            </span>
                                                            {row.status_changed_by ? (
                                                                <span className="text-[10px] font-medium text-[#64748b]">
                                                                    {t(
                                                                        'employer.applications.changed_by',
                                                                        {
                                                                            name: row.status_changed_by,
                                                                        },
                                                                    )}
                                                                </span>
                                                            ) : null}
                                                        </div>
                                                    }
                                                />
                                            </div>
                                        </div>
                                        <MobileListCardMeta
                                            items={[
                                                {
                                                    label: t(
                                                        'employer.applications.col.date',
                                                    ),
                                                    value: row.date || '—',
                                                },
                                                {
                                                    label: t(
                                                        'employer.applications.col.experience',
                                                    ),
                                                    value:
                                                        row.experience_years ||
                                                        '—',
                                                },
                                                {
                                                    label: t(
                                                        'employer.applications.col.location',
                                                    ),
                                                    value: row.location || '—',
                                                },
                                                ...(showAtsScores
                                                    ? [
                                                          {
                                                              label: t(
                                                                  'employer.ats.col_score',
                                                              ),
                                                              value: (
                                                                  <AtsScoreBadge
                                                                      match={
                                                                          row
                                                                      }
                                                                      thresholds={
                                                                          ats?.thresholds
                                                                      }
                                                                  />
                                                              ),
                                                          },
                                                      ]
                                                    : []),
                                            ]}
                                        />
                                        <MobileListCardActions
                                            primary={
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setViewingId(row.id)
                                                    }
                                                    className="inline-flex h-9 w-full items-center justify-center rounded-xl bg-[#0057c8] px-3 text-xs font-semibold text-white"
                                                >
                                                    {t('common.view')}
                                                </button>
                                            }
                                            moreItems={[
                                                {
                                                    key: 'roster',
                                                    label: row.on_roster
                                                        ? t(
                                                              'employer.roster.out',
                                                          )
                                                        : t(
                                                              'employer.roster.in',
                                                          ),
                                                    onSelect: () =>
                                                        toggleRoster(
                                                            row.id,
                                                            row.on_roster,
                                                            row.roster_entry_id,
                                                        ),
                                                },
                                                {
                                                    key: 'move',
                                                    label: t(
                                                        'employer.applications.move',
                                                    ),
                                                    disabled: !(
                                                        row.can_move &&
                                                        row.next_status
                                                    ),
                                                    onSelect: () => {
                                                        if (row.next_status) {
                                                            updateStatus(
                                                                row.id,
                                                                row.next_status,
                                                            );
                                                        }
                                                    },
                                                },
                                                {
                                                    key: 'reject',
                                                    label: t('common.reject'),
                                                    destructive: true,
                                                    disabled: !row.can_reject,
                                                    onSelect: () =>
                                                        updateStatus(
                                                            row.id,
                                                            'rejected',
                                                        ),
                                                },
                                            ]}
                                        />
                                    </MobileListCard>
                                ))}
                            </MobileListStack>
                        )}

                        <div className="hidden overflow-x-auto md:block">
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
                                            ...(showAtsScores
                                                ? [t('employer.ats.col_score')]
                                                : []),
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
                                    {rows.map((row, index) => (
                                        <tr
                                            key={row.id}
                                            className={cn(
                                                'border-b border-[#f3e8f3] last:border-b-0',
                                                employerListRowBg(index),
                                            )}
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
                                            {showAtsScores ? (
                                                <td className="whitespace-nowrap px-4 py-[13px]">
                                                    <AtsScoreBadge
                                                        match={row}
                                                        thresholds={
                                                            ats?.thresholds
                                                        }
                                                    />
                                                </td>
                                            ) : null}
                                            <td className="px-4 py-[13px] text-sm leading-[21px] text-[#374151]">
                                                {row.job || '—'}
                                            </td>
                                            <td className="px-4 py-[13px]">
                                                <div className="flex flex-col gap-0.5">
                                                    <span
                                                        className={cn(
                                                            'inline-flex w-fit rounded-full px-2.5 py-px text-xs font-semibold',
                                                            statusTone[
                                                                row.status_value ??
                                                                    ''
                                                            ] ??
                                                                'bg-[#f8faff] text-[#0057c8]',
                                                        )}
                                                    >
                                                        {row.status}
                                                    </span>
                                                    {row.status_changed_by ? (
                                                        <span className="text-[11px] text-[#64748b]">
                                                            {t(
                                                                'employer.applications.changed_by',
                                                                {
                                                                    name: row.status_changed_by,
                                                                },
                                                            )}
                                                        </span>
                                                    ) : null}
                                                </div>
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
                                                    <button
                                                        type="button"
                                                        className={cn(
                                                            actionClass,
                                                            row.on_roster
                                                                ? 'border border-[#bbf7d0] bg-[#f0fdf4] text-[#15803d]'
                                                                : 'border border-[#bfdbfe] bg-white text-[#0057c8]',
                                                        )}
                                                        onClick={() =>
                                                            toggleRoster(
                                                                row.id,
                                                                row.on_roster,
                                                                row.roster_entry_id,
                                                            )
                                                        }
                                                    >
                                                        {row.on_roster
                                                            ? t(
                                                                  'employer.roster.out',
                                                              )
                                                            : t(
                                                                  'employer.roster.in',
                                                              )}
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
                            {rows.length === 0 && (
                                <p className="hidden px-5 py-10 text-center text-sm text-[#99a1af] md:block">
                                    {filters.job_title
                                        ? t(
                                              'employer.applications.empty_for_job',
                                              { job: filters.job_title },
                                          )
                                        : t('employer.applications.empty_yet')}
                                </p>
                            )}
                        </div>
                        <div className="px-5 pb-4 pt-1">
                            <PortalPagination
                                showingLabel={t('common.showing_range', {
                                    from: applications.from ?? 0,
                                    to: applications.to ?? 0,
                                    total: applications.total,
                                })}
                                links={applications.links}
                            />
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
                preview={viewing ? toPreview(viewing, t, atsEnabled) : null}
                statuses={statuses}
                onUpdateStatus={updateStatus}
                onRescore={atsEnabled ? rescoreApplication : undefined}
                onAddToRoster={(applicationId) =>
                    setRosterApplicationId(applicationId)
                }
                onRemoveFromRoster={removeFromRoster}
            />

            <AddToRosterDialog
                open={rosterApplicationId !== null}
                onOpenChange={(open) => {
                    if (!open) {
                        setRosterApplicationId(null);
                    }
                }}
                applicationId={rosterApplicationId}
                categories={roster_categories}
                candidateName={rosterCandidate?.name}
            />
        </EmployerLayout>
    );
}
