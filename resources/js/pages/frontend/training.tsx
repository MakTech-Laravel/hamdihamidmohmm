import { Head, Link } from '@inertiajs/react';
import {
    Briefcase,
    CreditCard,
    Download,
    FileText,
    GraduationCap,
    PlayCircle,
    UserRound,
} from 'lucide-react';
import { useMemo } from 'react';

import { TrainingVideoSlider } from '@/components/frontend/training-video-slider';
import { useLocale } from '@/hooks/use-locale';
import FrontendLayout from '@/layouts/frontend-layout';
import { contact, register } from '@/routes';

type TrainingVideo = {
    id: string;
    name: string;
    file_name: string;
    url: string;
    mime: string | null;
    size: number | null;
};

type TrainingDocument = {
    id: string;
    name: string;
    file_name: string;
    url: string;
    mime: string | null;
    size: number | null;
};

type Props = {
    videos?: TrainingVideo[];
    heroVideoUrl?: string | null;
    documents?: TrainingDocument[];
};

function formatBytes(bytes: number | null): string {
    if (!bytes || bytes <= 0) {
        return '';
    }

    if (bytes < 1024 * 1024) {
        return `${(bytes / 1024).toFixed(1)} KB`;
    }

    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function Training({
    videos = [],
    heroVideoUrl = null,
    documents = [],
}: Props) {
    const { t } = useLocale();
    const slides =
        videos.length > 0
            ? videos
            : heroVideoUrl
              ? [
                    {
                        id: 'hero',
                        name: t('training.title'),
                        file_name: '',
                        url: heroVideoUrl,
                        mime: null,
                        size: null,
                    },
                ]
              : [];

    const topics = useMemo(
        () => [
            {
                icon: UserRound,
                title: t('training.topic.seeker_apply_title'),
                description: t('training.topic.seeker_apply_body'),
            },
            {
                icon: Briefcase,
                title: t('training.topic.employer_post_title'),
                description: t('training.topic.employer_post_body'),
            },
            {
                icon: CreditCard,
                title: t('training.topic.payment_title'),
                description: t('training.topic.payment_body'),
            },
            {
                icon: GraduationCap,
                title: t('training.topic.future_title'),
                description: t('training.topic.future_body'),
            },
        ],
        [t],
    );

    return (
        <FrontendLayout>
            <Head title={`${t('training.title')} - ${t('app.name')}`} />

            <section className="relative overflow-hidden bg-gradient-to-br from-[#eff6ff] via-white to-[#d1f6ff]">
                <div className="mx-auto grid max-w-[1344px] items-center gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:gap-12 lg:px-8 lg:py-20">
                    <div>
                        <p className="text-sm font-semibold tracking-wide text-[#0057c8]">
                            {t('nav.training')}
                        </p>
                        <h1 className="mt-3 max-w-3xl text-4xl font-extrabold tracking-[-0.04em] text-[#050315] sm:text-5xl">
                            {t('training.title')}
                        </h1>
                        <p className="mt-4 max-w-2xl text-base leading-7 text-[#4a5565] sm:text-lg">
                            {t('training.subtitle')}
                        </p>
                        <div className="mt-8 flex flex-wrap gap-3">
                            <Link
                                href={register()}
                                className="inline-flex items-center gap-2 rounded-lg bg-[#0057c8] px-5 py-2.5 text-sm font-semibold text-white transition hover:brightness-110"
                            >
                                <PlayCircle className="size-4" />
                                {t('training.cta_primary')}
                            </Link>
                            <Link
                                href={contact()}
                                className="inline-flex items-center rounded-lg border border-[#0057c8] px-5 py-2.5 text-sm font-semibold text-[#0057c8] transition hover:bg-[#0057c8]/5"
                            >
                                {t('training.cta_secondary')}
                            </Link>
                            <Link
                                href="/training/courses"
                                className="inline-flex items-center rounded-lg border border-[#0057c8] px-5 py-2.5 text-sm font-semibold text-[#0057c8] transition hover:bg-[#0057c8]/5"
                            >
                                {t('training.courses.link')}
                            </Link>
                        </div>
                    </div>

                    <div>
                        {slides.length > 0 ? (
                            <TrainingVideoSlider videos={slides} />
                        ) : (
                            <div className="overflow-hidden rounded-2xl border border-[#dbeafe] bg-[#0f172a] shadow-[0px_12px_32px_rgba(30,58,138,0.12)]">
                                <div className="flex aspect-video flex-col items-center justify-center gap-3 bg-gradient-to-br from-[#1e3a8a] to-[#0f172a] px-6 text-center">
                                    <PlayCircle className="size-12 text-white/70" />
                                    <p className="text-sm font-medium text-white/80">
                                        {t('training.video_placeholder')}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </section>

            {documents.length > 0 ? (
                <section className="mx-auto max-w-[1344px] px-4 py-14 sm:px-6 lg:px-8">
                    <h2 className="text-2xl font-extrabold text-[#050315]">
                        {t('training.documents_title')}
                    </h2>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-[#64748b]">
                        {t('training.documents_subtitle')}
                    </p>

                    <ul className="mt-8 divide-y divide-[#e2e8f0] overflow-hidden rounded-2xl border border-[#dbeafe] bg-white shadow-[0px_4px_12px_rgba(30,58,138,0.06)]">
                        {documents.map((document) => {
                            const sizeLabel = formatBytes(document.size);

                            return (
                                <li
                                    key={document.id}
                                    className="flex flex-wrap items-center justify-between gap-3 px-5 py-4"
                                >
                                    <div className="flex min-w-0 items-start gap-3">
                                        <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[#eff6ff] text-[#0057c8]">
                                            <FileText className="size-5" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="truncate text-sm font-bold text-[#050315]">
                                                {document.name}
                                            </p>
                                            <p className="mt-0.5 truncate text-xs text-[#64748b]">
                                                {document.file_name}
                                                {sizeLabel
                                                    ? ` · ${sizeLabel}`
                                                    : ''}
                                            </p>
                                        </div>
                                    </div>
                                    <a
                                        href={document.url}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="inline-flex items-center gap-2 rounded-lg bg-[#0057c8] px-4 py-2 text-sm font-semibold text-white transition hover:brightness-110"
                                    >
                                        <Download className="size-4" />
                                        {t('training.download')}
                                    </a>
                                </li>
                            );
                        })}
                    </ul>
                </section>
            ) : null}

            <section className="mx-auto max-w-[1344px] px-4 py-14 sm:px-6 lg:px-8">
                <h2 className="text-2xl font-extrabold text-[#050315]">
                    {t('training.topics_title')}
                </h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-[#64748b]">
                    {t('training.topics_subtitle')}
                </p>

                <div className="mt-8 grid gap-5 md:grid-cols-2">
                    {topics.map((topic) => {
                        const Icon = topic.icon;

                        return (
                            <div
                                key={topic.title}
                                className="rounded-2xl border border-[#dbeafe] bg-white p-6 shadow-[0px_4px_12px_rgba(30,58,138,0.06)]"
                            >
                                <div className="flex size-11 items-center justify-center rounded-xl bg-[#eff6ff] text-[#0057c8]">
                                    <Icon className="size-5" />
                                </div>
                                <h3 className="mt-4 text-lg font-bold text-[#050315]">
                                    {topic.title}
                                </h3>
                                <p className="mt-2 text-sm leading-6 text-[#64748b]">
                                    {topic.description}
                                </p>
                                <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-[#94a3b8]">
                                    {t('training.coming_soon')}
                                </p>
                            </div>
                        );
                    })}
                </div>
            </section>
        </FrontendLayout>
    );
}
