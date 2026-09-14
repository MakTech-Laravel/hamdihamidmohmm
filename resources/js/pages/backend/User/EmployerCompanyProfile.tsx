import { Head, router, useForm, usePage } from '@inertiajs/react';
import { CheckCircle2, Pencil, TriangleAlert } from 'lucide-react';
import { useRef, useState, type ChangeEvent, type ReactNode } from 'react';

import { AboutCompanyCard } from '@/components/employer/about-company-card';
import { getInitials } from '@/components/employer/demo-data';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { useLocale } from '@/hooks/use-locale';
import EmployerLayout from '@/layouts/employer-layout';
import { cn } from '@/lib/utils';
import type { SharedData } from '@/types';

type Profile = {
    company_name: string | null;
    contact_name: string | null;
    industry: string | null;
    company_size: string | null;
    founded_year: number | null;
    website: string | null;
    linkedin_url: string | null;
    x_url: string | null;
    instagram_url: string | null;
    about: string | null;
    address: string | null;
    phone: string | null;
    email: string | null;
    verification: string | null;
    verification_value: string | null;
    verified_on: string | null;
    package: string | null;
    initials: string;
    logo_url: string | null;
    cover_url: string | null;
    verification_document_name: string | null;
    verification_document_url: string | null;
};

type Completion = {
    percent: number;
    completed: number;
    total: number;
    sections: Record<string, boolean>;
};

const inputClass =
    'mt-1 w-full rounded-xl border border-[#e8d5e8] bg-[#f8faff] px-3 py-2.5 text-sm outline-none focus:border-[#0057c8]';

