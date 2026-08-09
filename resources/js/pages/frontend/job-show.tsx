import { Head, Link, usePage } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';

import { useLocale } from '@/hooks/use-locale';
import FrontendLayout from '@/layouts/frontend-layout';
import { home, jobs as jobsRoute, login } from '@/routes';
import { show as jobShow } from '@/routes/jobs';
import type { SharedData } from '@/types';

type SimilarJob = {
    slug: string;
    initials: string;
    title: string;
    company: string;
};

type JobDetail = {
    slug: string;
    initials: string;
    title: string;
    company: string;
    company_industry: string;
    company_about: string;
    company_website: string;
    type: string;
    location: string;
    experience: string;
    salary: string;
    posted: string;
    deadline: string;
    vacancies: string;
    industry: string;
    overview: string;
    responsibilities: string[];
    requirements: string[];
    benefits: string[];
    similar: SimilarJob[];
};

export default function JobShow({ job }: { job: JobDetail }) {
    const { t } = useLocale();
    const { auth } = usePage<SharedData>().props;
    const [shareOpen, setShareOpen] = useState(false);
    const [copied, setCopied] = useState(false);
    const shareRef = useRef<HTMLDivElement>(null);

    const pageUrl =
        typeof window !== 'undefined' ? window.location.href : jobShow.url(job.slug);

    useEffect(() => {
        if (!shareOpen) {
            return;
        }

        const handleClick = (event: MouseEvent) => {
            if (
                shareRef.current &&
                !shareRef.current.contains(event.target as Node)
            ) {
                setShareOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClick);

        return () => document.removeEventListener('mousedown', handleClick);
    }, [shareOpen]);

    const applyHref = auth.user ? '/dashboard' : login.url();

    const shareItems = [
        {
            key: 'copy',
            label: t('job_detail.share_copy'),
            icon: '/images/job-detail/copy-link.svg',
            onClick: async () => {
                try {
                    await navigator.clipboard.writeText(pageUrl);
                    setCopied(true);
                    window.setTimeout(() => setCopied(false), 2000);
                } catch {
                    setCopied(false);
                }
            },
        },
        {
            key: 'linkedin',
            label: t('job_detail.share_linkedin'),
            emoji: '💼',
            href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(pageUrl)}`,
        },
        {
            key: 'twitter',
            label: t('job_detail.share_twitter'),
            emoji: '𝕏',
            href: `https://twitter.com/intent/tweet?url=${encodeURIComponent(pageUrl)}&text=${encodeURIComponent(job.title)}`,
        },
        {
            key: 'facebook',
            label: t('job_detail.share_facebook'),
            emoji: 'f',
            href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(pageUrl)}`,
        },
        {
            key: 'email',
            label: t('job_detail.share_email'),
            emoji: '✉️',
            href: `mailto:?subject=${encodeURIComponent(job.title)}&body=${encodeURIComponent(pageUrl)}`,
        },
    ];

    const metaItems = [
        { label: t('job_detail.posted'), value: job.posted },
        { label: t('job_detail.deadline'), value: job.deadline },
        { label: t('job_detail.experience'), value: job.experience },
        { label: t('job_detail.job_type'), value: job.type },
        { label: t('job_detail.salary'), value: job.salary },
        { label: t('job_detail.location'), value: job.location },
        { label: t('job_detail.vacancies'), value: job.vacancies },
        { label: t('job_detail.industry'), value: job.industry },
    ];

    return (
        <FrontendLayout>
            <Head title={`${job.title} - RR Job Portal`} />

            <section className="bg-[#ffebf5] px-4 py-8 sm:px-6 lg:px-8">
                <div className="mx-auto max-w-[1280px]">
                    <nav className="flex flex-wrap items-center gap-2 text-sm">
                        <Link
                            href={home()}
                            className="text-[#050315] transition hover:text-[#323981]"
                        >
                            {t('nav.home')}
                        </Link>
                        <img
                            src="/images/job-detail/breadcrumb-chevron.svg"
                            alt=""
                            className="size-4 rtl:rotate-180"
                            width={16}
                            height={16}
                        />
                        <Link
                            href={jobsRoute()}
                            className="text-[#050315] transition hover:text-[#323981]"
                        >
                            {t('nav.jobs')}
                        </Link>
                        <img
                            src="/images/job-detail/breadcrumb-chevron.svg"
                            alt=""
                            className="size-4 rtl:rotate-180"
                            width={16}
                            height={16}
                        />
                        <span className="text-[#3977a6]">{job.title}</span>
                    </nav>
                </div>
            </section>

            <section className="bg-[#f8faff] px-4 py-8 sm:px-6 lg:px-8">
                <div className="mx-auto max-w-[1280px]">
                    <div className="grid gap-6 lg:grid-cols-[1fr_390px]">
                        <div>
                            <Link
                                href={jobsRoute()}
                                className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-[#323981] transition hover:underline"
                            >
                                <img
                                    src="/images/job-detail/back-arrow.svg"
                                    alt=""
                                    className="size-4 rtl:rotate-180"
                                    width={16}
                                    height={16}
                                />
                                {t('job_detail.back')}
                            </Link>

                            <article className="rounded-2xl border border-[#e2e8f0] bg-white p-6 shadow-[0px_1px_1.5px_rgba(0,0,0,0.06)] sm:p-7">
                                <div className="flex items-start gap-4">
                                    <div
                                        className="flex size-16 shrink-0 items-center justify-center rounded-2xl text-lg font-bold text-white"
                                        style={{
                                            backgroundImage:
                                                'linear-gradient(135deg, rgb(30, 58, 138) 0%, rgb(37, 99, 235) 100%)',
                                        }}
                                    >
                                        {job.initials}
                                    </div>
                                    <div className="min-w-0">
                                        <h1 className="text-2xl font-bold text-[#050315]">
                                            {job.title}
                                        </h1>
                                        <p className="mt-1 text-base text-[#4a5565]">
                                            {job.company}
                                        </p>
                                    </div>
                                </div>

                                <div className="mt-5 flex flex-wrap gap-2">
                                    <span className="rounded-full bg-[#dcfce7] px-2.5 py-0.5 text-xs font-semibold text-[#16a34a]">
                                        {job.type}
                                    </span>
                                    <span className="rounded-full bg-[#f1f5f9] px-2.5 py-0.5 text-xs font-semibold text-[#475569]">
                                        📍 {job.location}
                                    </span>
                                    <span className="rounded-full bg-[#f1f5f9] px-2.5 py-0.5 text-xs font-semibold text-[#475569]">
                                        💼 {job.experience}
                                    </span>
                                    <span className="rounded-full bg-[#f1f5f9] px-2.5 py-0.5 text-xs font-semibold text-[#475569]">
                                        💰 {job.salary}
                                    </span>
                                </div>

                                <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-4 border-t border-[#f1f5f9] pt-5 sm:grid-cols-4">
                                    {metaItems.map((item) => (
                                        <div key={item.label}>
                                            <p className="text-xs text-[#99a1af]">
                                                {item.label}
                                            </p>
                                            <p className="mt-1 text-sm font-semibold text-[#050315]">
                                                {item.value}
                                            </p>
                                        </div>
                                    ))}
                                </div>

                                <div className="relative mt-6 flex flex-col gap-3 sm:flex-row">
                                    <Link
                                        href={applyHref}
                                        className="inline-flex h-[46px] flex-1 items-center justify-center rounded-xl bg-[#323981] text-sm font-semibold text-white transition hover:brightness-110"
                                    >
                                        {t('job_detail.apply_now')}
                                    </Link>

                                    <div className="relative" ref={shareRef}>
                                        <button
                                            type="button"
                                            onClick={() => setShareOpen((open) => !open)}
                                            className="inline-flex h-[46px] w-full items-center justify-center gap-2 rounded-xl border border-[#323981] px-5 text-sm font-semibold text-[#323981] transition hover:bg-[#323981]/5 sm:w-[106px]"
                                        >
                                            <img
                                                src="/images/job-detail/share.svg"
                                                alt=""
                                                className="size-4"
                                                width={16}
                                                height={16}
                                            />
                                            {t('job_detail.share')}
                                        </button>

                                        {shareOpen && (
                                            <div className="absolute end-0 top-[54px] z-20 w-48 rounded-xl border border-[#e2e8f0] bg-white p-4 shadow-[0px_8px_24px_rgba(0,0,0,0.08)]">
                                                <p className="text-xs font-medium text-[#6a7282]">
                                                    {t('job_detail.share_via')}
                                                </p>
                                                <div className="mt-3 space-y-1">
                                                    {shareItems.map((item) =>
                                                        item.onClick ? (
                                                            <button
                                                                key={item.key}
                                                                type="button"
                                                                onClick={item.onClick}
                                                                className="flex w-full items-center gap-3 rounded-lg px-1 py-2 text-sm text-[#364153] transition hover:bg-[#f8faff]"
                                                            >
                                                                {item.icon ? (
                                                                    <img
                                                                        src={item.icon}
                                                                        alt=""
                                                                        className="size-4"
                                                                        width={16}
                                                                        height={16}
                                                                    />
                                                                ) : (
                                                                    <span className="inline-flex size-4 items-center justify-center text-xs">
                                                                        {item.emoji}
                                                                    </span>
                                                                )}
                                                                {copied && item.key === 'copy'
                                                                    ? t('job_detail.link_copied')
                                                                    : item.label}
                                                            </button>
                                                        ) : (
                                                            <a
                                                                key={item.key}
                                                                href={item.href}
                                                                target="_blank"
                                                                rel="noreferrer"
                                                                className="flex items-center gap-3 rounded-lg px-1 py-2 text-sm text-[#364153] transition hover:bg-[#f8faff]"
                                                            >
                                                                <span className="inline-flex size-4 items-center justify-center text-xs font-semibold">
                                                                    {item.emoji}
                                                                </span>
                                                                {item.label}
                                                            </a>
                                                        ),
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </article>

                            <article className="mt-5 rounded-2xl border border-[#e2e8f0] bg-white p-6 shadow-[0px_1px_1.5px_rgba(0,0,0,0.06)] sm:p-7">
                                <section>
                                    <h2 className="text-lg font-bold text-[#050315]">
                                        {t('job_detail.overview')}
                                    </h2>
                                    <p className="mt-3 text-sm leading-[23px] text-[#4a5565]">
                                        {job.overview}
                                    </p>
                                </section>

                                <section className="mt-8">
                                    <h2 className="text-lg font-bold text-[#050315]">
                                        {t('job_detail.responsibilities')}
                                    </h2>
                                    <ul className="mt-4 space-y-3">
                                        {job.responsibilities.map((item) => (
                                            <li
                                                key={item}
                                                className="flex items-start gap-3 text-sm text-[#364153]"
                                            >
                                                <span className="mt-0.5 inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-[#eff6ff]">
                                                    <img
                                                        src="/images/job-detail/check-blue.svg"
                                                        alt=""
                                                        className="size-3"
                                                        width={12}
                                                        height={12}
                                                    />
                                                </span>
                                                {item}
                                            </li>
                                        ))}
                                    </ul>
                                </section>

                                <section className="mt-8">
                                    <h2 className="text-lg font-bold text-[#050315]">
                                        {t('job_detail.requirements')}
                                    </h2>
                                    <ul className="mt-4 space-y-3">
                                        {job.requirements.map((item) => (
                                            <li
                                                key={item}
                                                className="flex items-start gap-3 text-sm text-[#364153]"
                                            >
                                                <span className="mt-0.5 inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-[#dcfce7]">
                                                    <img
                                                        src="/images/job-detail/check-green.svg"
                                                        alt=""
                                                        className="size-3"
                                                        width={12}
                                                        height={12}
                                                    />
                                                </span>
                                                {item}
                                            </li>
                                        ))}
                                    </ul>
                                </section>

                                <section className="mt-8">
                                    <h2 className="text-lg font-bold text-[#050315]">
                                        {t('job_detail.benefits')}
                                    </h2>
                                    <div className="mt-4 flex flex-wrap gap-2">
                                        {job.benefits.map((benefit) => (
                                            <span
                                                key={benefit}
                                                className="inline-flex items-center gap-1.5 rounded-full border border-[#bbf7d0] bg-[#f0fdf4] px-3 py-1.5 text-xs font-semibold text-[#15803d]"
                                            >
                                                ✓ {benefit}
                                            </span>
                                        ))}
                                    </div>
                                </section>
                            </article>
                        </div>

                        <aside className="space-y-5">
                            <article className="rounded-2xl border border-[#e2e8f0] bg-white p-5 shadow-[0px_1px_1.5px_rgba(0,0,0,0.06)]">
                                <h2 className="text-lg font-bold text-[#050315]">
                                    {t('job_detail.about_company')}
                                </h2>
                                <div className="mt-4 flex items-center gap-3">
                                    <div
                                        className="flex size-12 shrink-0 items-center justify-center rounded-xl text-sm font-bold text-white"
                                        style={{
                                            backgroundImage:
                                                'linear-gradient(135deg, rgb(30, 58, 138) 0%, rgb(37, 99, 235) 100%)',
                                        }}
                                    >
                                        {job.initials}
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-[#050315]">
                                            {job.company}
                                        </p>
                                        <p className="text-xs text-[#6a7282]">
                                            {job.company_industry}
                                        </p>
                                    </div>
                                </div>
                                <p className="mt-4 text-sm leading-[23px] text-[#4a5565]">
                                    {job.company_about}
                                </p>
                                <a
                                    href={job.company_website}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[#323981] transition hover:underline"
                                >
                                    <img
                                        src="/images/job-detail/external-link.svg"
                                        alt=""
                                        className="size-4"
                                        width={16}
                                        height={16}
                                    />
                                    {t('job_detail.visit_website')}
                                </a>

                                {!auth.user && (
                                    <div className="mt-5 rounded-xl bg-[#eff6ff] p-4">
                                        <p className="text-xs text-[#364153]">
                                            {t('job_detail.login_prompt')}
                                        </p>
                                        <Link
                                            href={login()}
                                            className="mt-3 inline-flex h-10 w-full items-center justify-center rounded-xl bg-[#323981] text-sm font-semibold text-white transition hover:brightness-110"
                                        >
                                            {t('job_detail.login_to_apply')}
                                        </Link>
                                    </div>
                                )}
                            </article>

                            <article className="rounded-2xl border border-[#e2e8f0] bg-white p-5 shadow-[0px_1px_1.5px_rgba(0,0,0,0.06)]">
                                <h2 className="text-lg font-bold text-[#050315]">
                                    {t('job_detail.similar')}
                                </h2>
                                <div className="mt-4 space-y-3">
                                    {job.similar.map((similar) => (
                                        <Link
                                            key={similar.slug}
                                            href={jobShow.url(similar.slug)}
                                            className="flex items-center gap-3 rounded-xl border border-[#f1f5f9] p-3 transition hover:border-[#dbeafe] hover:bg-[#f8faff]"
                                        >
                                            <div
                                                className="flex size-10 shrink-0 items-center justify-center rounded-lg text-xs font-bold text-white"
                                                style={{
                                                    backgroundImage:
                                                        'linear-gradient(135deg, rgb(30, 58, 138) 0%, rgb(37, 99, 235) 100%)',
                                                }}
                                            >
                                                {similar.initials}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="truncate text-sm font-semibold text-[#050315]">
                                                    {similar.title}
                                                </p>
                                                <p className="truncate text-xs text-[#6a7282]">
                                                    {similar.company}
                                                </p>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            </article>
                        </aside>
                    </div>
                </div>
            </section>
        </FrontendLayout>
    );
}
