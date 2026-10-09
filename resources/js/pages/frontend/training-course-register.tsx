import { Head, Link, useForm } from '@inertiajs/react';
import { type FormEvent } from 'react';

import InputError from '@/components/input-error';
import { useLocale } from '@/hooks/use-locale';
import FrontendLayout from '@/layouts/frontend-layout';

type Question = {
    id: string;
    label: string;
    type: 'short_text' | 'long_text' | 'yes_no' | 'single_choice';
    required: boolean;
    options: string[];
};

type Course = {
    title: string;
    slug: string;
    registration_open: boolean;
    questions: Question[];
};

const fieldClassName =
    'w-full rounded-xl border border-[#e2e8f0] bg-[#f9fafb] px-4 py-3 text-sm text-[#050315] outline-none focus:border-[#0057c8]';

export default function TrainingCourseRegister({ course }: { course: Course }) {
    const { t } = useLocale();
    const form = useForm({
        full_name: '',
        email: '',
        phone: '',
        country_city: '',
        organization: '',
        job_title: '',
        experience: '',
        reason: '',
        answers: course.questions.map((question) => ({
            id: question.id,
            value: '',
        })),
        consent: false,
    });

    const fields: Array<{
        name: keyof typeof form.data;
        label: string;
        multiline?: boolean;
    }> = [
        { name: 'full_name', label: t('training.register.full_name') },
        { name: 'email', label: t('training.register.email') },
        { name: 'phone', label: t('training.register.phone') },
        { name: 'country_city', label: t('training.register.country_city') },
        { name: 'organization', label: t('training.register.organization') },
        { name: 'job_title', label: t('training.register.job_title') },
        {
            name: 'experience',
            label: t('training.register.experience'),
            multiline: true,
        },
        { name: 'reason', label: t('training.register.reason'), multiline: true },
    ];

    const submit = (event: FormEvent) => {
        event.preventDefault();
        form.post(`/training/courses/${course.slug}/register`);
    };

    return (
        <FrontendLayout>
            <Head
                title={`${t('training.courses.register')} - ${course.title}`}
            />

            <section className="mx-auto max-w-2xl px-4 py-14 sm:px-6">
                <Link
                    href={`/training/courses/${course.slug}`}
                    className="text-sm font-semibold text-[#0057c8]"
                >
                    {course.title}
                </Link>
                <h1 className="mt-4 text-3xl font-extrabold text-[#050315]">
                    {t('training.courses.register')}
                </h1>

                {course.registration_open ? (
                    <form onSubmit={submit} className="mt-8 space-y-5">
                        {fields.map((field) => (
                            <label key={field.name} className="block space-y-2">
                                <span className="text-sm font-semibold text-[#050315]">
                                    {field.label}
                                </span>
                                {field.multiline ? (
                                    <textarea
                                        value={String(form.data[field.name])}
                                        onChange={(event) =>
                                            form.setData(
                                                field.name,
                                                event.target.value,
                                            )
                                        }
                                        className={`${fieldClassName} min-h-28`}
                                        required
                                    />
                                ) : (
                                    <input
                                        type={
                                            field.name === 'email'
                                                ? 'email'
                                                : 'text'
                                        }
                                        value={String(form.data[field.name])}
                                        onChange={(event) =>
                                            form.setData(
                                                field.name,
                                                event.target.value,
                                            )
                                        }
                                        className={fieldClassName}
                                        required
                                    />
                                )}
                                <InputError
                                    message={form.errors[field.name]}
                                />
                            </label>
                        ))}

                        {course.questions.map((question, index) => (
                            <label key={question.id} className="block space-y-2">
                                <span className="text-sm font-semibold text-[#050315]">
                                    {question.label}
                                    {question.required ? ' *' : ''}
                                </span>
                                {question.type === 'long_text' ? (
                                    <textarea
                                        value={form.data.answers[index]?.value ?? ''}
                                        onChange={(event) => {
                                            const answers = [...form.data.answers];
                                            answers[index] = {
                                                id: question.id,
                                                value: event.target.value,
                                            };
                                            form.setData('answers', answers);
                                        }}
                                        className={`${fieldClassName} min-h-28`}
                                        required={question.required}
                                    />
                                ) : null}
                                {question.type === 'short_text' ? (
                                    <input
                                        type="text"
                                        value={form.data.answers[index]?.value ?? ''}
                                        onChange={(event) => {
                                            const answers = [...form.data.answers];
                                            answers[index] = {
                                                id: question.id,
                                                value: event.target.value,
                                            };
                                            form.setData('answers', answers);
                                        }}
                                        className={fieldClassName}
                                        required={question.required}
                                    />
                                ) : null}
                                {question.type === 'yes_no' ? (
                                    <select
                                        value={form.data.answers[index]?.value ?? ''}
                                        onChange={(event) => {
                                            const answers = [...form.data.answers];
                                            answers[index] = {
                                                id: question.id,
                                                value: event.target.value,
                                            };
                                            form.setData('answers', answers);
                                        }}
                                        className={fieldClassName}
                                        required={question.required}
                                    >
                                        <option value="">
                                            {t('training.register.choose')}
                                        </option>
                                        <option value="yes">
                                            {t('training.register.yes')}
                                        </option>
                                        <option value="no">
                                            {t('training.register.no')}
                                        </option>
                                    </select>
                                ) : null}
                                {question.type === 'single_choice' ? (
                                    <select
                                        value={form.data.answers[index]?.value ?? ''}
                                        onChange={(event) => {
                                            const answers = [...form.data.answers];
                                            answers[index] = {
                                                id: question.id,
                                                value: event.target.value,
                                            };
                                            form.setData('answers', answers);
                                        }}
                                        className={fieldClassName}
                                        required={question.required}
                                    >
                                        <option value="">
                                            {t('training.register.choose')}
                                        </option>
                                        {question.options.map((option) => (
                                            <option key={option} value={option}>
                                                {option}
                                            </option>
                                        ))}
                                    </select>
                                ) : null}
                            </label>
                        ))}

                        <InputError message={form.errors.answers} />
                        <InputError
                            message={
                                (
                                    form.errors as Partial<
                                        Record<'course', string>
                                    >
                                ).course
                            }
                        />

                        <label className="flex items-start gap-3 text-sm text-[#050315]">
                            <input
                                type="checkbox"
                                checked={form.data.consent}
                                onChange={(event) =>
                                    form.setData('consent', event.target.checked)
                                }
                                className="mt-1"
                                required
                            />
                            <span>{t('training.register.consent')}</span>
                        </label>
                        <InputError message={form.errors.consent} />

                        <button
                            type="submit"
                            disabled={form.processing}
                            className="rounded-lg bg-[#0057c8] px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
                        >
                            {form.processing
                                ? t('training.register.submitting')
                                : t('training.register.submit')}
                        </button>
                    </form>
                ) : (
                    <p className="mt-8 text-sm font-semibold text-[#b45309]">
                        {t('training.courses.closed')}
                    </p>
                )}
            </section>
        </FrontendLayout>
    );
}
