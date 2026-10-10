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
    Users,
    X,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState, type ChangeEvent, type ReactNode } from 'react';

import {
    destroyCertificationDocument,
    destroyCv,
    destroyHighestDegree,
    destroyOtherDocument,
    destroyPhoto,
    storeCv,
    update as updateProfile,
    updateCv,
    uploadCertificationDocument,
    uploadHighestDegree,
    uploadOtherDocument,
    uploadPhoto,
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

type CertificationAttachment = {
    file_path: string | null;
    file_name: string | null;
    file_url: string | null;
};

type CertificationEntry = {
    name: string;
    issuer: string;
    date: string;
    attachments: CertificationAttachment[];
    file_path: string | null;
    file_name: string | null;
    file_url: string | null;
};

type ReferenceEntry = {
    name: string;
    address: string;
    relationship: string;
};

type Profile = {
    name: string | null;
    email: string | null;
    phone: string | null;
    location: string | null;
    photo_url: string | null;
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
    references: unknown[];
    resume_status: string | null;
    resume_name: string | null;
    resume_url: string | null;
    cvs: Array<{
        id: number;
        label: string;
        file_name: string | null;
        is_default: boolean;
        download_url: string;
    }>;
    cover_letter_name?: string | null;
    cover_letter_url?: string | null;
    highest_degree_name: string | null;
    highest_degree_url: string | null;
    other_document_name: string | null;
    other_document_url: string | null;
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
    | 'references'
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

const presetLanguages = ['English', 'Arabic', 'French'] as const;
const OTHER_LANGUAGE = '__other__';

function isKnownLanguageLevel(
    value: string,
): value is (typeof languageLevels)[number] {
    return (languageLevels as readonly string[]).includes(value);
}

function isPresetLanguage(
    value: string,
): value is (typeof presetLanguages)[number] {
    return (presetLanguages as readonly string[]).includes(value);
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
            id: 'references',
            labelKey: 'job_seeker.profile.references',
            icon: Users,
            emoji: '🤝',
            tone: 'bg-[#e0e7ff] text-[#3730a3]',
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

function normalizeReferences(items: unknown[]): ReferenceEntry[] {
    return items.map((item) => ({
        name:
            fieldString(item, 'name') ||
            (typeof item === 'string' ? item : ''),
        address: fieldString(item, 'address'),
        relationship: fieldString(item, 'relationship', 'relation'),
    }));
}

function normalizeCertifications(items: unknown[]): CertificationEntry[] {
    return items.map((item) => {
        const record = asRecord(item);
        const attachmentsFromArray = Array.isArray(record?.attachments)
            ? record.attachments
                .map((attachment) => {
                    const file = asRecord(attachment);

                    if (!file) {
                        return null;
                    }

                    return {
                        file_path:
                            typeof file.file_path === 'string'
                                ? file.file_path
                                : null,
                        file_name:
                            typeof file.file_name === 'string'
                                ? file.file_name
                                : null,
                        file_url:
                            typeof file.file_url === 'string'
                                ? file.file_url
                                : null,
                    } satisfies CertificationAttachment;
                })
                .filter((attachment): attachment is CertificationAttachment =>
                    Boolean(attachment?.file_path || attachment?.file_name),
                )
            : [];

        const legacyAttachment =
            attachmentsFromArray.length === 0 &&
                (typeof record?.file_path === 'string' ||
                    typeof record?.file_name === 'string')
                ? [
                    {
                        file_path:
                            typeof record?.file_path === 'string'
                                ? record.file_path
                                : null,
                        file_name:
                            typeof record?.file_name === 'string'
                                ? record.file_name
                                : null,
                        file_url:
                            typeof record?.file_url === 'string'
                                ? record.file_url
                                : null,
                    } satisfies CertificationAttachment,
                ]
                : [];

        const attachments =
            attachmentsFromArray.length > 0
                ? attachmentsFromArray
                : legacyAttachment;

        return {
            name:
                fieldString(item, 'name', 'title') ||
                (typeof item === 'string' ? item : ''),
            issuer: fieldString(item, 'issuer', 'org'),
            date: fieldString(item, 'date', 'year'),
            attachments,
            file_path: attachments[0]?.file_path ?? null,
            file_name: attachments[0]?.file_name ?? null,
            file_url: attachments[0]?.file_url ?? null,
        };
    });
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
    return {
        name: '',
        issuer: '',
        date: '',
        attachments: [],
        file_path: null,
        file_name: null,
        file_url: null,
    };
}

function emptyReference(): ReferenceEntry {
    return {
        name: '',
        address: '',
        relationship: '',
    };
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
        references: normalizeReferences(profile.references ?? []),
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
): Array<{
    name: string;
    issuer: string;
    date: string;
    attachments?: Array<{ file_path: string; file_name?: string }>;
}> {
    return entries
        .map((entry) => {
            const attachments = entry.attachments
                .filter((file) => Boolean(file.file_path))
                .map((file) => ({
                    file_path: file.file_path as string,
                    file_name: file.file_name ?? undefined,
                }));

            const cleaned: {
                name: string;
                issuer: string;
                date: string;
                attachments?: Array<{ file_path: string; file_name?: string }>;
            } = {
                name: entry.name.trim(),
                issuer: entry.issuer.trim(),
                date: entry.date.trim(),
            };

            if (attachments.length > 0) {
                cleaned.attachments = attachments;
            }

            return cleaned;
        })
        .filter(
            (entry) =>
                entry.name ||
                entry.issuer ||
                entry.date ||
                (entry.attachments?.length ?? 0) > 0,
        );
}

function cleanReferences(entries: ReferenceEntry[]): ReferenceEntry[] {
    return entries
        .map((entry) => ({
            name: entry.name.trim(),
            address: entry.address.trim(),
            relationship: entry.relationship.trim(),
        }))
        .filter(
            (entry) => entry.name || entry.address || entry.relationship,
        );
}

type ProfileFormData = ReturnType<typeof profileToFormData>;

type ProfileDraft = ProfileFormData & {
    section: SectionId;
    savedAt: string;
};

const editableSections: SectionId[] = [
    'personal',
    'professional',
    'education',
    'experience',
    'skills',
    'languages',
    'certifications',
    'references',
];

function isEditableSection(value: unknown): value is SectionId {
    return (
        typeof value === 'string' &&
        (editableSections as string[]).includes(value)
    );
}

function emptyProfileFormData(): ProfileFormData {
    return {
        name: '',
        phone: '',
        location: '',
        headline: '',
        current_title: '',
        experience_years: '',
        bio: '',
        linkedin_url: '',
        github_url: '',
        industry: '',
        expected_salary: '',
        availability: [],
        skills: [],
        education: [],
        experience: [],
        languages: [],
        certifications: [],
        references: [],
    };
}

function readProfileDraft(key: string): ProfileDraft | null {
    if (typeof window === 'undefined') {
        return null;
    }

    try {
        const raw = window.localStorage.getItem(key);

        if (!raw) {
            return null;
        }

        const parsed = JSON.parse(raw) as Partial<ProfileDraft>;

        if (!isEditableSection(parsed.section)) {
            return null;
        }

        return {
            ...emptyProfileFormData(),
            ...parsed,
            section: parsed.section,
            savedAt:
                typeof parsed.savedAt === 'string'
                    ? parsed.savedAt
                    : new Date().toISOString(),
        };
    } catch {
        return null;
    }
}

function writeProfileDraft(key: string, draft: ProfileDraft): void {
    if (typeof window === 'undefined') {
        return;
    }

    window.localStorage.setItem(key, JSON.stringify(draft));
}

function clearProfileDraft(key: string): void {
    if (typeof window === 'undefined') {
        return;
    }

    try {
        window.localStorage.removeItem(key);
    } catch {
        // ignore
    }
}

function buildProfilePayload(data: ProfileFormData) {
    return {
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
        skills: data.skills.map((skill) => skill.trim()).filter(Boolean),
        education: cleanEducation(data.education),
        experience: cleanExperience(data.experience),
        languages: cleanLanguages(data.languages),
        certifications: cleanCertifications(data.certifications),
        references: cleanReferences(data.references),
    };
}

function draftFormData(draft: ProfileDraft): ProfileFormData {
    const { section: _section, savedAt: _savedAt, ...data } = draft;

    return data;
}

export default function JobSeekerProfile({ profile }: { profile: Profile }) {
    const { flash, auth } = usePage<SharedData>().props;
    const { t } = useLocale();
    const [editing, setEditing] = useState<SectionId | null>(null);
    const [autosaveNote, setAutosaveNote] = useState<string | null>(null);
    const [pendingDraft, setPendingDraft] = useState<ProfileDraft | null>(null);
    const draftKey = `job-seeker-profile-draft:${auth.user?.id ?? 'guest'}`;
    const skipNextLocalAutosave = useRef(false);
    const lastServerPayload = useRef(
        JSON.stringify(buildProfilePayload(profileToFormData(profile))),
    );
    const lastAttemptedServerPayload = useRef<string | null>(null);
    const restoredForEdit = useRef<SectionId | null>(null);

    const form = useForm(profileToFormData(profile));

    useEffect(() => {
        const draft = readProfileDraft(draftKey);
        setPendingDraft(draft);
    }, [draftKey]);

    useEffect(() => {
        if (editing === null) {
            form.setData(profileToFormData(profile));
            form.clearErrors();
            lastServerPayload.current = JSON.stringify(
                buildProfilePayload(profileToFormData(profile)),
            );

            return;
        }

        if (editing === 'certifications') {
            form.setData(
                'certifications',
                normalizeCertifications(profile.certifications ?? []),
            );
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps -- sync when server profile refreshes
    }, [profile, editing]);

    useEffect(() => {
        if (editing === null || restoredForEdit.current === editing) {
            return;
        }

        const draft = readProfileDraft(draftKey);

        if (!draft) {
            restoredForEdit.current = editing;

            return;
        }

        skipNextLocalAutosave.current = true;
        form.setData({
            ...profileToFormData(profile),
            ...draftFormData(draft),
        });
        restoredForEdit.current = editing;
        setPendingDraft(null);
        setAutosaveNote(t('job_seeker.profile.restore_draft'));
        window.setTimeout(() => setAutosaveNote(null), 3000);
        // eslint-disable-next-line react-hooks/exhaustive-deps -- restore once when entering edit mode
    }, [editing, draftKey]);

    useEffect(() => {
        if (typeof window === 'undefined' || editing === null) {
            return;
        }

        if (skipNextLocalAutosave.current) {
            skipNextLocalAutosave.current = false;

            return;
        }

        const timer = window.setTimeout(() => {
            try {
                const draft: ProfileDraft = {
                    ...form.data,
                    section: editing,
                    savedAt: new Date().toISOString(),
                };
                writeProfileDraft(draftKey, draft);
                setPendingDraft(draft);
                setAutosaveNote(t('job_seeker.profile.autosaved'));
                window.setTimeout(() => setAutosaveNote(null), 2000);
            } catch {
                // Quota / private mode.
            }
        }, 800);

        return () => window.clearTimeout(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps -- debounce on form data while editing
    }, [form.data, editing, draftKey]);

    useEffect(() => {
        // Certifications keep a separate upload flow; avoid clobbering in-progress edits.
        if (
            editing === null ||
            editing === 'certifications' ||
            form.processing
        ) {
            return;
        }

        const payload = buildProfilePayload(form.data);
        const payloadJson = JSON.stringify(payload);

        if (
            payloadJson === lastServerPayload.current ||
            payloadJson === lastAttemptedServerPayload.current
        ) {
            return;
        }

        const timer = window.setTimeout(() => {
            lastAttemptedServerPayload.current = payloadJson;
            form.transform(() => payload);
            form.put(updateProfile.url(), {
                preserveScroll: true,
                preserveState: true,
                onSuccess: () => {
                    lastServerPayload.current = payloadJson;
                    lastAttemptedServerPayload.current = null;
                    clearProfileDraft(draftKey);
                    setPendingDraft(null);
                    setAutosaveNote(t('job_seeker.profile.autosaved_server'));
                    window.setTimeout(() => setAutosaveNote(null), 2500);
                },
            });
        }, 2500);

        return () => window.clearTimeout(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps -- silent server autosave while editing
    }, [form.data, editing, form.processing, draftKey]);

    useEffect(() => {
        if (editing === null || typeof window === 'undefined') {
            return;
        }

        const onBeforeUnload = (event: BeforeUnloadEvent): void => {
            event.preventDefault();
            event.returnValue = '';
        };

        window.addEventListener('beforeunload', onBeforeUnload);

        return () => window.removeEventListener('beforeunload', onBeforeUnload);
    }, [editing]);

    const completeMap = useMemo(() => {
        return Object.fromEntries(
            profile.checklist.map((item) => [item.id, item.complete]),
        ) as Record<string, boolean>;
    }, [profile.checklist]);

    const startEditing = (section: SectionId): void => {
        restoredForEdit.current = null;
        form.setData(profileToFormData(profile));
        form.clearErrors();
        setEditing(section);
    };

    const resumeDraft = (): void => {
        const draft = pendingDraft ?? readProfileDraft(draftKey);

        if (!draft) {
            return;
        }

        restoredForEdit.current = draft.section;
        skipNextLocalAutosave.current = true;
        form.setData({
            ...profileToFormData(profile),
            ...draftFormData(draft),
        });
        form.clearErrors();
        setEditing(draft.section);
        setPendingDraft(null);
        setAutosaveNote(t('job_seeker.profile.restore_draft'));
        window.setTimeout(() => setAutosaveNote(null), 3000);
    };

    const discardDraft = (): void => {
        clearProfileDraft(draftKey);
        setPendingDraft(null);
        setAutosaveNote(t('job_seeker.profile.draft_discarded'));
        window.setTimeout(() => setAutosaveNote(null), 2000);
    };

    const cancelEditing = (): void => {
        form.setData(profileToFormData(profile));
        form.clearErrors();
        setEditing(null);
        restoredForEdit.current = null;
        clearProfileDraft(draftKey);
        setPendingDraft(null);
    };

    const save = (): void => {
        const payload = buildProfilePayload(form.data);
        form.transform(() => payload);

        form.put(updateProfile.url(), {
            preserveScroll: true,
            onSuccess: () => {
                lastServerPayload.current = JSON.stringify(payload);
                setEditing(null);
                restoredForEdit.current = null;
                clearProfileDraft(draftKey);
                setPendingDraft(null);
            },
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

                {pendingDraft && editing === null ? (
                    <div className="flex flex-col gap-3 rounded-xl border border-[#fde68a] bg-[#fffbeb] px-4 py-3 text-sm text-[#92400e] sm:flex-row sm:items-center sm:justify-between">
                        <p>{t('job_seeker.profile.draft_found')}</p>
                        <div className="flex flex-wrap gap-2">
                            <button
                                type="button"
                                onClick={resumeDraft}
                                className="rounded-lg bg-[#0057c8] px-3 py-1.5 text-sm font-semibold text-white"
                            >
                                {t('job_seeker.profile.resume_draft')}
                            </button>
                            <button
                                type="button"
                                onClick={discardDraft}
                                className="rounded-lg border border-[#d97706] px-3 py-1.5 text-sm font-semibold text-[#92400e]"
                            >
                                {t('job_seeker.profile.discard_draft')}
                            </button>
                        </div>
                    </div>
                ) : null}

                {autosaveNote ? (
                    <div className="rounded-xl border border-[#dbeafe] bg-[#eff6ff] px-4 py-3 text-sm text-[#1e3a8a]">
                        {autosaveNote}
                    </div>
                ) : null}

                {Object.keys(form.errors).length > 0 && (
                    <div className="rounded-xl border border-[#fecaca] bg-[#fef2f2] px-4 py-3 text-sm text-[#b91c1c]">
                        {Object.values(form.errors)[0]}
                    </div>
                )}

                <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-[#0057c8] to-[#3977a6] p-6 text-white shadow-[0px_4px_10px_rgba(30,58,138,0.2)]">
                    <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                        <ProfileAvatar
                            photoUrl={profile.photo_url}
                            name={
                                profile.name ||
                                t('job_seeker.profile.fallback_name')
                            }
                            sizeClassName="size-[88px] text-2xl"
                            fallbackClassName="bg-white/15 text-white ring-2 ring-white/30"
                        />
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
                            <div className="md:col-span-2">
                                <ProfilePhotoUploader
                                    photoUrl={profile.photo_url}
                                    name={profile.name}
                                />
                            </div>
                            <Field
                                label={t('job_seeker.profile.full_name')}
                                value={form.data.name}
                                onChange={(value) => form.setData('name', value)}
                                required
                                error={form.errors.name}
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
                                required
                                error={form.errors.phone}
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
                            <div className="md:col-span-2">
                                <ProfilePhotoUploader
                                    photoUrl={profile.photo_url}
                                    name={profile.name}
                                    readOnly
                                />
                            </div>
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
                                        className="flex flex-wrap items-center gap-3 rounded-xl bg-[#f8fafc] p-3"
                                    >
                                        <span
                                            className="shrink-0 text-xl leading-7"
                                            aria-hidden
                                        >
                                            🌐
                                        </span>
                                        <NativeSelect
                                            variant="compact"
                                            wrapperClassName="min-w-[140px] flex-1"
                                            className="h-[42px] border-[#e8d5e8] bg-white text-base"
                                            value={
                                                isPresetLanguage(entry.name)
                                                    ? entry.name
                                                    : entry.name === ''
                                                        ? ''
                                                        : OTHER_LANGUAGE
                                            }
                                            onChange={(event) => {
                                                const next = [
                                                    ...form.data.languages,
                                                ];
                                                const selected =
                                                    event.target.value;

                                                next[index] = {
                                                    ...entry,
                                                    name:
                                                        selected ===
                                                            OTHER_LANGUAGE
                                                            ? isPresetLanguage(
                                                                entry.name,
                                                            ) ||
                                                                entry.name === ''
                                                                ? ''
                                                                : entry.name
                                                            : selected,
                                                };
                                                form.setData('languages', next);
                                            }}
                                            aria-label={t(
                                                'job_seeker.profile.language_placeholder',
                                            )}
                                        >
                                            <option value="" disabled>
                                                {t(
                                                    'job_seeker.profile.language_placeholder',
                                                )}
                                            </option>
                                            {presetLanguages.map((language) => (
                                                <option
                                                    key={language}
                                                    value={language}
                                                >
                                                    {t(
                                                        `job_seeker.profile.language_name.${language.toLowerCase()}`,
                                                    )}
                                                </option>
                                            ))}
                                            <option value={OTHER_LANGUAGE}>
                                                {t(
                                                    'job_seeker.profile.language_name.other',
                                                )}
                                            </option>
                                        </NativeSelect>
                                        {!isPresetLanguage(entry.name) ? (
                                            <input
                                                value={entry.name}
                                                onChange={(event) => {
                                                    const next = [
                                                        ...form.data.languages,
                                                    ];
                                                    next[index] = {
                                                        ...entry,
                                                        name: event.target
                                                            .value,
                                                    };
                                                    form.setData(
                                                        'languages',
                                                        next,
                                                    );
                                                }}
                                                placeholder={t(
                                                    'job_seeker.profile.language_other_placeholder',
                                                )}
                                                className="h-[42px] min-w-[140px] flex-1 rounded-lg border border-[#e8d5e8] bg-white px-3 text-base text-[#050315] outline-none transition placeholder:text-[rgba(5,3,21,0.5)] focus:border-[#0057c8] focus:ring-[3px] focus:ring-[#0057c8]/15"
                                            />
                                        ) : null}
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
                                    <div className="md:col-span-2">
                                        <CertificationFileUploader
                                            index={index}
                                            entry={entry}
                                        />
                                    </div>
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
                                    const record = asRecord(item);
                                    const attachments = Array.isArray(
                                        record?.attachments,
                                    )
                                        ? record.attachments
                                        : record?.file_name
                                            ? [
                                                {
                                                    file_name: record.file_name,
                                                    file_url: record.file_url,
                                                },
                                            ]
                                            : [];

                                    return (
                                        <div
                                            key={`${name}-${index}`}
                                            className="flex items-start gap-3"
                                        >
                                            <div className="flex size-9 items-center justify-center rounded-lg bg-[#eff6ff] text-[#0057c8]">
                                                <Award className="size-4" />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="text-sm font-semibold text-[#050315]">
                                                    {name}
                                                </p>
                                                <p className="text-xs text-[#64748b]">
                                                    {[issuer, date]
                                                        .filter(Boolean)
                                                        .join(' · ') || '—'}
                                                </p>
                                                {attachments.length > 0 ? (
                                                    <div className="mt-2 space-y-1.5">
                                                        {attachments.map(
                                                            (
                                                                file,
                                                                fileIndex,
                                                            ) => {
                                                                const fileRecord =
                                                                    asRecord(
                                                                        file,
                                                                    );
                                                                const fileName =
                                                                    typeof fileRecord?.file_name ===
                                                                        'string'
                                                                        ? fileRecord.file_name
                                                                        : null;
                                                                const fileUrl =
                                                                    typeof fileRecord?.file_url ===
                                                                        'string'
                                                                        ? fileRecord.file_url
                                                                        : null;

                                                                if (!fileName) {
                                                                    return null;
                                                                }

                                                                return (
                                                                    <div
                                                                        key={`${fileName}-${fileIndex}`}
                                                                        className="flex flex-wrap items-center gap-2"
                                                                    >
                                                                        <span className="text-xs font-medium text-[#0057c8]">
                                                                            {
                                                                                fileName
                                                                            }
                                                                        </span>
                                                                        {fileUrl ? (
                                                                            <a
                                                                                href={
                                                                                    fileUrl
                                                                                }
                                                                                className="inline-flex items-center gap-1 text-xs font-semibold text-[#0057c8]"
                                                                            >
                                                                                <Download className="size-3.5" />
                                                                                {t(
                                                                                    'job_seeker.profile.download',
                                                                                )}
                                                                            </a>
                                                                        ) : null}
                                                                    </div>
                                                                );
                                                            },
                                                        )}
                                                    </div>
                                                ) : null}
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    )}
                </SectionCard>

                <SectionCard
                    id="references"
                    title={t('job_seeker.profile.references')}
                    emoji="🤝"
                    complete={completeMap.references ?? true}
                    editing={editing === 'references'}
                    onEdit={() => startEditing('references')}
                    onCancel={cancelEditing}
                    onSave={save}
                    processing={form.processing}
                >
                    {editing === 'references' ? (
                        <div className="space-y-3">
                            <p className="text-sm text-[#64748b]">
                                {t('job_seeker.profile.references_optional_help')}
                            </p>
                            <EntryEditor
                                entries={form.data.references}
                                emptyLabel={t('job_seeker.profile.no_references')}
                                addLabel={t('job_seeker.profile.add_reference')}
                                onAdd={() =>
                                    form.setData('references', [
                                        ...form.data.references,
                                        emptyReference(),
                                    ])
                                }
                                onRemove={(index) =>
                                    form.setData(
                                        'references',
                                        form.data.references.filter(
                                            (_, itemIndex) => itemIndex !== index,
                                        ),
                                    )
                                }
                                renderFields={(entry, index) => (
                                    <div className="grid gap-3 md:grid-cols-2">
                                        <Field
                                            label={t(
                                                'job_seeker.profile.reference_name',
                                            )}
                                            value={entry.name}
                                            onChange={(value) => {
                                                const next = [
                                                    ...form.data.references,
                                                ];
                                                next[index] = {
                                                    ...entry,
                                                    name: value,
                                                };
                                                form.setData('references', next);
                                            }}
                                        />
                                        <Field
                                            label={t(
                                                'job_seeker.profile.reference_relationship',
                                            )}
                                            value={entry.relationship}
                                            onChange={(value) => {
                                                const next = [
                                                    ...form.data.references,
                                                ];
                                                next[index] = {
                                                    ...entry,
                                                    relationship: value,
                                                };
                                                form.setData('references', next);
                                            }}
                                            placeholder={t(
                                                'job_seeker.profile.reference_relationship_placeholder',
                                            )}
                                        />
                                        <div className="md:col-span-2">
                                            <Field
                                                label={t(
                                                    'job_seeker.profile.reference_address',
                                                )}
                                                value={entry.address}
                                                onChange={(value) => {
                                                    const next = [
                                                        ...form.data.references,
                                                    ];
                                                    next[index] = {
                                                        ...entry,
                                                        address: value,
                                                    };
                                                    form.setData(
                                                        'references',
                                                        next,
                                                    );
                                                }}
                                            />
                                        </div>
                                    </div>
                                )}
                            />
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {(profile.references ?? []).length === 0 ? (
                                <p className="text-sm text-[#99a1af]">
                                    {t('job_seeker.profile.no_references')}
                                </p>
                            ) : (
                                profile.references.map((item, index) => {
                                    const name =
                                        fieldString(item, 'name') ||
                                        (typeof item === 'string'
                                            ? item
                                            : '—');
                                    const address = fieldString(item, 'address');
                                    const relationship = fieldString(
                                        item,
                                        'relationship',
                                        'relation',
                                    );

                                    return (
                                        <div
                                            key={`${name}-${index}`}
                                            className="flex items-start gap-3"
                                        >
                                            <div className="flex size-9 items-center justify-center rounded-lg bg-[#eef2ff] text-[#3730a3]">
                                                <Users className="size-4" />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="text-sm font-semibold text-[#050315]">
                                                    {name}
                                                </p>
                                                <p className="text-xs text-[#64748b]">
                                                    {[relationship, address]
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
                    <ResumeDocumentsUploader
                        cvs={profile.cvs ?? []}
                        highestDegreeName={profile.highest_degree_name}
                        highestDegreeUrl={profile.highest_degree_url}
                        otherDocumentName={profile.other_document_name}
                        otherDocumentUrl={profile.other_document_url}
                    />
                </SectionCard>
            </div>
        </JobSeekerLayout>
    );
}

function ProfileAvatar({
    photoUrl,
    name,
    sizeClassName,
    fallbackClassName,
}: {
    photoUrl: string | null;
    name: string;
    sizeClassName: string;
    fallbackClassName: string;
}) {
    const [failed, setFailed] = useState(false);
    const showImage = Boolean(photoUrl) && !failed;

    if (showImage) {
        return (
            <img
                src={photoUrl!}
                alt={name}
                onError={() => setFailed(true)}
                className={cn(
                    'shrink-0 rounded-full object-cover object-top',
                    sizeClassName,
                )}
            />
        );
    }

    return (
        <div
            className={cn(
                'flex shrink-0 items-center justify-center rounded-full font-extrabold',
                sizeClassName,
                fallbackClassName,
            )}
        >
            {getInitials(name)}
        </div>
    );
}

function ProfilePhotoUploader({
    photoUrl,
    name,
    readOnly = false,
}: {
    photoUrl: string | null;
    name: string | null;
    readOnly?: boolean;
}) {
    const { t } = useLocale();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState(false);
    const displayName = name || t('job_seeker.profile.fallback_name');

    const onChange = (event: ChangeEvent<HTMLInputElement>): void => {
        const file = event.target.files?.[0];
        event.target.value = '';

        if (!file) {
            return;
        }

        const data = new FormData();
        data.append('photo', file);
        setUploading(true);
        router.post(uploadPhoto.url(), data, {
            forceFormData: true,
            preserveScroll: true,
            onFinish: () => setUploading(false),
        });
    };

    return (
        <div className="flex flex-wrap items-center gap-4 rounded-xl border border-[#e8d5e8] bg-[#f8faff] p-4">
            <ProfileAvatar
                photoUrl={photoUrl}
                name={displayName}
                sizeClassName="size-16 text-lg"
                fallbackClassName="bg-[#0057c8] text-white"
            />
            <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-[#050315]">
                    {t('job_seeker.profile.photo')}
                </p>
                <p className="text-xs text-[#64748b]">
                    {t('job_seeker.profile.photo_hint')}
                </p>
                {!readOnly ? (
                    <div className="mt-2 flex flex-wrap gap-2">
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            className="hidden"
                            onChange={onChange}
                        />
                        <button
                            type="button"
                            disabled={uploading}
                            onClick={() => fileInputRef.current?.click()}
                            className="cursor-pointer rounded-lg border border-[#0057c8] px-3 py-1.5 text-xs font-semibold text-[#0057c8]"
                        >
                            {uploading
                                ? t('job_seeker.profile.uploading')
                                : photoUrl
                                    ? t('job_seeker.profile.replace')
                                    : t('job_seeker.profile.upload_photo')}
                        </button>
                        {photoUrl ? (
                            <button
                                type="button"
                                onClick={() =>
                                    router.delete(destroyPhoto.url(), {
                                        preserveScroll: true,
                                    })
                                }
                                className="cursor-pointer rounded-lg px-3 py-1.5 text-xs font-semibold text-[#b91c1c]"
                            >
                                {t('job_seeker.profile.remove')}
                            </button>
                        ) : null}
                    </div>
                ) : null}
            </div>
        </div>
    );
}

function CertificationFileUploader({
    index,
    entry,
}: {
    index: number;
    entry: CertificationEntry;
}) {
    const { t } = useLocale();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState(false);
    const attachments = entry.attachments ?? [];
    const canAddMore = attachments.length < 5;

    const onChange = (event: ChangeEvent<HTMLInputElement>): void => {
        const file = event.target.files?.[0];
        event.target.value = '';

        if (!file) {
            return;
        }

        const data = new FormData();
        data.append('index', String(index));
        data.append('name', entry.name);
        data.append('issuer', entry.issuer);
        data.append('date', entry.date);
        data.append('document', file);
        setUploading(true);
        router.post(uploadCertificationDocument.url(), data, {
            forceFormData: true,
            preserveScroll: true,
            onFinish: () => setUploading(false),
        });
    };

    return (
        <div className="rounded-xl border border-dashed border-[#e8d5e8] bg-[#f8faff] p-3">
            <p className="text-xs font-semibold text-[#4a5565]">
                {t('job_seeker.profile.certificate_file')}
            </p>
            {attachments.length === 0 ? (
                <p className="mt-1 text-xs text-[#64748b]">
                    {t('job_seeker.profile.no_certificate_file')}
                </p>
            ) : (
                <div className="mt-2 space-y-2">
                    {attachments.map((file, attachmentIndex) => (
                        <div
                            key={`${file.file_path ?? file.file_name}-${attachmentIndex}`}
                            className="flex flex-wrap items-center gap-2 rounded-lg bg-white px-2.5 py-2"
                        >
                            <span className="min-w-0 flex-1 truncate text-xs font-medium text-[#0057c8]">
                                {file.file_name ||
                                    t('job_seeker.profile.certificate_file')}
                            </span>
                            {file.file_url ? (
                                <a
                                    href={file.file_url}
                                    className="inline-flex items-center gap-1 text-xs font-semibold text-[#374151]"
                                >
                                    <Download className="size-3.5" />
                                    {t('job_seeker.profile.download')}
                                </a>
                            ) : null}
                            <button
                                type="button"
                                onClick={() =>
                                    router.delete(
                                        destroyCertificationDocument.url(index),
                                        {
                                            preserveScroll: true,
                                            data: {
                                                attachment: attachmentIndex,
                                            },
                                        },
                                    )
                                }
                                className="cursor-pointer text-xs font-semibold text-[#b91c1c]"
                            >
                                {t('job_seeker.profile.remove')}
                            </button>
                        </div>
                    ))}
                </div>
            )}
            <p className="mt-1 text-[11px] text-[#94a3b8]">
                {t('job_seeker.profile.certificate_hint')}
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
                <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={onChange}
                />
                <button
                    type="button"
                    disabled={uploading || !canAddMore}
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-[#0057c8] px-3 py-1.5 text-xs font-semibold text-[#0057c8] disabled:cursor-not-allowed disabled:opacity-50"
                >
                    <FileUp className="size-3.5" />
                    {uploading
                        ? t('job_seeker.profile.uploading')
                        : attachments.length > 0
                            ? t('job_seeker.profile.upload_another_certificate')
                            : t('job_seeker.profile.upload_certificate')}
                </button>
            </div>
        </div>
    );
}

function ResumeDocumentsUploader({
    cvs,
    highestDegreeName,
    highestDegreeUrl,
    otherDocumentName,
    otherDocumentUrl,
}: {
    cvs: Array<{
        id: number;
        label: string;
        file_name: string | null;
        is_default: boolean;
        download_url: string;
    }>;
    highestDegreeName: string | null;
    highestDegreeUrl: string | null;
    otherDocumentName: string | null;
    otherDocumentUrl: string | null;
}) {
    const { t } = useLocale();

    return (
        <div className="max-w-xl space-y-8">
            <p className="rounded-xl border border-[#dbeafe] bg-[#eff6ff] px-3 py-2.5 text-xs leading-5 text-[#1e3a8a]">
                {t('job_seeker.profile.cover_letter_apply_hint')}
            </p>
            <MultipleCvManager cvs={cvs} />
            <ProfileDocumentField
                id="job-seeker-highest-degree-upload"
                labelKey="job_seeker.profile.resume_label_highest_degree"
                useExistingKey="job_seeker.profile.highest_degree_use_existing"
                fieldName="highest_degree"
                fileName={highestDegreeName}
                fileUrl={highestDegreeUrl}
                uploadUrl={uploadHighestDegree.url()}
                destroyUrl={destroyHighestDegree.url()}
            />
            <ProfileDocumentField
                id="job-seeker-other-document-upload"
                labelKey="job_seeker.profile.resume_label_other"
                useExistingKey="job_seeker.profile.other_document_use_existing"
                fieldName="other_document"
                fileName={otherDocumentName}
                fileUrl={otherDocumentUrl}
                uploadUrl={uploadOtherDocument.url()}
                destroyUrl={destroyOtherDocument.url()}
            />
        </div>
    );
}

function MultipleCvManager({
    cvs,
}: {
    cvs: Array<{
        id: number;
        label: string;
        file_name: string | null;
        is_default: boolean;
        download_url: string;
    }>;
}) {
    const { t } = useLocale();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [label, setLabel] = useState('');
    const [makeDefault, setMakeDefault] = useState(cvs.length === 0);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editLabel, setEditLabel] = useState('');
    const form = useForm<{
        resume: File | null;
        label: string;
        make_default: boolean;
        extract_profile: boolean;
    }>({
        resume: null,
        label: '',
        make_default: cvs.length === 0,
        extract_profile: true,
    });

    const uploadFile = (file: File): void => {
        form.setData({
            resume: file,
            label: label.trim(),
            make_default: makeDefault || cvs.length === 0,
            extract_profile: true,
        });
        form.post(storeCv.url(), {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                setLabel('');
                setMakeDefault(false);
                form.reset();
                if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                }
            },
        });
    };

    return (
        <div className="space-y-4">
            <div>
                <h3 className="text-sm font-semibold text-[#101828]">
                    {t('job_seeker.profile.cvs_title')}
                </h3>
                <p className="mt-1 text-xs leading-5 text-[#64748b]">
                    {t('job_seeker.profile.cvs_help')}
                </p>
            </div>

            {cvs.length === 0 ? (
                <p className="text-sm text-[#99a1af]">
                    {t('job_seeker.profile.no_cvs')}
                </p>
            ) : (
                <div className="space-y-3">
                    {cvs.map((cv) => (
                        <div
                            key={cv.id}
                            className="rounded-xl border border-[#e2e8f0] p-4"
                        >
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                <div className="min-w-0">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <p className="text-sm font-semibold text-[#050315]">
                                            {cv.label}
                                        </p>
                                        {cv.is_default ? (
                                            <span className="rounded-full bg-[#dcfce7] px-2 py-0.5 text-[11px] font-semibold text-[#15803d]">
                                                {t(
                                                    'job_seeker.profile.cv_default_badge',
                                                )}
                                            </span>
                                        ) : null}
                                    </div>
                                    <p className="mt-1 truncate text-xs text-[#64748b]">
                                        {cv.file_name ||
                                            t('job_seeker.profile.resume_label_cv')}
                                    </p>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    <a
                                        href={cv.download_url}
                                        className="inline-flex items-center gap-1 text-xs font-semibold text-[#0057c8]"
                                    >
                                        <Download className="size-3.5" />
                                        {t('job_seeker.profile.download')}
                                    </a>
                                    {!cv.is_default ? (
                                        <button
                                            type="button"
                                            className="text-xs font-semibold text-[#0057c8]"
                                            onClick={() =>
                                                router.put(
                                                    updateCv.url(cv.id),
                                                    { make_default: true },
                                                    { preserveScroll: true },
                                                )
                                            }
                                        >
                                            {t(
                                                'job_seeker.profile.cv_make_default',
                                            )}
                                        </button>
                                    ) : null}
                                    <button
                                        type="button"
                                        className="text-xs font-semibold text-[#475569]"
                                        onClick={() => {
                                            setEditingId(cv.id);
                                            setEditLabel(cv.label);
                                        }}
                                    >
                                        {t('job_seeker.profile.cv_rename')}
                                    </button>
                                    <button
                                        type="button"
                                        className="text-xs font-semibold text-[#b91c1c]"
                                        onClick={() =>
                                            router.delete(destroyCv.url(cv.id), {
                                                preserveScroll: true,
                                            })
                                        }
                                    >
                                        {t('job_seeker.profile.remove')}
                                    </button>
                                </div>
                            </div>
                            {editingId === cv.id ? (
                                <div className="mt-3 flex flex-wrap items-center gap-2">
                                    <input
                                        value={editLabel}
                                        onChange={(event) =>
                                            setEditLabel(event.target.value)
                                        }
                                        className="h-9 min-w-[180px] flex-1 rounded-lg border border-[#e8d5e8] px-3 text-sm"
                                        placeholder={t(
                                            'job_seeker.profile.cv_label_placeholder',
                                        )}
                                    />
                                    <button
                                        type="button"
                                        className="rounded-lg bg-[#0057c8] px-3 py-1.5 text-xs font-semibold text-white"
                                        onClick={() =>
                                            router.put(
                                                updateCv.url(cv.id),
                                                { label: editLabel },
                                                {
                                                    preserveScroll: true,
                                                    onSuccess: () =>
                                                        setEditingId(null),
                                                },
                                            )
                                        }
                                    >
                                        {t('job_seeker.profile.save')}
                                    </button>
                                    <button
                                        type="button"
                                        className="text-xs font-semibold text-[#64748b]"
                                        onClick={() => setEditingId(null)}
                                    >
                                        {t('job_seeker.profile.cancel')}
                                    </button>
                                </div>
                            ) : null}
                        </div>
                    ))}
                </div>
            )}

            <div className="space-y-2 rounded-xl border border-dashed border-[#cbd5e1] bg-[#f8faff] p-4">
                <p className="text-sm font-semibold text-[#101828]">
                    {t('job_seeker.profile.cv_add')}
                </p>
                <input
                    value={label}
                    onChange={(event) => setLabel(event.target.value)}
                    placeholder={t('job_seeker.profile.cv_label_placeholder')}
                    className="h-[42px] w-full rounded-lg border border-[#e8d5e8] bg-white px-3 text-sm"
                />
                <label className="flex items-center gap-2 text-xs text-[#475569]">
                    <input
                        type="checkbox"
                        checked={makeDefault || cvs.length === 0}
                        disabled={cvs.length === 0}
                        onChange={(event) =>
                            setMakeDefault(event.target.checked)
                        }
                        className="size-3.5 accent-[#0057c8]"
                    />
                    {t('job_seeker.profile.cv_make_default')}
                </label>
                <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    disabled={form.processing}
                    className="block w-full rounded-md border border-[#cbd5e1] bg-white px-3 py-2 text-sm text-[#364153] file:mr-3 file:rounded file:border-0 file:bg-[#f1f5f9] file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-[#101828] disabled:opacity-60"
                    onChange={(event) => {
                        const file = event.target.files?.[0] ?? null;

                        if (!file) {
                            return;
                        }

                        uploadFile(file);
                    }}
                />
                <p className="text-xs text-[#64748b]">
                    {t('job_seeker.profile.resume_hint')}
                </p>
                {form.processing ? (
                    <p className="text-sm text-[#0057c8]">
                        {t('job_seeker.profile.uploading')}
                    </p>
                ) : null}
                {form.errors.resume ? (
                    <p className="text-sm text-[#b91c1c]">{form.errors.resume}</p>
                ) : null}
            </div>
        </div>
    );
}

function ProfileDocumentField({
    id,
    labelKey,
    useExistingKey,
    fieldName,
    fileName,
    fileUrl,
    statusLabel = null,
    extractProfile = false,
    uploadUrl,
    destroyUrl,
}: {
    id: string;
    labelKey: string;
    useExistingKey: string;
    fieldName: 'resume' | 'cover_letter' | 'highest_degree' | 'other_document';
    fileName: string | null;
    fileUrl: string | null;
    statusLabel?: string | null;
    extractProfile?: boolean;
    uploadUrl: string;
    destroyUrl: string;
}) {
    const { t } = useLocale();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [selectedFileName, setSelectedFileName] = useState<string | null>(
        null,
    );
    const [uploadMode, setUploadMode] = useState<'new' | 'existing'>('new');
    const form = useForm<Record<string, File | boolean | null>>({
        [fieldName]: null,
        ...(extractProfile ? { extract_profile: true } : {}),
    });

    const hasFile = fileUrl !== null && fileName !== null;

    const uploadFile = (file: File): void => {
        setSelectedFileName(file.name);
        form.setData({
            [fieldName]: file,
            ...(extractProfile ? { extract_profile: true } : {}),
        });
        form.post(uploadUrl, {
            forceFormData: true,
            preserveScroll: true,
            onFinish: () => {
                form.setData(fieldName, null);
                setSelectedFileName(null);

                if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                }
            },
        });
    };

    return (
        <div className="space-y-4">
            <div className="space-y-2">
                <label
                    htmlFor={id}
                    className="block text-sm font-semibold text-[#101828]"
                >
                    {t(labelKey)}
                </label>

                <input
                    id={id}
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    disabled={form.processing || uploadMode === 'existing'}
                    className="block w-full rounded-md border border-[#cbd5e1] bg-white px-3 py-2 text-sm text-[#364153] file:mr-3 file:rounded file:border-0 file:bg-[#f1f5f9] file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-[#101828] disabled:cursor-not-allowed disabled:opacity-60"
                    onChange={(event) => {
                        const file = event.target.files?.[0] ?? null;

                        if (!file || uploadMode !== 'new') {
                            return;
                        }

                        uploadFile(file);
                    }}
                />

                <select
                    value={uploadMode}
                    disabled={form.processing}
                    onChange={(event) => {
                        const mode = event.target.value as 'new' | 'existing';
                        setUploadMode(mode);

                        if (mode === 'new' && fileInputRef.current) {
                            fileInputRef.current.value = '';
                            setSelectedFileName(null);
                        }
                    }}
                    className="block w-full max-w-xs rounded-md border border-[#cbd5e1] bg-white px-3 py-2 text-sm text-[#364153] disabled:opacity-60"
                >
                    <option value="new">
                        {t('job_seeker.profile.resume_upload_new')}
                    </option>
                    {hasFile ? (
                        <option value="existing">
                            {t(useExistingKey)}
                            {fileName ? ` — ${fileName}` : ''}
                        </option>
                    ) : null}
                </select>

                <p className="text-sm text-[#64748b]">
                    {t('job_seeker.profile.resume_hint')}
                </p>

                {form.processing ? (
                    <p className="text-sm text-[#0057c8]">
                        {t('job_seeker.profile.uploading')}
                        {selectedFileName ? ` — ${selectedFileName}` : ''}
                    </p>
                ) : null}

                {form.errors[fieldName] ? (
                    <p className="text-sm text-[#b91c1c]">
                        {form.errors[fieldName]}
                    </p>
                ) : null}
            </div>

            {hasFile ? (
                <div className="flex flex-col gap-3 rounded-xl border border-[#e2e8f0] p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex min-w-0 items-center gap-3">
                        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#fee2e2] text-sm font-bold text-[#fb2c36]">
                            {t('job_seeker.profile.pdf')}
                        </div>
                        <div className="min-w-0">
                            <p className="truncate text-base font-semibold text-[#101828]">
                                {fileName}
                            </p>
                            <p className="text-xs text-[#99a1af]">
                                {statusLabel
                                    ? translatedOrRaw(
                                          t,
                                          `job_seeker.profile.resume_status.${statusLabel.toLowerCase()}`,
                                          statusLabel,
                                      )
                                    : t(
                                          'job_seeker.profile.resume_status.uploaded',
                                      )}
                            </p>
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <a
                            href={fileUrl}
                            className="inline-flex items-center justify-center rounded-lg border border-[#0057c8] px-3 py-1.5 text-xs font-semibold text-[#0057c8]"
                        >
                            {t('job_seeker.profile.download')}
                        </a>
                        <button
                            type="button"
                            className="inline-flex items-center justify-center rounded-lg px-3 py-1.5 text-xs font-semibold text-[#fb2c36]"
                            onClick={() =>
                                router.delete(destroyUrl, {
                                    preserveScroll: true,
                                })
                            }
                        >
                            {t('job_seeker.profile.remove')}
                        </button>
                    </div>
                </div>
            ) : null}
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
                {!hideEdit && !editing ? (
                    <button
                        type="button"
                        className="inline-flex items-center gap-1.5 rounded-lg border border-[#bfdbfe] px-3 py-1.5 text-sm font-semibold text-[#0057c8]"
                        onClick={onEdit}
                    >
                        <Pencil className="size-3.5" />
                        {t('job_seeker.profile.edit')}
                    </button>
                ) : null}
            </div>
            <div className="p-5">{children}</div>
            {!hideEdit && editing ? (
                <div className="flex flex-wrap items-center justify-end gap-2 border-t border-[#f1f5f9] px-5 py-4">
                    <button
                        type="button"
                        className="rounded-lg border border-[#0057c8] px-4 py-1.5 text-sm font-normal text-[#0057c8]"
                        onClick={onCancel}
                    >
                        {t('job_seeker.profile.cancel')}
                    </button>
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
                </div>
            ) : null}
        </section>
    );
}

function Field({
    label,
    value,
    onChange,
    hint,
    placeholder,
    required = false,
    error,
}: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    hint?: string;
    placeholder?: string;
    required?: boolean;
    error?: string;
}) {
    return (
        <label className="block text-xs font-semibold text-[#4a5565]">
            {label}
            {required ? <span className="text-[#dc2626]"> *</span> : null}
            <input
                required={required}
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
            {error ? (
                <span className="mt-1 block text-[11px] font-normal text-[#dc2626]">
                    {error}
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
