import { FormEvent, useMemo, useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';

import { useLocale } from '@/hooks/use-locale';
import FrontendLayout from '@/layouts/frontend-layout';
import { home } from '@/routes';
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
    location: string | null;
    type: string | null;
    category: string | null;
    salary: string | null;
    featured: boolean;
};

type Props = {
    jobs: {
        data: JobRow[];
        links: Array<{ url: string | null; label: string; active: boolean }>;
        total: number;
        current_page: number;
        last_page: number;
    };
    filters: { search: string };
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

export default function Jobs({ jobs, filters }: Props) {
    const { t } = useLocale();
    const [keyword, setKeyword] = useState(filters.search ?? '');
    const [location, setLocation] = useState('all');
    const [category, setCategory] = useState('all');
    const [sort, setSort] = useState('latest');
    const [selectedTypes, setSelectedTypes] = useState<JobTypeKey[]>([]);

    const filteredJobs = useMemo(() => {
        return jobs.data.filter((job) => {
            const matchesLocation =
                location === 'all' ||
                (job.location ?? '').toLowerCase().includes(location.toLowerCase());
            const matchesCategory =
                category === 'all' ||
                (job.category ?? '').toLowerCase().includes(category.toLowerCase());
            const matchesType =
                selectedTypes.length === 0 ||
                selectedTypes.some((type) =>
                    (job.type ?? '').toLowerCase().includes(type.replace('_', ' ')),
                );

            return matchesLocation && matchesCategory && matchesType;
        });
    }, [jobs.data, location, category, selectedTypes]);

    const toggleType = (type: JobTypeKey) => {
        setSelectedTypes((current) =>
            current.includes(type)
                ? current.filter((item) => item !== type)
                : [...current, type],
        );
    };

    const clearFilters = () => {
        setLocation('all');
        setCategory('all');
        setSelectedTypes([]);
        setKeyword('');
        router.get('/jobs');
    };

    const handleSearch = (event: FormEvent) => {
        event.preventDefault();
        router.get('/jobs', { search: keyword }, { preserveState: true });
    };

    return (
        <FrontendLayout>
            <Head title={`${t('jobs_page.title')} - RR Job Portal`} />

            <section className="bg-[#d1f6ff] px-4 py-10 sm:px-6 lg:px-8">
                <div className="mx-auto max-w-[1280px]">
                    <nav className="flex flex-wrap items-center gap-2 text-sm text-[#6a7282]">
                        <Link href={home()} className="transition hover:text-[#0057c8]">
                            {t('nav.home')}
                        </Link>
                        <img
                            src="/images/jobs/breadcrumb-chevron.svg"
                            alt=""
                            className="size-4 rtl:rotate-180"
                            width={16}
                            height={16}
                        />
                        <span className="font-medium text-[#0057c8]">{t('nav.jobs')}</span>
                    </nav>

                    <h1 className="mt-4 text-3xl font-bold tracking-[-0.3px] text-[#050315] sm:text-[40px] sm:leading-[56px]">
                        {t('jobs_page.title')}
                    </h1>

                    <form
                        onSubmit={handleSearch}
                        className="mt-6 grid gap-3 rounded-2xl bg-white p-4 shadow-[0px_4px_2px_rgba(0,0,0,0.12)] sm:grid-cols-2 lg:grid-cols-[2fr_1fr_auto]"
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

                        <label className="flex items-center gap-3 rounded-xl border border-[#e2e8f0] bg-[#f9fafb] px-4 py-3">
                            <img
                                src="/images/jobs/map-pin.svg"
                                alt=""
                                className="size-5 shrink-0"
                                width={20}
                                height={20}
                            />
                            <select
                                value={location}
                                onChange={(event) => {
                                    setLocation(event.target.value);
                                }}
                                className="w-full appearance-none bg-transparent text-sm text-[#374151] outline-none"
                            >
                                <option value="all">{t('jobs_page.all_locations')}</option>
                                <option value="riyadh">Riyadh</option>
                                <option value="jeddah">Jeddah</option>
                                <option value="dammam">Dammam</option>
                                <option value="dubai">Dubai</option>
                                <option value="doha">Doha</option>
                                <option value="remote">Remote</option>
                            </select>
                            <img
                                src="/images/jobs/chevron-down.svg"
                                alt=""
                                className="size-2.5 shrink-0"
                                width={10}
                                height={6}
                            />
                        </label>

                        <button
                            type="submit"
                            className="h-[46px] rounded-xl bg-[#0057c8] px-6 text-sm font-semibold text-white transition hover:brightness-110"
                        >
                            {t('jobs_page.search')}
                        </button>
                    </form>
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
                                <div className="relative">
                                    <select
                                        value={location}
                                        onChange={(event) => {
                                            setLocation(event.target.value);
                                        }}
                                        className="h-[42px] w-full appearance-none rounded-xl border border-[#e2e8f0] bg-[#f9fafb] px-4 pe-8 text-sm text-[#374151] outline-none"
                                    >
                                        <option value="all">{t('jobs_page.all_locations')}</option>
                                        <option value="riyadh">Riyadh</option>
                                        <option value="jeddah">Jeddah</option>
                                        <option value="dammam">Dammam</option>
                                        <option value="dubai">Dubai</option>
                                        <option value="doha">Doha</option>
                                        <option value="remote">Remote</option>
                                    </select>
                                    <img
                                        src="/images/jobs/chevron-down.svg"
                                        alt=""
                                        className="pointer-events-none absolute end-3 top-1/2 size-2.5 -translate-y-1/2"
                                        width={10}
                                        height={6}
                                    />
                                </div>
                            </div>

                            <div className="mt-5">
                                <label className="mb-2 block text-sm font-medium text-[#364153]">
                                    {t('jobs_page.category')}
                                </label>
                                <div className="relative">
                                    <select
                                        value={category}
                                        onChange={(event) => setCategory(event.target.value)}
                                        className="h-[42px] w-full appearance-none rounded-xl border border-[#e2e8f0] bg-[#f9fafb] px-4 pe-8 text-sm text-[#374151] outline-none"
                                    >
                                        <option value="all">{t('jobs_page.all_categories')}</option>
                                        <option value="engineering">Engineering</option>
                                        <option value="marketing">Marketing</option>
                                        <option value="finance">Finance</option>
                                        <option value="design">Design</option>
                                        <option value="hr">HR</option>
                                        <option value="sales">Sales</option>
                                    </select>
                                    <img
                                        src="/images/jobs/chevron-down.svg"
                                        alt=""
                                        className="pointer-events-none absolute end-3 top-1/2 size-2.5 -translate-y-1/2"
                                        width={10}
                                        height={6}
                                    />
                                </div>
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
                                                checked={selectedTypes.includes(type)}
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
                                <span className="font-bold text-[#101828]" dir="ltr">
                                    {filteredJobs.length}
                                </span>{' '}
                                {t('jobs_page.results_found')}
                            </p>
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-[#6a7282]">
                                    {t('jobs_page.sort_by')}
                                </span>
                                <div className="relative">
                                    <select
                                        value={sort}
                                        onChange={(event) => setSort(event.target.value)}
                                        className="h-[34px] appearance-none rounded-lg border border-[#e2e8f0] bg-white px-4 pe-8 text-sm text-[#374151] outline-none"
                                    >
                                        <option value="latest">{t('jobs_page.sort_latest')}</option>
                                        <option value="salary">{t('jobs_page.sort_salary')}</option>
                                    </select>
                                    <img
                                        src="/images/jobs/chevron-down.svg"
                                        alt=""
                                        className="pointer-events-none absolute end-3 top-1/2 size-2.5 -translate-y-1/2"
                                        width={10}
                                        height={6}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="mt-5 grid gap-4 md:grid-cols-2">
                            {filteredJobs.map((job) => (
                                <article
                                    key={`${job.company}-${job.title}`}
                                    className="flex h-full flex-col rounded-2xl border border-[#e2e8f0] bg-white p-5 shadow-[0px_1px_1.5px_rgba(0,0,0,0.06)] transition hover:-translate-y-0.5 hover:shadow-md"
                                >
                                    <div className="flex items-start gap-3">
                                        <div
                                            className="flex size-12 shrink-0 items-center justify-center rounded-xl text-sm font-bold text-white"
                                            style={{
                                                backgroundImage:
                                                    'linear-gradient(135deg, rgb(30, 58, 138) 0%, rgb(37, 99, 235) 100%)',
                                            }}
                                        >
                                            {job.initials}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <h3 className="truncate text-sm font-semibold text-[#101828]">
                                                {job.title}
                                            </h3>
                                            <p className="mt-0.5 truncate text-xs text-[#6a7282]">
                                                {job.company}
                                            </p>
                                        </div>
                                        {job.featured && (
                                            <span className="shrink-0 rounded-full bg-[#fef9c3] px-2.5 py-0.5 text-xs font-semibold text-[#92400e]">
                                                ⭐
                                            </span>
                                        )}
                                    </div>

                                    <div className="mt-3 flex flex-wrap gap-1.5">
                                        <span
                                            className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${typeClass(job.type)}`}
                                        >
                                            {job.type}
                                        </span>
                                        <span className="rounded-full bg-[#f1f5f9] px-2.5 py-0.5 text-xs font-semibold text-[#475569]">
                                            {job.location}
                                        </span>
                                        {job.category && (
                                            <span className="rounded-full bg-[#f1f5f9] px-2.5 py-0.5 text-xs font-semibold text-[#475569]">
                                                {job.category}
                                            </span>
                                        )}
                                    </div>

                                    <div className="mt-auto flex items-center justify-between gap-3 border-t border-[#f1f5f9] pt-3">
                                        <div className="min-w-0">
                                            <p className="mt-0.5 truncate text-sm font-semibold text-[#0057c8]">
                                                {job.salary}
                                            </p>
                                        </div>
                                        <Link
                                            href={jobShow.url(job.slug)}
                                            className="shrink-0 rounded-xl bg-[#0057c8] px-4 py-2 text-xs font-semibold text-white transition hover:brightness-110"
                                        >
                                            {t('jobs_page.apply')}
                                        </Link>
                                    </div>
                                </article>
                            ))}
                        </div>

                        {filteredJobs.length === 0 && (
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

                        {filteredJobs.length > 0 && (
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
