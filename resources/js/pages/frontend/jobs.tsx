import { Head, Link, router } from '@inertiajs/react';
import { FormEvent, useMemo, useState } from 'react';

import { JobSearchForm } from '@/components/frontend/job-search-form';
import { LocationCombobox } from '@/components/frontend/location-combobox';
import { NativeSelect } from '@/components/ui/native-select';
import { useLocale } from '@/hooks/use-locale';
import FrontendLayout from '@/layouts/frontend-layout';
import {
    categoryTranslationKey,
} from '@/lib/job-filters';
import { sudanLocationKeys } from '@/lib/sudan-locations';
import { jobs as jobsRoute } from '@/routes';
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
        location: string;
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

export default function Jobs({ jobs, filters, filterOptions }: Props) {
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
            jobsRoute.url(),
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
        router.get(jobsRoute.url());
    };

    const handleSearch = (event: FormEvent): void => {
        event.preventDefault();
        applyFilters({ search: keyword });
    };

    return (
        <FrontendLayout>
            <Head title={`${t('jobs_page.title')} - ${t('app.name')}`} />

            <section className="relative bg-[#d1f6ff] px-4 py-10 sm:px-6 sm:py-12 lg:px-8 lg:py-14">
                <div
                    aria-hidden
                    className="pointer-events-none absolute inset-0 overflow-hidden"
                >
                    <div className="absolute -start-24 -top-28 size-72 rounded-full bg-[#0057c8]/10 blur-3xl" />
                    <div className="absolute -end-16 top-10 size-64 rounded-full bg-[#e57124]/15 blur-3xl" />
                    <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-white/50 to-transparent" />
                </div>

                <div className="relative mx-auto max-w-[1280px] animate-fadeInUp">
                    <nav className="mb-5 flex flex-wrap items-center gap-2 text-sm text-[#6a7282]">
                        <span className="font-medium text-[#0057c8]">
                            {t('nav.jobs')}
                        </span>
                    </nav>

                    <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between lg:gap-10">
                        <div className="min-w-0 max-w-xl">
                            <div className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/80 px-3 py-1.5 shadow-sm backdrop-blur">
                                <span className="size-1.5 rounded-full bg-[#05df72]" />
                                <span className="text-xs font-semibold text-[#050315]">
                                    {t('jobs_page.live_openings', {
                                        count: jobs.total,
                                    })}
                                </span>
                            </div>

                            <h1 className="mt-3 text-[28px] font-bold tracking-[-0.5px] text-[#050315] sm:text-[36px] sm:leading-[1.15] lg:text-[40px]">
                                {t('jobs_page.title')}
                            </h1>
                            <p className="mt-2 max-w-md text-sm font-medium leading-6 text-[#475569]">
                                {t('jobs_page.subtitle')}
                            </p>
                        </div>

                        <JobSearchForm
                            keyword={keyword}
                            location={location}
                            locationOptions={locationOptions}
                            keywordPlaceholder={t(
                                'jobs_page.search_placeholder',
                            )}
                            locationAriaLabel={t('jobs_page.all_locations')}
                            locationSearchPlaceholder={t(
                                'jobs_page.location_search_placeholder',
                            )}
                            locationUseCustomLabel={(query) =>
                                t('jobs_page.location_use_custom', { query })
                            }
                            locationEmptyLabel={t('jobs_page.location_empty')}
                            submitLabel={t('jobs_page.search')}
                            onKeywordChange={setKeyword}
                            onLocationChange={handleLocationChange}
                            onSubmit={handleSearch}
                            compact
                            className="w-full lg:max-w-[560px] lg:flex-1"
                        />
                    </div>
                </div>
            </section>

            <section className="bg-white px-4 py-8 sm:px-6 lg:px-8">
                <div className="mx-auto flex max-w-[1280px] flex-col gap-6 lg:flex-row lg:items-start">
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
                                                onChange={() => toggleType(type)}
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
                            {displayedJobs.map((job) => (
                                <article
                                    key={job.id ?? `${job.company}-${job.title}`}
                                    className="flex flex-col gap-4 rounded-2xl border border-[#e2e8f0] bg-white p-5 shadow-[0px_1px_1.5px_rgba(0,0,0,0.06)] transition hover:border-[#cbd5e1] hover:shadow-md sm:flex-row sm:items-center sm:justify-between"
                                >
                                    <div className="flex min-w-0 items-start gap-3">
                                        {job.logo_url ? (
                                            <img
                                                src={job.logo_url}
                                                alt={job.company || job.title}
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
                                                href={jobShow.url(job.slug)}
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

                                    <div className="flex shrink-0">
                                        <Link
                                            href={jobShow.url(job.slug)}
                                            className="inline-flex h-10 items-center justify-center rounded-xl bg-[#0057c8] px-5 text-sm font-semibold text-white transition hover:brightness-110"
                                        >
                                            {t('jobs_page.apply')}
                                        </Link>
                                    </div>
                                </article>
                            ))}
                        </div>

                        {displayedJobs.length === 0 && (
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
                        )}

                        {displayedJobs.length > 0 && jobs.last_page > 1 && (
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
                        )}
                    </div>
                </div>
            </section>
        </FrontendLayout>
    );
}
