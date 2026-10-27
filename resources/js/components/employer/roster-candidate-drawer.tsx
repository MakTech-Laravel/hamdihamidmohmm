import {
    CalendarDays,
    Download,
    ExternalLink,
    Mail,
    MapPin,
    Phone,
    X,
} from 'lucide-react';
import { useState, type ReactNode } from 'react';

import { getInitials } from '@/components/employer/demo-data';
import {
    Sheet,
    SheetClose,
    SheetContent,
    SheetDescription,
    SheetTitle,
} from '@/components/ui/sheet';
import { useLocale } from '@/hooks/use-locale';
import { cn } from '@/lib/utils';

export type RosterProfileEntry = {
    title: string;
    subtitle: string | null;
    meta: string | null;
    body: string | null;
};

export type RosterTimelineStep = {
    label: string;
    date: string | null;
    state: 'done' | 'current' | 'pending' | string;
};

export type RosterCandidatePreview = {
    name: string;
    title: string;
    status?: string | null;
    status_value?: string | null;
    email: string;
    phone: string;
    location: string;
    current_title: string | null;
    gender?: string | null;
    experience_years: string | null;
    industry: string | null;
    expected_salary: string | null;
    availability: string[];
    bio: string | null;
    linkedin_url: string | null;
    github_url: string | null;
    skills: string[];
    education: RosterProfileEntry[];
    experience: RosterProfileEntry[];
    languages: Array<{ name: string; level: string | null }>;
    certifications: Array<{
        name: string;
        issuer: string | null;
        date: string | null;
        attachments?: Array<{
            file_name: string;
            download_url: string | null;
        }>;
    }>;
    references?: Array<{
        name: string;
        address: string | null;
        relationship: string | null;
    }>;
    cover_letter: string | null;
    question_answers?: Array<{
        id: string;
        prompt: string;
        type: string;
        required: boolean;
        answer: string | null;
    }>;
    resume_name: string | null;
    resume_url: string | null;
    highest_degree_name?: string | null;
    highest_degree_url?: string | null;
    other_document_name?: string | null;
    other_document_url?: string | null;
    cover_letter_file_name?: string | null;
    cover_letter_file_url?: string | null;
    avatar_url?: string | null;
    timeline: RosterTimelineStep[];
    job?: string | null;
    job_id?: number | null;
};

export type RosterApplicationSummary = {
    id: number;
    job: string | null;
    job_id: number | null;
    status: string | null;
    status_value: string | null;
    date: string | null;
    applications_url: string;
};

export type RosterCandidateDrawerEntry = {
    id: number;
    category: string;
    comments: string | null;
    added_by: string | null;
    created_at: string | null;
    applications: RosterApplicationSummary[];
    candidate: RosterCandidatePreview | null;
};

export function RosterCandidateDrawer({
    open,
    onOpenChange,
    entry,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    entry: RosterCandidateDrawerEntry | null;
}) {
    const { t } = useLocale();

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent
                side="right"
                showCloseButton={false}
                overlayClassName="bg-[rgba(5,3,21,0.4)]"
                className="w-[420px] gap-0 border-0 p-0 shadow-[-4px_0px_24px_0px_rgba(5,3,21,0.15)] sm:max-w-[420px]"
            >
                {entry?.candidate ? (
                    <RosterDrawerBody
                        key={`${entry.id}-${entry.candidate.status_value ?? 'none'}`}
                        entry={entry}
                        candidate={entry.candidate}
                    />
                ) : (
                    <div className="p-5 text-sm text-[#3977a6]">
                        {t('employer.roster.drawer.no_preview')}
                    </div>
                )}
            </SheetContent>
        </Sheet>
    );
}

