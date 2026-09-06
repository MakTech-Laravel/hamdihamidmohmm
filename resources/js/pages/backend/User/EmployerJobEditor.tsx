import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { useState, type ReactNode } from 'react';

import { NativeSelect } from '@/components/ui/native-select';
import { useLocale } from '@/hooks/use-locale';
import EmployerLayout from '@/layouts/employer-layout';
import { cn } from '@/lib/utils';

type JobForm = {
    id: number;
    title: string;
    category: string | null;
    location: string | null;
    employment_type: string | null;
    experience_level: string | null;
    salary_range: string | null;
    description: string | null;
    requirements: string | null;
    skills: string[];
    expires_at: string | null;
    status: string;
};

type Plan = {
    credits_remaining: number;
    can_post_job: boolean;
    label: string | null;
};

type Props = {
    job: JobForm | null;
    plan: Plan | null;
    options: {
        categories: string[];
        types: string[];
        experience_levels: string[];
    };
};

export default function EmployerJobEditor({ job, plan, options }: Props) {
    const { t } = useLocale();
    const isEdit = job !== null;
    const [step, setStep] = useState(1);
    const form = useForm({
        title: job?.title ?? '',
        category: job?.category ?? '',
        location: job?.location ?? '',
        employment_type: job?.employment_type ?? 'Full-time',
        experience_level: job?.experience_level ?? '',
        salary_range: job?.salary_range ?? '',
        description: job?.description ?? '',
        requirements: job?.requirements ?? '',
        skills: (job?.skills ?? []).join(', '),
        expires_at: job?.expires_at ?? '',
        publish: true,
    });

    const steps = [
        { id: 1, label: t('employer.job_editor.step.basics') },
        { id: 2, label: t('employer.job_editor.step.details') },
        { id: 3, label: t('employer.job_editor.step.requirements') },
        { id: 4, label: t('employer.job_editor.step.preview') },
    ];

    const pageTitle = isEdit
        ? t('employer.job_editor.title_edit')
        : t('employer.job_editor.title_create');

    const submit = (publish: boolean) => {
        form.transform((data) => ({ ...data, publish }));

        if (isEdit && job) {
            form.put(`/employer/jobs/${job.id}`);
        } else {
            form.post('/employer/jobs');
        }
    };

    return (
        <EmployerLayout title={t('employer.jobs.title')}>
            <Head title={pageTitle} />

            <div className="space-y-6 px-4 py-6 sm:px-6">
                <div>
                    <h1 className="text-[28px] font-extrabold tracking-tight text-[#050315]">
                        {pageTitle}
                    </h1>
                    <p className="mt-1 text-sm text-[#64748b]">
                        {t('employer.job_editor.subtitle')}
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    {steps.map((item, index) => (
                        <div key={item.id} className="flex items-center gap-3">
                            <button
                                type="button"
                                onClick={() => setStep(item.id)}
                                className="flex cursor-pointer items-center gap-2"
                            >
                                <span
                                    className={cn(
                                        'flex size-8 items-center justify-center rounded-full text-sm font-bold',
                                        step === item.id
                                            ? 'bg-[#e57124] text-white'
                                            : step > item.id
                                              ? 'bg-[#0057c8] text-white'
                                              : 'bg-[#eef2ff] text-[#64748b]',
                                    )}
                                >
                                    {item.id}
                                </span>
                                <span
                                    className={cn(
                                        'text-sm font-semibold',
                                        step === item.id
                                            ? 'text-[#e57124]'
                                            : 'text-[#64748b]',
                                    )}
                                >
                                    {item.label}
                                </span>
                            </button>
                            {index < steps.length - 1 && (
                                <span className="hidden h-px w-8 bg-[#e2e8f0] sm:block" />
                            )}
                        </div>
                    ))}
                </div>

                {form.errors.title && (
                    <p className="rounded-xl border border-[#fecaca] bg-[#fef2f2] px-4 py-3 text-sm text-[#b91c1c]">
                        {form.errors.title}
                    </p>
                )}

                {plan && !plan.can_post_job && !isEdit && (
                    <p className="rounded-xl border border-[#fed7aa] bg-[#fff7ed] px-4 py-3 text-sm text-[#c2410c]">
                        {t('employer.job_editor.credits_warning', {
                            plan:
                                plan.label ||
                                t('employer.job_editor.your_plan'),
                        })}
                    </p>
                )}

                <form
                    className="rounded-2xl border border-[#e8d5e8] bg-white p-6 shadow-[0px_2px_4px_rgba(5,3,21,0.06)]"
                    onSubmit={(event) => {
                        event.preventDefault();
                        if (step < 4) {
                            setStep(step + 1);
                            return;
                        }
                        submit(true);
                    }}
                >
                    {step === 1 && (
                        <div className="space-y-4">
                            <h2 className="text-lg font-bold text-[#050315]">
                                {t('employer.job_editor.step.basics')}
                            </h2>
                            <Field
                                label={t('employer.job_editor.field.title')}
                                error={form.errors.title}
                            >
                                <input
                                    value={form.data.title}
                                    onChange={(event) =>
                                        form.setData('title', event.target.value)
                                    }
                                    placeholder={t(
                                        'employer.job_editor.field.title_placeholder',
                                    )}
                                    className={inputClass}
                                />
                            </Field>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <Field
                                    label={t(
                                        'employer.job_editor.field.category',
                                    )}
                                >
                                    <NativeSelect
                                        value={form.data.category}
                                        onChange={(event) =>
                                            form.setData(
                                                'category',
                                                event.target.value,
                                            )
                                        }
                                        className={selectClass}
                                    >
                                        <option value="">
                                            {t(
                                                'employer.job_editor.field.select_category',
                                            )}
                                        </option>
                                        {options.categories.map((item) => (
                                            <option key={item} value={item}>
                                                {item}
                                            </option>
                                        ))}
                                    </NativeSelect>
                                </Field>
                                <Field
                                    label={t(
                                        'employer.job_editor.field.job_type',
                                    )}
                                >
                                    <NativeSelect
                                        value={form.data.employment_type}
                                        onChange={(event) =>
                                            form.setData(
                                                'employment_type',
                                                event.target.value,
                                            )
                                        }
                                        className={selectClass}
                                    >
                                        {options.types.map((item) => (
                                            <option key={item} value={item}>
                                                {item}
                                            </option>
                                        ))}
                                    </NativeSelect>
                                </Field>
                                <Field
                                    label={t(
                                        'employer.job_editor.field.location',
                                    )}
                                >
                                    <input
                                        value={form.data.location}
                                        onChange={(event) =>
                                            form.setData(
                                                'location',
                                                event.target.value,
                                            )
                                        }
                                        placeholder={t(
                                            'employer.job_editor.field.location_placeholder',
                                        )}
                                        className={inputClass}
                                    />
                                </Field>
                                <Field
                                    label={t(
                                        'employer.job_editor.field.experience',
                                    )}
                                >
                                    <NativeSelect
                                        value={form.data.experience_level}
                                        onChange={(event) =>
                                            form.setData(
                                                'experience_level',
                                                event.target.value,
                                            )
                                        }
                                        className={selectClass}
                                    >
                                        <option value="">
                                            {t(
                                                'employer.job_editor.field.select_level',
                                            )}
                                        </option>
                                        {options.experience_levels.map(
                                            (item) => (
                                                <option key={item} value={item}>
                                                    {item}
                                                </option>
                                            ),
                                        )}
                                    </NativeSelect>
                                </Field>
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-4">
                            <h2 className="text-lg font-bold text-[#050315]">
                                {t('employer.job_editor.step.details')}
                            </h2>
                            <Field
                                label={t('employer.job_editor.field.salary')}
                            >
                                <input
                                    value={form.data.salary_range}
                                    onChange={(event) =>
                                        form.setData(
                                            'salary_range',
                                            event.target.value,
                                        )
                                    }
                                    placeholder={t(
                                        'employer.job_editor.field.salary_placeholder',
                                    )}
                                    className={inputClass}
                                />
                            </Field>
                            <Field
                                label={t(
                                    'employer.job_editor.field.description',
                                )}
                            >
                                <textarea
                                    rows={6}
                                    value={form.data.description}
                                    onChange={(event) =>
                                        form.setData(
                                            'description',
                                            event.target.value,
                                        )
                                    }
                                    placeholder={t(
                                        'employer.job_editor.field.description_placeholder',
                                    )}
                                    className={inputClass}
                                />
                            </Field>
                            <Field
                                label={t('employer.job_editor.field.expires')}
                            >
                                <input
                                    type="date"
                                    value={form.data.expires_at}
                                    onChange={(event) =>
                                        form.setData(
                                            'expires_at',
                                            event.target.value,
                                        )
                                    }
                                    className={inputClass}
                                />
                            </Field>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="space-y-4">
                            <h2 className="text-lg font-bold text-[#050315]">
                                {t('employer.job_editor.step.requirements')}
                            </h2>
                            <Field
                                label={t(
                                    'employer.job_editor.field.requirements',
                                )}
                            >
                                <textarea
                                    rows={6}
                                    value={form.data.requirements}
                                    onChange={(event) =>
                                        form.setData(
                                            'requirements',
                                            event.target.value,
                                        )
                                    }
                                    placeholder={t(
                                        'employer.job_editor.field.requirements_placeholder',
                                    )}
                                    className={inputClass}
                                />
                            </Field>
                            <Field
                                label={t('employer.job_editor.field.skills')}
                            >
                                <input
                                    value={form.data.skills}
                                    onChange={(event) =>
                                        form.setData(
                                            'skills',
                                            event.target.value,
                                        )
                                    }
                                    placeholder={t(
                                        'employer.job_editor.field.skills_placeholder',
                                    )}
                                    className={inputClass}
                                />
                                <p className="mt-1 text-xs text-[#94a3b8]">
                                    {t(
                                        'employer.job_editor.field.skills_hint',
                                    )}
                                </p>
                            </Field>
                        </div>
                    )}

                    {step === 4 && (
                        <div className="space-y-4">
                            <h2 className="text-lg font-bold text-[#050315]">
                                {t('employer.job_editor.step.preview')}
                            </h2>
                            <dl className="grid gap-3 text-sm sm:grid-cols-2">
                                {[
                                    [
                                        t('employer.job_editor.preview.title'),
                                        form.data.title || '—',
                                    ],
                                    [
                                        t(
                                            'employer.job_editor.preview.category',
                                        ),
                                        form.data.category || '—',
                                    ],
                                    [
                                        t('employer.job_editor.preview.type'),
                                        form.data.employment_type || '—',
                                    ],
                                    [
                                        t(
                                            'employer.job_editor.preview.location',
                                        ),
                                        form.data.location || '—',
                                    ],
                                    [
                                        t(
                                            'employer.job_editor.preview.experience',
                                        ),
                                        form.data.experience_level || '—',
                                    ],
                                    [
                                        t('employer.job_editor.preview.salary'),
                                        form.data.salary_range || '—',
                                    ],
                                    [
                                        t(
                                            'employer.job_editor.preview.expires',
                                        ),
                                        form.data.expires_at ||
                                            t(
                                                'employer.job_editor.preview.default_expires',
                                            ),
                                    ],
                                ].map(([label, value]) => (
                                    <div key={label}>
                                        <dt className="text-xs text-[#94a3b8]">
                                            {label}
                                        </dt>
                                        <dd className="font-semibold text-[#050315]">
                                            {value}
                                        </dd>
                                    </div>
                                ))}
                            </dl>
                            {form.data.description && (
                                <p className="text-sm whitespace-pre-wrap text-[#364153]">
                                    {form.data.description}
                                </p>
                            )}
                        </div>
                    )}

                    <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
                        <button
                            type="button"
                            disabled={step === 1}
                            onClick={() => setStep((current) => current - 1)}
                            className="inline-flex cursor-pointer items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-[#64748b] disabled:opacity-40"
                        >
                            <ArrowLeft className="size-4" />
                            {t('employer.job_editor.previous_step')}
                        </button>
                        <div className="flex flex-wrap gap-2">
                            <Link
                                href="/employer/jobs"
                                className="rounded-xl px-4 py-2.5 text-sm font-semibold text-[#64748b]"
                            >
                                {t('common.cancel')}
                            </Link>
                            {step === 4 ? (
                                <>
                                    <button
                                        type="button"
                                        disabled={form.processing}
                                        onClick={() => submit(false)}
                                        className="cursor-pointer rounded-xl border border-[#e2e8f0] px-4 py-2.5 text-sm font-semibold text-[#364153]"
                                    >
                                        {t('employer.job_editor.save_draft')}
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={form.processing}
                                        className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-[#0057c8] px-5 py-2.5 text-sm font-semibold text-white"
                                    >
                                        {isEdit
                                            ? t(
                                                  'employer.job_editor.save_submit',
                                              )
                                            : t(
                                                  'employer.job_editor.submit_review',
                                              )}
                                    </button>
                                </>
                            ) : (
                                <button
                                    type="submit"
                                    className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-[#0057c8] px-5 py-2.5 text-sm font-semibold text-white"
                                >
                                    {t('employer.job_editor.next_step')}
                                    <ArrowRight className="size-4" />
                                </button>
                            )}
                        </div>
                    </div>
                </form>
            </div>
        </EmployerLayout>
    );
}

const inputClass =
    'mt-1 w-full rounded-xl border border-[#e8d5e8] bg-[#f8faff] px-3 py-2.5 text-sm text-[#050315] outline-none focus:border-[#0057c8]';

const selectClass =
    'mt-1 border-[#e8d5e8] bg-gradient-to-b from-white to-[#f8faff]';

function Field({
    label,
    error,
    children,
}: {
    label: string;
    error?: string;
    children: ReactNode;
}) {
    return (
        <label className="block text-sm font-medium text-[#050315]">
            {label}
            {children}
            {error && <p className="mt-1 text-xs text-[#b91c1c]">{error}</p>}
        </label>
    );
}
