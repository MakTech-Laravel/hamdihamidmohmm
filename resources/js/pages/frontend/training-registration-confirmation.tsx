import { Head, Link } from '@inertiajs/react';

import { useLocale } from '@/hooks/use-locale';
import FrontendLayout from '@/layouts/frontend-layout';

type Registration = {
    number: string;
    full_name: string;
    email: string;
    course_title: string | null;
    status_label: string | null;
};

export default function TrainingRegistrationConfirmation({
    registration,
}: {
    registration: Registration;
}) {
    const { t } = useLocale();

    return (
        <FrontendLayout>
            <Head title={`${t('training.confirmation.title')} - ${t('app.name')}`} />

            <section className="mx-auto max-w-xl px-4 py-16 sm:px-6">
                <div className="rounded-2xl border border-[#dbeafe] bg-white p-8 shadow-[0px_4px_12px_rgba(30,58,138,0.06)]">
                    <h1 className="text-3xl font-extrabold text-[#050315]">
                        {t('training.confirmation.title')}
                    </h1>
                    <p className="mt-3 text-sm leading-6 text-[#4a5565]">
                        {t('training.confirmation.body', {
                            course: registration.course_title ?? '',
                            email: registration.email,
                        })}
                    </p>
                    <p className="mt-6 text-sm font-semibold text-[#64748b]">
                        {t('training.confirmation.number')}
                    </p>
                    <p className="mt-1 text-2xl font-extrabold text-[#0057c8]">
                        {registration.number}
                    </p>
                    <p className="mt-4 text-sm text-[#4a5565]">
                        {registration.full_name}
                        {registration.status_label
                            ? ` · ${registration.status_label}`
                            : ''}
                    </p>
                    <Link
                        href="/training/courses"
                        className="mt-8 inline-flex text-sm font-semibold text-[#0057c8]"
                    >
                        {t('training.courses.back_to_list')}
                    </Link>
                </div>
            </section>
        </FrontendLayout>
    );
}
