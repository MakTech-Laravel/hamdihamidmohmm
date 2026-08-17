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
    Trash2,
    UserRound,
    X,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

import {
    destroyResume,
    downloadResume,
    update as updateProfile,
    uploadResume,
} from '@/actions/App/Http/Controllers/Backend/User/JobSeekerProfileController';
import { getInitials } from '@/components/job-seeker/demo-data';
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
    years: string;
};

type ExperienceEntry = {
    title: string;
    company: string;
    dates: string;
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

const sectionMeta: Array<{
    id: SectionId;
    label: string;
    icon: typeof UserRound;
    tone: string;
}> = [
        {
            id: 'personal',
            label: 'Personal Information',
            icon: UserRound,
            tone: 'bg-[#dcfce7] text-[#15803d]',
        },
        {
            id: 'professional',
            label: 'Professional Information',
            icon: Briefcase,
            tone: 'bg-[#ffedd5] text-[#c2410c]',
        },
        {
            id: 'education',
            label: 'Education',
            icon: GraduationCap,
            tone: 'bg-[#dbeafe] text-[#1d4ed8]',
        },
        {
            id: 'experience',
            label: 'Work Experience',
            icon: Briefcase,
            tone: 'bg-[#ffedd5] text-[#c2410c]',
        },
        {
            id: 'skills',
            label: 'Skills',
            icon: Sparkles,
            tone: 'bg-[#dbeafe] text-[#1d4ed8]',
        },
        {
            id: 'languages',
            label: 'Languages',
            icon: Languages,
            tone: 'bg-[#dcfce7] text-[#15803d]',
        },
        {
            id: 'certifications',
            label: 'Certifications',
            icon: Award,
            tone: 'bg-[#fee2e2] text-[#b91c1c]',
        },
        {
            id: 'resume',
            label: 'Resume & Documents',
            icon: Download,
            tone: 'bg-[#dcfce7] text-[#15803d]',
        },
    ];

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

function splitList(value: string | string[]): string[] {
    if (Array.isArray(value)) {
        return value.filter(
            (item): item is string => typeof item === 'string' && item.trim() !== '',
        );
    }

    return value
        .split(/[\n,]+/)
        .map((item) => item.trim())
        .filter(Boolean);
}

function normalizeEducation(items: unknown[]): EducationEntry[] {
    return items.map((item) => ({
        degree: fieldString(item, 'degree', 'title'),
        school: fieldString(item, 'school', 'institution'),
        years: fieldString(item, 'years', 'dates'),
    }));
}

function normalizeExperience(items: unknown[]): ExperienceEntry[] {
    return items.map((item) => ({
        title: fieldString(item, 'title', 'role'),
        company: fieldString(item, 'company'),
        dates: fieldString(item, 'dates'),
        years: fieldString(item, 'years'),
        description: fieldString(item, 'description'),
    }));
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
    return { degree: '', school: '', years: '' };
}

function emptyExperience(): ExperienceEntry {
    return {
        title: '',
        company: '',
        dates: '',
        years: '',
        description: '',
    };
}

function emptyLanguage(): LanguageEntry {
    return { name: '', level: '' };
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
        availability: (profile.availability ?? []).join(', '),
        skills: [...(profile.skills ?? [])],
        education: normalizeEducation(profile.education ?? []),
        experience: normalizeExperience(profile.experience ?? []),
        languages: normalizeLanguages(profile.languages ?? []),
        certifications: normalizeCertifications(profile.certifications ?? []),
    };
}

function cleanEducation(entries: EducationEntry[]): EducationEntry[] {
    return entries
        .map((entry) => ({
            degree: entry.degree.trim(),
            school: entry.school.trim(),
            years: entry.years.trim(),
        }))
        .filter((entry) => entry.degree || entry.school || entry.years);
}

function cleanExperience(entries: ExperienceEntry[]): Array<
    Omit<ExperienceEntry, 'years'> & { years?: number }
