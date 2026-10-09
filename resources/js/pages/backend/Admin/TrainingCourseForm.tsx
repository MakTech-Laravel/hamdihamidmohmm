import { Head, useForm } from '@inertiajs/react';
import { type FormEvent } from 'react';

import { TrainingSectionNav } from '@/components/admin-portal/training-section-nav';
import {
    AdminPageHeader,
    AdminPanel,
    AdminPrimaryButton,
    AdminSecondaryButton,
} from '@/components/admin-portal/ui';
import InputError from '@/components/input-error';
import { useLocale } from '@/hooks/use-locale';
import AdminPortalLayout from '@/layouts/admin-portal-layout';

type Question = {
    id: string;
    label: string;
    type: string;
    required: boolean;
    options: string[];
};

type CourseForm = {
    id: number;
    title: string;
    description: string;
    starts_on: string | null;
    ends_on: string | null;
    duration: string;
    location: string;
    trainer: string;
    seats: number;
    registration_deadline: string | null;
    is_published: boolean;
    questions: Question[];
    thumbnail_url: string | null;
};

type QuestionType = {
    value: string;
    label: string;
};

const inputClassName =
    'w-full rounded-xl border border-[#e2e8f0] px-3 py-2 text-sm text-[#050315] outline-none focus:border-[#0057c8]';

function newQuestion(): Question {
    return {
        id: crypto.randomUUID().replaceAll('-', '').slice(0, 26),
        label: '',
        type: 'short_text',
        required: false,
        options: ['', ''],
    };
}

