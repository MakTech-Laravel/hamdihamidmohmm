import { Head, Link, router } from '@inertiajs/react';
import { FormEvent, useMemo, useState } from 'react';

import { LocationCombobox } from '@/components/frontend/location-combobox';
import { NativeSelect } from '@/components/ui/native-select';
import { useLocale } from '@/hooks/use-locale';
import JobSeekerLayout from '@/layouts/job-seeker-layout';
import { categoryTranslationKey } from '@/lib/job-filters';
import { sudanLocationKeys } from '@/lib/sudan-locations';
import { show as jobShow } from '@/routes/jobs';

const jobTypeKeys = [
    'full_time',
    'part_time',
    'contract',
    'freelance',
    'internship',
    'remote',
] as const;

type JobTypeKey = (typeof jobTypeKeys)[number];

type JobRow = {
    id: number;
    slug: string;
    title: string;
    company: string | null;
    initials: string;
    logo_url?: string | null;
    location: string | null;
    type: string | null;
    category: string | null;
    salary: string | null;
    applied: boolean;
    job_url: string | null;
};

type Props = {
    jobs: {
        data: JobRow[];
        links: Array<{ url: string | null; label: string; active: boolean }>;
        total: number;
        current_page: number;
        last_page: number;
    };
    filters: {
        search: string;
        location?: string;
        category?: string;
        types?: string[];
    };
    filterOptions?: {
        categories: string[];
        types: string[];
    };
};

function typeClass(type: string | null): string {
    const value = (type ?? '').toLowerCase();

    if (value.includes('remote')) {
        return 'bg-[#dbeafe] text-[#2563eb]';
    }

    if (value.includes('contract')) {
        return 'bg-[#ffedd5] text-[#c2410c]';
    }

    if (value.includes('part')) {
        return 'bg-[#f3e8ff] text-[#7e22ce]';
    }

    return 'bg-[#dcfce7] text-[#16a34a]';
}

function resolveLocationParam(
    location: string,
    locationOptions: Array<{ value: string; label: string }>,
): string | undefined {
    const selected = locationOptions.find((option) => option.value === location);

    if (selected) {
        return selected.value !== '' ? selected.label : undefined;
    }

    const trimmed = location.trim();

    return trimmed || undefined;
}