export default function EmployerCompanyProfile({
    profile,
    completion,
}: {
    profile: Profile;
    completion: Completion;
}) {
    const { flash } = usePage<SharedData>().props;
    const { t } = useLocale();
    const [editing, setEditing] = useState<string | null>(null);
    const [uploading, setUploading] = useState<string | null>(null);
    const logoInputRef = useRef<HTMLInputElement>(null);
    const coverInputRef = useRef<HTMLInputElement>(null);
    const documentInputRef = useRef<HTMLInputElement>(null);
    const form = useForm({
        company_name: profile.company_name ?? '',
        contact_name: profile.contact_name ?? '',
        industry: profile.industry ?? '',
        company_size: profile.company_size ?? '',
        founded_year: profile.founded_year?.toString() ?? '',
        website: profile.website ?? '',
        linkedin_url: profile.linkedin_url ?? '',
        x_url: profile.x_url ?? '',
        instagram_url: profile.instagram_url ?? '',
        about: profile.about ?? '',
        address: profile.address ?? '',
        phone: profile.phone ?? '',
        email: profile.email ?? '',
    });

    const save = () => {
        form.put('/employer/profile', {
            onSuccess: () => setEditing(null),
        });
    };

    const uploadFile = (
        key: string,
        url: string,
        field: string,
        file: File | undefined,
    ): void => {
        if (!file) {
            return;
        }

        const data = new FormData();
        data.append(field, file);
        setUploading(key);
        router.post(url, data, {
            forceFormData: true,
            preserveScroll: true,
            onFinish: () => {
                setUploading(null);
                setEditing(null);
            },
        });
    };

    const onLogoChange = (event: ChangeEvent<HTMLInputElement>): void => {
        uploadFile(
            'logo',
            '/employer/profile/logo',
            'logo',
            event.target.files?.[0],
        );
        event.target.value = '';
    };

    const onCoverChange = (event: ChangeEvent<HTMLInputElement>): void => {
        uploadFile(
            'cover',
            '/employer/profile/cover',
            'cover',
            event.target.files?.[0],
        );
        event.target.value = '';
    };

    const onDocumentChange = (event: ChangeEvent<HTMLInputElement>): void => {
        uploadFile(
            'document',
            '/employer/profile/verification-document',
            'document',
            event.target.files?.[0],
        );
        event.target.value = '';
    };

    const sectionTitleKey: Record<string, string> = {
        company: 'employer.profile.company_information',
        logo: 'employer.profile.company_logo',
        about: 'employer.profile.public_about',
        contact: 'employer.profile.contact_information',
        social: 'employer.profile.social_links',
        verification: 'employer.profile.verification_documents',
        cover: 'employer.profile.cover_banner',
    };

    const missing = Object.entries(completion.sections)
        .filter(([, done]) => !done)
        .map(([key]) => t(sectionTitleKey[key] ?? key));

    return (
        <EmployerLayout title={t('employer.profile.title')}>
            <Head title={t('employer.profile.title')} />

            <div className="space-y-6 px-4 py-6 sm:px-6">
                <input
                    ref={logoInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={onLogoChange}
                />
                <h1 className="text-2xl leading-9 font-extrabold text-[#050315]">
                    {t('employer.profile.title')}
                </h1>

                {flash.success && (
                    <div className="rounded-xl border border-[#bbf7d0] bg-[#f0fdf4] px-4 py-3 text-sm text-[#15803d]">
                        {typeof flash.success === 'string'
                            ? flash.success
                            : t('common.saved')}
                    </div>
                )}

                <div className="flex items-center gap-6 rounded-2xl border border-[#e8d5e8] bg-white p-6 shadow-[0px_2px_4px_rgba(5,3,21,0.06)]">
                    <CompletionRing percent={completion.percent} />
                    <div className="min-w-0">
                        <p className="text-[17.6px] leading-[26.4px] font-bold text-[#050315]">
                            {t('employer.profile.completion')}
                        </p>
                        <p className="mt-1 text-[14.4px] leading-[21.6px] text-[#6b7280]">
                            {t('employer.profile.sections_complete', {
                                completed: completion.completed,
                                total: completion.total,
                            })}
                        </p>
                        {missing.length > 0 && (
                            <div className="mt-3">
                                <p className="text-[12.8px] leading-[19.2px] text-[#6b7280]">
                                    {t('employer.profile.incomplete')}
                                </p>
                                <ul className="mt-1.5 flex flex-col gap-1">
                                    {missing.map((section) => (
                                        <li
                                            key={section}
                                            className="flex items-center gap-1.5 text-[13.6px] leading-[20.4px] text-[#050315]"
                                        >
                                            <TriangleAlert className="size-3.5 shrink-0 text-[#e57124]" />
                                            {section}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex items-center justify-between gap-4 rounded-2xl border border-[#e8d5e8] bg-white p-6 shadow-[0px_2px_4px_rgba(5,3,21,0.06)]">
                    <div>
                        <p className="text-base leading-6 font-bold text-[#050315]">
                            {t('employer.profile.verification_status')}
                        </p>
                        <p className="mt-1 text-[13.6px] leading-[20.4px] text-[#6b7280]">
                            {profile.verification_value === 'approved' &&
                                profile.verified_on
                                ? t('employer.profile.verified_on', {
                                    date: profile.verified_on,
                                })
                                : profile.verification ||
                                t('employer.profile.not_verified')}
                        </p>
                    </div>
                    <span
                        className={cn(
                            'inline-flex items-center gap-1.5 rounded-full px-[13.6px] py-[5.6px] text-sm font-semibold',
                            profile.verification_value === 'approved'
                                ? 'bg-[#dcfce7] text-[#166534]'
                                : profile.verification_value === 'rejected'
                                    ? 'bg-[#fef2f2] text-[#b91c1c]'
                                    : 'bg-[#fff7ed] text-[#c2410c]',
                        )}
                    >
                        {profile.verification_value === 'approved' ? (
                            <img
                                src="/images/employer/verified-shield.svg"
                                alt=""
                                width={14}
                                height={14}
                                className="size-3.5 shrink-0 object-contain"
                            />
                        ) : (
                            <TriangleAlert className="size-3.5" />
                        )}
                        {profile.verification_value === 'approved'
                            ? t('common.verified')
                            : profile.verification || t('common.pending')}
                    </span>
                </div>

                <Section
                    title={t('employer.profile.public_about')}
                    complete={
                        completion.sections.about &&
                        completion.sections.company &&
                        completion.sections.logo
                    }
                    onEdit={() => setEditing('about')}
                >
                    <p className="mb-4 text-sm text-[#64748b]">
                        {t('employer.profile.public_about_hint')}
                    </p>

                    <div className="mb-5 w-full min-w-0 max-w-md overflow-hidden">
                        <AboutCompanyCard
                            title={t('job_detail.about_company')}
                            companyName={
                                form.data.company_name ||
                                profile.company_name ||
                                t('employer.profile.company_fallback')
                            }
                            industry={
                                form.data.industry || profile.industry
                            }
                            about={form.data.about || profile.about}
                            website={form.data.website || profile.website}
                            logoUrl={profile.logo_url}
                            initials={
                                profile.initials ||
                                getInitials(
                                    form.data.company_name ||
                                    profile.company_name ||
                                    'C',
                                )
                            }
                            visitWebsiteLabel={t('job_detail.visit_website')}
                        />
                    </div>

                    {editing === 'about' ? (
                        <div className="space-y-3 rounded-xl border border-[#e8d5e8] bg-[#f8faff] p-4">
                            <div className="flex flex-wrap items-center gap-3">
                                {profile.logo_url ? (
                                    <img
                                        src={profile.logo_url}
                                        alt=""
                                        className="size-12 rounded-xl object-cover"
                                    />
                                ) : (
                                    <div className="flex size-12 items-center justify-center rounded-xl bg-[#0057c8] text-sm font-bold text-white">
                                        {profile.initials ||
                                            getInitials(
                                                form.data.company_name || 'C',
                                            )}
                                    </div>
                                )}
                                <button
                                    type="button"
                                    disabled={uploading === 'logo'}
                                    onClick={() =>
                                        logoInputRef.current?.click()
                                    }
                                    className="cursor-pointer rounded-lg border border-[#0057c8] px-3 py-1.5 text-xs font-semibold text-[#0057c8]"
                                >
                                    {uploading === 'logo'
                                        ? t('common.uploading')
                                        : profile.logo_url
                                            ? t('common.replace')
                                            : t(
                                                'employer.profile.upload_logo',
                                            )}
                                </button>
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-[#64748b]">
                                    {t('employer.profile.company_name')}
                                </label>
                                <input
                                    className={inputClass}
                                    value={form.data.company_name}
                                    onChange={(event) =>
                                        form.setData(
                                            'company_name',
                                            event.target.value,
                                        )
                                    }
                                    placeholder={t(
                                        'employer.profile.company_name',
                                    )}
                                />
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-[#64748b]">
                                    {t('employer.profile.industry')}
                                </label>
                                <input
                                    className={inputClass}
                                    value={form.data.industry}
                                    onChange={(event) =>
                                        form.setData(
                                            'industry',
                                            event.target.value,
                                        )
                                    }
                                    placeholder={t(
                                        'employer.profile.industry_placeholder',
                                    )}
                                />
                            </div>
                            <div>
                                <label className="mb-1.5 block text-xs font-semibold text-[#64748b]">
                                    {t('employer.profile.about_company')}
                                </label>
                                <RichTextEditor
                                    value={form.data.about}
                                    onChange={(value) =>
                                        form.setData('about', value)
                                    }
                                    placeholder={t(
                                        'employer.profile.about_placeholder',
                                    )}
                                />
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-[#64748b]">
                                    {t('employer.profile.website')}
                                </label>
                                <input
                                    className={inputClass}
                                    value={form.data.website}
                                    onChange={(event) =>
                                        form.setData(
                                            'website',
                                            event.target.value,
                                        )
                                    }
                                    placeholder={t(
                                        'employer.profile.website_placeholder',
                                    )}
                                />
                            </div>
                            <SaveRow
                                processing={form.processing}
                                onSave={save}
                                onCancel={() => setEditing(null)}
                            />
                        </div>
                    ) : (
                        <button
                            type="button"
                            onClick={() => setEditing('about')}
                            className="cursor-pointer rounded-xl bg-[#0057c8] px-4 py-2.5 text-sm font-semibold text-white"
                        >
                            {t('employer.profile.edit_public_about')}
                        </button>
                    )}
                </Section>

                <Section
                    title={t('employer.profile.company_information')}
                    complete={completion.sections.company}
                    onEdit={() => setEditing('company')}
                >
                    {editing === 'company' ? (
                        <div className="grid gap-3 sm:grid-cols-2">
                            <input
                                className={inputClass}
                                value={form.data.company_name}
                                onChange={(event) =>
                                    form.setData(
                                        'company_name',
                                        event.target.value,
                                    )
                                }
                                placeholder={t('employer.profile.company_name')}
                            />
                            <input
                                className={inputClass}
                                value={form.data.industry}
                                onChange={(event) =>
                                    form.setData('industry', event.target.value)
                                }
                                placeholder={t('employer.profile.industry')}
                            />
                            <input
                                className={inputClass}
                                value={form.data.company_size}
                                onChange={(event) =>
                                    form.setData(
                                        'company_size',
                                        event.target.value,
                                    )
                                }
                                placeholder={t('employer.profile.company_size')}
                            />
                            <input
                                className={inputClass}
                                value={form.data.founded_year}
                                onChange={(event) =>
                                    form.setData(
                                        'founded_year',
                                        event.target.value,
                                    )
                                }
                                placeholder={t('employer.profile.founded')}
                            />
                            <input
                                className={cn(inputClass, 'sm:col-span-2')}
                                value={form.data.website}
                                onChange={(event) =>
                                    form.setData('website', event.target.value)
                                }
                                placeholder={t('employer.profile.website')}
                            />
                            <SaveRow
                                processing={form.processing}
                                onSave={save}
                                onCancel={() => setEditing(null)}
                            />
                        </div>
                    ) : (
                        <dl className="grid gap-3 sm:grid-cols-2">
                            <Info label={t('employer.profile.company_name')} value={profile.company_name} />
                            <Info label={t('employer.profile.industry')} value={profile.industry} />
                            <Info label={t('employer.profile.company_size')} value={profile.company_size} />
                            <Info
                                label={t('employer.profile.founded')}
                                value={profile.founded_year?.toString() ?? null}
                            />
                            <Info label={t('employer.profile.website')} value={profile.website} />
                        </dl>
                    )}
                </Section>

                <Section
                    title={t('employer.profile.company_logo')}
                    complete={completion.sections.logo}
                    onEdit={() => logoInputRef.current?.click()}
                >
                    <div className="flex flex-wrap items-center gap-4">
                        {profile.logo_url ? (
                            <img
                                src={profile.logo_url}
                                alt={`${profile.company_name || t('employer.profile.company_fallback')} logo`}
                                className="size-14 rounded-full object-cover"
                            />
                        ) : (
                            <div className="flex size-14 items-center justify-center rounded-full bg-[#0057c8] text-lg font-bold text-white">
                                {profile.initials ||
                                    getInitials(profile.company_name || 'C')}
                            </div>
                        )}
                        <div className="min-w-0">
                            <p className="font-semibold text-[#050315]">
                                {profile.company_name}
                            </p>
                            <p className="text-sm text-[#64748b]">
                                {profile.logo_url
                                    ? t('employer.profile.logo_uploaded')
                                    : t('employer.profile.logo_hint')}
                            </p>
                            <div className="mt-2 flex flex-wrap gap-2">
                                <button
                                    type="button"
                                    disabled={uploading === 'logo'}
                                    onClick={() => logoInputRef.current?.click()}
                                    className="cursor-pointer rounded-lg border border-[#0057c8] px-3 py-1.5 text-xs font-semibold text-[#0057c8]"
                                >
                                    {uploading === 'logo'
                                        ? t('common.uploading')
                                        : profile.logo_url
                                            ? t('common.replace')
                                            : t('common.upload')}
                                </button>
                                {profile.logo_url && (
                                    <button
                                        type="button"
                                        onClick={() =>
                                            router.delete(
                                                '/employer/profile/logo',
                                                { preserveScroll: true },
                                            )
                                        }
                                        className="cursor-pointer rounded-lg px-3 py-1.5 text-xs font-semibold text-[#b91c1c]"
                                    >
                                        {t('common.remove')}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </Section>

                <Section
                    title={t('employer.profile.contact_information')}
                    complete={completion.sections.contact}
                    onEdit={() => setEditing('contact')}
                >
                    {editing === 'contact' ? (
                        <div className="grid gap-3 sm:grid-cols-2">
                            <input
                                className={inputClass}
                                value={form.data.contact_name}
                                onChange={(event) =>
                                    form.setData(
                                        'contact_name',
                                        event.target.value,
                                    )
                                }
                                placeholder={t('employer.profile.contact_name')}
                            />
                            <input
                                className={inputClass}
                                value={form.data.email}
                                onChange={(event) =>
                                    form.setData('email', event.target.value)
                                }
                                placeholder={t('employer.profile.email')}
                            />
                            <input
                                className={inputClass}
                                value={form.data.phone}
                                onChange={(event) =>
                                    form.setData('phone', event.target.value)
                                }
                                placeholder={t('employer.profile.phone')}
                            />
                            <input
                                className={inputClass}
                                value={form.data.address}
                                onChange={(event) =>
                                    form.setData('address', event.target.value)
                                }
                                placeholder={t('employer.profile.address')}
                            />
                            <SaveRow
                                processing={form.processing}
                                onSave={save}
                                onCancel={() => setEditing(null)}
                            />
                        </div>
                    ) : (
                        <dl className="grid gap-3 sm:grid-cols-2">
                            <Info label={t('employer.profile.contact_name')} value={profile.contact_name} />
                            <Info label={t('employer.profile.email')} value={profile.email} />
                            <Info label={t('employer.profile.phone')} value={profile.phone} />
                            <Info label={t('employer.profile.address')} value={profile.address} />
                        </dl>
                    )}
                </Section>

                <Section
                    title={t('employer.profile.social_links')}
                    complete={completion.sections.social}
                    onEdit={() => setEditing('social')}
                >
                    {editing === 'social' ? (
                        <div className="grid gap-3">
                            <input
                                className={inputClass}
                                value={form.data.linkedin_url}
                                onChange={(event) =>
                                    form.setData(
                                        'linkedin_url',
                                        event.target.value,
                                    )
                                }
                                placeholder={t('employer.profile.linkedin_url')}
                            />
                            <input
                                className={inputClass}
                                value={form.data.x_url}
                                onChange={(event) =>
                                    form.setData('x_url', event.target.value)
                                }
                                placeholder={t('employer.profile.x_url')}
                            />
                            <input
                                className={inputClass}
                                value={form.data.instagram_url}
                                onChange={(event) =>
                                    form.setData(
                                        'instagram_url',
                                        event.target.value,
                                    )
                                }
                                placeholder={t(
                                    'employer.profile.instagram_url',
                                )}
                            />
                            <SaveRow
                                processing={form.processing}
                                onSave={save}
                                onCancel={() => setEditing(null)}
                            />
                        </div>
                    ) : (
                        <p className="text-sm text-[#64748b]">
                            {completion.sections.social
                                ? [profile.linkedin_url, profile.x_url, profile.instagram_url]
                                    .filter(Boolean)
                                    .join(' · ')
                                : t('employer.profile.no_social')}
                        </p>
                    )}
                </Section>

                <Section
                    title={t('employer.profile.verification_documents')}
                    complete={completion.sections.verification}
                    onEdit={() => documentInputRef.current?.click()}
                >
                    <input
                        ref={documentInputRef}
                        type="file"
                        accept=".pdf,.doc,.docx,application/pdf"
                        className="hidden"
                        onChange={onDocumentChange}
                    />
                    <div className="space-y-3">
                        <p className="text-sm text-[#364153]">
                            {profile.verification_document_name
                                ? t('employer.profile.uploaded_document', {
                                    name: profile.verification_document_name,
                                })
                                : t('employer.profile.verification_hint')}
                        </p>
                        <div className="flex flex-wrap gap-2">
                            <button
                                type="button"
                                disabled={uploading === 'document'}
                                onClick={() =>
                                    documentInputRef.current?.click()
                                }
                                className="cursor-pointer rounded-lg border border-[#0057c8] px-3 py-1.5 text-xs font-semibold text-[#0057c8]"
                            >
                                {uploading === 'document'
                                    ? t('common.uploading')
                                    : profile.verification_document_name
                                        ? t('common.replace')
                                        : t('common.upload')}
                            </button>
                            {profile.verification_document_url && (
                                <a
                                    href={profile.verification_document_url}
                                    className="rounded-lg border border-[#e8d5e8] px-3 py-1.5 text-xs font-semibold text-[#374151]"
                                >
                                    {t('common.download')}
                                </a>
                            )}
                            {profile.verification_document_name && (
                                <button
                                    type="button"
                                    onClick={() =>
                                        router.delete(
                                            '/employer/profile/verification-document',
                                            { preserveScroll: true },
                                        )
                                    }
                                    className="cursor-pointer rounded-lg px-3 py-1.5 text-xs font-semibold text-[#b91c1c]"
                                >
                                    {t('common.remove')}
                                </button>
                            )}
                        </div>
                    </div>
                </Section>

                <Section
                    title={t('employer.profile.cover_banner')}
                    complete={completion.sections.cover}
                    onEdit={() => coverInputRef.current?.click()}
                >
                    <input
                        ref={coverInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="hidden"
                        onChange={onCoverChange}
                    />
                    {profile.cover_url ? (
                        <div className="space-y-3">
                            <img
                                src={profile.cover_url}
                                alt={t('employer.profile.cover_alt')}
                                className="h-28 w-full rounded-xl object-cover"
                            />
                            <div className="flex flex-wrap gap-2">
                                <button
                                    type="button"
                                    disabled={uploading === 'cover'}
                                    onClick={() =>
                                        coverInputRef.current?.click()
                                    }
                                    className="cursor-pointer rounded-lg border border-[#0057c8] px-3 py-1.5 text-xs font-semibold text-[#0057c8]"
                                >
                                    {uploading === 'cover'
                                        ? t('common.uploading')
                                        : t('common.replace')}
                                </button>
                                <button
                                    type="button"
                                    onClick={() =>
                                        router.delete(
                                            '/employer/profile/cover',
                                            { preserveScroll: true },
                                        )
                                    }
                                    className="cursor-pointer rounded-lg px-3 py-1.5 text-xs font-semibold text-[#b91c1c]"
                                >
                                    {t('common.remove')}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <div className="flex h-28 items-center justify-center rounded-xl border border-dashed border-[#e2e8f0] bg-[#f8faff] text-sm text-[#99a1af]">
                                {t('employer.profile.no_cover')}
                            </div>
                            <button
                                type="button"
                                disabled={uploading === 'cover'}
                                onClick={() => coverInputRef.current?.click()}
                                className="cursor-pointer rounded-lg border border-[#0057c8] px-3 py-1.5 text-xs font-semibold text-[#0057c8]"
                            >
                                {uploading === 'cover'
                                    ? t('common.uploading')
                                    : t('common.upload')}
                            </button>
                        </div>
                    )}
                </Section>
            </div>
        </EmployerLayout>
    );
}

function CompletionRing({ percent }: { percent: number }) {
    const radius = 40;
    const circumference = 2 * Math.PI * radius;
    const clamped = Math.min(100, Math.max(0, percent));
    const dash = (clamped / 100) * circumference;

    return (
        <div className="relative size-24 shrink-0">
            <svg
                width={96}
                height={96}
                viewBox="0 0 96 96"
                fill="none"
                className="-rotate-90"
                aria-hidden
            >
                <circle
                    cx="48"
                    cy="48"
                    r={radius}
                    stroke="#F3E6F3"
                    strokeWidth="8"
                />
                <circle
                    cx="48"
                    cy="48"
                    r={radius}
                    stroke="#E57124"
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={`${dash} ${circumference}`}
                />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-xl leading-[30px] font-bold text-[#e57124]">
                {clamped}%
            </span>
        </div>
    );
}

function Section({
    title,
    complete,
    onEdit,
    children,
}: {
    title: string;
    complete: boolean;
    onEdit?: () => void;
    children: ReactNode;
}) {
    const { t } = useLocale();

    return (
        <section className="rounded-2xl border border-[#e8d5e8] bg-white p-6 shadow-[0px_2px_4px_rgba(5,3,21,0.06)]">
            <div className="mb-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                    {complete ? (
                        <CheckCircle2 className="size-5 text-[#16a34a]" />
                    ) : (
                        <TriangleAlert className="size-5 text-[#eab308]" />
                    )}
                    <h2 className="text-base font-bold text-[#050315]">
                        {title}
                    </h2>
                </div>
                {onEdit && (
                    <button
                        type="button"
                        onClick={onEdit}
                        className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-[#0057c8] px-[13.6px] py-[5.6px] text-[13.6px] font-semibold text-[#0057c8]"
                    >
                        <Pencil className="size-3.5" />
                        {t('common.edit')}
                    </button>
                )}
            </div>
            {children}
        </section>
    );
}

function Info({ label, value }: { label: string; value: string | null }) {
    return (
        <div>
            <dt className="text-xs text-[#94a3b8]">{label}</dt>
            <dd className="text-sm font-semibold text-[#050315]">
                {value || '—'}
            </dd>
        </div>
    );
}

function SaveRow({
    processing,
    onSave,
    onCancel,
}: {
    processing: boolean;
    onSave: () => void;
    onCancel: () => void;
}) {
    const { t } = useLocale();

    return (
        <div className="flex gap-2 sm:col-span-2">
            <button
                type="button"
                disabled={processing}
                onClick={onSave}
                className="cursor-pointer rounded-xl bg-[#0057c8] px-4 py-2 text-sm font-semibold text-white"
            >
                {t('common.save')}
            </button>
            <button
                type="button"
                onClick={onCancel}
                className="cursor-pointer rounded-xl px-4 py-2 text-sm font-semibold text-[#64748b]"
            >
                {t('common.cancel')}
            </button>
        </div>
    );
}
