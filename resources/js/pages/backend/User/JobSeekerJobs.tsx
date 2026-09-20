import { Head, Link, router } from '@inertiajs/react';
import { FormEvent, useMemo, useState } from 'react';

import { JobListingCard } from '@/components/frontend/job-listing-card';
import { JobSearchForm } from '@/components/frontend/job-search-form';
import { NativeSelect } from '@/components/ui/native-select';
import { useLocale } from '@/hooks/use-locale';
import JobSeekerLayout from '@/layouts/job-seeker-layout';
import { show as jobShow } from '@/routes/jobs';

type TaxonomyOption = { value: string; label: string };

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
    closing_date?: string | null;
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
        country?: string;
        location: string;
        category?: string;
        types?: string[];
    };
    filterOptions?: {
        countries: TaxonomyOption[];
        dutyStations: TaxonomyOption[];
        positionAreas: TaxonomyOption[];
        employmentTypes: TaxonomyOption[];
    };
};

export default function JobSeekerJobs({ jobs, filters, filterOptions }: Props) {
    const { t } = useLocale();
    const countries = filterOptions?.countries ?? [];
    const dutyStations = filterOptions?.dutyStations ?? [];
    const positionAreas = filterOptions?.positionAreas ?? [];
    const employmentTypes = filterOptions?.employmentTypes ?? [];

    const [keyword, setKeyword] = useState(filters.search ?? '');
    const [country, setCountry] = useState(filters.country ?? '');
    const [location, setLocation] = useState(filters.location ?? '');
    const [category, setCategory] = useState(
        filters.category && filters.category !== ''
            ? filters.category
            : 'all',
    );
    const [sort, setSort] = useState('latest');
    const [selectedTypes, setSelectedTypes] = useState<string[]>(
        () => filters.types ?? [],
    );

    const locationOptions = useMemo(
        () => [
            { value: '', label: t('jobs_page.all_locations') },
            ...dutyStations,
        ],
        [dutyStations, t],
    );

    const applyFilters = (overrides: {
        search?: string;
        country?: string;
        location?: string;
        category?: string;
        types?: string[];
    } = {}): void => {
        const nextSearch = overrides.search ?? keyword;
        const nextCountry = overrides.country ?? country;
        const nextLocation = overrides.location ?? location;
        const nextCategory = overrides.category ?? category;
        const nextTypes = overrides.types ?? selectedTypes;

        router.get(
            '/job-seeker/jobs',
            {
                search: nextSearch.trim() || undefined,
                country: nextCountry || undefined,
                location: nextLocation || undefined,
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

    const handleCountryChange = (value: string): void => {
        setCountry(value);
        applyFilters({ country: value });
    };

    const handleLocationChange = (value: string): void => {
        setLocation(value);
        applyFilters({ location: value });
    };

    const handleCategoryChange = (value: string): void => {
        setCategory(value);
        applyFilters({ category: value });
    };

    const toggleType = (type: string): void => {
        const next = selectedTypes.includes(type)
            ? selectedTypes.filter((item) => item !== type)
            : [...selectedTypes, type];

        setSelectedTypes(next);
        applyFilters({ types: next });
    };

    const clearFilters = (): void => {
        setCountry('');
        setLocation('');
        setCategory('all');
        setSelectedTypes([]);
        setKeyword('');
        router.get('/job-seeker/jobs');
    };

    const handleSearch = (event: FormEvent): void => {
        event.preventDefault();
        applyFilters({ search: keyword, location });
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

                <JobSearchForm
                    keyword={keyword}
                    location={location}
                    locationOptions={locationOptions}
                    keywordPlaceholder={t('jobs_page.search_placeholder')}
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
                    className="w-full"
                />

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
                                    {t('jobs_page.country')}
                                </label>
                                <NativeSelect
                                    variant="filter"
                                    value={country}
                                    onChange={(event) =>
                                        handleCountryChange(event.target.value)
                                    }
                                    aria-label={t('jobs_page.country')}
                                >
                                    <option value="">
                                        {t('jobs_page.all_countries')}
                                    </option>
                                    {countries.map((item) => (
                                        <option
                                            key={item.value}
                                            value={item.value}
                                        >
                                            {item.label}
                                        </option>
                                    ))}
                                </NativeSelect>
                            </div>

                            <div className="mt-5">
                                <label className="mb-2 block text-sm font-medium text-[#364153]">
                                    {t('jobs_page.duty_station')}
                                </label>
                                <NativeSelect
                                    variant="filter"
                                    value={location}
                                    onChange={(event) =>
                                        handleLocationChange(event.target.value)
                                    }
                                    aria-label={t('jobs_page.duty_station')}
                                >
                                    {locationOptions.map((option) => (
                                        <option
                                            key={option.value || 'all'}
                                            value={option.value}
                                        >
                                            {option.label}
                                        </option>
                                    ))}
                                </NativeSelect>
                            </div>

                            <div className="mt-5">
                                <label className="mb-2 block text-sm font-medium text-[#364153]">
                                    {t('jobs_page.position_area')}
                                </label>
                                <NativeSelect
                                    variant="filter"
                                    value={category}
                                    onChange={(event) =>
                                        handleCategoryChange(event.target.value)
                                    }
                                    aria-label={t('jobs_page.position_area')}
                                >
                                    <option value="all">
                                        {t('jobs_page.all_categories')}
                                    </option>
                                    {positionAreas.map((item) => (
                                        <option
                                            key={item.value}
                                            value={item.value}
                                        >
                                            {item.label}
                                        </option>
                                    ))}
                                </NativeSelect>
                            </div>

                            <div className="mt-5">
                                <p className="text-sm font-medium text-[#364153]">
                                    {t('jobs_page.job_type')}
                                </p>
                                <div className="mt-3 space-y-2.5">
                                    {employmentTypes.map((type) => (
                                        <label
                                            key={type.value}
                                            className="flex cursor-pointer items-center gap-3 text-sm text-[#364153]"
                                        >
                                            <input
                                                type="checkbox"
                                                checked={selectedTypes.includes(
                                                    type.value,
                                                )}
                                                onChange={() =>
                                                    toggleType(type.value)
                                                }
                                                className="size-4 rounded-[2px] border-[#767676] text-[#0057c8] accent-[#0057c8]"
                                            />
                                            <span>{type.label}</span>
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
                                <JobListingCard
                                    key={job.id}
                                    job={job}
                                    href={job.job_url ?? jobShow.url(job.slug)}
                                    applied={job.applied}
                                />
                            ))}
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
