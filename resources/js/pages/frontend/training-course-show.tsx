import { Head, Link } from '@inertiajs/react';
import { GraduationCap } from 'lucide-react';

import { useLocale } from '@/hooks/use-locale';
import FrontendLayout from '@/layouts/frontend-layout';

type Course = {
    title: string;
    slug: string;
    description: string;
    thumbnail_url: string | null;
    dates: string;
    duration: string;
    location: string;
    trainer: string;
    available_seats: number;
    registration_deadline: string | null;
    registration_open: boolean;
};

export default function TrainingCourseShow({ course }: { course: Course }) {
    const { t } = useLocale();
    const facts = [
        [t('training.courses.dates'), course.dates],
        [t('training.courses.duration'), course.duration],
        [t('training.courses.location'), course.location],
        [t('training.courses.trainer'), course.trainer],
        [
            t('training.courses.available_seats'),
            String(course.available_seats),
        ],
        [t('training.courses.deadline_label'), course.registration_deadline ?? ''],
    ];

    return (
        <FrontendLayout>
            <Head title={`${course.title} - ${t('app.name')}`} />

            <section className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
                <Link
                    href="/training/courses"
                    className="text-sm font-semibold text-[#0057c8]"
                >
                    {t('training.courses.back_to_list')}
                </Link>
                <h1 className="mt-4 text-4xl font-extrabold text-[#050315]">
                    {course.title}
                </h1>
                {course.thumbnail_url ? (
                    <img
                        src={course.thumbnail_url}
                        alt=""
                        className="mt-6 aspect-[16/9] w-full rounded-2xl object-cover"
                    />
                ) : (
                    <div className="mt-6 flex aspect-[16/9] items-center justify-center rounded-2xl bg-gradient-to-br from-[#1e3a8a] to-[#0f172a] text-white/70">
                        <GraduationCap className="size-12" />
                    </div>
                )}
                <p className="mt-6 whitespace-pre-line text-base leading-7 text-[#4a5565]">
                    {course.description}
                </p>

                <dl className="mt-8 divide-y divide-[#e2e8f0] rounded-2xl border border-[#dbeafe] bg-white">
                    {facts.map(([label, value]) => (
                        <div
                            key={label}
                            className="grid gap-1 px-5 py-3 sm:grid-cols-[180px_minmax(0,1fr)]"
                        >
                            <dt className="text-sm font-semibold text-[#050315]">
                                {label}
                            </dt>
                            <dd className="text-sm text-[#4a5565]">{value}</dd>
                        </div>
                    ))}
                </dl>

                {course.registration_open ? (
                    <Link
                        href={`/training/courses/${course.slug}/register`}
                        className="mt-8 inline-flex rounded-lg bg-[#0057c8] px-5 py-2.5 text-sm font-semibold text-white"
                    >
                        {t('training.courses.register')}
                    </Link>
                ) : (
                    <p className="mt-8 text-sm font-semibold text-[#b45309]">
                        {t('training.courses.closed')}
                    </p>
                )}
            </section>
        </FrontendLayout>
    );
}