export default function TrainingCourseForm({
    course,
    questionTypes,
}: {
    course: CourseForm | null;
    questionTypes: QuestionType[];
}) {
    const { t } = useLocale();
    const form = useForm({
        title: course?.title ?? '',
        description: course?.description ?? '',
        starts_on: course?.starts_on ?? '',
        ends_on: course?.ends_on ?? '',
        duration: course?.duration ?? '',
        location: course?.location ?? '',
        trainer: course?.trainer ?? '',
        seats: course?.seats ?? 20,
        registration_deadline: course?.registration_deadline ?? '',
        is_published: course?.is_published ?? false,
        questions: course?.questions ?? [],
        thumbnail: null as File | null,
    });

    const submit = (event: FormEvent) => {
        event.preventDefault();

        if (course) {
            form.put(`/admin/training/courses/${course.id}`, {
                forceFormData: true,
            });

            return;
        }

        form.post('/admin/training/courses', {
            forceFormData: true,
        });
    };

    const updateQuestion = (index: number, patch: Partial<Question>) => {
        const questions = form.data.questions.map((question, questionIndex) =>
            questionIndex === index ? { ...question, ...patch } : question,
        );
        form.setData('questions', questions);
    };

    const moveQuestion = (index: number, direction: -1 | 1) => {
        const nextIndex = index + direction;

        if (nextIndex < 0 || nextIndex >= form.data.questions.length) {
            return;
        }

        const questions = [...form.data.questions];
        const current = questions[index];
        questions[index] = questions[nextIndex];
        questions[nextIndex] = current;
        form.setData('questions', questions);
    };

    return (
        <AdminPortalLayout>
            <Head
                title={
                    course
                        ? t('admin.training.courses.edit')
                        : t('admin.training.courses.create')
                }
            />
            <form onSubmit={submit} className="space-y-6 p-6">
                <AdminPageHeader
                    title={
                        course
                            ? t('admin.training.courses.edit')
                            : t('admin.training.courses.create')
                    }
                    subtitle={t('admin.training.courses.form_subtitle')}
                />
                <TrainingSectionNav />
                <AdminPanel className="grid gap-4 p-6 md:grid-cols-2">
                    <label className="space-y-1 md:col-span-2">
                        <span className="text-sm font-semibold">{t('admin.training.courses.field.title')}</span>
                        <input
                            className={inputClassName}
                            value={form.data.title}
                            onChange={(event) => form.setData('title', event.target.value)}
                            required
                        />
                        <InputError message={form.errors.title} />
                    </label>
                    <label className="space-y-1 md:col-span-2">
                        <span className="text-sm font-semibold">{t('admin.training.courses.field.description')}</span>
                        <textarea
                            className={`${inputClassName} min-h-32`}
                            value={form.data.description}
                            onChange={(event) => form.setData('description', event.target.value)}
                            required
                        />
                        <InputError message={form.errors.description} />
                    </label>
                    <label className="space-y-1 md:col-span-2">
                        <span className="text-sm font-semibold">{t('admin.training.courses.field.thumbnail')}</span>
                        {course?.thumbnail_url ? (
                            <img
                                src={course.thumbnail_url}
                                alt=""
                                className="h-32 w-full max-w-sm rounded-xl object-cover"
                            />
                        ) : null}
                        <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            className="block text-sm"
                            onChange={(event) =>
                                form.setData('thumbnail', event.target.files?.[0] ?? null)
                            }
                        />
                        <p className="text-xs text-[#64748b]">
                            {t('admin.training.courses.field.thumbnail_help')}
                        </p>
                        <InputError message={form.errors.thumbnail} />
                    </label>
                    <label className="space-y-1">
                        <span className="text-sm font-semibold">{t('admin.training.courses.field.starts_on')}</span>
                        <input
                            type="date"
                            className={inputClassName}
                            value={form.data.starts_on}
                            onChange={(event) => form.setData('starts_on', event.target.value)}
                            required
                        />
                        <InputError message={form.errors.starts_on} />
                    </label>
                    <label className="space-y-1">
                        <span className="text-sm font-semibold">{t('admin.training.courses.field.ends_on')}</span>
                        <input
                            type="date"
                            className={inputClassName}
                            value={form.data.ends_on ?? ''}
                            onChange={(event) => form.setData('ends_on', event.target.value)}
                        />
                        <InputError message={form.errors.ends_on} />
                    </label>
                    <label className="space-y-1">
                        <span className="text-sm font-semibold">{t('admin.training.courses.field.duration')}</span>
                        <input
                            className={inputClassName}
                            value={form.data.duration}
                            onChange={(event) => form.setData('duration', event.target.value)}
                            required
                        />
                        <InputError message={form.errors.duration} />
                    </label>
                    <label className="space-y-1">
                        <span className="text-sm font-semibold">{t('admin.training.courses.field.location')}</span>
                        <input
                            className={inputClassName}
                            value={form.data.location}
                            onChange={(event) => form.setData('location', event.target.value)}
                            required
                        />
                        <InputError message={form.errors.location} />
                    </label>
                    <label className="space-y-1">
                        <span className="text-sm font-semibold">{t('admin.training.courses.field.trainer')}</span>
                        <input
                            className={inputClassName}
                            value={form.data.trainer}
                            onChange={(event) => form.setData('trainer', event.target.value)}
                            required
                        />
                        <InputError message={form.errors.trainer} />
                    </label>
                    <label className="space-y-1">
                        <span className="text-sm font-semibold">{t('admin.training.courses.field.seats')}</span>
                        <input
                            type="number"
                            min={1}
                            className={inputClassName}
                            value={form.data.seats}
                            onChange={(event) => form.setData('seats', Number(event.target.value))}
                            required
                        />
                        <InputError message={form.errors.seats} />
                    </label>
                    <label className="space-y-1">
                        <span className="text-sm font-semibold">{t('admin.training.courses.field.deadline')}</span>
                        <input
                            type="date"
                            className={inputClassName}
                            value={form.data.registration_deadline ?? ''}
                            onChange={(event) =>
                                form.setData('registration_deadline', event.target.value)
                            }
                            required
                        />
                        <InputError message={form.errors.registration_deadline} />
                    </label>
                    <label className="flex items-center gap-2 text-sm font-semibold md:col-span-2">
                        <input
                            type="checkbox"
                            checked={form.data.is_published}
                            onChange={(event) => form.setData('is_published', event.target.checked)}
                        />
                        {t('admin.training.courses.field.published')}
                    </label>
                </AdminPanel>

                <AdminPanel className="space-y-4 p-6">
                    <div className="flex items-center justify-between gap-3">
                        <div>
                            <h2 className="text-base font-bold text-[#050315]">
                                {t('admin.training.courses.questions')}
                            </h2>
                            <p className="text-sm text-[#64748b]">
                                {t('admin.training.courses.questions_help')}
                            </p>
                        </div>
                        <AdminSecondaryButton
                            type="button"
                            onClick={() =>
                                form.setData('questions', [
                                    ...form.data.questions,
                                    newQuestion(),
                                ])
                            }
                        >
                            {t('admin.training.courses.add_question')}
                        </AdminSecondaryButton>
                    </div>
                    <InputError message={form.errors.questions} />
                    {form.data.questions.map((question, index) => (
                        <div
                            key={question.id}
                            className="space-y-3 rounded-xl border border-[#e2e8f0] p-4"
                        >
                            <div className="grid gap-3 md:grid-cols-2">
                                <input
                                    className={inputClassName}
                                    value={question.label}
                                    placeholder={t('admin.training.courses.question_label')}
                                    onChange={(event) =>
                                        updateQuestion(index, { label: event.target.value })
                                    }
                                    required
                                />
                                <select
                                    className={inputClassName}
                                    value={question.type}
                                    onChange={(event) =>
                                        updateQuestion(index, { type: event.target.value })
                                    }
                                >
                                    {questionTypes.map((type) => (
                                        <option key={type.value} value={type.value}>
                                            {type.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <InputError message={form.errors[`questions.${index}.label`]} />
                            <InputError message={form.errors[`questions.${index}.options`]} />
                            <label className="flex items-center gap-2 text-sm">
                                <input
                                    type="checkbox"
                                    checked={question.required}
                                    onChange={(event) =>
                                        updateQuestion(index, { required: event.target.checked })
                                    }
                                />
                                {t('admin.training.courses.question_required')}
                            </label>
                            {question.type === 'single_choice' ? (
                                <div className="space-y-2">
                                    {question.options.map((option, optionIndex) => (
                                        <input
                                            key={`${question.id}-${optionIndex}`}
                                            className={inputClassName}
                                            value={option}
                                            placeholder={t('admin.training.courses.option')}
                                            onChange={(event) => {
                                                const options = [...question.options];
                                                options[optionIndex] = event.target.value;
                                                updateQuestion(index, { options });
                                            }}
                                        />
                                    ))}
                                    <button
                                        type="button"
                                        className="text-sm font-semibold text-[#0057c8]"
                                        onClick={() =>
                                            updateQuestion(index, {
                                                options: [...question.options, ''],
                                            })
                                        }
                                    >
                                        {t('admin.training.courses.add_option')}
                                    </button>
                                </div>
                            ) : null}
                            <div className="flex flex-wrap gap-3 text-sm">
                                <button type="button" onClick={() => moveQuestion(index, -1)}>
                                    {t('admin.training.courses.move_up')}
                                </button>
                                <button type="button" onClick={() => moveQuestion(index, 1)}>
                                    {t('admin.training.courses.move_down')}
                                </button>
                                <button
                                    type="button"
                                    className="text-[#b91c1c]"
                                    onClick={() =>
                                        form.setData(
                                            'questions',
                                            form.data.questions.filter(
                                                (_, questionIndex) => questionIndex !== index,
                                            ),
                                        )
                                    }
                                >
                                    {t('admin.training.courses.remove_question')}
                                </button>
                            </div>
                        </div>
                    ))}
                </AdminPanel>

                <AdminPrimaryButton type="submit" disabled={form.processing}>
                    {t('admin.training.courses.save')}
                </AdminPrimaryButton>
            </form>
        </AdminPortalLayout>
    );
}
