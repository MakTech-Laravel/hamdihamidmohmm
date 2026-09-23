import { Head, Link, router, usePage } from '@inertiajs/react';
import { BriefcaseBusiness, UserRoundPen } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { AboutCompanyCard } from '@/components/employer/about-company-card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { RichTextContent } from '@/components/ui/rich-text-editor';
import { useLocale } from '@/hooks/use-locale';
import FrontendLayout from '@/layouts/frontend-layout';
import { jobs as jobsRoute, login } from '@/routes';
import { show as jobShow } from '@/routes/jobs';
import type { SharedData } from '@/types';

type SimilarJob = {
    slug: string;
    initials: string;
    logo_url?: string | null;
    title: string;
    company: string | null;
};

type JobDetail = {
    slug: string;
    initials?: string;
    title: string;
    subtitle?: string | null;
    logo_url?: string | null;
    company: string | null;
    company_logo_url?: string | null;
    company_industry?: string | null;
    company_about?: string | null;
    company_website?: string | null;
    type?: string | null;
    category?: string | null;
    location?: string | null;
    experience?: string | null;
    salary?: string | null;
    posted?: string | null;
    deadline?: string | null;
    vacancies?: string | null;
    industry?: string | null;
    overview?: string | null;
    description?: string | null;
    responsibilities?: string[];
    requirements?: string[];
    skills?: string[];
    benefits?: string[];
    similar?: SimilarJob[];
};