export default function JobSeekerJobs({ jobs, filters, filterOptions }: Props) {
    const { t } = useLocale();
    const [keyword, setKeyword] = useState(filters.search ?? '');
    const [location, setLocation] = useState(() => {
        const initialRaw = (filters.location ?? '').trim();
        const initial = initialRaw.toLowerCase();

        if (!initial) {
            return '';
        }

        if (
            sudanLocationKeys.includes(
                initial as (typeof sudanLocationKeys)[number],
            )
        ) {
            return initial;
        }

        const known =
            sudanLocationKeys.find((item) =>
                initial.includes(item.replaceAll('_', ' ')),
            ) ?? sudanLocationKeys.find((item) => initial.includes(item));

        return known ?? initialRaw;
    });
    const [category, setCategory] = useState(
        filters.category && filters.category !== ''
            ? filters.category
            : 'all',
    );
    const [sort, setSort] = useState('latest');
    const [selectedTypes, setSelectedTypes] = useState<JobTypeKey[]>(() => {
        const incoming = (filters.types ?? []).filter((type): type is JobTypeKey =>
            jobTypeKeys.includes(type as JobTypeKey),
        );

        return incoming;
    });

    const categories = filterOptions?.categories ?? [
        'Technology',
        'Engineering',
        'Design',
        'Marketing',
        'Finance',
        'Healthcare',
        'HR',
        'Sales',
        'Construction',
        'Logistics',
        'Retail',
        'Other',
    ];

    const locationOptions = useMemo(
        () => [
            { value: '', label: t('jobs_page.all_locations') },
            ...sudanLocationKeys.map((key) => ({
                value: key,
                label: t(`location.${key}`),
            })),
        ],
        [t],
    );

    const applyFilters = (overrides: {
        search?: string;
        location?: string;
        category?: string;
        types?: JobTypeKey[];
    } = {}): void => {
        const nextSearch = overrides.search ?? keyword;
        const nextLocation = overrides.location ?? location;
        const nextCategory = overrides.category ?? category;
        const nextTypes = overrides.types ?? selectedTypes;

        router.get(
            '/job-seeker/jobs',
            {
                search: nextSearch.trim() || undefined,
                location: resolveLocationParam(nextLocation, locationOptions),
                category:
                    nextCategory !== 'all' && nextCategory !== ''
                        ? nextCategory
                        : undefined,
                types: nextTypes.length > 0 ? nextTypes : undefined,
            },
            { preserveState: true, replace: true },
        );
    };

    const displayedJobs = useMemo(() => {
        const rows = [...jobs.data];

        if (sort === 'salary') {
            return rows.sort((a, b) =>
                (b.salary ?? '').localeCompare(a.salary ?? ''),
            );
        }

        return rows;
    }, [jobs.data, sort]);

    const handleLocationChange = (value: string): void => {
        setLocation(value);
        applyFilters({ location: value });
    };

    const handleCategoryChange = (value: string): void => {
        setCategory(value);
        applyFilters({ category: value });
    };

    const toggleType = (type: JobTypeKey): void => {
        const next = selectedTypes.includes(type)
            ? selectedTypes.filter((item) => item !== type)
            : [...selectedTypes, type];

        setSelectedTypes(next);
        applyFilters({ types: next });
    };

    const clearFilters = (): void => {
        setLocation('');
        setCategory('all');
        setSelectedTypes([]);
        setKeyword('');
        router.get('/job-seeker/jobs');
    };

    const handleSearch = (event: FormEvent): void => {
        event.preventDefault();
        applyFilters({ search: keyword });
    };

    return (
        <JobSeekerLayout title={t('job_seeker.nav.jobs')}>
            <Head title={t('job_seeker.nav.jobs')} />

            <div className="space-y-6 p-6">
                <div>
                    <h1 className="text-2xl font-bold tracking-[-0.3px] text-[#050315]">
                        {t('jobs_page.title')}
                    </h1>
                    <p className="mt-1 text-sm text-[#6a7282]">
                        {t('job_seeker.jobs.subtitle')}
                    </p>
                </div>

                <form
                    onSubmit={handleSearch}
                    className="grid gap-3 rounded-2xl border border-[#e2e8f0] bg-white p-4 shadow-[0px_1px_3px_rgba(0,0,0,0.06)] sm:grid-cols-2 lg:grid-cols-[2fr_1fr_auto]"
                >
                    <label className="relative flex items-center">
                        <img
                            src="/images/jobs/search.svg"
                            alt=""
                            className="pointer-events-none absolute start-3 size-4"
                            width={16}
                            height={16}
                        />
                        <input
                            type="text"
                            value={keyword}
                            onChange={(event) => setKeyword(event.target.value)}
                            placeholder={t('jobs_page.search_placeholder')}
                            className="h-[46px] w-full rounded-xl border border-[#e2e8f0] bg-[#f9fafb] pe-4 ps-9 text-sm text-[#374151] outline-none placeholder:text-[rgba(55,65,81,0.5)] focus:border-[#0057c8]"
                        />
                    </label>

                    <LocationCombobox
                        value={location}
                        options={locationOptions}
                        onChange={handleLocationChange}
                        ariaLabel={t('jobs_page.all_locations')}
                        placeholder={t('jobs_page.all_locations')}
                        searchPlaceholder={t(
                            'jobs_page.location_search_placeholder',
                        )}
                        useCustomLabel={(query) =>
                            t('jobs_page.location_use_custom', { query })
                        }
                        emptyLabel={t('jobs_page.location_empty')}
                        showPin
                        className="min-w-0"
                    />

                    <button
                        type="submit"
                        className="h-[46px] rounded-xl bg-[#0057c8] px-6 text-sm font-semibold text-white transition hover:brightness-110"
                    >
                        {t('jobs_page.search')}
                    </button>
                </form>

                <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
                    <aside className="w-full shrink-0 lg:w-64">
                        <div className="rounded-2xl border border-[#d1f6ff] bg-white p-5 shadow-[0px_1px_1.5px_rgba(0,0,0,0.06)]">
                            <div className="flex items-center justify-between">
                                <h2 className="text-base font-bold text-[#101828]">
                                    {t('jobs_page.filters')}
                                </h2>
                                <button
                                    type="button"
                                    onClick={clearFilters}
                                    className="text-sm font-medium text-[#0057c8] transition hover:underline"
                                >
                                    {t('jobs_page.clear_all')}
                                </button>
                            </div>

                            <div className="mt-5">
                                <label className="mb-2 block text-sm font-medium text-[#364153]">
                                    {t('jobs_page.location')}
                                </label>
                                <LocationCombobox
                                    value={location}
                                    options={locationOptions}
                                    onChange={handleLocationChange}
                                    ariaLabel={t('jobs_page.location')}
                                    placeholder={t('jobs_page.all_locations')}
                                    searchPlaceholder={t(
                                        'jobs_page.location_search_placeholder',
                                    )}
                                    useCustomLabel={(query) =>
                                        t('jobs_page.location_use_custom', {
                                            query,
                                        })
                                    }
                                    emptyLabel={t('jobs_page.location_empty')}
                                />
                            </div>

                            <div className="mt-5">
                                <label className="mb-2 block text-sm font-medium text-[#364153]">
                                    {t('jobs_page.category')}
                                </label>
                                <NativeSelect
                                    variant="filter"
                                    value={category}
                                    onChange={(event) =>
                                        handleCategoryChange(event.target.value)
                                    }
                                    aria-label={t('jobs_page.category')}
                                >
                                    <option value="all">
                                        {t('jobs_page.all_categories')}
                                    </option>
                                    {categories.map((item) => {
                                        const key = categoryTranslationKey(item);
                                        const label = t(key);

                                        return (
                                            <option key={item} value={item}>
                                                {label === key ? item : label}
                                            </option>
                                        );
                                    })}
                                </NativeSelect>
                            </div>

                            <div className="mt-5">
                                <p className="text-sm font-medium text-[#364153]">
                                    {t('jobs_page.job_type')}
                                </p>
                                <div className="mt-3 space-y-2.5">
                                    {jobTypeKeys.map((type) => (
                                        <label
                                            key={type}
                                            className="flex cursor-pointer items-center gap-3 text-sm text-[#364153]"
                                        >
                                            <input
                                                type="checkbox"
                                                checked={selectedTypes.includes(
                                                    type,
                                                )}
                                                onChange={() =>
                                                    toggleType(type)
                                                }
                                                className="size-4 rounded-[2px] border-[#767676] text-[#0057c8] accent-[#0057c8]"
                                            />
                                            <span>{t(`jobs.${type}`)}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </aside>

                    <div className="min-w-0 flex-1">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <p className="text-sm text-[#6a7282]">
                                <span
                                    className="font-bold text-[#101828]"
                                    dir="ltr"
                                >
                                    {jobs.total}
                                </span>{' '}
                                {t('jobs_page.results_found')}
                            </p>
                            <div className="flex shrink-0 items-center gap-2">
                                <span className="whitespace-nowrap text-sm text-[#6a7282]">
                                    {t('jobs_page.sort_by')}
                                </span>
                                <NativeSelect
                                    variant="compact"
                                    className="min-w-[140px]"
                                    value={sort}
                                    onChange={(event) =>
                                        setSort(event.target.value)
                                    }
                                    aria-label={t('jobs_page.sort_by')}
                                >
                                    <option value="latest">
                                        {t('jobs_page.sort_latest')}
                                    </option>
                                    <option value="salary">
                                        {t('jobs_page.sort_salary')}
                                    </option>
                                </NativeSelect>
                            </div>
                        </div>

                        <div className="mt-5 space-y-4">
                            {displayedJobs.map((job) => {
                                const jobHref =
                                    job.job_url ?? jobShow.url(job.slug);

                                return (
                                    <article
                                        key={job.id}
                                        className="flex flex-col gap-4 rounded-2xl border border-[#e2e8f0] bg-white p-5 shadow-[0px_1px_1.5px_rgba(0,0,0,0.06)] sm:flex-row sm:items-center sm:justify-between"
                                    >
                                        <div className="flex min-w-0 items-start gap-3">
                                            {job.logo_url ? (
                                                <img
                                                    src={job.logo_url}
                                                    alt={
                                                        job.company || job.title
                                                    }
                                                    className="size-12 shrink-0 rounded-xl border border-[#e2e8f0] bg-[#f8faff] object-contain p-1"
                                                />
                                            ) : (
                                                <div
                                                    className="flex size-12 shrink-0 items-center justify-center rounded-xl text-sm font-bold text-white"
                                                    style={{
                                                        backgroundImage:
                                                            'linear-gradient(135deg, rgb(30, 58, 138) 0%, rgb(37, 99, 235) 100%)',
                                                    }}
                                                >
                                                    {job.initials}
                                                </div>
                                            )}
                                            <div className="min-w-0">
                                                <Link
                                                    href={jobHref}
                                                    className="truncate text-base font-semibold text-[#1c398e] hover:underline"
                                                >
                                                    {job.title}
                                                </Link>
                                                <p className="mt-0.5 truncate text-sm text-[#6a7282]">
                                                    {job.company}
                                                </p>
                                                <div className="mt-2 flex flex-wrap gap-1.5">
                                                    {job.type ? (
                                                        <span
                                                            className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${typeClass(job.type)}`}
                                                        >
                                                            {job.type}
                                                        </span>
                                                    ) : null}
                                                    {job.location ? (
                                                        <span className="rounded-full bg-[#f1f5f9] px-2.5 py-0.5 text-xs font-semibold text-[#475569]">
                                                            {job.location}
                                                        </span>
                                                    ) : null}
                                                    {job.category ? (
                                                        <span className="rounded-full bg-[#f1f5f9] px-2.5 py-0.5 text-xs font-semibold text-[#475569]">
                                                            {job.category}
                                                        </span>
                                                    ) : null}
                                                </div>
                                                {job.salary ? (
                                                    <p className="mt-2 text-sm font-semibold text-[#0057c8]">
                                                        {job.salary}
                                                    </p>
                                                ) : null}
                                            </div>
                                        </div>

                                        <div className="flex shrink-0 gap-2">
                                            {job.applied ? (
                                                <span className="inline-flex h-10 items-center justify-center rounded-xl bg-[#e2e8f0] px-5 text-sm font-semibold text-[#64748b]">
                                                    {t(
                                                        'job_seeker.dashboard.applied',
                                                    )}
                                                </span>
                                            ) : (
                                                <Link
                                                    href={jobHref}
                                                    className="inline-flex h-10 items-center justify-center rounded-xl bg-[#0057c8] px-5 text-sm font-semibold text-white transition hover:brightness-110"
                                                >
                                                    {t('jobs_page.apply')}
                                                </Link>
                                            )}
                                        </div>
                                    </article>
                                );
                            })}
                        </div>

                        {displayedJobs.length === 0 ? (
                            <div className="mt-10 rounded-2xl border border-dashed border-[#e2e8f0] bg-white px-6 py-16 text-center">
                                <p className="text-base font-semibold text-[#101828]">
                                    {t('jobs_page.empty_title')}
                                </p>
                                <p className="mt-2 text-sm text-[#6a7282]">
                                    {t('jobs_page.empty_subtitle')}
                                </p>
                                <button
                                    type="button"
                                    onClick={clearFilters}
                                    className="mt-5 rounded-xl bg-[#0057c8] px-5 py-2.5 text-sm font-semibold text-white"
                                >
                                    {t('jobs_page.clear_all')}
                                </button>
                            </div>
                        ) : null}

                        {displayedJobs.length > 0 && jobs.last_page > 1 ? (
                            <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
                                {jobs.links.map((link) => (
                                    <Link
                                        key={link.label}
                                        href={link.url ?? ''}
                                        className={`inline-flex min-w-9 items-center justify-center rounded-lg px-3 py-2 text-sm font-semibold ${
                                            link.active
                                                ? 'bg-[#0057c8] text-white'
                                                : 'bg-white text-[#364153] hover:bg-[#f1f5f9]'
                                        } ${link.url ? '' : 'pointer-events-none opacity-40'}`}
                                        dangerouslySetInnerHTML={{
                                            __html: link.label,
                                        }}
                                    />
                                ))}
                            </div>
                        ) : null}
                    </div>
                </div>
            </div>
        </JobSeekerLayout>
    );
}