> {
    return entries
        .map((entry) => {
            const yearsRaw = entry.years.trim();
            const yearsNumber = Number(yearsRaw);

            return {
                title: entry.title.trim(),
                company: entry.company.trim(),
                dates: entry.dates.trim(),
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
            availability: splitList(data.availability),
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
        <JobSeekerLayout title="My Profile">
            <Head title="My Profile" />

            <div className="space-y-6 p-6">
                {flash.success && (
                    <div className="rounded-xl border border-[#bbf7d0] bg-[#f0fdf4] px-4 py-3 text-sm text-[#15803d]">
                        {typeof flash.success === 'string'
                            ? flash.success
                            : 'Saved successfully.'}
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
                            {getInitials(profile.name || 'JS')}
                        </div>
                        <div className="min-w-0 flex-1">
                            <h1 className="text-2xl font-extrabold">
                                {profile.name || 'Job Seeker'}
                            </h1>
                            <p className="pt-1 text-sm text-[#bfdbfe]">
                                {profile.headline || 'Add a professional headline'}
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
                                        {profile.completion}% Profile Completion
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
                                {section.label}
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
                    title="Personal Information"
                    complete={completeMap.personal ?? false}
                    editing={editing === 'personal'}
                    onEdit={() => startEditing('personal')}
                    onCancel={cancelEditing}
                    onSave={save}
                    processing={form.processing}
                >
                    {editing === 'personal' ? (
                        <div className="grid gap-3 md:grid-cols-2">
                            <Field
                                label="Full Name"
                                value={form.data.name}
                                onChange={(value) => form.setData('name', value)}
                            />
                            <Field
                                label="Professional Headline"
                                value={form.data.headline}
                                onChange={(value) =>
                                    form.setData('headline', value)
                                }
                            />
                            <Field
                                label="Location"
                                value={form.data.location}
                                onChange={(value) =>
                                    form.setData('location', value)
                                }
                            />
                            <ReadOnlyField
                                label="Email Address"
                                value={profile.email || '—'}
                            />
                            <Field
                                label="Phone Number"
                                value={form.data.phone}
                                onChange={(value) => form.setData('phone', value)}
                            />
                            <Field
                                label="LinkedIn Profile"
                                value={form.data.linkedin_url}
                                onChange={(value) =>
                                    form.setData('linkedin_url', value)
                                }
                            />
                            <Field
                                label="GitHub Profile"
                                value={form.data.github_url}
                                onChange={(value) =>
                                    form.setData('github_url', value)
                                }
                            />
                            <div className="md:col-span-2">
                                <label className="text-xs font-semibold text-[#64748b]">
                                    Bio
                                    <textarea
                                        className="mt-1 min-h-24 w-full rounded-xl border border-[#e2e8f0] px-3 py-2 text-sm text-[#050315]"
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
                            <ReadOnlyField label="Full Name" value={profile.name} />
                            <ReadOnlyField
                                label="Professional Headline"
                                value={profile.headline}
                            />
                            <ReadOnlyField
                                label="Location"
                                value={profile.location}
                            />
                            <ReadOnlyField
                                label="Email Address"
                                value={profile.email}
                            />
                            <ReadOnlyField
                                label="Phone Number"
                                value={profile.phone}
                            />
                            <ReadOnlyField
                                label="LinkedIn Profile"
                                value={profile.linkedin_url}
                            />
                            <ReadOnlyField
                                label="GitHub Profile"
                                value={profile.github_url}
                            />
                            <div className="md:col-span-2">
                                <ReadOnlyField label="Bio" value={profile.bio} />
                            </div>
                        </div>
                    )}
                </SectionCard>

                <SectionCard
                    id="professional"
                    title="Professional Information"
                    complete={completeMap.professional ?? false}
                    editing={editing === 'professional'}
                    onEdit={() => startEditing('professional')}
                    onCancel={cancelEditing}
                    onSave={save}
                    processing={form.processing}
                >
                    {editing === 'professional' ? (
                        <div className="grid gap-3 md:grid-cols-2">
                            <Field
                                label="Current Job Title"
                                value={form.data.current_title}
                                onChange={(value) =>
                                    form.setData('current_title', value)
                                }
                            />
                            <Field
                                label="Years of Experience"
                                value={form.data.experience_years}
                                onChange={(value) =>
                                    form.setData('experience_years', value)
                                }
                                hint="e.g. 5 or 5 years"
                            />
                            <Field
                                label="Industry"
                                value={form.data.industry}
                                onChange={(value) =>
                                    form.setData('industry', value)
                                }
                            />
                            <Field
                                label="Expected Salary"
                                value={form.data.expected_salary}
                                onChange={(value) =>
                                    form.setData('expected_salary', value)
                                }
                            />
                            <div className="md:col-span-2">
                                <Field
                                    label="Available For"
                                    value={form.data.availability}
                                    onChange={(value) =>
                                        form.setData('availability', value)
                                    }
                                    hint="Comma-separated, e.g. Full Time, Remote"
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="grid gap-4 md:grid-cols-2">
                            <ReadOnlyField
                                label="Current Job Title"
                                value={profile.current_title}
                            />
                            <ReadOnlyField
                                label="Years of Experience"
                                value={profile.experience_years_label}
                            />
                            <ReadOnlyField
                                label="Industry"
                                value={profile.industry}
                            />
                            <ReadOnlyField
                                label="Expected Salary"
                                value={profile.expected_salary}
                            />
                            <div className="md:col-span-2">
                                <p className="text-xs font-semibold text-[#64748b]">
                                    Available For
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
                                                className="rounded-full bg-[#dbeafe] px-2.5 py-1 text-xs font-semibold text-[#1d4ed8]"
                                            >
                                                {item}
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
                    title="Education"
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
                            emptyLabel="No education added yet."
                            addLabel="Add education"
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
                                        label="Degree"
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
                                        label="School"
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
                                        label="Years"
                                        value={entry.years}
                                        onChange={(value) => {
                                            const next = [
                                                ...form.data.education,
                                            ];
                                            next[index] = {
                                                ...entry,
                                                years: value,
                                            };
                                            form.setData('education', next);
                                        }}
                                        hint="e.g. 2015 - 2019"
                                    />
                                </div>
                            )}
                        />
                    ) : (
                        <TimelineList
                            items={profile.education}
                            empty="No education added yet."
                            accent="blue"
                            titleKeys={['degree', 'title']}
                            subtitleKeys={['school', 'institution']}
                            metaKeys={['years', 'dates']}
                        />
                    )}
                </SectionCard>

                <SectionCard
                    id="experience"
                    title="Work Experience"
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
                            emptyLabel="No work experience added yet."
                            addLabel="Add experience"
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
                                <div className="grid gap-3 md:grid-cols-2">
                                    <Field
                                        label="Job Title"
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
                                        label="Company"
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
                                        label="Dates"
                                        value={entry.dates}
                                        onChange={(value) => {
                                            const next = [
                                                ...form.data.experience,
                                            ];
                                            next[index] = {
                                                ...entry,
                                                dates: value,
                                            };
                                            form.setData('experience', next);
                                        }}
                                        hint="e.g. 2021 - Present"
                                    />
                                    <Field
                                        label="Years (number)"
                                        value={entry.years}
                                        onChange={(value) => {
                                            const next = [
                                                ...form.data.experience,
                                            ];
                                            next[index] = {
                                                ...entry,
                                                years: value,
                                            };
                                            form.setData('experience', next);
                                        }}
                                        hint="Used for Years of Experience total"
                                    />
                                    <div className="md:col-span-2">
                                        <label className="text-xs font-semibold text-[#64748b]">
                                            Description
                                            <textarea
                                                className="mt-1 min-h-20 w-full rounded-xl border border-[#e2e8f0] px-3 py-2 text-sm text-[#050315]"
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
                                                    form.setData(
                                                        'experience',
                                                        next,
                                                    );
                                                }}
                                            />
                                        </label>
                                    </div>
                                </div>
                            )}
                        />
                    ) : (
                        <TimelineList
                            items={profile.experience}
                            empty="No work experience added yet."
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
                    title="Skills"
                    complete={completeMap.skills ?? false}
                    editing={editing === 'skills'}
                    onEdit={() => startEditing('skills')}
                    onCancel={cancelEditing}
                    onSave={save}
                    processing={form.processing}
                >
                    {editing === 'skills' ? (
                        <ChipListEditor
                            label="Skills"
                            items={form.data.skills}
                            addLabel="Add skill"
                            emptyLabel="No skills listed."
                            placeholder="e.g. React"
                            onChange={(items) => form.setData('skills', items)}
                        />
                    ) : (
                        <div className="flex flex-wrap gap-2">
                            {(profile.skills ?? []).length === 0 ? (
                                <p className="text-sm text-[#99a1af]">
                                    No skills listed.
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
                    title="Languages"
                    complete={completeMap.languages ?? false}
                    editing={editing === 'languages'}
                    onEdit={() => startEditing('languages')}
                    onCancel={cancelEditing}
                    onSave={save}
                    processing={form.processing}
                >
                    {editing === 'languages' ? (
                        <EntryEditor
                            entries={form.data.languages}
                            emptyLabel="No languages listed."
                            addLabel="Add language"
                            onAdd={() =>
                                form.setData('languages', [
                                    ...form.data.languages,
                                    emptyLanguage(),
                                ])
                            }
                            onRemove={(index) =>
                                form.setData(
                                    'languages',
                                    form.data.languages.filter(
                                        (_, itemIndex) => itemIndex !== index,
                                    ),
                                )
                            }
                            renderFields={(entry, index) => (
                                <div className="grid gap-3 md:grid-cols-2">
                                    <Field
                                        label="Language"
                                        value={entry.name}
                                        onChange={(value) => {
                                            const next = [
                                                ...form.data.languages,
                                            ];
                                            next[index] = {
                                                ...entry,
                                                name: value,
                                            };
                                            form.setData('languages', next);
                                        }}
                                    />
                                    <Field
                                        label="Level"
                                        value={entry.level}
                                        onChange={(value) => {
                                            const next = [
                                                ...form.data.languages,
                                            ];
                                            next[index] = {
                                                ...entry,
                                                level: value,
                                            };
                                            form.setData('languages', next);
                                        }}
                                        hint="e.g. Native, Advanced"
                                    />
                                </div>
                            )}
                        />
                    ) : (
                        <div className="space-y-2">
                            {(profile.languages ?? []).length === 0 ? (
                                <p className="text-sm text-[#99a1af]">
                                    No languages listed.
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
                                                    {level}
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
                    title="Certifications"
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
                            emptyLabel="No certifications added yet."
                            addLabel="Add certification"
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
                                        label="Certification"
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
                                        label="Issuer"
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
                                        label="Date"
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
                                        hint="e.g. 2024-03"
                                    />
                                </div>
                            )}
                        />
                    ) : (
                        <div className="space-y-3">
                            {(profile.certifications ?? []).length === 0 ? (
                                <p className="text-sm text-[#99a1af]">
                                    No certifications added yet.
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
                    title="Resume & Documents"
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
    const fileInputRef = useRef<HTMLInputElement>(null);
    const resumeForm = useForm<{ resume: File | null }>({
        resume: null,
    });

    const hasResume = resumeUrl !== null && resumeName !== null;

    return (
        <div className="space-y-4">
            <div className="flex flex-col gap-3 rounded-xl border border-[#e2e8f0] bg-[#f8faff] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                    <p className="text-sm font-semibold text-[#050315]">
                        Resume status
                    </p>
                    <p className="truncate text-xs text-[#64748b]">
                        {hasResume
                            ? resumeName
                            : 'Upload a PDF, DOC, or DOCX resume (max 5MB).'}
                    </p>
                </div>
                <span
                    className={cn(
                        'shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold',
                        hasResume
                            ? 'bg-[#dcfce7] text-[#15803d]'
                            : 'bg-[#dbeafe] text-[#1d4ed8]',
                    )}
                >
                    {hasResume ? resumeStatus || 'Uploaded' : 'Not set'}
                </span>
            </div>

            {resumeForm.errors.resume ? (
                <p className="text-sm text-[#b91c1c]">{resumeForm.errors.resume}</p>
            ) : null}

            <div className="flex flex-wrap gap-2">
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
                <button
                    type="button"
                    disabled={resumeForm.processing}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-[#0057c8] px-3 py-2 text-xs font-semibold text-white disabled:opacity-60"
                    onClick={() => fileInputRef.current?.click()}
                >
                    <FileUp className="size-3.5" />
                    {resumeForm.processing
                        ? 'Uploading…'
                        : hasResume
                            ? 'Replace resume'
                            : 'Upload resume'}
                </button>
                {hasResume ? (
                    <>
                        <a
                            href={downloadResume.url()}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-[#bfdbfe] px-3 py-2 text-xs font-semibold text-[#0057c8]"
                        >
                            <Download className="size-3.5" />
                            Download
                        </a>
                        <button
                            type="button"
                            className="inline-flex items-center gap-1.5 rounded-lg border border-[#fecaca] px-3 py-2 text-xs font-semibold text-[#b91c1c]"
                            onClick={() =>
                                router.delete(destroyResume.url(), {
                                    preserveScroll: true,
                                })
                            }
                        >
                            <Trash2 className="size-3.5" />
                            Remove
                        </button>
                    </>
                ) : null}
            </div>
        </div>
    );
}

function SectionCard({
    id,
    title,
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
    complete: boolean;
    editing: boolean;
    onEdit: () => void;
    onCancel: () => void;
    onSave: () => void;
    processing: boolean;
    hideEdit?: boolean;
    children: ReactNode;
}) {
    return (
        <section
            id={`section-${id}`}
            className="scroll-mt-24 rounded-2xl border border-[#e2e8f0] bg-white p-5 shadow-[0px_1px_3px_rgba(0,0,0,0.06)]"
        >
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-[#050315]">
                        {title}
                    </h2>
                    <span
                        className={cn(
                            'inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-bold',
                            complete
                                ? 'bg-[#dcfce7] text-[#15803d]'
                                : 'bg-[#fee2e2] text-[#b91c1c]',
                        )}
                    >
                        {complete ? (
                            <Check className="mr-1 size-3" strokeWidth={3} />
                        ) : (
                            <X className="mr-1 size-3" strokeWidth={3} />
                        )}
                        {complete ? 'Complete' : 'Incomplete'}
                    </span>
                </div>
                {!hideEdit &&
                    (editing ? (
                        <div className="flex gap-2">
                            <button
                                type="button"
                                className="rounded-lg border border-[#e2e8f0] px-3 py-1.5 text-xs font-semibold text-[#64748b]"
                                onClick={onCancel}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                disabled={processing}
                                className="rounded-lg bg-[#0057c8] px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60"
                                onClick={onSave}
                            >
                                {processing ? 'Saving…' : 'Save'}
                            </button>
                        </div>
                    ) : (
                        <button
                            type="button"
                            className="inline-flex items-center gap-1.5 rounded-lg border border-[#bfdbfe] px-3 py-1.5 text-xs font-semibold text-[#0057c8]"
                            onClick={onEdit}
                        >
                            <Pencil className="size-3.5" />
                            Edit
                        </button>
                    ))}
            </div>
            {children}
        </section>
    );
}

function Field({
    label,
    value,
    onChange,
    hint,
}: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    hint?: string;
}) {
    return (
        <label className="text-xs font-semibold text-[#64748b]">
            {label}
            <input
                className="mt-1 w-full rounded-xl border border-[#e2e8f0] px-3 py-2 text-sm text-[#050315]"
                value={value}
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
            <p className="text-xs font-semibold text-[#64748b]">{label}</p>
            <p className="pt-1 text-sm font-medium text-[#050315]">
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
                            className="inline-flex items-center gap-1.5 rounded-full bg-[#eeeffe] px-3 py-1 text-xs font-semibold text-[#0057c8]"
                        >
                            {item}
                            <button
                                type="button"
                                className="rounded-full p-0.5 text-[#64748b] hover:bg-white/70 hover:text-[#b91c1c]"
                                aria-label={`Remove ${item}`}
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
                    className="w-full rounded-xl border border-[#e2e8f0] px-3 py-2 text-sm text-[#050315] sm:flex-1"
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
}: {
    entries: T[];
    emptyLabel: string;
    addLabel: string;
    onAdd: () => void;
    onRemove: (index: number) => void;
    renderFields: (entry: T, index: number) => ReactNode;
}) {
    return (
        <div className="space-y-4">
            {entries.length === 0 ? (
                <p className="text-sm text-[#99a1af]">{emptyLabel}</p>
            ) : (
                entries.map((entry, index) => (
                    <div
                        key={index}
                        className="rounded-xl border border-[#e2e8f0] bg-[#f8faff] p-4"
                    >
                        <div className="mb-3 flex items-center justify-between gap-2">
                            <p className="text-xs font-bold text-[#64748b]">
                                Entry {index + 1}
                            </p>
                            <button
                                type="button"
                                className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-[#b91c1c]"
                                onClick={() => onRemove(index)}
                            >
                                <Trash2 className="size-3.5" />
                                Remove
                            </button>
                        </div>
                        {renderFields(entry, index)}
                    </div>
                ))
            )}
            <button
                type="button"
                className="inline-flex items-center gap-1.5 rounded-lg border border-[#bfdbfe] px-3 py-1.5 text-xs font-semibold text-[#0057c8]"
                onClick={onAdd}
            >
                <Plus className="size-3.5" />
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
