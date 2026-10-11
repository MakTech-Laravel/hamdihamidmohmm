import { Head, Link } from '@inertiajs/react';
import { Calendar, GraduationCap, MapPin, UserRound } from 'lucide-react';

import { useLocale } from '@/hooks/use-locale';
import FrontendLayout from '@/layouts/frontend-layout';
import { training } from '@/routes';

type CourseCard = {
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

export default function TrainingCourses({ courses }: { courses: CourseCard[] }) {
    const { t } = useLocale();

    return (
        <FrontendLayout>
            <Head title={`${t('training.courses.title')} - ${t('app.name')}`} />

            <section className="bg-[#d1f6ff] px-4 py-14 sm:px-6 lg:px-8">
                <div className="mx-auto max-w-[1344px]">
                    <Link
                        href={training.url()}
                        className="text-sm font-semibold text-[#0057c8]"
                    >
                        {t('training.courses.back')}
                    </Link>
                    <h1 className="mt-4 text-4xl font-extrabold text-[#050315]">
                        {t('training.courses.title')}
                    </h1>
                    <p className="mt-3 max-w-2xl text-base leading-7 text-[#4a5565]">
                        {t('training.courses.subtitle')}
                    </p>
                </div>
            </section>

            <section className="mx-auto max-w-[1344px] px-4 py-12 sm:px-6 lg:px-8">
                {courses.length === 0 ? (
                    <p className="rounded-2xl border border-[#dbeafe] bg-white px-6 py-10 text-sm text-[#64748b]">
                        {t('training.courses.empty')}
                    </p>
                ) : (
                    <div className="grid gap-5 md:grid-cols-2">
                        {courses.map((course) => (
                            <article
                                key={course.slug}
                                className="flex flex-col overflow-hidden rounded-2xl border border-[#dbeafe] bg-white shadow-[0px_4px_12px_rgba(30,58,138,0.06)]"
                            >
                                {course.thumbnail_url ? (
                                    <img
                                        src={course.thumbnail_url}
                                        alt=""
                                        className="h-44 w-full object-cover"
                                    />
                                ) : (
                                    <div className="flex h-44 items-center justify-center bg-gradient-to-br from-[#1e3a8a] to-[#0f172a] text-white/70">
                                        <GraduationCap className="size-10" />
                                    </div>
                                )}
                                <div className="flex flex-1 flex-col p-6">
                                <h2 className="text-xl font-bold text-[#050315]">
                                    {course.title}
                                </h2>
                                <p className="mt-2 line-clamp-3 text-sm leading-6 text-[#4a5565]">
                                    {course.description}
                                </p>
                                <dl className="mt-4 grid gap-2 text-sm text-[#4a5565]">
                                    <div className="flex items-center gap-2">
                                        <Calendar className="size-4 text-[#0057c8]" />
                                        <span>
                                            {course.dates} · {course.duration}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <MapPin className="size-4 text-[#0057c8]" />
                                        <span>{course.location}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <UserRound className="size-4 text-[#0057c8]" />
                                        <span>{course.trainer}</span>
                                    </div>
                                </dl>
                                <p className="mt-4 text-sm font-semibold text-[#050315]">
                                    {t('training.courses.seats', {
                                        count: course.available_seats,
                                    })}
                                </p>
                                <p className="mt-1 text-sm text-[#64748b]">
                                    {t('training.courses.deadline', {
                                        date: course.registration_deadline ?? '',
                                    })}
                                </p>
                                <Link
                                    href={`/training/courses/${course.slug}`}
                                    className="mt-5 inline-flex w-fit rounded-lg bg-[#0057c8] px-4 py-2 text-sm font-semibold text-white"
                                >
                                    {t('training.courses.view')}
                                </Link>
                                </div>
                            </article>
                        ))}
                    </div>
                )}
            </section>
        </FrontendLayout>
    );
}
