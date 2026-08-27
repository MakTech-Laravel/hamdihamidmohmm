import { Head, router, useForm, usePage } from '@inertiajs/react';
import { CheckCircle2, Pencil, TriangleAlert } from 'lucide-react';
import { useRef, useState, type ChangeEvent, type ReactNode } from 'react';

import { getInitials } from '@/components/employer/demo-data';
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

    const missing = Object.entries(completion.sections)
        .filter(([, done]) => !done)
        .map(([key]) => sectionTitle(key));

    return (
        <EmployerLayout title="Company Profile">
            <Head title="Company Profile" />

            <div className="space-y-6 px-4 py-6 sm:px-6">
                <h1 className="text-2xl leading-9 font-extrabold text-[#050315]">
                    Company Profile
                </h1>

                {flash.success && (
                    <div className="rounded-xl border border-[#bbf7d0] bg-[#f0fdf4] px-4 py-3 text-sm text-[#15803d]">
                        {typeof flash.success === 'string'
                            ? flash.success
                            : 'Saved successfully.'}
                    </div>
                )}

                <div className="flex items-center gap-6 rounded-2xl border border-[#e8d5e8] bg-white p-6 shadow-[0px_2px_4px_rgba(5,3,21,0.06)]">
                    <CompletionRing percent={completion.percent} />
                    <div className="min-w-0">
                        <p className="text-[17.6px] leading-[26.4px] font-bold text-[#050315]">
                            Profile Completion
                        </p>
                        <p className="mt-1 text-[14.4px] leading-[21.6px] text-[#6b7280]">
                            {completion.completed} of {completion.total}{' '}
                            sections complete
                        </p>
                        {missing.length > 0 && (
                            <div className="mt-3">
                                <p className="text-[12.8px] leading-[19.2px] text-[#6b7280]">
                                    Incomplete sections:
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
                            Verification Status
                        </p>
                        <p className="mt-1 text-[13.6px] leading-[20.4px] text-[#6b7280]">
                            {profile.verification_value === 'approved' &&
                                profile.verified_on
                                ? `Verified on ${profile.verified_on}`
                                : profile.verification || 'Not verified'}
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
                            ? 'Verified'
                            : profile.verification || 'Pending'}
                    </span>
                </div>

                <Section
                    title="Company Information"
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
                                placeholder="Company name"
                            />
                            <input
                                className={inputClass}
                                value={form.data.industry}
                                onChange={(event) =>
                                    form.setData('industry', event.target.value)
                                }
                                placeholder="Industry"
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
                                placeholder="Company size"
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
                                placeholder="Founded year"
                            />
                            <input
                                className={cn(inputClass, 'sm:col-span-2')}
                                value={form.data.website}
                                onChange={(event) =>
                                    form.setData('website', event.target.value)
                                }
                                placeholder="Website"
                            />
                            <SaveRow
                                processing={form.processing}
                                onSave={save}
                                onCancel={() => setEditing(null)}
                            />
                        </div>
                    ) : (
                        <dl className="grid gap-3 sm:grid-cols-2">
                            <Info label="Company Name" value={profile.company_name} />
                            <Info label="Industry" value={profile.industry} />
                            <Info label="Company Size" value={profile.company_size} />
                            <Info
                                label="Founded"
                                value={profile.founded_year?.toString() ?? null}
                            />
                            <Info label="Website" value={profile.website} />
                        </dl>
                    )}
                </Section>

                <Section
                    title="Company Logo"
                    complete={completion.sections.logo}
                    onEdit={() => logoInputRef.current?.click()}
                >
                    <input
                        ref={logoInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="hidden"
                        onChange={onLogoChange}
                    />
                    <div className="flex flex-wrap items-center gap-4">
                        {profile.logo_url ? (
                            <img
                                src={profile.logo_url}
                                alt={`${profile.company_name || 'Company'} logo`}
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
                                    ? 'Logo uploaded'
                                    : 'Upload a square logo (JPG, PNG, WEBP).'}
                            </p>
                            <div className="mt-2 flex flex-wrap gap-2">
                                <button
                                    type="button"
                                    disabled={uploading === 'logo'}
                                    onClick={() => logoInputRef.current?.click()}
                                    className="cursor-pointer rounded-lg border border-[#0057c8] px-3 py-1.5 text-xs font-semibold text-[#0057c8]"
                                >
                                    {uploading === 'logo'
                                        ? 'Uploading…'
                                        : profile.logo_url
                                          ? 'Replace'
                                          : 'Upload'}
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
                                        Remove
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </Section>

                <Section
                    title="About Company"
                    complete={completion.sections.about}
                    onEdit={() => setEditing('about')}
                >
                    {editing === 'about' ? (
                        <div className="space-y-3">
                            <textarea
                                rows={5}
                                className={inputClass}
                                value={form.data.about}
                                onChange={(event) =>
                                    form.setData('about', event.target.value)
                                }
                            />
                            <SaveRow
                                processing={form.processing}
                                onSave={save}
                                onCancel={() => setEditing(null)}
                            />
                        </div>
                    ) : (
                        <p className="text-sm whitespace-pre-wrap text-[#364153]">
                            {profile.about || 'Add a company overview.'}
                        </p>
                    )}
                </Section>

                <Section
                    title="Contact Information"
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
                                placeholder="Contact name"
                            />
                            <input
                                className={inputClass}
                                value={form.data.email}
                                onChange={(event) =>
                                    form.setData('email', event.target.value)
                                }
                                placeholder="Email"
                            />
                            <input
                                className={inputClass}
                                value={form.data.phone}
                                onChange={(event) =>
                                    form.setData('phone', event.target.value)
                                }
                                placeholder="Phone"
                            />
                            <input
                                className={inputClass}
                                value={form.data.address}
                                onChange={(event) =>
                                    form.setData('address', event.target.value)
                                }
                                placeholder="Address"
                            />
                            <SaveRow
                                processing={form.processing}
                                onSave={save}
                                onCancel={() => setEditing(null)}
                            />
                        </div>
                    ) : (
                        <dl className="grid gap-3 sm:grid-cols-2">
                            <Info label="Contact Name" value={profile.contact_name} />
                            <Info label="Email" value={profile.email} />
                            <Info label="Phone" value={profile.phone} />
                            <Info label="Address" value={profile.address} />
                        </dl>
                    )}
                </Section>

                <Section
                    title="Social Links"
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
                                placeholder="LinkedIn URL"
                            />
                            <input
                                className={inputClass}
                                value={form.data.x_url}
                                onChange={(event) =>
                                    form.setData('x_url', event.target.value)
                                }
                                placeholder="X URL"
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
                                placeholder="Instagram URL"
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
                                : 'No social links added yet.'}
                        </p>
                    )}
                </Section>

                <Section
                    title="Verification Documents"
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
                                ? `Uploaded: ${profile.verification_document_name}`
                                : 'Upload your CR / trade license for admin review.'}
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
                                    ? 'Uploading…'
                                    : profile.verification_document_name
                                      ? 'Replace Document'
                                      : 'Upload Document'}
                            </button>
                            {profile.verification_document_url && (
                                <a
                                    href={profile.verification_document_url}
                                    className="rounded-lg border border-[#e8d5e8] px-3 py-1.5 text-xs font-semibold text-[#374151]"
                                >
                                    Download
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
                                    Remove
                                </button>
                            )}
                        </div>
                    </div>
                </Section>

                <Section
                    title="Cover Banner"
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
                                alt="Company cover banner"
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
                                        ? 'Uploading…'
                                        : 'Replace'}
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
                                    Remove
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <div className="flex h-28 items-center justify-center rounded-xl border border-dashed border-[#e2e8f0] bg-[#f8faff] text-sm text-[#99a1af]">
                                No cover banner uploaded.
                            </div>
                            <button
                                type="button"
                                disabled={uploading === 'cover'}
                                onClick={() => coverInputRef.current?.click()}
                                className="cursor-pointer rounded-lg border border-[#0057c8] px-3 py-1.5 text-xs font-semibold text-[#0057c8]"
                            >
                                {uploading === 'cover'
                                    ? 'Uploading…'
                                    : 'Upload Cover'}
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

function sectionTitle(key: string): string {
    return (
        {
            company: 'Company Information',
            logo: 'Company Logo',
            about: 'About Company',
            contact: 'Contact Information',
            social: 'Social Links',
            verification: 'Verification Documents',
            cover: 'Cover Banner',
        }[key] ?? key
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
                        Edit
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
    return (
        <div className="flex gap-2 sm:col-span-2">
            <button
                type="button"
                disabled={processing}
                onClick={onSave}
                className="cursor-pointer rounded-xl bg-[#0057c8] px-4 py-2 text-sm font-semibold text-white"
            >
                Save
            </button>
            <button
                type="button"
                onClick={onCancel}
                className="cursor-pointer rounded-xl px-4 py-2 text-sm font-semibold text-[#64748b]"
            >
                Cancel
            </button>
        </div>
    );
}
