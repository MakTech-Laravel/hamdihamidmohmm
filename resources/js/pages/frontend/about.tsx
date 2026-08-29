import { Head, Link } from '@inertiajs/react';
import {
    Building2,
    Lock,
    Rocket,
    Star,
    Target,
    Trophy,
    UserRound,
    Zap,
} from 'lucide-react';
import { useMemo } from 'react';

import { useLocale } from '@/hooks/use-locale';
import FrontendLayout from '@/layouts/frontend-layout';
import { home, jobs } from '@/routes';
import { role as registerRole } from '@/routes/register';

export default function About() {
    const { t } = useLocale();

    const heroHighlights = useMemo(
        () => [
            { icon: Lock, label: t('about.highlight.secure'), color: 'text-[#0057c8]' },
            { icon: Zap, label: t('about.highlight.easy'), color: 'text-[#e57124]' },
            { icon: Trophy, label: t('about.highlight.professional'), color: 'text-[#16a34a]' },
            { icon: Rocket, label: t('about.highlight.fast'), color: 'text-[#7c3aed]' },
        ],
        [t],
    );

    const platformHighlights = useMemo(
        () => [
            { icon: Lock, label: t('about.highlight.secure'), bg: 'bg-[#eff6ff]', color: 'text-[#0057c8]' },
            { icon: Zap, label: t('about.highlight.easy'), bg: 'bg-[#fff7ed]', color: 'text-[#e57124]' },
            { icon: Trophy, label: t('about.highlight.professional'), bg: 'bg-[#f0fdf4]', color: 'text-[#16a34a]' },
            { icon: Rocket, label: t('about.highlight.fast'), bg: 'bg-[#fdf4ff]', color: 'text-[#7c3aed]' },
        ],
        [t],
    );

    const seekerBenefits = useMemo(
        () => [
            t('about.seeker.benefit_1'),
            t('about.seeker.benefit_2'),
            t('about.seeker.benefit_3'),
            t('about.seeker.benefit_4'),
        ],
        [t],
    );

    const employerBenefits = useMemo(
        () => [
            t('about.employer.benefit_1'),
            t('about.employer.benefit_2'),
            t('about.employer.benefit_3'),
            t('about.employer.benefit_4'),
        ],
        [t],
    );

    const seekerSteps = useMemo(
        () => [
            t('about.seeker.step_1'),
            t('about.seeker.step_2'),
            t('about.seeker.step_3'),
            t('about.seeker.step_4'),
        ],
        [t],
    );

    const employerSteps = useMemo(
        () => [
            t('about.employer.step_1'),
            t('about.employer.step_2'),
            t('about.employer.step_3'),
            t('about.employer.step_4'),
        ],
        [t],
    );

    return (
        <FrontendLayout>
            <Head title={`${t('about.title')} - ${t('app.name')}`} />

            <section className="bg-[#d1f6ff] px-4 py-12 sm:px-6 lg:px-8">
                <div className="mx-auto max-w-[1280px]">
                    <nav className="flex flex-wrap items-center gap-2 text-sm">
                        <Link href={home()} className="text-[#050315] transition hover:text-[#0057c8]">
                            {t('nav.home')}
                        </Link>
                        <img
                            src="/images/about/breadcrumb-chevron.svg"
                            alt=""
                            className="size-4 rtl:rotate-180"
                            width={16}
                            height={16}
                        />
                        <span className="text-[#3977a6]">{t('nav.about')}</span>
                    </nav>

                    <div className="mt-5 grid items-center gap-10 lg:grid-cols-2 lg:gap-12">
                        <div>
                            <h1 className="text-4xl font-extrabold leading-tight text-[#050315] sm:text-[48px] sm:leading-[48px]">
                                {t('about.title')}
                            </h1>
                            <p className="mt-4 text-lg leading-[29px] text-[rgba(5,3,21,0.6)]">
                                {t('about.hero_subtitle')}
                            </p>
                        </div>

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            {heroHighlights.map((item) => {
                                const Icon = item.icon;

                                return (
                                    <div
                                        key={item.label}
                                        className="flex items-center gap-3 rounded-2xl bg-white/60 p-5"
                                    >
                                        <Icon className={`size-6 shrink-0 ${item.color}`} />
                                        <span className="text-sm font-semibold text-[#050315]">
                                            {item.label}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </section>

            <section className="bg-white px-4 py-16 sm:px-6 lg:px-8">
                <div className="mx-auto max-w-[1280px] space-y-20">
                    <div className="grid items-center gap-12 lg:grid-cols-2">
                        <div>
                            <h2 className="text-3xl font-bold tracking-[-0.2px] text-[#050315]">
                                {t('about.platform_title')}
                            </h2>
                            <p className="mt-5 text-base leading-[22px] tracking-[-0.18px] text-[#4a5565]">
                                {t('about.platform_description')}
                            </p>
                            <div className="mt-8 grid gap-3 sm:grid-cols-2">
                                {platformHighlights.map((item) => {
                                    const Icon = item.icon;

                                    return (
                                        <div
                                            key={item.label}
                                            className={`flex items-center gap-2.5 rounded-xl p-3 ${item.bg}`}
                                        >
                                            <Icon className={`size-5 shrink-0 ${item.color}`} />
                                            <span className="text-sm font-semibold tracking-[-0.16px] text-[#050315]">
                                                {item.label}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        <div
                            className="flex min-h-[320px] items-center justify-center rounded-2xl p-12"
                            style={{
                                backgroundImage:
                                    'linear-gradient(151.28deg, rgb(239, 246, 255) 0%, rgb(219, 234, 254) 100%)',
                            }}
                        >
                            <div
                                className="flex size-40 items-center justify-center rounded-full"
                                style={{
                                    backgroundImage:
                                        'linear-gradient(135deg, rgb(0, 87, 200) 0%, rgb(37, 99, 235) 100%)',
                                }}
                            >
                                <img
                                    src="/images/about/briefcase.svg"
                                    alt=""
                                    className="size-20"
                                    width={80}
                                    height={80}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="grid gap-6 md:grid-cols-2">
                        <article className="rounded-2xl border border-[#e2e8f0] bg-white p-8 shadow-[0px_1px_1.5px_rgba(0,0,0,0.06)]">
                            <div className="flex size-14 items-center justify-center rounded-2xl bg-[#eff6ff]">
                                <Target className="size-6 text-[#0057c8]" />
                            </div>
                            <h3 className="mt-5 text-xl font-bold text-[#050315]">
                                {t('about.mission_title')}
                            </h3>
                            <p className="mt-3 text-base leading-[26px] text-[#4a5565]">
                                {t('about.mission_description')}
                            </p>
                        </article>
                        <article className="rounded-2xl border border-[#e2e8f0] bg-white p-8 shadow-[0px_1px_1.5px_rgba(0,0,0,0.06)]">
                            <div className="flex size-14 items-center justify-center rounded-2xl bg-[#fff7ed]">
                                <Star className="size-6 text-[#e57124]" />
                            </div>
                            <h3 className="mt-5 text-xl font-bold text-[#050315]">
                                {t('about.vision_title')}
                            </h3>
                            <p className="mt-3 text-base leading-[26px] text-[#4a5565]">
                                {t('about.vision_description')}
                            </p>
                        </article>
                    </div>

                    <div>
                        <h2 className="text-center text-3xl font-bold tracking-[-0.2px] text-[#050315]">
                            {t('about.benefits_title')}
                        </h2>
                        <div className="mt-10 grid gap-6 md:grid-cols-2">
                            <article className="rounded-2xl border border-[#e2e8f0] bg-white p-7 shadow-[0px_1px_1.5px_rgba(0,0,0,0.06)]">
                                <div className="flex items-center gap-3">
                                    <div className="flex size-10 items-center justify-center rounded-xl bg-[#eff6ff]">
                                        <UserRound className="size-5 text-[#0057c8]" />
                                    </div>
                                    <h3 className="text-xl font-bold text-[#050315]">
                                        {t('about.seeker_title')}
                                    </h3>
                                </div>
                                <ul className="mt-5 space-y-3">
                                    {seekerBenefits.map((benefit) => (
                                        <li
                                            key={benefit}
                                            className="flex items-center gap-3 text-sm text-[#364153]"
                                        >
                                            <span className="inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-[#eff6ff]">
                                                <img
                                                    src="/images/about/check-blue.svg"
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
                            </article>

                            <article className="rounded-2xl border border-[#e2e8f0] bg-white p-7 shadow-[0px_1px_1.5px_rgba(0,0,0,0.06)]">
                                <div className="flex items-center gap-3">
                                    <div className="flex size-10 items-center justify-center rounded-xl bg-[#fff7ed]">
                                        <Building2 className="size-5 text-[#e57124]" />
                                    </div>
                                    <h3 className="text-xl font-bold text-[#050315]">
                                        {t('about.employer_title')}
                                    </h3>
                                </div>
                                <ul className="mt-5 space-y-3">
                                    {employerBenefits.map((benefit) => (
                                        <li
                                            key={benefit}
                                            className="flex items-center gap-3 text-sm text-[#364153]"
                                        >
                                            <span className="inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-[#fff7ed]">
                                                <img
                                                    src="/images/about/check-orange.svg"
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
                            </article>
                        </div>
                    </div>

                    <div>
                        <h2 className="text-center text-3xl font-bold tracking-[-0.2px] text-[#050315]">
                            {t('about.how_title')}
                        </h2>
                        <div className="mt-10 grid gap-8 lg:grid-cols-2">
                            <div>
                                <div className="flex items-center gap-3">
                                    <div className="flex size-10 items-center justify-center rounded-xl bg-[#eff6ff]">
                                        <UserRound className="size-5 text-[#0057c8]" />
                                    </div>
                                    <h3 className="text-xl font-semibold text-[#050315]">
                                        {t('about.seeker_journey')}
                                    </h3>
                                </div>
                                <div className="mt-6 space-y-3">
                                    {seekerSteps.map((step, index) => (
                                        <div key={step} className="flex items-center gap-4">
                                            <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-[#0057c8] text-sm font-bold text-white">
                                                {index + 1}
                                            </span>
                                            <span className="h-px flex-1 bg-[#d1f6ff]" />
                                            <span className="rounded-xl border border-[#e2e8f0] bg-white px-4 py-2.5 text-sm font-medium tracking-[-0.16px] text-[#050315]">
                                                {step}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <div className="flex items-center gap-3">
                                    <div className="flex size-10 items-center justify-center rounded-xl bg-[#fff7ed]">
                                        <Building2 className="size-5 text-[#e57124]" />
                                    </div>
                                    <h3 className="text-xl font-semibold text-[#050315]">
                                        {t('about.employer_journey')}
                                    </h3>
                                </div>
                                <div className="mt-6 space-y-3">
                                    {employerSteps.map((step, index) => (
                                        <div key={step} className="flex items-center gap-4">
                                            <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-[#f97316] text-sm font-bold text-white">
                                                {index + 1}
                                            </span>
                                            <span className="h-px flex-1 bg-[#d1f6ff]" />
                                            <span className="rounded-xl border border-[#e2e8f0] bg-white px-4 py-2.5 text-sm font-medium tracking-[-0.16px] text-[#050315]">
                                                {step}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-3xl bg-[#3977a6] p-12 text-center">
                        <h2 className="text-3xl font-extrabold text-white">
                            {t('about.cta_title')}
                        </h2>
                        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
                            <Link
                                href={jobs()}
                                className="inline-flex items-center justify-center rounded-xl bg-[#0057c8] px-8 py-3.5 text-sm font-bold text-white transition hover:brightness-110"
                            >
                                {t('about.cta_find_jobs')}
                            </Link>
                            <Link
                                href={registerRole.url('employer')}
                                className="inline-flex items-center justify-center rounded-xl border border-white/30 px-8 py-3.5 text-sm font-bold text-white transition hover:bg-white/10"
                            >
                                {t('about.cta_post_job')}
                            </Link>
                        </div>
                    </div>
                </div>
            </section>
        </FrontendLayout>
    );
}
