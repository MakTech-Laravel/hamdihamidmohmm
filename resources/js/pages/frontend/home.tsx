import { Head, Link, router } from '@inertiajs/react';
import { FormEvent, useMemo, useState } from 'react';

import { JobSearchForm } from '@/components/frontend/job-search-form';
import PricingPackageCards, {
    type PricingPackage,
} from '@/components/frontend/pricing-package-cards';
import { useLocale } from '@/hooks/use-locale';
import FrontendLayout from '@/layouts/frontend-layout';
import { jobs, pricing } from '@/routes';
import { show as jobShow } from '@/routes/jobs';
import { role as registerRole } from '@/routes/register';

type TaxonomyOption = { value: string; label: string };

type FilterOptions = {
    countries: TaxonomyOption[];
    dutyStations: TaxonomyOption[];
    positionAreas: TaxonomyOption[];
    employmentTypes: TaxonomyOption[];
};

export default function Home({
    packages = [],
    recommendedJobs = [],
    filterOptions = {
        countries: [],
        dutyStations: [],
        positionAreas: [],
        employmentTypes: [],
    },
}: {
    packages?: PricingPackage[];
    recommendedJobs?: Array<{
        slug: string;
        initials: string;
        logo_url?: string | null;
        title: string;
        company: string;
        type: string;
        location: string;
        experience: string;
        posted: string;
        salary: string;
    }>;
    filterOptions?: FilterOptions;
}) {
    const { t } = useLocale();
    const [keyword, setKeyword] = useState('');
    const [location, setLocation] = useState('');
    const [email, setEmail] = useState('');

    const locationOptions = useMemo(
        () => [
            { value: '', label: t('search.all_locations') },
            ...filterOptions.dutyStations,
        ],
        [filterOptions.dutyStations, t],
    );

    const features = useMemo(
        () => [
            {
                title: t('why.jobs.title'),
                description: t('why.jobs.description'),
                icon: '/images/home/briefcase.svg',
                iconBg: 'bg-[#eff6ff]',
            },
            {
                title: t('why.apply.title'),
                description: t('why.apply.description'),
                icon: '/images/home/target.svg',
                iconBg: 'bg-[#fff7ed]',
            },
            {
                title: t('why.manage.title'),
                description: t('why.manage.description'),
                icon: '/images/home/users.svg',
                iconBg: 'bg-[#f0fdf4]',
            },
            {
                title: t('why.secure.title'),
                description: t('why.secure.description'),
                icon: '/images/home/shield.svg',
                iconBg: 'bg-[#fdf4ff]',
            },
        ],
        [t],
    );

    const stats = useMemo(
        () => [
            { value: '12,450+', label: t('stats.active_jobs') },
            { value: '3,200+', label: t('stats.companies') },
            { value: '48,000+', label: t('stats.seekers') },
            { value: '95,000+', label: t('stats.applications') },
        ],
        [t],
    );

    const typeClass = (type: string): string => {
        const normalized = type.toLowerCase();

        if (normalized.includes('remote')) {
            return 'bg-[#dbeafe] text-[#2563eb]';
        }

        return 'bg-[#dcfce7] text-[#16a34a]';
    };

    const seekerBenefits = useMemo(
        () => [
            t('seeker.benefit_1'),
            t('seeker.benefit_2'),
            t('seeker.benefit_3'),
            t('seeker.benefit_4'),
        ],
        [t],
    );

    const employerBenefits = useMemo(
        () => [
            t('employer.benefit_1'),
            t('employer.benefit_2'),
            t('employer.benefit_3'),
            t('employer.benefit_4'),
        ],
        [t],
    );

    const handleSearch = (event: FormEvent) => {
        event.preventDefault();

        router.get(jobs.url(), {
            search: keyword || undefined,
            location: location || undefined,
        });
    };

    const handleSubscribe = (event: FormEvent) => {
        event.preventDefault();
    };

    return (
        <FrontendLayout>
            <Head title={t('app.name')} />

            {/* Hero */}
            <section className="relative bg-[#d1f6ff]">
                <div className="mx-auto max-w-[1344px] px-4 pb-20 pt-14 sm:px-6 sm:pt-16 lg:px-8 lg:pb-24 lg:pt-20">
                    <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
                        <div className="animate-fadeInUp">
                            <div className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 shadow-sm">
                                <span className="size-1.5 rounded-full bg-[#05df72]" />
                                <span className="text-xs font-semibold text-[#050315]">
                                    {t('hero.badge')}
                                </span>
                            </div>

                            <h1 className="mt-5 max-w-xl text-4xl font-bold leading-[1.15] tracking-[-0.8px] text-[#e57124] sm:text-5xl lg:text-[64px] lg:leading-[76px]">
                                {t('hero.title')}
                            </h1>

                            <p className="mt-6 max-w-xl text-base font-medium leading-[22px] tracking-[-0.18px] text-[#050315]">
                                {t('hero.subtitle')}
                            </p>

                            <div className="mt-8 flex flex-wrap gap-3">
                                <Link
                                    href={jobs()}
                                    className="inline-flex h-[60px] items-center gap-[7px] rounded-xl bg-[#0057c8] px-8 text-base font-medium tracking-[-0.18px] text-white shadow-[0px_10px_7.5px_rgba(0,0,0,0.1),0px_4px_3px_rgba(0,0,0,0.1)] transition hover:brightness-110"
                                >
                                    {t('hero.find_jobs')}
                                    <img
                                        src="/images/home/arrow-right.svg"
                                        alt=""
                                        className="size-5 rtl:rotate-180"
                                        width={20}
                                        height={20}
                                    />
                                </Link>
                                <Link
                                    href={registerRole.url('employer')}
                                    className="inline-flex h-[60px] items-center justify-center rounded-xl border-2 border-[#e57124] px-8 text-base font-medium tracking-[-0.18px] text-[#e57124] transition hover:bg-[#e57124]/10"
                                >
                                    {t('hero.post_job')}
                                </Link>
                            </div>
                        </div>

                        <div className="relative mx-auto w-full max-w-[448px] px-6 sm:px-10 animate-fadeInUp">
                            <div
                                className="absolute top-[-16px] end-2 h-[176px] w-[70%] max-w-[288px] rounded-2xl opacity-30"
                                style={{
                                    backgroundImage:
                                        'linear-gradient(148.57deg, rgb(59, 130, 246) 0%, rgb(37, 99, 235) 100%)',
                                }}
                            />

                            <div className="relative rounded-2xl bg-white p-6 shadow-[0px_25px_25px_rgba(0,0,0,0.25)]">
                                <div className="flex items-center gap-3">
                                    <div
                                        className="flex size-12 shrink-0 items-center justify-center rounded-xl text-base font-bold text-white"
                                        style={{
                                            backgroundImage:
                                                'linear-gradient(135deg, rgb(30, 58, 138) 0%, rgb(37, 99, 235) 100%)',
                                        }}
                                    >
                                        TC
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-sm font-semibold text-[#101828]">
                                            {t('hero.preview.title')}
                                        </p>
                                        <p className="text-xs text-[#6a7282]">
                                            {t('hero.preview.company')}
                                        </p>
                                    </div>
                                    <span className="shrink-0 rounded-full bg-[#dcfce7] px-2.5 py-0.5 text-xs font-semibold text-[#16a34a]">
                                        {t('hero.preview.type')}
                                    </span>
                                </div>
                                <div className="mt-5 flex flex-wrap gap-2">
                                    <span className="rounded-full bg-[#f1f5f9] px-2.5 py-0.5 text-xs font-semibold text-[#475569]">
                                        {t('hero.preview.location')}
                                    </span>
                                    <span className="rounded-full bg-[#f1f5f9] px-2.5 py-0.5 text-xs font-semibold text-[#475569]">
                                        {t('hero.preview.salary')}
                                    </span>
                                </div>
                                <div className="mt-4 flex items-center justify-between gap-3">
                                    <p className="text-xs text-[#99a1af]">
                                        {t('hero.preview.posted')}
                                    </p>
                                    <button
                                        type="button"
                                        className="rounded-lg bg-[#1e3a8a] px-4 py-2 text-xs font-semibold text-white"
                                    >
                                        {t('hero.preview.apply')}
                                    </button>
                                </div>
                            </div>

                            <div className="absolute start-0 top-[70%] z-10 hidden w-[107px] -translate-x-1/4 rounded-xl border border-[#e2e8f0] bg-white p-3 shadow-[0px_10px_7.5px_rgba(0,0,0,0.1),0px_4px_3px_rgba(0,0,0,0.1)] sm:block rtl:translate-x-1/4">
                                <p className="text-xs text-[#6a7282]">{t('hero.preview.active_jobs')}</p>
                                <p dir="ltr" className="text-xl font-extrabold leading-7 text-[#1e3a8a]">
                                    12,450+
                                </p>
                            </div>

                            <div className="absolute end-0 top-[40%] z-10 hidden w-[99px] translate-x-1/4 rounded-xl border border-[#e2e8f0] bg-white p-3 shadow-[0px_10px_7.5px_rgba(0,0,0,0.1),0px_4px_3px_rgba(0,0,0,0.1)] sm:block rtl:-translate-x-1/4">
                                <p className="text-xs text-[#6a7282]">{t('hero.preview.companies')}</p>
                                <p dir="ltr" className="text-xl font-extrabold leading-7 text-[#f97316]">
                                    3,200+
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Floating search — overlaps hero / next section */}
            <section className="relative z-20 -mt-8 px-4 sm:-mt-10 sm:px-6 lg:px-8">
                <JobSearchForm
                    keyword={keyword}
                    location={location}
                    locationOptions={locationOptions}
                    keywordPlaceholder={t('search.keyword_placeholder')}
                    locationAriaLabel={t('search.all_locations')}
                    locationSearchPlaceholder={t(
                        'jobs_page.location_search_placeholder',
                    )}
                    locationUseCustomLabel={(query) =>
                        t('jobs_page.location_use_custom', { query })
                    }
                    locationEmptyLabel={t('jobs_page.location_empty')}
                    submitLabel={t('search.submit')}
                    onKeywordChange={setKeyword}
                    onLocationChange={setLocation}
                    onSubmit={handleSearch}
                    showSubmitIcon
                    className="mx-auto max-w-[960px] border-[#e2e8f0] bg-white shadow-[0px_16px_28px_rgba(5,3,21,0.1)]"
                />
            </section>

            {/* Why Choose Us */}
            <section id="about" className="scroll-mt-28 bg-white pt-16 pb-20 sm:pt-20">
                <div className="mx-auto max-w-[1344px] px-4 sm:px-6 lg:px-8">
                    <div className="text-center">
                        <h2 className="text-3xl font-bold tracking-[-0.3px] text-[#050315] sm:text-[40px] sm:leading-[48px]">
                            {t('why.title')}
                        </h2>
                        <p className="mx-auto mt-4 max-w-xl text-base text-[#6a7282]">
                            {t('why.subtitle')}
                        </p>
                    </div>

                    <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                        {features.map((feature) => (
                            <div
                                key={feature.title}
                                className="rounded-2xl border border-[#e2e8f0] bg-white p-6 shadow-[0px_1px_1.5px_rgba(0,0,0,0.06)] transition hover:-translate-y-0.5 hover:shadow-md"
                            >
                                <div
                                    className={`mx-auto flex size-14 items-center justify-center rounded-2xl ${feature.iconBg}`}
                                >
                                    <img
                                        src={feature.icon}
                                        alt=""
                                        className="size-6"
                                        width={24}
                                        height={24}
                                    />
                                </div>
                                <h3 className="mt-4 text-center text-sm font-bold text-[#0f172a]">
                                    {feature.title}
                                </h3>
                                <p className="mt-2 text-center text-xs leading-[19.5px] text-[#6a7282]">
                                    {feature.description}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Stats */}
            <section className="bg-[#d1f6ff] py-20">
                <div className="mx-auto max-w-[1344px] px-4 sm:px-6 lg:px-8">
                    <h2 className="text-center text-3xl font-bold tracking-[-0.3px] text-[#0057c8] sm:text-[40px] sm:leading-[48px]">
                        {t('stats.title')}
                    </h2>
                    <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
                        {stats.map((stat) => (
                            <div key={stat.label} className="text-center">
                                <p
                                    dir="ltr"
                                    className="text-4xl font-extrabold leading-[48px] text-[#050315] sm:text-[48px]"
                                >
                                    {stat.value}
                                </p>
                                <p className="mt-2 text-sm font-medium text-[#3977a6]">
                                    {stat.label}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Recommended Jobs */}
            <section id="jobs" className="scroll-mt-28 bg-white py-20">
                <div className="mx-auto max-w-[1344px] px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
                        <div>
                            <h2 className="text-3xl font-bold tracking-[-0.3px] text-[#050315] sm:text-[40px] sm:leading-[48px]">
                                {t('jobs.title')}
                            </h2>
                            <p className="mt-2 text-base text-[rgba(5,3,21,0.6)]">
                                {t('jobs.subtitle')}
                            </p>
                        </div>
                        <Link
                            href={jobs()}
                            className="inline-flex shrink-0 items-center gap-2 text-sm font-semibold text-[#0057c8] transition hover:underline"
                        >
                            {t('jobs.view_all')}
                            <img
                                src="/images/home/arrow-link.svg"
                                alt=""
                                className="size-4 rtl:rotate-180"
                                width={16}
                                height={16}
                            />
                        </Link>
                    </div>

                    {recommendedJobs.length === 0 ? (
                        <div className="mt-10 rounded-2xl border border-dashed border-[#e2e8f0] bg-[#f8faff] px-6 py-16 text-center">
                            <p className="text-base font-semibold text-[#050315]">
                                {t('home.recommended_empty_title')}
                            </p>
                            <p className="mt-2 text-sm text-[#64748b]">
                                {t('home.recommended_empty_subtitle')}
                            </p>
                        </div>
                    ) : (
                        <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {recommendedJobs.map((job) => (
                                <article
                                    key={job.slug}
                                    className="flex h-full flex-col rounded-2xl border border-[rgba(57,119,166,0.52)] bg-white p-5 shadow-[0px_1px_1.5px_rgba(0,0,0,0.06)] transition hover:-translate-y-0.5 hover:shadow-md"
                                >
                                    <div className="flex items-start gap-3">
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
                                            <h3 className="truncate text-sm font-medium tracking-[-0.16px] text-[#050315]">
                                                {job.title}
                                            </h3>
                                            <p className="mt-0.5 truncate text-xs text-[#6a7282]">
                                                {job.company}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="mt-3 flex flex-wrap gap-1.5">
                                        <span
                                            className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${typeClass(job.type)}`}
                                        >
                                            {job.type}
                                        </span>
                                        <span className="rounded-full bg-[#f1f5f9] px-2.5 py-0.5 text-xs font-semibold text-[#475569]">
                                            📍 {job.location}
                                        </span>
                                        <span className="rounded-full bg-[#f1f5f9] px-2.5 py-0.5 text-xs font-semibold text-[#475569]">
                                            💼 {job.experience}
                                        </span>
                                    </div>

                                    <div className="mt-auto flex items-center justify-between gap-3 border-t border-[#f1f5f9] pt-3">
                                        <div className="min-w-0">
                                            <p className="text-xs tracking-[-0.12px] text-[#3977a6]">
                                                {job.posted}
                                            </p>
                                            <p className="mt-0.5 truncate text-sm font-semibold tracking-[-0.16px] text-[#0057c8]">
                                                {job.salary}
                                            </p>
                                        </div>
                                        <Link
                                            href={jobShow.url(job.slug)}
                                            className="shrink-0 rounded-xl bg-[#0057c8] px-4 py-2 text-xs font-semibold text-white transition hover:brightness-110"
                                        >
                                            {t('jobs.apply_now')}
                                        </Link>
                                    </div>
                                </article>
                            ))}
                        </div>
                    )}
                </div>
            </section>

            {/* Job Seeker CTA */}
            <section className="bg-linear-to-b from-[#f8faff] to-[#eff6ff] px-4 py-20 sm:px-6 lg:px-8">
                <div className="mx-auto max-w-[1344px] overflow-hidden rounded-3xl bg-white shadow-[0px_8px_40px_0px_rgba(30,58,138,0.1)]">
                    <div className="grid lg:grid-cols-2">
                        <div className="p-8 sm:p-12 lg:p-14">
                            <span className="inline-flex rounded-full bg-[#eff6ff] px-3 py-1.5 text-xs font-semibold text-[#1e3a8a]">
                                {t('seeker.badge')}
                            </span>
                            <h2 className="mt-4 text-3xl font-bold tracking-[-0.3px] text-[#050315] sm:text-[40px] sm:leading-[48px]">
                                {t('seeker.title')}
                            </h2>
                            <p className="mt-4 max-w-lg text-base tracking-[-0.18px] text-[rgba(5,3,21,0.6)]">
                                {t('seeker.subtitle')}
                            </p>
                            <ul className="mt-8 space-y-3">
                                {seekerBenefits.map((benefit) => (
                                    <li
                                        key={benefit}
                                        className="flex items-center gap-3 text-sm tracking-[-0.16px] text-[rgba(5,3,21,0.8)]"
                                    >
                                        <span className="inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-[#dcfce7]">
                                            <img
                                                src="/images/home/check.svg"
                                                alt=""
                                                className="size-3"
                                                width={12}
                                                height={12}
                                            />
                                        </span>
                                        {benefit}
                                    </li>
                                ))}
                            </ul>
                            <div className="mt-8 flex flex-wrap gap-3">
                                <Link
                                    href={registerRole.url('job-seeker')}
                                    className="rounded-xl bg-[#0057c8] px-6 py-3 text-sm font-bold text-white transition hover:brightness-110"
                                >
                                    {t('seeker.cta_primary')}
                                </Link>
                                <Link
                                    href={jobs()}
                                    className="rounded-xl border border-[#e57124] px-6 py-3 text-sm font-bold text-[#e57124] transition hover:bg-[#e57124]/10"
                                >
                                    {t('seeker.cta_secondary')}
                                </Link>
                            </div>
                        </div>

                        <div className="relative flex min-h-[280px] items-center justify-center bg-[rgba(0,87,200,0.08)] p-12">
                            <div className="relative">
                                <div
                                    className="flex size-48 items-center justify-center rounded-full"
                                    style={{
                                        backgroundImage:
                                            'linear-gradient(135deg, rgb(30, 58, 138) 0%, rgb(37, 99, 235) 100%)',
                                    }}
                                >
                                    <img
                                        src="/images/home/user-large.svg"
                                        alt=""
                                        className="size-24"
                                        width={96}
                                        height={96}
                                    />
                                </div>
                                <div className="absolute -top-3 -end-8 hidden w-[95px] rounded-xl bg-white p-3 shadow-[0px_10px_7.5px_rgba(0,0,0,0.1),0px_4px_3px_rgba(0,0,0,0.1)] sm:block">
                                    <p className="text-xs text-[#6a7282]">{t('seeker.stat_applications')}</p>
                                    <p className="text-lg font-extrabold leading-7 text-[#1e3a8a]">
                                        95K+
                                    </p>
                                </div>
                                <div className="absolute -bottom-2 -start-6 hidden w-[86px] rounded-xl bg-white p-3 shadow-[0px_10px_7.5px_rgba(0,0,0,0.1),0px_4px_3px_rgba(0,0,0,0.1)] sm:block">
                                    <p className="text-xs text-[#6a7282]">{t('seeker.stat_new_today')}</p>
                                    <p className="text-lg font-extrabold leading-7 text-[#16a34a]">
                                        +340
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Pricing */}
            {packages.length > 0 && (
                <section id="pricing" className="scroll-mt-28 bg-white py-20">
                    <div className="mx-auto max-w-[1344px] px-4 sm:px-6 lg:px-8">
                        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
                            <div>
                                <h2 className="text-3xl font-bold tracking-[-0.3px] text-[#050315] sm:text-[40px] sm:leading-[48px]">
                                    {t('pricing.title')}
                                </h2>
                                <p className="mt-2 max-w-xl text-base text-[rgba(5,3,21,0.6)]">
                                    {t('pricing.subtitle')}
                                </p>
                            </div>
                            <Link
                                href={pricing()}
                                className="inline-flex shrink-0 items-center gap-2 text-sm font-semibold text-[#0057c8] transition hover:underline"
                            >
                                {t('employer.cta_secondary')}
                                <img
                                    src="/images/home/arrow-link.svg"
                                    alt=""
                                    className="size-4 rtl:rotate-180"
                                    width={16}
                                    height={16}
                                />
                            </Link>
                        </div>

                        <div className="mt-10">
                            <PricingPackageCards packages={packages} />
                        </div>
                    </div>
                </section>
            )}

            {/* Employer CTA */}
            <section id="employers" className="scroll-mt-28 px-4 py-20 sm:px-6 lg:px-8">
                <div className="mx-auto max-w-[1344px] overflow-hidden rounded-3xl bg-[#d1f6ff] shadow-[0px_8px_6px_0px_rgba(15,23,42,0.12)]">
                    <div className="grid lg:grid-cols-2">
                        <div className="relative order-2 flex min-h-[280px] items-center justify-center p-12 lg:order-1">
                            <div className="relative">
                                <div className="flex size-48 items-center justify-center rounded-full bg-[#f97316]">
                                    <img
                                        src="/images/home/building-large.svg"
                                        alt=""
                                        className="size-24"
                                        width={96}
                                        height={96}
                                    />
                                </div>
                                <div className="absolute -top-3 -start-8 hidden w-[90px] rounded-xl bg-white p-3 shadow-[0px_10px_7.5px_rgba(0,0,0,0.1),0px_4px_3px_rgba(0,0,0,0.1)] sm:block">
                                    <p className="text-xs text-[#6a7282]">{t('employer.stat_companies')}</p>
                                    <p className="text-lg font-extrabold leading-7 text-[#f97316]">
                                        3,200+
                                    </p>
                                </div>
                                <div className="absolute -bottom-2 -end-6 hidden w-[92px] rounded-xl bg-white p-3 shadow-[0px_10px_7.5px_rgba(0,0,0,0.1),0px_4px_3px_rgba(0,0,0,0.1)] sm:block">
                                    <p className="text-xs text-[#6a7282]">{t('employer.stat_hired_today')}</p>
                                    <p className="text-lg font-extrabold leading-7 text-[#1e3a8a]">
                                        +85
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="order-1 bg-white p-8 sm:p-12 lg:order-2 lg:p-14">
                            <span className="inline-flex rounded-full bg-[rgba(229,113,36,0.15)] px-3 py-1.5 text-xs font-semibold text-[#e57124]">
                                {t('employer.badge')}
                            </span>
                            <h2 className="mt-4 text-3xl font-bold tracking-[-0.3px] text-[#050315] sm:text-[40px] sm:leading-[48px]">
                                {t('employer.title')}
                            </h2>
                            <p className="mt-4 max-w-lg text-base tracking-[-0.18px] text-[rgba(5,3,21,0.6)]">
                                {t('employer.subtitle')}
                            </p>
                            <ul className="mt-8 space-y-3">
                                {employerBenefits.map((benefit) => (
                                    <li
                                        key={benefit}
                                        className="flex items-center gap-3 text-sm text-[rgba(5,3,21,0.8)]"
                                    >
                                        <span className="inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-[rgba(229,113,36,0.2)]">
                                            <img
                                                src="/images/home/check-orange.svg"
                                                alt=""
                                                className="size-3"
                                                width={12}
                                                height={12}
                                            />
                                        </span>
                                        {benefit}
                                    </li>
                                ))}
                            </ul>
                            <div className="mt-8 flex flex-wrap gap-3">
                                <Link
                                    href={registerRole.url('employer')}
                                    className="rounded-xl bg-[#0057c8] px-6 py-3 text-sm font-bold text-[#d1f6ff] transition hover:brightness-110"
                                >
                                    {t('employer.cta_primary')}
                                </Link>
                                <Link
                                    href={pricing()}
                                    className="rounded-xl border border-[#e57124] px-6 py-3 text-sm font-bold text-[#e57124] transition hover:bg-[#e57124]/10"
                                >
                                    {t('employer.cta_secondary')}
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Newsletter */}
            <section className="bg-linear-to-b from-[#f8faff] to-[#eff6ff] px-4 py-24 sm:px-6 lg:px-8">
                <div className="mx-auto max-w-2xl text-center">
                    <h2 className="text-3xl font-bold tracking-[-0.2px] text-[#050315]">
                        {t('newsletter.title')}
                    </h2>
                    <p className="mt-3 text-base text-[rgba(5,3,21,0.6)]">
                        {t('newsletter.subtitle')}
                    </p>
                    <form
                        onSubmit={handleSubscribe}
                        className="mt-6 flex flex-col gap-3 sm:flex-row"
                    >
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(event) => setEmail(event.target.value)}
                            placeholder={t('newsletter.placeholder')}
                            className="h-[46px] flex-1 rounded-xl border border-[#e2e8f0] bg-white px-4 text-sm text-[#374151] outline-none placeholder:text-[rgba(55,65,81,0.5)] focus:border-[#0057c8]"
                        />
                        <button
                            type="submit"
                            className="h-[46px] shrink-0 rounded-xl bg-[#0057c8] px-8 text-sm font-bold text-white transition hover:brightness-110"
                        >
                            {t('newsletter.submit')}
                        </button>
                    </form>
                </div>
            </section>
        </FrontendLayout>
    );
}
