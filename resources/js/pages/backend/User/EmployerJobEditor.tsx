import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import {
    ArrowLeft,
    ArrowRight,
    Briefcase,
    CalendarDays,
    Check,
    ChevronDown,
    Copy,
    Facebook,
    ImagePlus,
    Link2,
    MapPin,
    Plus,
    Share2,
    Tags,
    Wallet,
    X,
} from 'lucide-react';
import {
    useEffect,
    useMemo,
    useRef,
    useState,
    type ChangeEvent,
    type KeyboardEvent,
    type ReactNode,
} from 'react';

import { AboutCompanyCard } from '@/components/employer/about-company-card';
import { NativeSelect } from '@/components/ui/native-select';
import {
    RichTextContent,
    RichTextEditor,
} from '@/components/ui/rich-text-editor';
import { useLocale } from '@/hooks/use-locale';
import EmployerLayout from '@/layouts/employer-layout';
import { cn } from '@/lib/utils';
import type { SharedData } from '@/types';

type TaxonomyOption = {
    value: string;
    label: string;
};

type JobForm = {
    id: number;
    title: string;
    subtitle: string | null;
    slug?: string | null;
    logo_url?: string | null;
    category: string | null;
    country?: string | null;
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

type Company = {
    name: string;
    industry: string | null;
    about: string | null;
    website: string | null;
    initials: string;
    logo_url: string | null;
};

type Props = {
    job: JobForm | null;
    plan: Plan | null;
    company: Company | null;
    options: {
        countries: TaxonomyOption[];
        dutyStations: TaxonomyOption[];
        positionAreas: TaxonomyOption[];
        employmentTypes: TaxonomyOption[];
        experience_levels: string[];
    };
};

export default function EmployerJobEditor({
    job,
    plan,
    company,
    options,
}: Props) {
    const { t } = useLocale();
    const { errors: pageErrors } = usePage<SharedData>().props;
    const isEdit = job !== null;
    const [step, setStep] = useState(1);
    const [uploadingLogo, setUploadingLogo] = useState(false);
    const [uploadingCompanyLogo, setUploadingCompanyLogo] = useState(false);
    const [shareOpen, setShareOpen] = useState(false);
    const [shareFeedback, setShareFeedback] = useState<string | null>(null);
    const [editingCompany, setEditingCompany] = useState(false);
    const [jobLogoPreview, setJobLogoPreview] = useState<string | null>(
        job?.logo_url ?? null,
    );
    const jobLogoInputRef = useRef<HTMLInputElement>(null);
    const companyLogoInputRef = useRef<HTMLInputElement>(null);
    const shareMenuRef = useRef<HTMLDivElement>(null);
    const form = useForm<{
        title: string;
        subtitle: string;
        category: string;
        country: string;
        location: string;
        employment_type: string;
        experience_level: string;
        salary_range: string;
        description: string;
        requirements: string;
        skills: string;
        expires_at: string;
        publish: boolean;
        logo: File | null;
    }>({
        title: job?.title ?? '',
        subtitle: job?.subtitle ?? '',
        category: job?.category ?? '',
        country: job?.country ?? '',
        location: job?.location ?? '',
        employment_type: job?.employment_type ?? options.employmentTypes[0]?.value ?? 'full_time',
        experience_level: job?.experience_level ?? '',
        salary_range: job?.salary_range ?? '',
        description: job?.description ?? '',
        requirements: job?.requirements ?? '',
        skills: (job?.skills ?? []).join(', '),
        expires_at: job?.expires_at ?? '',
        publish: true,
        logo: null,
    });
    const companyForm = useForm({
        company_name: company?.name ?? '',
        industry: company?.industry ?? '',
        about: company?.about ?? '',
        website: company?.website ?? '',
    });

    const saveCompanyAbout = (): void => {
        companyForm.put('/employer/profile/public-about', {
            preserveScroll: true,
            onSuccess: () => setEditingCompany(false),
        });
    };

    const steps = [
        { id: 1, label: t('employer.job_editor.step.basics') },
        { id: 2, label: t('employer.job_editor.step.details') },
        { id: 3, label: t('employer.job_editor.step.requirements') },
        { id: 4, label: t('employer.job_editor.step.preview') },
    ];

    const pageTitle = isEdit
        ? t('employer.job_editor.title_edit')
        : t('employer.job_editor.title_create');

    const previewShareTitle =
        form.data.title.trim() || t('employer.job_editor.preview.untitled');
    const previewShareUrl =
        typeof window !== 'undefined'
            ? job?.slug
                ? `${window.location.origin}/jobs/${job.slug}`
                : `${window.location.origin}/jobs`
            : '/jobs';
    const previewShareText = [
        form.data.subtitle.trim(),
        form.data.description
            .replace(/<[^>]*>/g, ' ')
            .replace(/\s+/g, ' ')
            .trim()
            .slice(0, 160),
    ]
        .filter(Boolean)
        .join(' â€” ');

    useEffect(() => {
        if (!shareOpen) {
            return;
        }

        const onPointerDown = (event: MouseEvent): void => {
            if (
                shareMenuRef.current &&
                !shareMenuRef.current.contains(event.target as Node)
            ) {
                setShareOpen(false);
            }
        };

        document.addEventListener('mousedown', onPointerDown);

        return () => document.removeEventListener('mousedown', onPointerDown);
    }, [shareOpen]);

    const showShareFeedback = (message: string): void => {
        setShareFeedback(message);
        window.setTimeout(() => setShareFeedback(null), 2200);
    };

    const copyPreviewLink = async (): Promise<void> => {
        try {
            await navigator.clipboard.writeText(previewShareUrl);
            showShareFeedback(t('job_detail.link_copied'));
            setShareOpen(false);
        } catch {
            showShareFeedback(t('employer.job_editor.preview.share_failed'));
        }
    };

    const sharePreviewNative = async (): Promise<void> => {
        if (typeof navigator !== 'undefined' && 'share' in navigator) {
            try {
                await navigator.share({
                    title: previewShareTitle,
                    text: previewShareText || previewShareTitle,
                    url: previewShareUrl,
                });
                setShareOpen(false);
                return;
            } catch {
                // Fall through to menu / copy when share is cancelled or unavailable.
            }
        }

        setShareOpen((open) => !open);
    };

    const sharePreviewOnFacebook = (): void => {
        const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(previewShareUrl)}&quote=${encodeURIComponent(previewShareTitle)}`;
        window.open(facebookUrl, '_blank', 'noopener,noreferrer,width=640,height=720');
        setShareOpen(false);
    };

    const submit = (publish: boolean) => {
        form.transform((data) => {
            const { logo, ...rest } = data;
            const payload = { ...rest, publish };

            // Logo uploads on edit use a dedicated endpoint. Never send multipart PUT â€”
            // PHP does not populate multipart bodies on PUT, so fields like title vanish.
            if (!isEdit && logo) {
                return { ...payload, logo };
            }

            return payload;
        });

        if (isEdit && job) {
            form.put(`/employer/jobs/${job.id}`);
        } else if (form.data.logo) {
            form.post('/employer/jobs', { forceFormData: true });
        } else {
            form.post('/employer/jobs');
        }
    };

    const onJobLogoChange = (event: ChangeEvent<HTMLInputElement>): void => {
        const file = event.target.files?.[0];

        if (!file) {
            return;
        }

        if (jobLogoPreview && jobLogoPreview.startsWith('blob:')) {
            URL.revokeObjectURL(jobLogoPreview);
        }

        const previewUrl = URL.createObjectURL(file);
        setJobLogoPreview(previewUrl);
        form.setData('logo', file);

        if (isEdit && job) {
            const data = new FormData();
            data.append('logo', file);
            setUploadingLogo(true);
            router.post(`/employer/jobs/${job.id}/logo`, data, {
                forceFormData: true,
                preserveScroll: true,
                onFinish: () => {
                    setUploadingLogo(false);
                    if (jobLogoInputRef.current) {
                        jobLogoInputRef.current.value = '';
                    }
                },
            });
            return;
        }

        if (jobLogoInputRef.current) {
            jobLogoInputRef.current.value = '';
        }
    };

    const removeJobLogo = (): void => {
        if (jobLogoPreview && jobLogoPreview.startsWith('blob:')) {
            URL.revokeObjectURL(jobLogoPreview);
        }

        setJobLogoPreview(null);
        form.setData('logo', null);

        if (isEdit && job) {
            router.delete(`/employer/jobs/${job.id}/logo`, {
                preserveScroll: true,
            });
        }
    };

    const onCompanyLogoChange = (
        event: ChangeEvent<HTMLInputElement>,
    ): void => {
        const file = event.target.files?.[0];

        if (!file) {
            return;
        }

        const data = new FormData();
        data.append('logo', file);
        setUploadingCompanyLogo(true);
        router.post('/employer/profile/logo', data, {
            forceFormData: true,
            preserveScroll: true,
            onFinish: () => {
                setUploadingCompanyLogo(false);
                if (companyLogoInputRef.current) {
                    companyLogoInputRef.current.value = '';
                }
            },
        });
    };

    return (
        <EmployerLayout title={t('employer.jobs.title')}>
            <Head title={pageTitle} />

            <div className="space-y-6 px-4 py-6 sm:px-6">
                <header className="flex flex-col gap-4 sm:flex-row sm:items-center">
                    <div className="flex items-center gap-4">
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
                            className="group relative flex size-16 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-2xl border border-[#e8d5e8] bg-[#f8faff] shadow-[0px_2px_4px_rgba(5,3,21,0.06)] transition hover:border-[#0057c8]/50 disabled:opacity-60"
                            aria-label={t('employer.job_editor.job_logo.upload')}
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
                            <h1 className="text-[28px] font-extrabold tracking-tight text-[#050315]">
                                {pageTitle}
                            </h1>
                            <p className="mt-1 text-sm font-normal text-[#64748b]">
                                {t('employer.job_editor.subtitle')}
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
                                <span className="text-xs text-[#94a3b8]">
                                    {t('employer.job_editor.job_logo.hint')}
                                </span>
                            </div>
                        </div>
                    </div>
                </header>

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

                {pageErrors.logo && (
                    <p className="rounded-xl border border-[#fecaca] bg-[#fef2f2] px-4 py-3 text-sm text-[#b91c1c]">
                        {pageErrors.logo}
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
                                        form.setData(
                                            'title',
                                            event.target.value,
                                        )
                                    }
                                    placeholder={t(
                                        'employer.job_editor.field.title_placeholder',
                                    )}
                                    className={inputClass}
                                />
                            </Field>
                            <Field
                                label={t('employer.job_editor.field.subtitle')}
                                error={form.errors.subtitle}
                            >
                                <input
                                    value={form.data.subtitle}
                                    onChange={(event) =>
                                        form.setData(
                                            'subtitle',
                                            event.target.value,
                                        )
                                    }
                                    placeholder={t(
                                        'employer.job_editor.field.subtitle_placeholder',
                                    )}
                                    className={inputClass}
                                />
                            </Field>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <Field
                                    label={t('employer.jobs.form.position_area')}
                                    error={form.errors.category}
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
                                        {options.positionAreas.map((item) => (
                                            <option
                                                key={item.value}
                                                value={item.value}
                                            >
                                                {item.label}
                                            </option>
                                        ))}
                                    </NativeSelect>
                                </Field>
                                <Field
                                    label={t(
                                        'employer.job_editor.field.job_type',
                                    )}
                                    error={form.errors.employment_type}
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
                                        {options.employmentTypes.map((item) => (
                                            <option
                                                key={item.value}
                                                value={item.value}
                                            >
                                                {item.label}
                                            </option>
                                        ))}
                                    </NativeSelect>
                                </Field>
                                <Field
                                    label={t('employer.jobs.form.country')}
                                    error={form.errors.country}
                                >
                                    <NativeSelect
                                        value={form.data.country}
                                        onChange={(event) =>
                                            form.setData(
                                                'country',
                                                event.target.value,
                                            )
                                        }
                                        className={selectClass}
                                    >
                                        <option value="">
                                            {t('jobs_page.select_option')}
                                        </option>
                                        {options.countries.map((item) => (
                                            <option
                                                key={item.value}
                                                value={item.value}
                                            >
                                                {item.label}
                                            </option>
                                        ))}
                                    </NativeSelect>
                                </Field>
                                <Field
                                    label={t('employer.jobs.form.duty_station')}
                                    error={form.errors.location}
                                >
                                    <NativeSelect
                                        value={form.data.location}
                                        onChange={(event) =>
                                            form.setData(
                                                'location',
                                                event.target.value,
                                            )
                                        }
                                        className={selectClass}
                                    >
                                        <option value="">
                                            {t('jobs_page.select_option')}
                                        </option>
                                        {options.dutyStations.map((item) => (
                                            <option
                                                key={item.value}
                                                value={item.value}
                                            >
                                                {item.label}
                                            </option>
                                        ))}
                                    </NativeSelect>
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

                            <div className="rounded-2xl border border-[#e8d5e8] bg-[#f8faff] p-4">
                                <div className="flex flex-wrap items-start justify-between gap-3">
                                    <div>
                                        <h3 className="text-base font-bold text-[#050315]">
                                            {t('job_detail.about_company')}
                                        </h3>
                                        <p className="mt-1 text-xs text-[#64748b]">
                                            {t(
                                                'employer.job_editor.company_about_hint',
                                            )}
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setEditingCompany((open) => !open)
                                        }
                                        className="cursor-pointer rounded-lg border border-[#0057c8] px-3 py-1.5 text-xs font-semibold text-[#0057c8]"
                                    >
                                        {editingCompany
                                            ? t('common.cancel')
                                            : t(
                                                'employer.profile.edit_public_about',
                                            )}
                                    </button>
                                </div>

                                <div className="mt-4 w-full min-w-0 max-w-md overflow-hidden">
                                    <input
                                        ref={companyLogoInputRef}
                                        type="file"
                                        accept="image/jpeg,image/png,image/webp"
                                        className="hidden"
                                        onChange={onCompanyLogoChange}
                                    />
                                    <div className="mb-3 flex flex-wrap items-center gap-2">
                                        <button
                                            type="button"
                                            disabled={uploadingCompanyLogo}
                                            onClick={() =>
                                                companyLogoInputRef.current?.click()
                                            }
                                            className="cursor-pointer rounded-lg border border-[#0057c8] px-3 py-1.5 text-xs font-semibold text-[#0057c8] disabled:opacity-50"
                                        >
                                            {uploadingCompanyLogo
                                                ? t('common.uploading')
                                                : company?.logo_url
                                                    ? t(
                                                        'employer.job_editor.company_logo.replace',
                                                    )
                                                    : t(
                                                        'employer.job_editor.company_logo.upload',
                                                    )}
                                        </button>
                                        {company?.logo_url && (
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    router.delete(
                                                        '/employer/profile/logo',
                                                        {
                                                            preserveScroll: true,
                                                        },
                                                    )
                                                }
                                                className="cursor-pointer rounded-lg px-2 py-1 text-xs font-semibold text-[#b91c1c]"
                                            >
                                                {t('common.remove')}
                                            </button>
                                        )}
                                        <span className="text-xs text-[#94a3b8]">
                                            {t(
                                                'employer.job_editor.company_logo.hint',
                                            )}
                                        </span>
                                    </div>
                                    <AboutCompanyCard
                                        title={t('job_detail.about_company')}
                                        companyName={
                                            companyForm.data.company_name ||
                                            company?.name ||
                                            t(
                                                'employer.profile.company_fallback',
                                            )
                                        }
                                        industry={
                                            companyForm.data.industry ||
                                            company?.industry
                                        }
                                        about={
                                            companyForm.data.about ||
                                            company?.about
                                        }
                                        website={
                                            companyForm.data.website ||
                                            company?.website
                                        }
                                        logoUrl={company?.logo_url}
                                        initials={company?.initials || 'CO'}
                                        visitWebsiteLabel={t(
                                            'job_detail.visit_website',
                                        )}
                                        className="shadow-none"
                                    />
                                </div>

                                {editingCompany && (
                                    <div className="mt-4 space-y-3 rounded-xl border border-[#e8d5e8] bg-white p-4">
                                        <Field
                                            label={t(
                                                'employer.profile.company_name',
                                            )}
                                            error={
                                                companyForm.errors.company_name
                                            }
                                        >
                                            <input
                                                value={
                                                    companyForm.data
                                                        .company_name
                                                }
                                                onChange={(event) =>
                                                    companyForm.setData(
                                                        'company_name',
                                                        event.target.value,
                                                    )
                                                }
                                                className={inputClass}
                                            />
                                        </Field>
                                        <Field
                                            label={t(
                                                'employer.profile.industry',
                                            )}
                                        >
                                            <input
                                                value={
                                                    companyForm.data.industry
                                                }
                                                onChange={(event) =>
                                                    companyForm.setData(
                                                        'industry',
                                                        event.target.value,
                                                    )
                                                }
                                                placeholder={t(
                                                    'employer.profile.industry_placeholder',
                                                )}
                                                className={inputClass}
                                            />
                                        </Field>
                                        <Field
                                            label={t(
                                                'employer.profile.about_company',
                                            )}
                                        >
                                            <RichTextEditor
                                                value={companyForm.data.about}
                                                onChange={(value) =>
                                                    companyForm.setData(
                                                        'about',
                                                        value,
                                                    )
                                                }
                                                placeholder={t(
                                                    'employer.profile.about_placeholder',
                                                )}
                                            />
                                        </Field>
                                        <Field
                                            label={t(
                                                'employer.profile.website',
                                            )}
                                        >
                                            <input
                                                value={
                                                    companyForm.data.website
                                                }
                                                onChange={(event) =>
                                                    companyForm.setData(
                                                        'website',
                                                        event.target.value,
                                                    )
                                                }
                                                placeholder={t(
                                                    'employer.profile.website_placeholder',
                                                )}
                                                className={inputClass}
                                            />
                                        </Field>
                                        <button
                                            type="button"
                                            disabled={companyForm.processing}
                                            onClick={saveCompanyAbout}
                                            className="cursor-pointer rounded-xl bg-[#0057c8] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
                                        >
                                            {t('common.save')}
                                        </button>
                                    </div>
                                )}
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
                                error={form.errors.description}
                            >
                                <RichTextEditor
                                    value={form.data.description}
                                    onChange={(value) =>
                                        form.setData('description', value)
                                    }
                                    placeholder={t(
                                        'employer.job_editor.field.description_placeholder',
                                    )}
                                    attachmentUploadUrl="/employer/jobs/description-attachments"
                                />
                                <p className="mt-1.5 text-xs text-[#94a3b8]">
                                    {t(
                                        'employer.job_editor.field.description_hint',
                                    )}
                                </p>
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
                            <div className="flex items-center justify-between gap-3">
                                <h2 className="text-lg font-bold text-[#050315]">
                                    {t('employer.job_editor.step.preview')}
                                </h2>
                                <p className="text-xs text-[#94a3b8]">
                                    {t('employer.job_editor.preview.hint')}
                                </p>
                            </div>

                            <article className="overflow-hidden rounded-2xl border border-[#e8eef5] bg-[#f8fafc]">
                                <div className="border-b border-[#e8eef5] bg-white px-5 py-5 sm:px-7 sm:py-6">
                                    <div className="flex items-start gap-4">
                                        <div className="flex size-[72px] shrink-0 items-center justify-center overflow-hidden rounded-xl border border-[#e2e8f0] bg-[#f8faff]">
                                            {jobLogoPreview ? (
                                                <img
                                                    src={jobLogoPreview}
                                                    alt={
                                                        form.data.title ||
                                                        t(
                                                            'employer.job_editor.job_logo.badge',
                                                        )
                                                    }
                                                    className="size-full object-contain p-1.5"
                                                />
                                            ) : (
                                                <span className="text-lg font-bold text-[#0057c8]">
                                                    {company?.initials || 'JR'}
                                                </span>
                                            )}
                                        </div>

                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="min-w-0">
                                                    <h3 className="text-xl font-bold leading-snug tracking-tight text-[#0f172a] sm:text-2xl">
                                                        {form.data.title ||
                                                            t(
                                                                'employer.job_editor.preview.untitled',
                                                            )}
                                                    </h3>
                                                    <p className="mt-1.5 text-sm font-normal text-[#64748b] sm:text-base">
                                                        {form.data.subtitle ||
                                                            company?.name ||
                                                            t(
                                                                'employer.job_editor.preview.no_subtitle',
                                                            )}
                                                    </p>
                                                </div>

                                                <div
                                                    ref={shareMenuRef}
                                                    className="relative flex shrink-0 items-center gap-2"
                                                >
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            void sharePreviewNative();
                                                        }}
                                                        className="inline-flex size-8 cursor-pointer items-center justify-center rounded-full border border-[#e2e8f0] text-[#64748b] transition hover:border-[#0057c8] hover:bg-[#eef5ff] hover:text-[#0057c8]"
                                                        aria-label={t(
                                                            'job_detail.share',
                                                        )}
                                                        title={t(
                                                            'job_detail.share',
                                                        )}
                                                    >
                                                        <Share2 className="size-3.5" />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={
                                                            sharePreviewOnFacebook
                                                        }
                                                        className="inline-flex size-8 cursor-pointer items-center justify-center rounded-full border border-[#e2e8f0] text-[#1877f2] transition hover:border-[#1877f2] hover:bg-[#eff6ff]"
                                                        aria-label={t(
                                                            'job_detail.share_facebook',
                                                        )}
                                                        title={t(
                                                            'job_detail.share_facebook',
                                                        )}
                                                    >
                                                        <Facebook className="size-3.5" />
                                                    </button>

                                                    {shareOpen && (
                                                        <div className="absolute end-0 top-10 z-30 w-48 rounded-xl border border-[#e2e8f0] bg-white p-2 shadow-[0px_12px_28px_rgba(5,3,21,0.12)]">
                                                            <p className="px-2 py-1.5 text-[11px] font-medium tracking-wide text-[#94a3b8] uppercase">
                                                                {t(
                                                                    'job_detail.share_via',
                                                                )}
                                                            </p>
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    void copyPreviewLink();
                                                                }}
                                                                className="flex w-full cursor-pointer items-center gap-2 rounded-lg px-2 py-2 text-sm font-medium text-[#334155] hover:bg-[#eef5ff] hover:text-[#0057c8]"
                                                            >
                                                                <Copy className="size-3.5" />
                                                                {t(
                                                                    'job_detail.share_copy',
                                                                )}
                                                            </button>
                                                            <a
                                                                href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(previewShareUrl)}`}
                                                                target="_blank"
                                                                rel="noreferrer"
                                                                onClick={() =>
                                                                    setShareOpen(
                                                                        false,
                                                                    )
                                                                }
                                                                className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-sm font-medium text-[#334155] hover:bg-[#eef5ff] hover:text-[#0057c8]"
                                                            >
                                                                <Link2 className="size-3.5" />
                                                                {t(
                                                                    'job_detail.share_linkedin',
                                                                )}
                                                            </a>
                                                            <button
                                                                type="button"
                                                                onClick={
                                                                    sharePreviewOnFacebook
                                                                }
                                                                className="flex w-full cursor-pointer items-center gap-2 rounded-lg px-2 py-2 text-sm font-medium text-[#334155] hover:bg-[#eef5ff] hover:text-[#0057c8]"
                                                            >
                                                                <Facebook className="size-3.5 text-[#1877f2]" />
                                                                {t(
                                                                    'job_detail.share_facebook',
                                                                )}
                                                            </button>
                                                        </div>
                                                    )}

                                                    {shareFeedback && (
                                                        <span className="absolute end-0 top-10 z-30 whitespace-nowrap rounded-lg bg-[#0f172a] px-2.5 py-1.5 text-xs font-medium text-white shadow-lg">
                                                            {shareFeedback}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-6 px-5 py-5 sm:px-7 sm:py-6">
                                    {form.data.description ? (
                                        <RichTextContent
                                            html={form.data.description}
                                            className="text-[#334155]"
                                        />
                                    ) : (
                                        <p className="text-sm text-[#94a3b8]">
                                            {t(
                                                'employer.job_editor.preview.no_description',
                                            )}
                                        </p>
                                    )}

                                    <div className="space-y-3 border-t border-[#e8eef5] pt-5">
                                        {[
                                            {
                                                icon: Tags,
                                                label: t(
                                                    'employer.job_editor.preview.category',
                                                ),
                                                value: form.data.category,
                                            },
                                            {
                                                icon: Briefcase,
                                                label: t(
                                                    'employer.job_editor.preview.type',
                                                ),
                                                value: form.data
                                                    .employment_type,
                                            },
                                            {
                                                icon: MapPin,
                                                label: t(
                                                    'employer.job_editor.preview.location',
                                                ),
                                                value: form.data.location,
                                            },
                                            {
                                                icon: Briefcase,
                                                label: t(
                                                    'employer.job_editor.preview.experience',
                                                ),
                                                value: form.data
                                                    .experience_level,
                                            },
                                            {
                                                icon: Wallet,
                                                label: t(
                                                    'employer.job_editor.preview.salary',
                                                ),
                                                value: form.data.salary_range,
                                            },
                                            {
                                                icon: CalendarDays,
                                                label: t(
                                                    'employer.job_editor.preview.expires',
                                                ),
                                                value:
                                                    form.data.expires_at ||
                                                    t(
                                                        'employer.job_editor.preview.default_expires',
                                                    ),
                                            },
                                        ]
                                            .filter((item) =>
                                                Boolean(item.value),
                                            )
                                            .map((item) => (
                                                <div
                                                    key={item.label}
                                                    className="flex items-start gap-3 text-sm"
                                                >
                                                    <span className="mt-0.5 inline-flex size-7 shrink-0 items-center justify-center rounded-full bg-[#eef5ff] text-[#0057c8]">
                                                        <item.icon className="size-3.5" />
                                                    </span>
                                                    <p className="leading-6 text-[#334155]">
                                                        <span className="font-semibold text-[#0f172a]">
                                                            {item.label}:
                                                        </span>{' '}
                                                        <span className="font-normal">
                                                            {item.value}
                                                        </span>
                                                    </p>
                                                </div>
                                            ))}
                                    </div>

                                    {form.data.requirements && (
                                        <div className="border-t border-[#e8eef5] pt-5">
                                            <h4 className="text-sm font-bold text-[#0f172a]">
                                                {t(
                                                    'employer.job_editor.field.requirements',
                                                )}
                                            </h4>
                                            <p className="mt-2 text-sm whitespace-pre-wrap text-[#334155]">
                                                {form.data.requirements}
                                            </p>
                                        </div>
                                    )}

                                    {form.data.skills.trim() !== '' && (
                                        <div className="border-t border-[#e8eef5] pt-5">
                                            <h4 className="text-sm font-bold text-[#0f172a]">
                                                {t(
                                                    'employer.job_editor.field.skills',
                                                )}
                                            </h4>
                                            <div className="mt-3 flex flex-wrap gap-2">
                                                {form.data.skills
                                                    .split(',')
                                                    .map((skill) => skill.trim())
                                                    .filter(Boolean)
                                                    .map((skill) => (
                                                        <span
                                                            key={skill}
                                                            className="rounded-full bg-[#eef5ff] px-2.5 py-1 text-xs font-semibold text-[#0057c8]"
                                                        >
                                                            {skill}
                                                        </span>
                                                    ))}
                                            </div>
                                        </div>
                                    )}

                                    <div className="border-t border-[#e8eef5] pt-5">
                                        <AboutCompanyCard
                                            title={t(
                                                'job_detail.about_company',
                                            )}
                                            companyName={
                                                companyForm.data.company_name ||
                                                company?.name ||
                                                t(
                                                    'employer.profile.company_fallback',
                                                )
                                            }
                                            industry={
                                                companyForm.data.industry ||
                                                company?.industry
                                            }
                                            about={
                                                companyForm.data.about ||
                                                company?.about
                                            }
                                            website={
                                                companyForm.data.website ||
                                                company?.website
                                            }
                                            logoUrl={company?.logo_url}
                                            initials={
                                                company?.initials || 'CO'
                                            }
                                            visitWebsiteLabel={t(
                                                'job_detail.visit_website',
                                            )}
                                            className="bg-[#f8faff] shadow-none"
                                        />
                                    </div>
                                </div>
                            </article>
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
        <div className="block text-sm font-medium text-[#050315]">
            <span className="block">{label}</span>
            {children}
            {error && <p className="mt-1 text-xs text-[#b91c1c]">{error}</p>}
        </div>
    );
}
