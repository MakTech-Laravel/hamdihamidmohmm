import { Head, router, useForm, usePage } from '@inertiajs/react';
import {
    Award,
    Briefcase,
    Check,
    Download,
    FileUp,
    GraduationCap,
    Languages,
    MapPin,
    Pencil,
    Plus,
    Sparkles,
    UserRound,
    X,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

import {
    destroyResume,
    update as updateProfile,
    uploadResume,
} from '@/actions/App/Http/Controllers/Backend/User/JobSeekerProfileController';
import { getInitials } from '@/components/job-seeker/demo-data';
import { NativeSelect } from '@/components/ui/native-select';
import { useLocale } from '@/hooks/use-locale';
import JobSeekerLayout from '@/layouts/job-seeker-layout';
import { cn } from '@/lib/utils';
import type { SharedData } from '@/types';

type ChecklistItem = {
    id: string;
    label: string;
    complete: boolean;
};

type EducationEntry = {
    degree: string;
    school: string;
    field: string;
    from: string;
    to: string;
    years: string;
};

type ExperienceEntry = {
    title: string;
    company: string;
    dates: string;
    from: string;
    to: string;
    present: boolean;
    years: string;
    description: string;
};

type LanguageEntry = {
    name: string;
    level: string;
};

type CertificationEntry = {
    name: string;
    issuer: string;
    date: string;
};

type Profile = {
    name: string | null;
    email: string | null;
    phone: string | null;
    location: string | null;
    headline: string | null;
    current_title: string | null;
    experience_years: string | null;
    experience_years_label: string;
    bio: string | null;
    linkedin_url: string | null;
    github_url: string | null;
    industry: string | null;
    expected_salary: string | null;
    availability: string[];
    skills: string[];
    education: unknown[];
    experience: unknown[];
    languages: unknown[];
    certifications: unknown[];
    resume_status: string | null;
    resume_name: string | null;
    resume_url: string | null;
    completion: number;
    checklist: ChecklistItem[];
};

type SectionId =
    | 'personal'
    | 'professional'
    | 'education'
    | 'experience'
    | 'skills'
    | 'languages'
    | 'certifications'
    | 'resume';

const availabilityOptions = [
    'Full Time',
    'Part Time',
    'Remote',
    'Freelance',
] as const;

const languageLevels = [
    'Native',
    'Advanced',
    'Intermediate',
    'Conversational',
    'Beginner',
] as const;

function isKnownLanguageLevel(
    value: string,
): value is (typeof languageLevels)[number] {
    return (languageLevels as readonly string[]).includes(value);
}

const sectionMeta: Array<{
    id: SectionId;
    labelKey: string;
    icon: typeof UserRound;
    emoji: string;
    tone: string;
}> = [
        {
            id: 'personal',
            labelKey: 'job_seeker.profile.personal',
            icon: UserRound,
            emoji: '👤',
            tone: 'bg-[#dcfce7] text-[#15803d]',
        },
        {
            id: 'professional',
            labelKey: 'job_seeker.profile.professional',
            icon: Briefcase,
            emoji: '💼',
            tone: 'bg-[#ffedd5] text-[#c2410c]',
        },
        {
            id: 'education',
            labelKey: 'job_seeker.profile.education',
            icon: GraduationCap,
            emoji: '🎓',
            tone: 'bg-[#dbeafe] text-[#1d4ed8]',
        },
        {
            id: 'experience',
            labelKey: 'job_seeker.profile.experience',
            icon: Briefcase,
            emoji: '🏢',
            tone: 'bg-[#ffedd5] text-[#c2410c]',
        },
        {
            id: 'skills',
            labelKey: 'job_seeker.profile.skills',
            icon: Sparkles,
            emoji: '⚡',
            tone: 'bg-[#dbeafe] text-[#1d4ed8]',
        },
        {
            id: 'languages',
            labelKey: 'job_seeker.profile.languages',
            icon: Languages,
            emoji: '🌐',
            tone: 'bg-[#dcfce7] text-[#15803d]',
        },
        {
            id: 'certifications',
            labelKey: 'job_seeker.profile.certifications',
            icon: Award,
            emoji: '🏅',
            tone: 'bg-[#fee2e2] text-[#b91c1c]',
        },
        {
            id: 'resume',
            labelKey: 'job_seeker.profile.resume',
            icon: Download,
            emoji: '📄',
            tone: 'bg-[#dcfce7] text-[#15803d]',
        },
    ];

const availabilityLabelKeys: Record<(typeof availabilityOptions)[number], string> = {
    'Full Time': 'jobs.full_time',
    'Part Time': 'jobs.part_time',
    Remote: 'jobs.remote',
    Freelance: 'jobs.freelance',
};

function translatedOrRaw(
    t: (key: string, replacements?: Record<string, string | number>) => string,
    key: string,
    raw: string,
): string {
    const value = t(key);

    return value === key ? raw : value;
}

function availabilityLabel(t: (key: string) => string, option: string): string {
    const key =
        availabilityLabelKeys[option as (typeof availabilityOptions)[number]];

    return key ? t(key) : option;
}

function languageLevelLabel(t: (key: string) => string, level: string): string {
    return translatedOrRaw(
        t,
        `job_seeker.profile.language_level.${level.toLowerCase()}`,
        level,
    );
}

function asRecord(value: unknown): Record<string, unknown> | null {
    return value !== null && typeof value === 'object' && !Array.isArray(value)
        ? (value as Record<string, unknown>)
        : null;
}

function fieldString(value: unknown, ...keys: string[]): string {
    if (typeof value === 'string') {
        return value;
    }

    const record = asRecord(value);

    if (!record) {
        return '';
    }

    for (const key of keys) {
        const item = record[key];

        if (typeof item === 'string' && item !== '') {
            return item;
        }

        if (typeof item === 'number') {
            return String(item);
        }
    }

    return '';
}

function parseYearRange(value: string): { from: string; to: string; present: boolean } {
    const trimmed = value.trim();

    if (trimmed === '') {
        return { from: '', to: '', present: false };
    }

    const match = trimmed.match(/^(\d{4})\s*[-–—]\s*(.+)$/);

    if (!match) {
        return { from: trimmed, to: '', present: false };
    }

    const to = match[2].trim();
    const present = /^present$/i.test(to);

    return {
        from: match[1],
        to: present ? '' : to,
        present,
    };
}

function formatYearRange(from: string, to: string, present = false): string {
    const start = from.trim();
    const end = present ? 'Present' : to.trim();

    if (start !== '' && end !== '') {
        return `${start} - ${end}`;
    }

    return start || end;
}

function normalizeEducation(items: unknown[]): EducationEntry[] {
    return items.map((item) => {
        const years = fieldString(item, 'years', 'dates');
        const range = parseYearRange(years);

        return {
            degree: fieldString(item, 'degree', 'title'),
            school: fieldString(item, 'school', 'institution'),
            field: fieldString(item, 'field', 'field_of_study'),
            from: fieldString(item, 'from') || range.from,
            to: fieldString(item, 'to') || range.to,
            years,
        };
    });
}

function normalizeExperience(items: unknown[]): ExperienceEntry[] {
    return items.map((item) => {
        const dates = fieldString(item, 'dates');
        const range = parseYearRange(dates);

        return {
            title: fieldString(item, 'title', 'role'),
            company: fieldString(item, 'company'),
            dates,
            from: fieldString(item, 'from') || range.from,
            to: fieldString(item, 'to') || range.to,
            present:
                Boolean(asRecord(item)?.present) ||
                range.present ||
                /^present$/i.test(fieldString(item, 'to')),
            years: fieldString(item, 'years'),
            description: fieldString(item, 'description'),
        };
    });
}

function normalizeLanguages(items: unknown[]): LanguageEntry[] {
    return items.map((item) => ({
        name:
            fieldString(item, 'name', 'language') ||
            (typeof item === 'string' ? item : ''),
        level: fieldString(item, 'level'),
    }));
}

function normalizeCertifications(items: unknown[]): CertificationEntry[] {
    return items.map((item) => ({
        name:
            fieldString(item, 'name', 'title') ||
            (typeof item === 'string' ? item : ''),
        issuer: fieldString(item, 'issuer', 'org'),
        date: fieldString(item, 'date', 'year'),
    }));
}

function emptyEducation(): EducationEntry {
    return { degree: '', school: '', field: '', from: '', to: '', years: '' };
}

function emptyExperience(): ExperienceEntry {
    return {
        title: '',
        company: '',
        dates: '',
        from: '',
        to: '',
        present: false,
        years: '',
        description: '',
    };
}

function emptyLanguage(): LanguageEntry {
    return { name: '', level: 'Native' };
}

function emptyCertification(): CertificationEntry {
    return { name: '', issuer: '', date: '' };
}

function profileToFormData(profile: Profile) {
    return {
        name: profile.name ?? '',
        phone: profile.phone ?? '',
        location: profile.location ?? '',
        headline: profile.headline ?? '',
        current_title: profile.current_title ?? '',
        experience_years: profile.experience_years ?? '',
        bio: profile.bio ?? '',
        linkedin_url: profile.linkedin_url ?? '',
        github_url: profile.github_url ?? '',
        industry: profile.industry ?? '',
        expected_salary: profile.expected_salary ?? '',
        availability: [...(profile.availability ?? [])],
        skills: [...(profile.skills ?? [])],
        education: normalizeEducation(profile.education ?? []),
        experience: normalizeExperience(profile.experience ?? []),
        languages: normalizeLanguages(profile.languages ?? []),
        certifications: normalizeCertifications(profile.certifications ?? []),
    };
}

function cleanEducation(entries: EducationEntry[]): Array<{
    degree: string;
    school: string;
    field: string;
    years: string;
}> {
    return entries
        .map((entry) => {
            const years = formatYearRange(entry.from, entry.to) || entry.years.trim();

            return {
                degree: entry.degree.trim(),
                school: entry.school.trim(),
                field: entry.field.trim(),
                years,
            };
        })
        .filter(
            (entry) =>
                entry.degree || entry.school || entry.field || entry.years,
        );
}

function cleanExperience(entries: ExperienceEntry[]): Array<
    Omit<ExperienceEntry, 'years' | 'from' | 'to' | 'present'> & {
        years?: number;
        dates: string;
    }
> {
    return entries
        .map((entry) => {
            const yearsRaw = entry.years.trim();
            const yearsNumber = Number(yearsRaw);
            const dates =
                formatYearRange(entry.from, entry.to, entry.present) ||
                entry.dates.trim();

            return {
                title: entry.title.trim(),
                company: entry.company.trim(),
                dates,
                description: entry.description.trim(),
                ...(yearsRaw !== '' && Number.isFinite(yearsNumber)
                    ? { years: yearsNumber }
                    : {}),
            };
        })
        .filter(
            (entry) =>
                entry.title ||
                entry.company ||
                entry.dates ||
                entry.description ||
                entry.years !== undefined,
        );
}

function cleanLanguages(entries: LanguageEntry[]): LanguageEntry[] {
    return entries
        .map((entry) => ({
            name: entry.name.trim(),
            level: entry.level.trim(),
        }))
        .filter((entry) => entry.name || entry.level);
}

function cleanCertifications(
    entries: CertificationEntry[],
): CertificationEntry[] {
    return entries
        .map((entry) => ({
            name: entry.name.trim(),
            issuer: entry.issuer.trim(),
            date: entry.date.trim(),
        }))
        .filter((entry) => entry.name || entry.issuer || entry.date);
}

export default function JobSeekerProfile({ profile }: { profile: Profile }) {
    const { flash } = usePage<SharedData>().props;
    const { t } = useLocale();
    const [editing, setEditing] = useState<SectionId | null>(null);

    const form = useForm(profileToFormData(profile));

    useEffect(() => {
        if (editing !== null) {
            return;
        }

        form.setData(profileToFormData(profile));
        form.clearErrors();
        // eslint-disable-next-line react-hooks/exhaustive-deps -- sync when server profile refreshes
    }, [profile, editing]);

    const completeMap = useMemo(() => {
        return Object.fromEntries(
            profile.checklist.map((item) => [item.id, item.complete]),
        ) as Record<string, boolean>;
    }, [profile.checklist]);

    const startEditing = (section: SectionId): void => {
        form.setData(profileToFormData(profile));
        form.clearErrors();
        setEditing(section);
    };

    const cancelEditing = (): void => {
        form.setData(profileToFormData(profile));
        form.clearErrors();
        setEditing(null);
    };

    const save = (): void => {
        form.transform((data) => ({
            name: data.name,
            phone: data.phone,
            location: data.location,
            headline: data.headline,
            current_title: data.current_title,
            experience_years: data.experience_years,
            bio: data.bio,
            linkedin_url: data.linkedin_url,
            github_url: data.github_url,
            industry: data.industry,
            expected_salary: data.expected_salary,
            availability: data.availability
                .map((item) => item.trim())
                .filter(Boolean),
            skills: data.skills
                .map((skill) => skill.trim())
                .filter(Boolean),
            education: cleanEducation(data.education),
            experience: cleanExperience(data.experience),
            languages: cleanLanguages(data.languages),
            certifications: cleanCertifications(data.certifications),
        }));

        form.put(updateProfile.url(), {
            preserveScroll: true,
            onSuccess: () => setEditing(null),
        });
    };

    return (
        <JobSeekerLayout title={t('job_seeker.profile.title')}>
            <Head title={t('job_seeker.profile.title')} />

            <div className="space-y-6 p-6">
                {flash.success && (
                    <div className="rounded-xl border border-[#bbf7d0] bg-[#f0fdf4] px-4 py-3 text-sm text-[#15803d]">
                        {typeof flash.success === 'string'
                            ? flash.success
                            : t('job_seeker.profile.saved')}
                    </div>
                )}

                {Object.keys(form.errors).length > 0 && (
                    <div className="rounded-xl border border-[#fecaca] bg-[#fef2f2] px-4 py-3 text-sm text-[#b91c1c]">
                        {Object.values(form.errors)[0]}
                    </div>
                )}

                <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-[#0057c8] to-[#3977a6] p-6 text-white shadow-[0px_4px_10px_rgba(30,58,138,0.2)]">
                    <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                        <div className="flex size-[88px] shrink-0 items-center justify-center rounded-full bg-white/15 text-2xl font-extrabold">
                            {getInitials(
                                profile.name ||
                                    t('job_seeker.profile.fallback_name'),
                            )}
                        </div>
                        <div className="min-w-0 flex-1">
                            <h1 className="text-2xl font-extrabold">
                                {profile.name ||
                                    t('job_seeker.profile.fallback_name')}
                            </h1>
                            <p className="pt-1 text-sm text-[#bfdbfe]">
                                {profile.headline ||
                                    t('job_seeker.profile.add_headline')}
                            </p>
                            {profile.location ? (
                                <p className="flex items-center gap-1.5 pt-2 text-sm text-[#dbeafe]">
                                    <MapPin className="size-3.5" />
                                    {profile.location}
                                </p>
                            ) : null}
                            <div className="mt-4 max-w-md">
                                <div className="mb-1 flex items-center justify-between text-xs font-semibold text-[#bedbff]">
                                    <span>
                                        {t('job_seeker.profile.completion', {
                                            percent: profile.completion,
                                        })}
                                    </span>
                                </div>
                                <div className="h-2 overflow-hidden rounded-full bg-white/25">
                                    <div
                                        className="h-full rounded-full bg-[#93c5fd]"
                                        style={{
                                            width: `${profile.completion}%`,
                                        }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex flex-wrap gap-2">
                    {sectionMeta.map((section) => {
                        const complete = completeMap[section.id] ?? false;

                        return (
                            <a
                                key={section.id}
                                href={`#section-${section.id}`}
                                className={cn(
                                    'inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold',
                                    section.tone,
                                )}
                            >
                                <section.icon className="size-3.5" />
                                {t(section.labelKey)}
                                {complete ? (
                                    <Check className="size-3.5" strokeWidth={3} />
                                ) : (
                                    <X className="size-3.5" strokeWidth={3} />
                                )}
                            </a>
                        );
                    })}
                </div>

                <SectionCard
                    id="personal"
                    title={t('job_seeker.profile.personal')}
                    emoji="👤"
                    complete={completeMap.personal ?? false}
                    editing={editing === 'personal'}
                    onEdit={() => startEditing('personal')}
                    onCancel={cancelEditing}
                    onSave={save}
                    processing={form.processing}
                >
                    {editing === 'personal' ? (
                        <div className="grid gap-4 md:grid-cols-2">
                            <Field
                                label={t('job_seeker.profile.full_name')}
                                value={form.data.name}
                                onChange={(value) => form.setData('name', value)}
                            />
                            <Field
                                label={t('job_seeker.profile.headline')}
                                value={form.data.headline}
                                onChange={(value) =>
                                    form.setData('headline', value)
                                }
                            />
                            <Field
                                label={t('job_seeker.profile.location')}
                                value={form.data.location}
                                onChange={(value) =>
                                    form.setData('location', value)
                                }
                            />
                            <div>
                                <p className="pb-1.5 text-xs font-semibold text-[#4a5565]">
                                    {t('job_seeker.profile.email')}
                                </p>
                                <div className="flex h-[42px] items-center rounded-lg border border-[#e8d5e8] bg-[#f8fafc] px-3 text-base text-[#64748b]">
                                    {profile.email || '—'}
                                </div>
                            </div>
                            <Field
                                label={t('job_seeker.profile.phone')}
                                value={form.data.phone}
                                onChange={(value) => form.setData('phone', value)}
                            />
                            <Field
                                label={t('job_seeker.profile.linkedin')}
                                value={form.data.linkedin_url}
                                onChange={(value) =>
                                    form.setData('linkedin_url', value)
                                }
                                placeholder={t(
                                    'job_seeker.profile.linkedin_placeholder',
                                )}
                            />
                            <Field
                                label={t('job_seeker.profile.github')}
                                value={form.data.github_url}
                                onChange={(value) =>
                                    form.setData('github_url', value)
                                }
                                placeholder={t(
                                    'job_seeker.profile.github_placeholder',
                                )}
                            />
                            <div className="md:col-span-2">
                                <label className="block text-xs font-semibold text-[#4a5565]">
                                    {t('job_seeker.profile.bio')}
                                    <textarea
                                        className="mt-1.5 min-h-24 w-full rounded-lg border border-[#e8d5e8] px-3 py-2 text-base text-[#050315] outline-none transition focus:border-[#0057c8] focus:ring-[3px] focus:ring-[#0057c8]/15"
                                        value={form.data.bio}
                                        onChange={(event) =>
                                            form.setData(
                                                'bio',
                                                event.target.value,
                                            )
                                        }
                                    />
                                </label>
                            </div>
                        </div>
                    ) : (
                        <div className="grid gap-4 md:grid-cols-2">
                            <ReadOnlyField
                                label={t('job_seeker.profile.full_name')}
                                value={profile.name}
                            />
                            <ReadOnlyField
                                label={t('job_seeker.profile.headline')}
                                value={profile.headline}
                            />
                            <ReadOnlyField
                                label={t('job_seeker.profile.location')}
                                value={profile.location}
                            />
                            <ReadOnlyField
                                label={t('job_seeker.profile.email')}
                                value={profile.email}
                            />
                            <ReadOnlyField
                                label={t('job_seeker.profile.phone')}
                                value={profile.phone}
                            />
                            <ReadOnlyField
                                label={t('job_seeker.profile.linkedin')}
                                value={profile.linkedin_url}
                            />
                            <ReadOnlyField
                                label={t('job_seeker.profile.github')}
                                value={profile.github_url}
                            />
                            <div className="md:col-span-2">
                                <ReadOnlyField
                                    label={t('job_seeker.profile.bio')}
                                    value={profile.bio}
                                />
                            </div>
                        </div>
                    )}
                </SectionCard>

                <SectionCard
                    id="professional"
                    title={t('job_seeker.profile.professional')}
                    emoji="💼"
                    complete={completeMap.professional ?? false}
                    editing={editing === 'professional'}
                    onEdit={() => startEditing('professional')}
                    onCancel={cancelEditing}
                    onSave={save}
                    processing={form.processing}
                >
                    {editing === 'professional' ? (
                        <div className="space-y-4">
                            <div className="grid gap-4 md:grid-cols-2">
                                <Field
                                    label={t('job_seeker.profile.current_title')}
                                    value={form.data.current_title}
                                    onChange={(value) =>
                                        form.setData('current_title', value)
                                    }
                                />
                                <Field
                                    label={t('job_seeker.profile.years_experience')}
                                    value={form.data.experience_years}
                                    onChange={(value) =>
                                        form.setData('experience_years', value)
                                    }
                                    placeholder={t('job_seeker.profile.years_placeholder')}
                                />
                                <Field
                                    label={t('job_seeker.profile.industry')}
                                    value={form.data.industry}
                                    onChange={(value) =>
                                        form.setData('industry', value)
                                    }
                                />
                                <Field
                                    label={t('job_seeker.profile.expected_salary')}
                                    value={form.data.expected_salary}
                                    onChange={(value) =>
                                        form.setData('expected_salary', value)
                                    }
                                />
                            </div>
                            <div>
                                <p className="text-xs font-semibold text-[#4a5565]">
                                    {t('job_seeker.profile.available_for')}
                                </p>
                                <div className="mt-2 flex flex-wrap gap-2">
                                    {availabilityOptions.map((option) => {
                                        const selected =
                                            form.data.availability.includes(
                                                option,
                                            );

                                        return (
                                            <button
                                                key={option}
                                                type="button"
                                                onClick={() => {
                                                    const next = selected
                                                        ? form.data.availability.filter(
                                                            (item) =>
                                                                item !==
                                                                option,
                                                        )
                                                        : [
                                                            ...form.data
                                                                .availability,
                                                            option,
                                                        ];
                                                    form.setData(
                                                        'availability',
                                                        next,
                                                    );
                                                }}
                                                className={cn(
                                                    'rounded-lg border px-3 py-1.5 text-sm font-semibold transition',
                                                    selected
                                                        ? 'border-[#0057c8] bg-[#0057c8] text-white'
                                                        : 'border-[#e5e7eb] bg-white text-[#374151] hover:border-[#0057c8]/40',
                                                )}
                                            >
                                                {availabilityLabel(t, option)}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="grid gap-4 md:grid-cols-2">
                            <ReadOnlyField
                                label={t('job_seeker.profile.current_title')}
                                value={profile.current_title}
                            />
                            <ReadOnlyField
                                label={t('job_seeker.profile.years_experience')}
                                value={profile.experience_years_label}
                            />
                            <ReadOnlyField
                                label={t('job_seeker.profile.industry')}
                                value={profile.industry}
                            />
                            <ReadOnlyField
                                label={t('job_seeker.profile.expected_salary')}
                                value={profile.expected_salary}
                            />
                            <div className="md:col-span-2">
                                <p className="text-xs font-semibold text-[#4a5565]">
                                    {t('job_seeker.profile.available_for')}
                                </p>
                                <div className="mt-2 flex flex-wrap gap-2">
                                    {(profile.availability ?? []).length ===
                                        0 ? (
                                        <span className="text-sm text-[#99a1af]">
                                            —
                                        </span>
                                    ) : (
                                        profile.availability.map((item) => (
                                            <span
                                                key={item}
                                                className="rounded-lg bg-[#dbeafe] px-3 py-1.5 text-sm font-semibold text-[#1d4ed8]"
                                            >
                                                {availabilityLabel(t, item)}
                                            </span>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </SectionCard>

                <SectionCard
                    id="education"
                    title={t('job_seeker.profile.education')}
                    emoji="🎓"
                    complete={completeMap.education ?? false}
                    editing={editing === 'education'}
                    onEdit={() => startEditing('education')}
                    onCancel={cancelEditing}
                    onSave={save}
                    processing={form.processing}
                >
                    {editing === 'education' ? (
                        <EntryEditor
                            entries={form.data.education}
                            emptyLabel={t('job_seeker.profile.no_education')}
                            addLabel={t('job_seeker.profile.add_education')}
                            accent="blue"
                            onAdd={() =>
                                form.setData('education', [
                                    ...form.data.education,
                                    emptyEducation(),
                                ])
                            }
                            onRemove={(index) =>
                                form.setData(
                                    'education',
                                    form.data.education.filter(
                                        (_, itemIndex) => itemIndex !== index,
                                    ),
                                )
                            }
                            renderFields={(entry, index) => (
                                <div className="grid gap-3 md:grid-cols-2">
                                    <Field
                                        label={t('job_seeker.profile.degree')}
                                        value={entry.degree}
                                        onChange={(value) => {
                                            const next = [
                                                ...form.data.education,
                                            ];
                                            next[index] = {
                                                ...entry,
                                                degree: value,
                                            };
                                            form.setData('education', next);
                                        }}
                                    />
                                    <Field
                                        label={t('job_seeker.profile.school')}
                                        value={entry.school}
                                        onChange={(value) => {
                                            const next = [
                                                ...form.data.education,
                                            ];
                                            next[index] = {
                                                ...entry,
                                                school: value,
                                            };
                                            form.setData('education', next);
                                        }}
                                    />
                                    <Field
                                        label={t('job_seeker.profile.field_of_study')}
                                        value={entry.field}
                                        onChange={(value) => {
                                            const next = [
                                                ...form.data.education,
                                            ];
                                            next[index] = {
                                                ...entry,
                                                field: value,
                                            };
                                            form.setData('education', next);
                                        }}
                                    />
                                    <div className="grid grid-cols-2 gap-2">
                                        <Field
                                            label={t('job_seeker.profile.from')}
                                            value={entry.from}
                                            onChange={(value) => {
                                                const next = [
                                                    ...form.data.education,
                                                ];
                                                next[index] = {
                                                    ...entry,
                                                    from: value,
                                                };
                                                form.setData('education', next);
                                            }}
                                            placeholder="2015"
                                        />
                                        <Field
                                            label={t('job_seeker.profile.to')}
                                            value={entry.to}
                                            onChange={(value) => {
                                                const next = [
                                                    ...form.data.education,
                                                ];
                                                next[index] = {
                                                    ...entry,
                                                    to: value,
                                                };
                                                form.setData('education', next);
                                            }}
                                            placeholder="2019"
                                        />
                                    </div>
                                </div>
                            )}
                        />
                    ) : (
                        <TimelineList
                            items={profile.education}
                            empty={t('job_seeker.profile.no_education')}
                            accent="blue"
                            titleKeys={['degree', 'title']}
                            subtitleKeys={['school', 'institution']}
                            metaKeys={['years', 'dates']}
                        />
                    )}
                </SectionCard>

                <SectionCard
                    id="experience"
                    title={t('job_seeker.profile.experience')}
                    emoji="🏢"
                    complete={completeMap.experience ?? false}
                    editing={editing === 'experience'}
                    onEdit={() => startEditing('experience')}
                    onCancel={cancelEditing}
                    onSave={save}
                    processing={form.processing}
                >
                    {editing === 'experience' ? (
                        <EntryEditor
                            entries={form.data.experience}
                            emptyLabel={t('job_seeker.profile.no_experience')}
                            addLabel={t('job_seeker.profile.add_experience')}
                            accent="orange"
                            onAdd={() =>
                                form.setData('experience', [
                                    ...form.data.experience,
                                    emptyExperience(),
                                ])
                            }
                            onRemove={(index) =>
                                form.setData(
                                    'experience',
                                    form.data.experience.filter(
                                        (_, itemIndex) => itemIndex !== index,
                                    ),
                                )
                            }
                            renderFields={(entry, index) => (
                                <div className="space-y-3">
                                    <div className="grid gap-3 md:grid-cols-2">
                                        <Field
                                            label={t('job_seeker.profile.job_title')}
                                            value={entry.title}
                                            onChange={(value) => {
                                                const next = [
                                                    ...form.data.experience,
                                                ];
                                                next[index] = {
                                                    ...entry,
                                                    title: value,
                                                };
                                                form.setData('experience', next);
                                            }}
                                        />
                                        <Field
                                            label={t('job_seeker.profile.company')}
                                            value={entry.company}
                                            onChange={(value) => {
                                                const next = [
                                                    ...form.data.experience,
                                                ];
                                                next[index] = {
                                                    ...entry,
                                                    company: value,
                                                };
                                                form.setData('experience', next);
                                            }}
                                        />
                                        <Field
                                            label={t('job_seeker.profile.from')}
                                            value={entry.from}
                                            onChange={(value) => {
                                                const next = [
                                                    ...form.data.experience,
                                                ];
                                                next[index] = {
                                                    ...entry,
                                                    from: value,
                                                };
                                                form.setData('experience', next);
                                            }}
                                            placeholder="2021"
                                        />
                                        {!entry.present ? (
                                            <Field
                                                label={t('job_seeker.profile.to')}
                                                value={entry.to}
                                                onChange={(value) => {
                                                    const next = [
                                                        ...form.data.experience,
                                                    ];
                                                    next[index] = {
                                                        ...entry,
                                                        to: value,
                                                    };
                                                    form.setData(
                                                        'experience',
                                                        next,
                                                    );
                                                }}
                                                placeholder="2024"
                                            />
                                        ) : (
                                            <div />
                                        )}
                                    </div>
                                    <label className="inline-flex items-center gap-2 text-sm text-[#050315]">
                                        <input
                                            type="checkbox"
                                            checked={entry.present}
                                            onChange={(event) => {
                                                const next = [
                                                    ...form.data.experience,
                                                ];
                                                next[index] = {
                                                    ...entry,
                                                    present:
                                                        event.target.checked,
                                                    to: event.target.checked
                                                        ? ''
                                                        : entry.to,
                                                };
                                                form.setData('experience', next);
                                            }}
                                            className="size-3.5 rounded border-[#767676] accent-[#0057c8]"
                                        />
                                        {t('job_seeker.profile.present')}
                                    </label>
                                    <label className="block text-xs font-semibold text-[#4a5565]">
                                        {t('job_seeker.profile.description')}
                                        <textarea
                                            className="mt-1.5 min-h-[74px] w-full rounded-lg border border-[#e8d5e8] px-3 py-2 text-base text-[#050315] outline-none transition focus:border-[#0057c8] focus:ring-[3px] focus:ring-[#0057c8]/15"
                                            value={entry.description}
                                            onChange={(event) => {
                                                const next = [
                                                    ...form.data.experience,
                                                ];
                                                next[index] = {
                                                    ...entry,
                                                    description:
                                                        event.target.value,
                                                };
                                                form.setData('experience', next);
                                            }}
                                        />
                                    </label>
                                </div>
                            )}
                        />
                    ) : (
                        <TimelineList
                            items={profile.experience}
                            empty={t('job_seeker.profile.no_experience')}
                            accent="orange"
                            titleKeys={['title', 'role']}
                            subtitleKeys={['company']}
                            metaKeys={['dates', 'years']}
                            bodyKeys={['description']}
                        />
                    )}
                </SectionCard>

                <SectionCard
                    id="skills"
                    title={t('job_seeker.profile.skills')}
                    emoji="⚡"
                    complete={completeMap.skills ?? false}
                    editing={editing === 'skills'}
                    onEdit={() => startEditing('skills')}
                    onCancel={cancelEditing}
                    onSave={save}
                    processing={form.processing}
                >
                    {editing === 'skills' ? (
                        <ChipListEditor
                            label={t('job_seeker.profile.skills')}
                            items={form.data.skills}
                            addLabel={t('job_seeker.profile.add_skill')}
                            emptyLabel={t('job_seeker.profile.no_skills')}
                            placeholder={t('job_seeker.profile.skill_placeholder')}
                            onChange={(items) => form.setData('skills', items)}
                        />
                    ) : (
                        <div className="flex flex-wrap gap-2">
                            {(profile.skills ?? []).length === 0 ? (
                                <p className="text-sm text-[#99a1af]">
                                    {t('job_seeker.profile.no_skills')}
                                </p>
                            ) : (
                                profile.skills.map((skill) => (
                                    <span
                                        key={skill}
                                        className="rounded-full bg-[#eeeffe] px-3 py-1 text-xs font-semibold text-[#0057c8]"
                                    >
                                        {skill}
                                    </span>
                                ))
                            )}
                        </div>
                    )}
                </SectionCard>

                <SectionCard
                    id="languages"
                    title={t('job_seeker.profile.languages')}
                    emoji="🌐"
                    complete={completeMap.languages ?? false}
                    editing={editing === 'languages'}
                    onEdit={() => startEditing('languages')}
                    onCancel={cancelEditing}
                    onSave={save}
                    processing={form.processing}
                >
                    {editing === 'languages' ? (
                        <div className="space-y-3">
                            {form.data.languages.length === 0 ? (
                                <p className="text-sm text-[#99a1af]">
                                    {t('job_seeker.profile.no_languages')}
                                </p>
                            ) : (
                                form.data.languages.map((entry, index) => (
                                    <div
                                        key={index}
                                        className="flex items-center gap-4 rounded-xl bg-[#f8fafc] p-3"
                                    >
                                        <span
                                            className="shrink-0 text-xl leading-7"
                                            aria-hidden
                                        >
                                            🌐
                                        </span>
                                        <input
                                            value={entry.name}
                                            onChange={(event) => {
                                                const next = [
                                                    ...form.data.languages,
                                                ];
                                                next[index] = {
                                                    ...entry,
                                                    name: event.target.value,
                                                };
                                                form.setData('languages', next);
                                            }}
                                            placeholder={t(
                                                'job_seeker.profile.language_placeholder',
                                            )}
                                            className="h-[42px] min-w-0 flex-1 rounded-lg border border-[#e8d5e8] bg-white px-3 text-base text-[#050315] outline-none transition placeholder:text-[rgba(5,3,21,0.5)] focus:border-[#0057c8] focus:ring-[3px] focus:ring-[#0057c8]/15"
                                        />
                                        <NativeSelect
                                            variant="compact"
                                            wrapperClassName="w-[152px] shrink-0"
                                            className="h-[42px] border-[#e8d5e8] bg-white text-base"
                                            value={
                                                entry.level === ''
                                                    ? 'Native'
                                                    : entry.level
                                            }
                                            onChange={(event) => {
                                                const next = [
                                                    ...form.data.languages,
                                                ];
                                                next[index] = {
                                                    ...entry,
                                                    level: event.target.value,
                                                };
                                                form.setData('languages', next);
                                            }}
                                            aria-label={t(
                                                'job_seeker.profile.proficiency',
                                            )}
                                        >
                                            {entry.level !== '' &&
                                                !isKnownLanguageLevel(
                                                    entry.level,
                                                ) ? (
                                                <option value={entry.level}>
                                                    {languageLevelLabel(
                                                        t,
                                                        entry.level,
                                                    )}
                                                </option>
                                            ) : null}
                                            {languageLevels.map((level) => (
                                                <option
                                                    key={level}
                                                    value={level}
                                                >
                                                    {languageLevelLabel(
                                                        t,
                                                        level,
                                                    )}
                                                </option>
                                            ))}
                                        </NativeSelect>
                                        <button
                                            type="button"
                                            className="shrink-0 px-1 text-base leading-6 text-[#fb2c36]"
                                            aria-label={t(
                                                'job_seeker.profile.remove_language',
                                                {
                                                    name:
                                                        entry.name ||
                                                        t(
                                                            'job_seeker.profile.language_fallback',
                                                        ),
                                                },
                                            )}
                                            onClick={() =>
                                                form.setData(
                                                    'languages',
                                                    form.data.languages.filter(
                                                        (_, itemIndex) =>
                                                            itemIndex !== index,
                                                    ),
                                                )
                                            }
                                        >
                                            ×
                                        </button>
                                    </div>
                                ))
                            )}
                            <button
                                type="button"
                                className="text-sm font-semibold text-[#0057c8]"
                                onClick={() =>
                                    form.setData('languages', [
                                        ...form.data.languages,
                                        emptyLanguage(),
                                    ])
                                }
                            >
                                {t('job_seeker.profile.add_language')}
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {(profile.languages ?? []).length === 0 ? (
                                <p className="text-sm text-[#99a1af]">
                                    {t('job_seeker.profile.no_languages')}
                                </p>
                            ) : (
                                profile.languages.map((item, index) => {
                                    const name =
                                        fieldString(item, 'name', 'language') ||
                                        (typeof item === 'string' ? item : '—');
                                    const level = fieldString(item, 'level');

                                    return (
                                        <div
                                            key={`${name}-${index}`}
                                            className="flex items-center justify-between rounded-xl border border-[#f1f5f9] px-3 py-2"
                                        >
                                            <span className="text-sm font-semibold text-[#050315]">
                                                {name}
                                            </span>
                                            {level ? (
                                                <span className="rounded-full bg-[#dcfce7] px-2.5 py-0.5 text-xs font-semibold text-[#15803d]">
                                                    {languageLevelLabel(
                                                        t,
                                                        level,
                                                    )}
                                                </span>
                                            ) : null}
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    )}
                </SectionCard>

                <SectionCard
                    id="certifications"
                    title={t('job_seeker.profile.certifications')}
                    emoji="🏅"
                    complete={completeMap.certifications ?? false}
                    editing={editing === 'certifications'}
                    onEdit={() => startEditing('certifications')}
                    onCancel={cancelEditing}
                    onSave={save}
                    processing={form.processing}
                >
                    {editing === 'certifications' ? (
                        <EntryEditor
                            entries={form.data.certifications}
                            emptyLabel={t('job_seeker.profile.no_certifications')}
                            addLabel={t('job_seeker.profile.add_certification')}
                            onAdd={() =>
                                form.setData('certifications', [
                                    ...form.data.certifications,
                                    emptyCertification(),
                                ])
                            }
                            onRemove={(index) =>
                                form.setData(
                                    'certifications',
                                    form.data.certifications.filter(
                                        (_, itemIndex) => itemIndex !== index,
                                    ),
                                )
                            }
                            renderFields={(entry, index) => (
                                <div className="grid gap-3 md:grid-cols-2">
                                    <Field
                                        label={t('job_seeker.profile.certification')}
                                        value={entry.name}
                                        onChange={(value) => {
                                            const next = [
                                                ...form.data.certifications,
                                            ];
                                            next[index] = {
                                                ...entry,
                                                name: value,
                                            };
                                            form.setData(
                                                'certifications',
                                                next,
                                            );
                                        }}
                                    />
                                    <Field
                                        label={t('job_seeker.profile.issuer')}
                                        value={entry.issuer}
                                        onChange={(value) => {
                                            const next = [
                                                ...form.data.certifications,
                                            ];
                                            next[index] = {
                                                ...entry,
                                                issuer: value,
                                            };
                                            form.setData(
                                                'certifications',
                                                next,
                                            );
                                        }}
                                    />
                                    <Field
                                        label={t('job_seeker.profile.date')}
                                        value={entry.date}
                                        onChange={(value) => {
                                            const next = [
                                                ...form.data.certifications,
                                            ];
                                            next[index] = {
                                                ...entry,
                                                date: value,
                                            };
                                            form.setData(
                                                'certifications',
                                                next,
                                            );
                                        }}
                                        hint={t('job_seeker.profile.date_hint')}
                                    />
                                </div>
                            )}
                        />
                    ) : (
                        <div className="space-y-3">
                            {(profile.certifications ?? []).length === 0 ? (
                                <p className="text-sm text-[#99a1af]">
                                    {t('job_seeker.profile.no_certifications')}
                                </p>
                            ) : (
                                profile.certifications.map((item, index) => {
                                    const name =
                                        fieldString(item, 'name', 'title') ||
                                        (typeof item === 'string'
                                            ? item
                                            : '—');
                                    const issuer = fieldString(
                                        item,
                                        'issuer',
                                        'org',
                                    );
                                    const date = fieldString(
                                        item,
                                        'date',
                                        'year',
                                    );

                                    return (
                                        <div
                                            key={`${name}-${index}`}
                                            className="flex items-start gap-3"
                                        >
                                            <div className="flex size-9 items-center justify-center rounded-lg bg-[#eff6ff] text-[#0057c8]">
                                                <Award className="size-4" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold text-[#050315]">
                                                    {name}
                                                </p>
                                                <p className="text-xs text-[#64748b]">
                                                    {[issuer, date]
                                                        .filter(Boolean)
                                                        .join(' · ') || '—'}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    )}
                </SectionCard>

                <SectionCard
                    id="resume"
                    title={t('job_seeker.profile.resume')}
                    emoji="📄"
                    complete={completeMap.resume ?? false}
                    editing={false}
                    onEdit={() => undefined}
                    onCancel={() => undefined}
                    onSave={() => undefined}
                    processing={false}
                    hideEdit
                >
                    <ResumeUploader
                        resumeName={profile.resume_name}
                        resumeStatus={profile.resume_status}
                        resumeUrl={profile.resume_url}
                    />
                </SectionCard>
            </div>
        </JobSeekerLayout>
    );
}

function ResumeUploader({
    resumeName,
    resumeStatus,
    resumeUrl,
}: {
    resumeName: string | null;
    resumeStatus: string | null;
    resumeUrl: string | null;
}) {
    const { t } = useLocale();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const resumeForm = useForm<{ resume: File | null }>({
        resume: null,
    });

    const hasResume = resumeUrl !== null && resumeName !== null;

    const pickFile = (): void => {
        fileInputRef.current?.click();
    };

    return (
        <div className="space-y-3">
            {resumeForm.errors.resume ? (
                <p className="text-sm text-[#b91c1c]">{resumeForm.errors.resume}</p>
            ) : null}

            <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                className="hidden"
                onChange={(event) => {
                    const file = event.target.files?.[0] ?? null;

                    if (!file) {
                        return;
                    }

                    resumeForm.setData('resume', file);
                    resumeForm.post(uploadResume.url(), {
                        forceFormData: true,
                        preserveScroll: true,
                        onFinish: () => {
                            resumeForm.setData('resume', null);

                            if (fileInputRef.current) {
                                fileInputRef.current.value = '';
                            }
                        },
                    });
                }}
            />

            {hasResume ? (
                <div className="flex flex-col gap-3 rounded-xl border border-[#e2e8f0] p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex min-w-0 items-center gap-3">
                        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#fee2e2] text-sm font-bold text-[#fb2c36]">
                            {t('job_seeker.profile.pdf')}
                        </div>
                        <div className="min-w-0">
                            <p className="truncate text-base font-semibold text-[#101828]">
                                {resumeName}
                            </p>
                            <p className="text-xs text-[#99a1af]">
                                {translatedOrRaw(
                                    t,
                                    `job_seeker.profile.resume_status.${(resumeStatus ?? 'uploaded').toLowerCase()}`,
                                    resumeStatus ||
                                        t(
                                            'job_seeker.profile.resume_status.uploaded',
                                        ),
                                )}
                            </p>
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <a
                            href={resumeUrl}
                            className="inline-flex items-center justify-center rounded-lg border border-[#0057c8] px-3 py-1.5 text-xs font-semibold text-[#0057c8]"
                        >
                            {t('job_seeker.profile.download')}
                        </a>
                        <button
                            type="button"
                            disabled={resumeForm.processing}
                            onClick={pickFile}
                            className="inline-flex items-center justify-center rounded-lg bg-[#0057c8] px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60"
                        >
                            {resumeForm.processing
                                ? t('job_seeker.profile.uploading')
                                : t('job_seeker.profile.replace')}
                        </button>
                        <button
                            type="button"
                            className="inline-flex items-center justify-center rounded-lg px-3 py-1.5 text-xs font-semibold text-[#fb2c36]"
                            onClick={() =>
                                router.delete(destroyResume.url(), {
                                    preserveScroll: true,
                                })
                            }
                        >
                            {t('job_seeker.profile.remove')}
                        </button>
                    </div>
                </div>
            ) : null}

            <button
                type="button"
                disabled={resumeForm.processing}
                onClick={pickFile}
                className="flex w-full flex-col items-center rounded-xl border-2 border-dashed border-[#cbd5e1] bg-[#f8fafc] px-8 py-8 text-center transition hover:border-[#0057c8]/40 disabled:opacity-60"
            >
                <FileUp className="size-8 text-[#64748b]" />
                <p className="mt-2 text-base font-semibold text-[#364153]">
                    {t('job_seeker.profile.upload_resume')}
                </p>
                <p className="mt-1 text-sm text-[#99a1af]">
                    {t('job_seeker.profile.resume_hint')}
                </p>
            </button>
        </div>
    );
}

function SectionCard({
    id,
    title,
    emoji,
    complete,
    onEdit,
    onCancel,
    onSave,
    processing,
    hideEdit = false,
    children,
    editing,
}: {
    id: SectionId;
    title: string;
    emoji: string;
    complete: boolean;
    editing: boolean;
    onEdit: () => void;
    onCancel: () => void;
    onSave: () => void;
    processing: boolean;
    hideEdit?: boolean;
    children: ReactNode;
}) {
    const { t } = useLocale();

    return (
        <section
            id={`section-${id}`}
            className="scroll-mt-24 overflow-hidden rounded-2xl border border-[#e2e8f0] bg-white shadow-[0px_1px_1.5px_rgba(0,0,0,0.05)]"
        >
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#f1f5f9] px-5 py-5">
                <div className="flex items-center gap-3">
                    <span className="text-xl leading-7" aria-hidden>
                        {emoji}
                    </span>
                    <h2 className="text-base font-bold text-[#101828]">
                        {title}
                    </h2>
                    <span
                        className={cn(
                            'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold',
                            complete
                                ? 'bg-[#dcfce7] text-[#15803d]'
                                : 'bg-[#fef2f2] text-[#b91c1c]',
                        )}
                    >
                        {complete ? '✓' : '!'}
                    </span>
                </div>
                {!hideEdit &&
                    (editing ? (
                        <div className="flex gap-2">
                            <button
                                type="button"
                                disabled={processing}
                                className="rounded-lg bg-[#0057c8] px-4 py-1.5 text-sm font-semibold text-white disabled:opacity-60"
                                onClick={onSave}
                            >
                                {processing
                                    ? t('job_seeker.profile.saving')
                                    : t('job_seeker.profile.save')}
                            </button>
                            <button
                                type="button"
                                className="rounded-lg border border-[#0057c8] px-4 py-1.5 text-sm font-normal text-[#0057c8]"
                                onClick={onCancel}
                            >
                                {t('job_seeker.profile.cancel')}
                            </button>
                        </div>
                    ) : (
                        <button
                            type="button"
                            className="inline-flex items-center gap-1.5 rounded-lg border border-[#bfdbfe] px-3 py-1.5 text-sm font-semibold text-[#0057c8]"
                            onClick={onEdit}
                        >
                            <Pencil className="size-3.5" />
                            {t('job_seeker.profile.edit')}
                        </button>
                    ))}
            </div>
            <div className="p-5">{children}</div>
        </section>
    );
}

function Field({
    label,
    value,
    onChange,
    hint,
    placeholder,
}: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    hint?: string;
    placeholder?: string;
}) {
    return (
        <label className="block text-xs font-semibold text-[#4a5565]">
            {label}
            <input
                className="mt-1.5 h-[42px] w-full rounded-lg border border-[#e8d5e8] px-3 text-base text-[#050315] outline-none transition placeholder:text-[rgba(5,3,21,0.5)] focus:border-[#0057c8] focus:ring-[3px] focus:ring-[#0057c8]/15"
                value={value}
                placeholder={placeholder}
                onChange={(event) => onChange(event.target.value)}
            />
            {hint ? (
                <span className="mt-1 block text-[11px] font-normal text-[#99a1af]">
                    {hint}
                </span>
            ) : null}
        </label>
    );
}

function ReadOnlyField({
    label,
    value,
}: {
    label: string;
    value: string | null | undefined;
}) {
    return (
        <div>
            <p className="text-xs font-semibold text-[#4a5565]">{label}</p>
            <p className="pt-1 text-base font-medium text-[#050315]">
                {value && value !== '' ? value : '—'}
            </p>
        </div>
    );
}

function ChipListEditor({
    label,
    items,
    addLabel,
    emptyLabel,
    placeholder,
    onChange,
}: {
    label: string;
    items: string[];
    addLabel: string;
    emptyLabel: string;
    placeholder: string;
    onChange: (items: string[]) => void;
}) {
    const { t } = useLocale();
    const [draft, setDraft] = useState('');

    const addItem = (): void => {
        const next = draft.trim();

        if (next === '') {
            return;
        }

        const exists = items.some(
            (item) => item.toLowerCase() === next.toLowerCase(),
        );

        if (!exists) {
            onChange([...items, next]);
        }

        setDraft('');
    };

    return (
        <div className="space-y-3">
            <p className="text-xs font-semibold text-[#64748b]">{label}</p>
            {items.length === 0 ? (
                <p className="text-sm text-[#99a1af]">{emptyLabel}</p>
            ) : (
                <div className="flex flex-wrap gap-2">
                    {items.map((item) => (
                        <span
                            key={item}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-[#dbeafe] px-3 py-1.5 text-sm font-semibold text-[#1d4ed8]"
                        >
                            {item}
                            <button
                                type="button"
                                className="rounded-full p-0.5 text-[#64748b] hover:bg-white/70 hover:text-[#b91c1c]"
                                aria-label={t('job_seeker.profile.remove_item', {
                                    name: item,
                                })}
                                onClick={() =>
                                    onChange(
                                        items.filter(
                                            (skill) => skill !== item,
                                        ),
                                    )
                                }
                            >
                                <X className="size-3" strokeWidth={3} />
                            </button>
                        </span>
                    ))}
                </div>
            )}
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <input
                    className="w-full rounded-lg border border-[#e8d5e8] px-3 py-2 text-base text-[#050315] outline-none transition focus:border-[#0057c8] focus:ring-[3px] focus:ring-[#0057c8]/15 sm:flex-1"
                    value={draft}
                    placeholder={placeholder}
                    onChange={(event) => setDraft(event.target.value)}
                    onKeyDown={(event) => {
                        if (event.key === 'Enter') {
                            event.preventDefault();
                            addItem();
                        }
                    }}
                />
                <button
                    type="button"
                    className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-[#bfdbfe] px-3 py-2 text-xs font-semibold text-[#0057c8]"
                    onClick={addItem}
                >
                    <Plus className="size-3.5" />
                    {addLabel}
                </button>
            </div>
        </div>
    );
}

function EntryEditor<T>({
    entries,
    emptyLabel,
    addLabel,
    onAdd,
    onRemove,
    renderFields,
    accent = 'blue',
}: {
    entries: T[];
    emptyLabel: string;
    addLabel: string;
    onAdd: () => void;
    onRemove: (index: number) => void;
    renderFields: (entry: T, index: number) => ReactNode;
    accent?: 'blue' | 'orange';
}) {
    const { t } = useLocale();

    return (
        <div className="space-y-5">
            {entries.length === 0 ? (
                <p className="text-sm text-[#99a1af]">{emptyLabel}</p>
            ) : (
                entries.map((entry, index) => (
                    <div
                        key={index}
                        className={cn(
                            'relative border-l-2 pl-5',
                            accent === 'blue'
                                ? 'border-[#e3eff7]'
                                : 'border-[#fde68a]',
                        )}
                    >
                        <span
                            className={cn(
                                'absolute top-0 -left-[7px] size-3 rounded-full',
                                accent === 'blue'
                                    ? 'bg-[#0057c8]'
                                    : 'bg-[#f59e0b]',
                            )}
                        />
                        {renderFields(entry, index)}
                        <button
                            type="button"
                            className="mt-3 text-sm font-semibold text-[#fb2c36]"
                            onClick={() => onRemove(index)}
                        >
                            {t('job_seeker.profile.delete')}
                        </button>
                    </div>
                ))
            )}
            <button
                type="button"
                className="text-sm font-semibold text-[#0057c8]"
                onClick={onAdd}
            >
                {addLabel}
            </button>
        </div>
    );
}

function TimelineList({
    items,
    empty,
    accent,
    titleKeys,
    subtitleKeys,
    metaKeys,
    bodyKeys = [],
}: {
    items: unknown[];
    empty: string;
    accent: 'blue' | 'orange';
    titleKeys: string[];
    subtitleKeys: string[];
    metaKeys: string[];
    bodyKeys?: string[];
}) {
    if (items.length === 0) {
        return <p className="text-sm text-[#99a1af]">{empty}</p>;
    }

    return (
        <ol className="space-y-4">
            {items.map((item, index) => {
                const title =
                    fieldString(item, ...titleKeys) ||
                    (typeof item === 'string' ? item : '—');
                const subtitle = fieldString(item, ...subtitleKeys);
                const meta = fieldString(item, ...metaKeys);
                const body = fieldString(item, ...bodyKeys);

                return (
                    <li key={`${title}-${index}`} className="flex gap-3">
                        <div className="flex flex-col items-center">
                            <span
                                className={cn(
                                    'size-3 rounded-full',
                                    accent === 'blue'
                                        ? 'bg-[#0057c8]'
                                        : 'bg-[#e57124]',
                                )}
                            />
                            {index < items.length - 1 ? (
                                <span className="mt-1 h-full w-0.5 bg-[#e2e8f0]" />
                            ) : null}
                        </div>
                        <div className="min-w-0 pb-1">
                            <p className="text-sm font-semibold text-[#050315]">
                                {title}
                            </p>
                            {subtitle ? (
                                <p className="text-sm text-[#64748b]">
                                    {subtitle}
                                </p>
                            ) : null}
                            {meta ? (
                                <p className="text-xs text-[#99a1af]">{meta}</p>
                            ) : null}
                            {body ? (
                                <p className="pt-1 text-sm text-[#374151]">
                                    {body}
                                </p>
                            ) : null}
                        </div>
                    </li>
                );
            })}
        </ol>
    );
}
