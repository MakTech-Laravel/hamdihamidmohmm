import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { ImagePlus } from 'lucide-react';
import { useRef, useState, type ChangeEvent } from 'react';

import {
    show,
    update,
} from '@/actions/App/Http/Controllers/Backend/Admin/JobManagementController';
import {
    AdminPageHeader,
    AdminPanel,
    AdminPrimaryButton,
    AdminSecondaryButton,
} from '@/components/admin-portal/ui';
import InputError from '@/components/input-error';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { NativeSelect } from '@/components/ui/native-select';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { Textarea } from '@/components/ui/textarea';
import { useLocale } from '@/hooks/use-locale';
import AdminPortalLayout from '@/layouts/admin-portal-layout';
import type { SharedData } from '@/types';

type Option = { value: string; label: string };

type Job = {
    id: number;
    title: string;
    subtitle: string | null;
    logo_url: string | null;
    category: string | null;
    country: string | null;
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

type Props = {
    job: Job;
    options: {
        countries: Option[];
        dutyStations: Option[];
        positionAreas: Option[];
        employmentTypes: Option[];
        experience_levels: string[];
        statuses: Option[];
    };
};

export default function JobEdit({ job, options }: Props) {
    const { flash, errors: pageErrors } = usePage<SharedData>().props;
    const { t } = useLocale();
    const [uploadingLogo, setUploadingLogo] = useState(false);
    const [jobLogoPreview, setJobLogoPreview] = useState<string | null>(
        job.logo_url,
    );
    const jobLogoInputRef = useRef<HTMLInputElement>(null);

    const form = useForm({
        title: job.title,
        subtitle: job.subtitle ?? '',
        category: job.category ?? '',
        country: job.country ?? '',
        location: job.location ?? '',
        employment_type: job.employment_type ?? '',
        experience_level: job.experience_level ?? '',
        salary_range: job.salary_range ?? '',
        description: job.description ?? '',
        requirements: job.requirements ?? '',
        skills: job.skills.join(', '),
        expires_at: job.expires_at ?? '',
        status: job.status,
    });

    const onJobLogoChange = (event: ChangeEvent<HTMLInputElement>): void => {
        const file = event.target.files?.[0];

        if (!file) {
            return;
        }

        if (jobLogoPreview && jobLogoPreview.startsWith('blob:')) {
            URL.revokeObjectURL(jobLogoPreview);
        }

        setJobLogoPreview(URL.createObjectURL(file));

        const data = new FormData();
        data.append('logo', file);
        setUploadingLogo(true);
        router.post(`/admin/jobs/${job.id}/logo`, data, {
            forceFormData: true,
            preserveScroll: true,
            onFinish: () => {
                setUploadingLogo(false);
                if (jobLogoInputRef.current) {
                    jobLogoInputRef.current.value = '';
                }
            },
        });
    };

    const removeJobLogo = (): void => {
        if (jobLogoPreview && jobLogoPreview.startsWith('blob:')) {
            URL.revokeObjectURL(jobLogoPreview);
        }

        setJobLogoPreview(null);
        router.delete(`/admin/jobs/${job.id}/logo`, {
            preserveScroll: true,
        });
    };

    return (
        <AdminPortalLayout>
            <Head
                title={t('admin.jobs.edit_title', {
                    title: job.title,
                })}
            />

            <div className="space-y-6 p-6">
                <AdminPageHeader
                    title={t('admin.jobs.edit_title', {
                        title: job.title,
                    })}
                    subtitle={t('admin.jobs.edit_subtitle')}
                    actions={
                        <Link href={show.url(job.id)}>
                            <AdminSecondaryButton>
                                {t('common.back')}
                            </AdminSecondaryButton>
                        </Link>
                    }
                />

                {flash.success && (
                    <div className="rounded-xl border border-[#bbf7d0] bg-[#f0fdf4] px-4 py-3 text-sm text-[#15803d]">
                        {typeof flash.success === 'string'
                            ? flash.success
                            : t('common.saved')}
                    </div>
                )}

                {pageErrors.logo && (
                    <div className="rounded-xl border border-[#fecaca] bg-[#fef2f2] px-4 py-3 text-sm text-[#b91c1c]">
                        {pageErrors.logo}
                    </div>
                )}

                <AdminPanel className="max-w-3xl">
                    <div className="mb-6 flex flex-wrap items-start gap-4">
                        <input
                            ref={jobLogoInputRef}
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            className="hidden"
                            onChange={onJobLogoChange}
                        />
                        <button
                            type="button"
                            onClick={() => jobLogoInputRef.current?.click()}
                            disabled={uploadingLogo}
                            className="group relative flex size-[88px] shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-2xl border border-[#e2e8f0] bg-[#f8faff] transition hover:border-[#0057c8]/50 disabled:opacity-60"
                            aria-label={t(
                                'employer.job_editor.job_logo.upload',
                            )}
                        >
                            {jobLogoPreview ? (
                                <img
                                    src={jobLogoPreview}
                                    alt={t(
                                        'employer.job_editor.job_logo.badge',
                                    )}
                                    className="size-full object-cover"
                                />
                            ) : (
                                <span className="flex flex-col items-center gap-0.5 text-[#64748b]">
                                    <ImagePlus className="size-5" />
                                    <span className="text-[10px] font-semibold tracking-wide uppercase">
                                        {t(
                                            'employer.job_editor.job_logo.badge',
                                        )}
                                    </span>
                                </span>
                            )}
                            <span className="absolute inset-0 flex items-center justify-center bg-[#050315]/45 text-xs font-semibold text-white opacity-0 transition group-hover:opacity-100">
                                {uploadingLogo
                                    ? t('common.uploading')
                                    : jobLogoPreview
                                      ? t('common.replace')
                                      : t('common.upload')}
                            </span>
                        </button>

                        <div className="min-w-0">
                            <p className="text-sm font-semibold text-[#050315]">
                                {t('admin.jobs.fields.job_logo')}
                            </p>
                            <p className="mt-1 text-xs text-[#94a3b8]">
                                {t('employer.job_editor.job_logo.hint')}
                            </p>
                            <div className="mt-2 flex flex-wrap items-center gap-2">
                                <button
                                    type="button"
                                    disabled={uploadingLogo}
                                    onClick={() =>
                                        jobLogoInputRef.current?.click()
                                    }
                                    className="cursor-pointer rounded-lg border border-[#0057c8] px-3 py-1 text-xs font-semibold text-[#0057c8] disabled:opacity-50"
                                >
                                    {uploadingLogo
                                        ? t('common.uploading')
                                        : jobLogoPreview
                                          ? t(
                                                'employer.job_editor.job_logo.replace',
                                            )
                                          : t(
                                                'employer.job_editor.job_logo.upload',
                                            )}
                                </button>
                                {jobLogoPreview && (
                                    <button
                                        type="button"
                                        onClick={removeJobLogo}
                                        className="cursor-pointer rounded-lg px-2 py-1 text-xs font-semibold text-[#b91c1c]"
                                    >
                                        {t('common.remove')}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    <form
                        className="space-y-4"
                        onSubmit={(event) => {
                            event.preventDefault();
                            form.put(update.url(job.id));
                        }}
                    >
                        <div className="space-y-1.5">
                            <Label htmlFor="title">
                                {t('admin.jobs.cols.title')}
                            </Label>
                            <Input
                                id="title"
                                value={form.data.title}
                                onChange={(event) =>
                                    form.setData('title', event.target.value)
                                }
                                className="rounded-xl"
                            />
                            <InputError message={form.errors.title} />
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="subtitle">
                                {t('employer.job_editor.field.subtitle')}
                            </Label>
                            <Input
                                id="subtitle"
                                value={form.data.subtitle}
                                onChange={(event) =>
                                    form.setData(
                                        'subtitle',
                                        event.target.value,
                                    )
                                }
                                className="rounded-xl"
                            />
                            <InputError message={form.errors.subtitle} />
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-1.5">
                                <Label htmlFor="category">
                                    {t('admin.jobs.fields.category')}
                                </Label>
                                <NativeSelect
                                    id="category"
                                    value={form.data.category}
                                    onChange={(event) =>
                                        form.setData(
                                            'category',
                                            event.target.value,
                                        )
                                    }
                                    className="h-10 w-full rounded-xl border border-[#e2e8f0] bg-white px-3 text-sm"
                                >
                                    {options.positionAreas.map((option) => (
                                        <option
                                            key={option.value}
                                            value={option.value}
                                        >
                                            {option.label}
                                        </option>
                                    ))}
                                </NativeSelect>
                                <InputError message={form.errors.category} />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="location">
                                    {t('common.location')}
                                </Label>
                                <NativeSelect
                                    id="location"
                                    value={form.data.location}
                                    onChange={(event) =>
                                        form.setData(
                                            'location',
                                            event.target.value,
                                        )
                                    }
                                    className="h-10 w-full rounded-xl border border-[#e2e8f0] bg-white px-3 text-sm"
                                >
                                    {options.dutyStations.map((option) => (
                                        <option
                                            key={option.value}
                                            value={option.value}
                                        >
                                            {option.label}
                                        </option>
                                    ))}
                                </NativeSelect>
                                <InputError message={form.errors.location} />
                            </div>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-1.5">
                                <Label htmlFor="country">
                                    {t('employer.jobs.form.country')}
                                </Label>
                                <NativeSelect
                                    id="country"
                                    value={form.data.country}
                                    onChange={(event) =>
                                        form.setData(
                                            'country',
                                            event.target.value,
                                        )
                                    }
                                    className="h-10 w-full rounded-xl border border-[#e2e8f0] bg-white px-3 text-sm"
                                >
                                    <option value="">—</option>
                                    {options.countries.map((option) => (
                                        <option
                                            key={option.value}
                                            value={option.value}
                                        >
                                            {option.label}
                                        </option>
                                    ))}
                                </NativeSelect>
                                <InputError message={form.errors.country} />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="employment_type">
                                    {t('admin.jobs.fields.type')}
                                </Label>
                                <NativeSelect
                                    id="employment_type"
                                    value={form.data.employment_type}
                                    onChange={(event) =>
                                        form.setData(
                                            'employment_type',
                                            event.target.value,
                                        )
                                    }
                                    className="h-10 w-full rounded-xl border border-[#e2e8f0] bg-white px-3 text-sm"
                                >
                                    {options.employmentTypes.map((option) => (
                                        <option
                                            key={option.value}
                                            value={option.value}
                                        >
                                            {option.label}
                                        </option>
                                    ))}
                                </NativeSelect>
                                <InputError
                                    message={form.errors.employment_type}
                                />
                            </div>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-1.5">
                                <Label htmlFor="experience_level">
                                    {t('admin.jobs.fields.experience')}
                                </Label>
                                <NativeSelect
                                    id="experience_level"
                                    value={form.data.experience_level}
                                    onChange={(event) =>
                                        form.setData(
                                            'experience_level',
                                            event.target.value,
                                        )
                                    }
                                    className="h-10 w-full rounded-xl border border-[#e2e8f0] bg-white px-3 text-sm"
                                >
                                    {options.experience_levels.map((level) => (
                                        <option key={level} value={level}>
                                            {level}
                                        </option>
                                    ))}
                                </NativeSelect>
                                <InputError
                                    message={form.errors.experience_level}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="status">
                                    {t('admin.jobs.fields.status')}
                                </Label>
                                <NativeSelect
                                    id="status"
                                    value={form.data.status}
                                    onChange={(event) =>
                                        form.setData(
                                            'status',
                                            event.target.value,
                                        )
                                    }
                                    className="h-10 w-full rounded-xl border border-[#e2e8f0] bg-white px-3 text-sm"
                                >
                                    {options.statuses.map((option) => (
                                        <option
                                            key={option.value}
                                            value={option.value}
                                        >
                                            {option.label}
                                        </option>
                                    ))}
                                </NativeSelect>
                                <InputError message={form.errors.status} />
                            </div>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-1.5">
                                <Label htmlFor="salary_range">
                                    {t('admin.jobs.fields.salary')}
                                </Label>
                                <Input
                                    id="salary_range"
                                    value={form.data.salary_range}
                                    onChange={(event) =>
                                        form.setData(
                                            'salary_range',
                                            event.target.value,
                                        )
                                    }
                                    className="rounded-xl"
                                />
                                <InputError
                                    message={form.errors.salary_range}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="expires_at">
                                    {t('admin.jobs.fields.expires')}
                                </Label>
                                <Input
                                    id="expires_at"
                                    type="date"
                                    value={form.data.expires_at}
                                    onChange={(event) =>
                                        form.setData(
                                            'expires_at',
                                            event.target.value,
                                        )
                                    }
                                    className="rounded-xl"
                                />
                                <InputError message={form.errors.expires_at} />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="description">
                                {t('common.description')}
                            </Label>
                            <RichTextEditor
                                value={form.data.description}
                                onChange={(value) =>
                                    form.setData('description', value)
                                }
                                placeholder={t(
                                    'employer.job_editor.field.description_placeholder',
                                )}
                                attachmentUploadUrl="/admin/jobs/description-attachments"
                            />
                            <p className="text-xs text-[#94a3b8]">
                                {t(
                                    'employer.job_editor.field.description_hint',
                                )}
                            </p>
                            <InputError message={form.errors.description} />
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="requirements">
                                {t('admin.jobs.fields.requirements')}
                            </Label>
                            <Textarea
                                id="requirements"
                                value={form.data.requirements}
                                onChange={(event) =>
                                    form.setData(
                                        'requirements',
                                        event.target.value,
                                    )
                                }
                                className="min-h-24 rounded-xl"
                            />
                            <InputError message={form.errors.requirements} />
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="skills">
                                {t('admin.jobs.fields.skills')}
                            </Label>
                            <Input
                                id="skills"
                                value={form.data.skills}
                                onChange={(event) =>
                                    form.setData('skills', event.target.value)
                                }
                                className="rounded-xl"
                            />
                            <p className="text-xs text-[#94a3b8]">
                                {t('employer.job_editor.field.skills_hint')}
                            </p>
                            <InputError message={form.errors.skills} />
                        </div>

                        <div className="flex gap-2 pt-2">
                            <AdminPrimaryButton
                                type="submit"
                                disabled={form.processing}
                            >
                                {t('common.save')}
                            </AdminPrimaryButton>
                            <Link href={show.url(job.id)}>
                                <AdminSecondaryButton type="button">
                                    {t('common.cancel')}
                                </AdminSecondaryButton>
                            </Link>
                        </div>
                    </form>
                </AdminPanel>
            </div>
        </AdminPortalLayout>
    );
}