function RosterDrawerBody({
    entry,
    candidate,
}: {
    entry: RosterCandidateDrawerEntry;
    candidate: RosterCandidatePreview;
}) {
    const { t } = useLocale();
    const [avatarFailed, setAvatarFailed] = useState(false);
    const mailto = candidate.email !== '—' ? `mailto:${candidate.email}` : null;
    const showAvatar = Boolean(candidate.avatar_url) && !avatarFailed;

    return (
        <div className="flex h-full flex-col bg-white">
            <div className="flex shrink-0 items-center gap-4 border-b border-[#d1f6ff] bg-[#d1f6ff] p-5">
                {showAvatar ? (
                    <img
                        src={candidate.avatar_url ?? undefined}
                        alt={candidate.name}
                        onError={() => setAvatarFailed(true)}
                        className="size-24 shrink-0 rounded-full border-2 border-white object-cover object-top shadow-sm"
                    />
                ) : (
                    <div className="flex size-24 shrink-0 items-center justify-center rounded-full bg-[#0057c8] text-2xl font-extrabold text-white">
                        {getInitials(candidate.name) || '—'}
                    </div>
                )}
                <div className="min-w-0 flex-1">
                    <SheetTitle className="text-base font-extrabold text-[#050315]">
                        {candidate.name}
                    </SheetTitle>
                    <SheetDescription className="pt-0.5 text-[12.8px] leading-[19.2px] text-[#3977a6]">
                        {candidate.title}
                    </SheetDescription>
                    <div className="mt-1 flex flex-wrap gap-1.5">
                        <span className="inline-flex rounded-full bg-[#eff6ff] px-2.5 py-0.5 text-[11.52px] font-bold text-[#0057c8]">
                            {entry.category}
                        </span>
                        {candidate.status ? (
                            <span className="inline-flex rounded-full bg-[#fdf4ff] px-2.5 py-0.5 text-[11.52px] font-bold text-[#7e22ce]">
                                {candidate.status}
                            </span>
                        ) : null}
                    </div>
                </div>
                <SheetClose asChild>
                    <button
                        type="button"
                        aria-label={t('common.close')}
                        className="flex size-8 shrink-0 items-center justify-center text-[20px] text-[#3977a6] hover:text-[#050315]"
                    >
                        <X className="size-5" strokeWidth={1.75} />
                    </button>
                </SheetClose>
            </div>

            <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto p-5">
                <Section title={t('employer.roster.drawer.roster_details')}>
                    <DetailGrid
                        items={[
                            [
                                t('employer.roster.col.category'),
                                entry.category,
                            ],
                            [
                                t('employer.roster.col.added_by'),
                                entry.added_by,
                            ],
                            [t('employer.roster.col.date'), entry.created_at],
                        ]}
                    />
                    {entry.comments ? (
                        <p className="mt-3 whitespace-pre-wrap text-[13.6px] leading-5 text-[#050315]">
                            {entry.comments}
                        </p>
                    ) : (
                        <p className="mt-3 text-[13.6px] text-[#3977a6]">
                            {t('employer.roster.drawer.no_comments')}
                        </p>
                    )}
                </Section>

                <Section title={t('employer.roster.drawer.applications')}>
                    {entry.applications.length === 0 ? (
                        <EmptyText>
                            {t('employer.roster.drawer.no_applications')}
                        </EmptyText>
                    ) : (
                        <div className="space-y-2">
                            {entry.applications.map((application) => (
                                <a
                                    key={application.id}
                                    href={application.applications_url}
                                    className="block rounded-xl border border-[#e2e8f0] px-3 py-2.5 transition-colors hover:border-[#bfdbfe] hover:bg-[#f8faff]"
                                >
                                    <p className="text-[13.6px] font-semibold text-[#050315]">
                                        {application.job ||
                                            t(
                                                'employer.roster.drawer.unknown_job',
                                            )}
                                    </p>
                                    <p className="pt-0.5 text-[12px] text-[#64748b]">
                                        {[
                                            application.status,
                                            application.date,
                                        ]
                                            .filter(Boolean)
                                            .join(' · ') || '—'}
                                    </p>
                                </a>
                            ))}
                        </div>
                    )}
                </Section>

                <Section title={t('employer.roster.drawer.contact')}>
                    <div className="flex flex-col gap-[4.8px]">
                        <ContactRow icon={Mail} value={candidate.email} />
                        <ContactRow icon={Phone} value={candidate.phone} />
                        <ContactRow icon={MapPin} value={candidate.location} />
                    </div>
                </Section>

                <Section title={t('employer.roster.drawer.professional')}>
                    <DetailGrid
                        items={[
                            [
                                t('employer.roster.drawer.current_title'),
                                candidate.current_title,
                            ],
                            [
                                t('employer.roster.drawer.gender'),
                                candidate.gender,
                            ],
                            [
                                t('employer.roster.drawer.experience'),
                                candidate.experience_years,
                            ],
                            [
                                t('employer.roster.drawer.industry'),
                                candidate.industry,
                            ],
                            [
                                t('employer.roster.drawer.expected_salary'),
                                candidate.expected_salary,
                            ],
                            [
                                t('employer.roster.drawer.source_job'),
                                candidate.job,
                            ],
                        ]}
                    />
                    {(candidate.availability ?? []).length > 0 ? (
                        <div className="flex flex-wrap gap-1.5 pt-2">
                            {candidate.availability.map((item) => (
                                <span
                                    key={item}
                                    className="rounded-full bg-[#dbeafe] px-2.5 py-0.5 text-[11px] font-semibold text-[#1d4ed8]"
                                >
                                    {item}
                                </span>
                            ))}
                        </div>
                    ) : null}
                </Section>

                {candidate.bio ? (
                    <Section title={t('employer.roster.drawer.about')}>
                        <p className="text-[13.6px] leading-5 text-[#050315]">
                            {candidate.bio}
                        </p>
                    </Section>
                ) : null}

                {(candidate.linkedin_url || candidate.github_url) && (
                    <Section title={t('employer.roster.drawer.links')}>
                        <div className="flex flex-col gap-1.5">
                            {candidate.linkedin_url ? (
                                <LinkRow
                                    href={candidate.linkedin_url}
                                    label={t('employer.roster.drawer.linkedin')}
                                />
                            ) : null}
                            {candidate.github_url ? (
                                <LinkRow
                                    href={candidate.github_url}
                                    label={t('employer.roster.drawer.github')}
                                />
                            ) : null}
                        </div>
                    </Section>
                )}

                <Section title={t('employer.roster.drawer.skills')}>
                    <div className="flex flex-wrap gap-[6.4px]">
                        {candidate.skills.length === 0 ? (
                            <EmptyText>
                                {t('employer.roster.drawer.no_skills')}
                            </EmptyText>
                        ) : (
                            candidate.skills.map((skill) => (
                                <span
                                    key={skill}
                                    className="rounded-full bg-[#eeeffe] px-[9.6px] py-[3.2px] text-xs font-semibold text-[#0057c8]"
                                >
                                    {skill}
                                </span>
                            ))
                        )}
                    </div>
                </Section>

                <EntriesSection
                    title={t('employer.roster.drawer.experience')}
                    entries={candidate.experience}
                />
                <EntriesSection
                    title={t('employer.roster.drawer.education')}
                    entries={candidate.education}
                />

                <Section title={t('employer.roster.drawer.languages')}>
                    {candidate.languages.length === 0 ? (
                        <EmptyText>
                            {t('employer.roster.drawer.no_languages')}
                        </EmptyText>
                    ) : (
                        <div className="space-y-2">
                            {candidate.languages.map((language) => (
                                <div
                                    key={language.name}
                                    className="flex items-center justify-between gap-2 rounded-lg border border-[#f1f5f9] px-3 py-2"
                                >
                                    <span className="text-[13.6px] font-semibold text-[#050315]">
                                        {language.name}
                                    </span>
                                    {language.level ? (
                                        <span className="rounded-full bg-[#dcfce7] px-2 py-0.5 text-[11px] font-semibold text-[#15803d]">
                                            {language.level}
                                        </span>
                                    ) : null}
                                </div>
                            ))}
                        </div>
                    )}
                </Section>

                <Section title={t('employer.roster.drawer.certifications')}>
                    {candidate.certifications.length === 0 ? (
                        <EmptyText>
                            {t('employer.roster.drawer.no_certifications')}
                        </EmptyText>
                    ) : (
                        <div className="space-y-3">
                            {candidate.certifications.map((item) => (
                                <div key={item.name} className="space-y-1.5">
                                    <p className="text-[13.6px] font-semibold text-[#050315]">
                                        {item.name}
                                    </p>
                                    <p className="text-[12px] text-[#3977a6]">
                                        {[item.issuer, item.date]
                                            .filter(Boolean)
                                            .join(' · ') || '—'}
                                    </p>
                                    {(item.attachments ?? []).map((file) =>
                                        file.download_url ? (
                                            <a
                                                key={`${item.name}-${file.file_name}`}
                                                href={file.download_url}
                                                download
                                                className="inline-flex items-center gap-1.5 text-[12.8px] font-semibold text-[#0057c8]"
                                            >
                                                <Download
                                                    className="size-3.5"
                                                    strokeWidth={2}
                                                />
                                                {file.file_name}
                                            </a>
                                        ) : null,
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </Section>

                <Section title={t('employer.roster.drawer.references')}>
                    {(candidate.references ?? []).length === 0 ? (
                        <EmptyText>
                            {t('employer.roster.drawer.no_references')}
                        </EmptyText>
                    ) : (
                        <div className="space-y-3">
                            {(candidate.references ?? []).map((item) => (
                                <div key={item.name} className="space-y-1">
                                    <p className="text-[13.6px] font-semibold text-[#050315]">
                                        {item.name}
                                    </p>
                                    <p className="text-[12px] text-[#3977a6]">
                                        {[item.relationship, item.address]
                                            .filter(Boolean)
                                            .join(' · ') || '—'}
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}
                </Section>

                {candidate.cover_letter ? (
                    <Section title={t('employer.roster.drawer.cover_letter')}>
                        <p className="whitespace-pre-wrap text-[13.6px] leading-5 text-[#050315]">
                            {candidate.cover_letter}
                        </p>
                    </Section>
                ) : null}

                {(candidate.question_answers ?? []).length > 0 ? (
                    <Section title={t('employer.roster.drawer.questions')}>
                        <div className="space-y-3">
                            {(candidate.question_answers ?? []).map((item) => (
                                <div key={item.id}>
                                    <p className="text-xs font-semibold text-[#64748b]">
                                        {item.prompt}
                                    </p>
                                    <p className="mt-1 whitespace-pre-wrap text-[13.6px] leading-5 text-[#050315]">
                                        {item.answer || '—'}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </Section>
                ) : null}

                <Section title={t('employer.roster.drawer.documents')}>
                    <div className="flex flex-col gap-2">
                        <DocumentDownload
                            label={t('employer.roster.drawer.resume')}
                            fileName={candidate.resume_name}
                            url={candidate.resume_url}
                            buttonLabel={t(
                                'employer.roster.drawer.download_resume',
                            )}
                        />
                        <DocumentDownload
                            label={t('employer.roster.drawer.highest_degree')}
                            fileName={candidate.highest_degree_name}
                            url={candidate.highest_degree_url}
                            buttonLabel={t(
                                'employer.roster.drawer.download_highest_degree',
                            )}
                        />
                        <DocumentDownload
                            label={t('employer.roster.drawer.other_document')}
                            fileName={candidate.other_document_name}
                            url={candidate.other_document_url}
                            buttonLabel={t(
                                'employer.roster.drawer.download_other_document',
                            )}
                        />
                        <DocumentDownload
                            label={t('employer.roster.drawer.cover_letter_file')}
                            fileName={candidate.cover_letter_file_name}
                            url={candidate.cover_letter_file_url}
                            buttonLabel={t(
                                'employer.roster.drawer.download_cover_letter',
                            )}
                        />
                        {!candidate.resume_url &&
                        !candidate.highest_degree_url &&
                        !candidate.other_document_url &&
                        !candidate.cover_letter_file_url ? (
                            <EmptyText>
                                {t('employer.roster.drawer.no_documents')}
                            </EmptyText>
                        ) : null}
                    </div>
                </Section>

                {(candidate.timeline ?? []).length > 0 ? (
                    <Section title={t('employer.roster.drawer.status_timeline')}>
                        <ol className="flex flex-col">
                            {candidate.timeline.map((step, index) => (
                                <TimelineStep
                                    key={`${step.label}-${index}`}
                                    step={step}
                                    isLast={
                                        index === candidate.timeline.length - 1
                                    }
                                />
                            ))}
                        </ol>
                    </Section>
                ) : null}
            </div>

            <div className="flex shrink-0 gap-2 border-t border-[#e2e8f0] p-4">
                {mailto ? (
                    <a
                        href={`${mailto}?subject=${encodeURIComponent(t('employer.roster.drawer.interview_subject'))}`}
                        className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-[8px] border border-[#0057c8] text-[13.6px] font-semibold text-[#0057c8]"
                    >
                        <CalendarDays className="size-3.5" />
                        {t('employer.roster.drawer.schedule_interview')}
                    </a>
                ) : (
                    <button
                        type="button"
                        disabled
                        className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-[8px] border border-[#0057c8] text-[13.6px] font-semibold text-[#0057c8] opacity-50"
                    >
                        <CalendarDays className="size-3.5" />
                        {t('employer.roster.drawer.schedule_interview')}
                    </button>
                )}
                {mailto ? (
                    <a
                        href={mailto}
                        className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-[8px] bg-[#0057c8] text-[13.6px] font-semibold text-white"
                    >
                        <Mail className="size-3.5" />
                        {t('employer.roster.drawer.send_message')}
                    </a>
                ) : (
                    <button
                        type="button"
                        disabled
                        className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-[8px] bg-[#0057c8] text-[13.6px] font-semibold text-white opacity-50"
                    >
                        <Mail className="size-3.5" />
                        {t('employer.roster.drawer.send_message')}
                    </button>
                )}
            </div>
        </div>
    );
}

function DocumentDownload({
    label,
    fileName,
    url,
    buttonLabel,
}: {
    label: string;
    fileName?: string | null;
    url?: string | null;
    buttonLabel: string;
}) {
    if (!url) {
        return null;
    }

    return (
        <div className="rounded-lg border border-[#e2e8f0] px-3 py-2.5">
            <p className="text-[11px] font-semibold text-[#64748b]">{label}</p>
            {fileName ? (
                <p className="truncate pt-0.5 text-[12.8px] text-[#3977a6]">
                    {fileName}
                </p>
            ) : null}
            <a
                href={url}
                download
                className="mt-2 inline-flex h-[34px] items-center justify-center gap-2 rounded-[8px] border border-[#0057c8] bg-[#0057c8] px-3 text-[12.8px] font-semibold text-white hover:bg-[#0046a3]"
            >
                <Download className="size-3.5" strokeWidth={2} />
                {buttonLabel}
            </a>
        </div>
    );
}

function Section({
    title,
    children,
}: {
    title: string;
    children: ReactNode;
}) {
    return (
        <section>
            <h3 className="pb-2 text-[12.8px] font-bold tracking-[0.512px] text-[#3977a6] uppercase">
                {title}
            </h3>
            {children}
        </section>
    );
}

function EmptyText({ children }: { children: ReactNode }) {
    return <p className="text-[13.6px] text-[#3977a6]">{children}</p>;
}

function DetailGrid({
    items,
}: {
    items: Array<[string, string | null | undefined]>;
}) {
    const { t } = useLocale();
    const visible = items.filter(([, value]) => value && value !== '—');

    if (visible.length === 0) {
        return (
            <EmptyText>
                {t('employer.roster.drawer.no_professional')}
            </EmptyText>
        );
    }

    return (
        <div className="grid grid-cols-2 gap-3">
            {visible.map(([label, value]) => (
                <div key={label}>
                    <p className="text-[11px] font-semibold text-[#64748b]">
                        {label}
                    </p>
                    <p className="pt-0.5 text-[13.6px] font-medium text-[#050315]">
                        {value}
                    </p>
                </div>
            ))}
        </div>
    );
}

function EntriesSection({
    title,
    entries,
}: {
    title: string;
    entries: RosterProfileEntry[];
}) {
    const { t } = useLocale();

    return (
        <Section title={title}>
            {entries.length === 0 ? (
                <EmptyText>
                    {t('employer.roster.drawer.no_entries', {
                        section: title,
                    })}
                </EmptyText>
            ) : (
                <ol className="space-y-3">
                    {entries.map((entry, index) => (
                        <li key={`${entry.title}-${index}`}>
                            <p className="text-[13.6px] font-semibold text-[#050315]">
                                {entry.title}
                            </p>
                            {entry.subtitle ? (
                                <p className="text-[12.8px] text-[#3977a6]">
                                    {entry.subtitle}
                                </p>
                            ) : null}
                            {entry.meta ? (
                                <p className="text-[11.5px] text-[#64748b]">
                                    {entry.meta}
                                </p>
                            ) : null}
                            {entry.body ? (
                                <p className="pt-1 text-[12.8px] text-[#374151]">
                                    {entry.body}
                                </p>
                            ) : null}
                        </li>
                    ))}
                </ol>
            )}
        </Section>
    );
}

function LinkRow({ href, label }: { href: string; label: string }) {
    return (
        <a
            href={href}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 text-[13.6px] font-semibold text-[#0057c8]"
        >
            <ExternalLink className="size-3.5" />
            {label}
        </a>
    );
}

function ContactRow({
    icon: Icon,
    value,
}: {
    icon: typeof Mail;
    value: string;
}) {
    return (
        <p className="flex items-center gap-2 text-[13.6px] leading-[20.4px] text-[#3977a6]">
            <Icon className="size-3.5 shrink-0" strokeWidth={1.75} />
            <span className="min-w-0 truncate">{value}</span>
        </p>
    );
}

function TimelineStep({
    step,
    isLast,
}: {
    step: RosterTimelineStep;
    isLast: boolean;
}) {
    const isDone = step.state === 'done';
    const isCurrent = step.state === 'current';

    return (
        <li className="flex gap-3">
            <div className="flex flex-col items-center">
                <span
                    className={cn(
                        'mt-1 size-2.5 rounded-full',
                        isDone || isCurrent ? 'bg-[#0057c8]' : 'bg-[#cbd5e1]',
                    )}
                />
                {!isLast ? (
                    <span
                        className={cn(
                            'mt-1 w-0.5 flex-1',
                            isDone ? 'bg-[#0057c8]' : 'bg-[#e2e8f0]',
                        )}
                    />
                ) : null}
            </div>
            <div className={cn('min-w-0 pb-4', isLast && 'pb-0')}>
                <p
                    className={cn(
                        'text-[13.6px] font-semibold',
                        isCurrent || isDone
                            ? 'text-[#050315]'
                            : 'text-[#94a3b8]',
                    )}
                >
                    {step.label}
                </p>
                {step.date ? (
                    <p className="text-[11.5px] text-[#64748b]">{step.date}</p>
                ) : null}
            </div>
        </li>
    );
}