export default function JobShow({
    job,
    applied = false,
    can_apply = false,
}: {
    job: JobDetail;
    applied?: boolean;
    can_apply?: boolean;
}) {
    const { t } = useLocale();
    const { auth } = usePage<SharedData>().props;
    const [shareOpen, setShareOpen] = useState(false);
    const [copied, setCopied] = useState(false);
    const [applyModalOpen, setApplyModalOpen] = useState(false);
    const [applying, setApplying] = useState(false);
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
    const profileHref = '/job-seeker/profile';
    const overview = job.overview || job.description || '';
    const similar = job.similar ?? [];
    const responsibilities = job.responsibilities ?? [];
    const requirements = job.requirements ?? [];
    const skills = job.skills ?? [];
    const benefits = job.benefits ?? [];

    const confirmApply = (): void => {
        if (applying) {
            return;
        }

        setApplying(true);
        router.post(
            `/jobs/${job.slug}/apply`,
            {},
            {
                onFinish: () => setApplying(false),
                onError: () => setApplying(false),
            },
        );
    };

    const goToProfile = (): void => {
        setApplyModalOpen(false);
        router.visit(profileHref);
    };

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
        { label: t('job_detail.category'), value: job.category },
        { label: t('job_detail.salary'), value: job.salary },
        { label: t('job_detail.location'), value: job.location },
        { label: t('job_detail.vacancies'), value: job.vacancies },
        { label: t('job_detail.industry'), value: job.industry },
    ].filter((item) => Boolean(item.value));

    return (
        <FrontendLayout>
            <Head title={`${job.title} - ${t('app.name')}`} />

            <section className="bg-[#d1f6ff] px-4 py-8 sm:px-6 lg:px-8">
                <div className="mx-auto max-w-[1280px]">
                    <nav className="flex flex-wrap items-center gap-2 text-sm">
                        <Link
                            href={jobsRoute()}
                            className="text-[#050315] transition hover:text-[#0057c8]"
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

            <section className="bg-white px-4 py-8 sm:px-6 lg:px-8">
                <div className="mx-auto max-w-[1280px]">
                    <div className="grid gap-6 lg:grid-cols-[1fr_390px]">
                        <div>
                            <Link
                                href={jobsRoute()}
                                className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-[#0057c8] transition hover:underline"
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
                                    <div className="flex size-[96px] shrink-0 items-center justify-center overflow-hidden rounded-xl border border-[#e2e8f0] bg-[#f8faff] text-xl font-bold text-[#0057c8] sm:size-[112px]">
                                        {job.logo_url ? (
                                            <img
                                                src={job.logo_url}
                                                alt={job.title}
                                                className="size-full object-cover"
                                            />
                                        ) : (
                                            job.initials || 'JP'
                                        )}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="min-w-0">
                                                <h1 className="text-2xl font-bold text-[#050315]">
                                                    {job.title}
                                                </h1>
                                                <p className="mt-1.5 text-base font-normal text-[#64748b]">
                                                    {job.subtitle || job.company}
                                                </p>
                                                {job.subtitle && job.company ? (
                                                    <p className="mt-1 text-sm text-[#4a5565]">
                                                        {job.company}
                                                    </p>
                                                ) : null}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-5 flex flex-wrap gap-2">
                                    {job.type ? (
                                        <span className="rounded-full bg-[#dcfce7] px-2.5 py-0.5 text-xs font-semibold text-[#16a34a]">
                                            {job.type}
                                        </span>
                                    ) : null}
                                    {job.category ? (
                                        <span className="rounded-full bg-[#eef5ff] px-2.5 py-0.5 text-xs font-semibold text-[#0057c8]">
                                            {job.category}
                                        </span>
                                    ) : null}
                                    {job.location ? (
                                        <span className="rounded-full bg-[#f1f5f9] px-2.5 py-0.5 text-xs font-semibold text-[#475569]">
                                            📍 {job.location}
                                        </span>
                                    ) : null}
                                    {job.experience ? (
                                        <span className="rounded-full bg-[#f1f5f9] px-2.5 py-0.5 text-xs font-semibold text-[#475569]">
                                            💼 {job.experience}
                                        </span>
                                    ) : null}
                                    {job.salary ? (
                                        <span className="rounded-full bg-[#f1f5f9] px-2.5 py-0.5 text-xs font-semibold text-[#475569]">
                                            💰 {job.salary}
                                        </span>
                                    ) : null}
                                </div>

                                {metaItems.length > 0 ? (
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
                                ) : null}
                            </article>

                            <article className="mt-5 rounded-2xl border border-[#e2e8f0] bg-white p-6 shadow-[0px_1px_1.5px_rgba(0,0,0,0.06)] sm:p-7">
                                {overview ? (
                                    <section>
                                        <h2 className="text-lg font-bold text-[#050315]">
                                            {t('job_detail.overview')}
                                        </h2>
                                        <div className="mt-3 text-sm leading-[23px] text-[#4a5565]">
                                            <RichTextContent html={overview} />
                                        </div>
                                    </section>
                                ) : null}

                                {responsibilities.length > 0 ? (
                                    <section className="mt-8">
                                        <h2 className="text-lg font-bold text-[#050315]">
                                            {t('job_detail.responsibilities')}
                                        </h2>
                                        <ul className="mt-4 space-y-3">
                                            {responsibilities.map((item) => (
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
                                ) : null}

                                {requirements.length > 0 ? (
                                    <section className="mt-8">
                                        <h2 className="text-lg font-bold text-[#050315]">
                                            {t('job_detail.requirements')}
                                        </h2>
                                        <ul className="mt-4 space-y-3">
                                            {requirements.map((item) => (
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
                                ) : null}

                                {skills.length > 0 ? (
                                    <section className="mt-8">
                                        <h2 className="text-lg font-bold text-[#050315]">
                                            {t('job_detail.skills')}
                                        </h2>
                                        <div className="mt-4 flex flex-wrap gap-2">
                                            {skills.map((skill) => (
                                                <span
                                                    key={skill}
                                                    className="inline-flex rounded-full bg-[#eef5ff] px-3 py-1.5 text-xs font-semibold text-[#0057c8]"
                                                >
                                                    {skill}
                                                </span>
                                            ))}
                                        </div>
                                    </section>
                                ) : null}

                                {benefits.length > 0 ? (
                                    <section className="mt-8">
                                        <h2 className="text-lg font-bold text-[#050315]">
                                            {t('job_detail.benefits')}
                                        </h2>
                                        <div className="mt-4 flex flex-wrap gap-2">
                                            {benefits.map((benefit) => (
                                                <span
                                                    key={benefit}
                                                    className="inline-flex items-center gap-1.5 rounded-full border border-[#bbf7d0] bg-[#f0fdf4] px-3 py-1.5 text-xs font-semibold text-[#15803d]"
                                                >
                                                    ✓ {benefit}
                                                </span>
                                            ))}
                                        </div>
                                    </section>
                                ) : null}

                                <div className="relative mt-8 flex items-center gap-3 border-t border-[#e5e7eb] pt-5">
                                    {can_apply ? (
                                        <button
                                            type="button"
                                            onClick={() => setApplyModalOpen(true)}
                                            className="inline-flex h-12 min-w-0 flex-1 items-center justify-center rounded-full bg-[#0057c8] px-6 text-sm font-bold text-white transition hover:bg-[#0046a3]"
                                        >
                                            {t('job_detail.apply_now')}
                                        </button>
                                    ) : applied ? (
                                        <span className="inline-flex h-12 min-w-0 flex-1 items-center justify-center rounded-full bg-[#e2e8f0] px-6 text-sm font-bold text-[#64748b]">
                                            {t('job_seeker.dashboard.applied')}
                                        </span>
                                    ) : (
                                        <Link
                                            href={applyHref}
                                            className="inline-flex h-12 min-w-0 flex-1 items-center justify-center rounded-full bg-[#0057c8] px-6 text-sm font-bold text-white transition hover:bg-[#0046a3]"
                                        >
                                            {t('job_detail.apply_now')}
                                        </Link>
                                    )}

                                    <div className="relative shrink-0" ref={shareRef}>
                                        <button
                                            type="button"
                                            onClick={() => setShareOpen((open) => !open)}
                                            className="inline-flex h-12 items-center justify-center gap-2 rounded-full border-2 border-[#0057c8] bg-white px-5 text-sm font-semibold text-[#0057c8] transition hover:bg-[#eef5ff]"
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
                                            <div className="absolute bottom-[56px] end-0 z-20 w-48 rounded-xl border border-[#e2e8f0] bg-white p-4 shadow-[0px_8px_24px_rgba(0,0,0,0.08)]">
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
                        </div>

                        <aside className="space-y-5">
                            <div>
                                <AboutCompanyCard
                                    title={t('job_detail.about_company')}
                                    companyName={
                                        job.company ||
                                        t('employer.profile.company_fallback')
                                    }
                                    industry={job.company_industry}
                                    about={job.company_about}
                                    website={job.company_website}
                                    logoUrl={job.company_logo_url}
                                    initials={job.initials || 'JP'}
                                    visitWebsiteLabel={t(
                                        'job_detail.visit_website',
                                    )}
                                />

                                {!auth.user && (
                                    <div className="mt-5 rounded-xl bg-[#eff6ff] p-4">
                                        <p className="text-xs text-[#364153]">
                                            {t('job_detail.login_prompt')}
                                        </p>
                                        <Link
                                            href={login()}
                                            className="mt-3 inline-flex h-10 w-full items-center justify-center rounded-full bg-[#0057c8] text-sm font-semibold text-white transition hover:bg-[#0046a3]"
                                        >
                                            {t('auth.log_in')}
                                        </Link>
                                    </div>
                                )}
                            </div>

                            <article className="rounded-2xl border border-[#e2e8f0] bg-white p-5 shadow-[0px_1px_1.5px_rgba(0,0,0,0.06)]">
                                <h2 className="text-lg font-bold text-[#050315]">
                                    {t('job_detail.similar')}
                                </h2>
                                <div className="mt-4 space-y-3">
                                    {similar.map((item) => (
                                        <Link
                                            key={item.slug}
                                            href={jobShow.url(item.slug)}
                                            className="flex items-center gap-3 rounded-xl border border-[#f1f5f9] p-3 transition hover:border-[#dbeafe] hover:bg-[#f8faff]"
                                        >
                                            {item.logo_url ? (
                                                <img
                                                    src={item.logo_url}
                                                    alt={item.company || item.title}
                                                    className="size-[72px] shrink-0 rounded-xl border border-[#e2e8f0] bg-[#f8faff] object-contain p-1.5"
                                                />
                                            ) : (
                                                <div
                                                    className="flex size-[72px] shrink-0 items-center justify-center rounded-xl text-sm font-bold text-white"
                                                    style={{
                                                        backgroundImage:
                                                            'linear-gradient(135deg, rgb(30, 58, 138) 0%, rgb(37, 99, 235) 100%)',
                                                    }}
                                                >
                                                    {item.initials}
                                                </div>
                                            )}
                                            <div className="min-w-0">
                                                <p className="truncate text-sm font-semibold text-[#050315]">
                                                    {item.title}
                                                </p>
                                                <p className="truncate text-xs text-[#6a7282]">
                                                    {item.company}
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

            <Dialog open={applyModalOpen} onOpenChange={setApplyModalOpen}>
                <DialogContent className="max-w-[440px] overflow-hidden rounded-3xl border-[#dbeafe] bg-white p-0 shadow-[0_24px_60px_rgba(5,3,21,0.18)] sm:max-w-[440px]">
                    <div className="relative overflow-hidden bg-gradient-to-br from-[#eef5ff] via-white to-[#f8fbff] px-6 pb-5 pt-8 sm:px-7">
                        <div
                            aria-hidden
                            className="pointer-events-none absolute -end-10 -top-10 size-32 rounded-full bg-[#0057c8]/10 blur-2xl"
                        />
                        <div
                            aria-hidden
                            className="pointer-events-none absolute -start-8 bottom-0 size-24 rounded-full bg-[#38bdf8]/15 blur-2xl"
                        />
                        <DialogHeader className="relative items-center gap-3 text-center sm:text-center">
                            <div className="flex size-14 items-center justify-center rounded-2xl bg-[#0057c8] text-white shadow-[0_10px_24px_rgba(0,87,200,0.28)]">
                                <BriefcaseBusiness
                                    className="size-7"
                                    strokeWidth={2.2}
                                />
                            </div>
                            <DialogTitle className="text-[22px] font-bold tracking-[-0.3px] text-[#050315]">
                                {t('job_detail.apply_confirm_title')}
                            </DialogTitle>
                            <DialogDescription className="max-w-[320px] text-sm leading-6 text-[#64748b]">
                                {t('job_detail.apply_confirm_message')}
                            </DialogDescription>
                            <div className="mt-1 w-full rounded-2xl border border-[#dbeafe] bg-white/90 px-4 py-3 text-start">
                                <p className="text-sm font-bold text-[#050315]">
                                    {job.title}
                                </p>
                                <p className="mt-1 text-xs font-semibold text-[#e57124]">
                                    {job.company}
                                </p>
                                <div className="mt-2 flex flex-wrap gap-2 text-[11px] font-medium text-[#64748b]">
                                    {job.type ? (
                                        <span className="rounded-full bg-[#dcfce7] px-2 py-0.5 text-[#166534]">
                                            {job.type}
                                        </span>
                                    ) : null}
                                    {job.location ? (
                                        <span className="rounded-full bg-[#f1f5f9] px-2 py-0.5">
                                            {job.location}
                                        </span>
                                    ) : null}
                                    {job.category ? (
                                        <span className="rounded-full bg-[#eef5ff] px-2 py-0.5 text-[#0057c8]">
                                            {job.category}
                                        </span>
                                    ) : null}
                                </div>
                                <p className="mt-2 text-xs text-[#64748b]">
                                    {t('job_detail.apply_review_hint')}
                                </p>
                            </div>
                        </DialogHeader>
                    </div>

                    <DialogFooter className="flex flex-row items-center justify-between gap-3 border-t border-[#eef2f7] bg-[#f8faff] px-5 py-4 sm:space-x-0">
                        <button
                            type="button"
                            disabled={applying}
                            onClick={goToProfile}
                            className="inline-flex h-11 min-w-0 flex-1 items-center justify-center gap-2 rounded-xl border border-[#bfdbfe] bg-white px-3 text-sm font-semibold text-[#0057c8] shadow-sm transition hover:border-[#0057c8] hover:bg-[#eef5ff] disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            <UserRoundPen className="size-4 shrink-0" />
                            <span className="truncate">
                                {t('job_detail.modify_profile')}
                            </span>
                        </button>
                        <button
                            type="button"
                            disabled={applying}
                            onClick={confirmApply}
                            className="inline-flex h-11 min-w-0 flex-1 items-center justify-center rounded-xl bg-[#0057c8] px-3 text-sm font-semibold text-white shadow-[0_8px_18px_rgba(0,87,200,0.28)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            <span className="truncate">
                                {t('job_detail.apply_confirm')}
                            </span>
                        </button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </FrontendLayout>
    );
}
