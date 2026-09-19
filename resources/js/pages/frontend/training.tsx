import { Head, Link } from '@inertiajs/react';
import {
    Briefcase,
    CreditCard,
    GraduationCap,
    PlayCircle,
    UserRound,
} from 'lucide-react';
import { useMemo } from 'react';

import { useLocale } from '@/hooks/use-locale';
import FrontendLayout from '@/layouts/frontend-layout';
import { contact, register } from '@/routes';

type Props = {
    heroVideoUrl?: string | null;
};

export default function Training({ heroVideoUrl = null }: Props) {
    const { t } = useLocale();

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
                        </div>
                    </div>

                    <div className="overflow-hidden rounded-2xl border border-[#dbeafe] bg-[#0f172a] shadow-[0px_12px_32px_rgba(30,58,138,0.12)]">
                        {heroVideoUrl ? (
                            <video
                                key={heroVideoUrl}
                                src={heroVideoUrl}
                                controls
                                playsInline
                                preload="metadata"
                                className="aspect-video w-full bg-black"
                            >
                                {t('training.video_unsupported')}
                            </video>
                        ) : (
                            <div className="flex aspect-video flex-col items-center justify-center gap-3 bg-gradient-to-br from-[#1e3a8a] to-[#0f172a] px-6 text-center">
                                <PlayCircle className="size-12 text-white/70" />
                                <p className="text-sm font-medium text-white/80">
                                    {t('training.video_placeholder')}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </section>

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
