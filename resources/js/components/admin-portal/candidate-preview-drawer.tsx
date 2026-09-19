import { Download, ExternalLink, Mail, MapPin, Phone, X } from 'lucide-react';
import { useState, type ReactNode } from 'react';

import { getInitials } from '@/components/job-seeker/demo-data';
import {
    Sheet,
    SheetClose,
    SheetContent,
    SheetDescription,
    SheetTitle,
} from '@/components/ui/sheet';
import { useLocale } from '@/hooks/use-locale';
import { cn } from '@/lib/utils';

export type CandidatePreviewTimelineStep = {
    label: string;
    date: string | null;
    state: 'done' | 'current' | 'pending';
};

export type ProfileEntry = {
    title: string;
    subtitle: string | null;
    meta: string | null;
    body: string | null;
};

export type CandidatePreview = {
    name: string;
    title: string;
    status: string;
    email: string;
    phone: string;
    location: string;
    is_applicant?: boolean;
    current_title?: string | null;
    experience_years?: string | null;
    industry?: string | null;
    expected_salary?: string | null;
    availability?: string[];
    bio?: string | null;
    linkedin_url?: string | null;
    github_url?: string | null;
    skills: string[];
    education?: ProfileEntry[];
    experience?: ProfileEntry[];
    languages?: Array<{ name: string; level: string | null }>;
    certifications?: Array<{
        name: string;
        issuer: string | null;
        date: string | null;
    }>;
    cover_letter?: string | null;
    resume_name?: string | null;
    resume_url: string | null;
    avatar_url?: string | null;
    timeline: CandidatePreviewTimelineStep[];
};

export function CandidatePreviewDrawer({
    open,
    onOpenChange,
    preview,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    preview: CandidatePreview | null;
}) {
    const { t } = useLocale();

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent
                side="right"
                showCloseButton={false}
                overlayClassName="bg-black/40"
                className="w-[400px] gap-0 border-0 p-0 shadow-[-4px_0px_24px_0px_rgba(5,3,21,0.15)] sm:max-w-[400px]"
            >
                {preview ? (
                    <DrawerBody preview={preview} />
                ) : (
                    <div className="p-5 text-sm text-[#3977a6]">
                        {t('admin.candidate.no_preview')}
                    </div>
                )}
            </SheetContent>
        </Sheet>
    );
}

function DrawerBody({ preview }: { preview: CandidatePreview }) {
    const { t } = useLocale();
    const [avatarFailed, setAvatarFailed] = useState(false);
    const resumeEnabled = preview.resume_url !== null;
    const isApplicant = preview.is_applicant !== false;
    const education = preview.education ?? [];
    const experience = preview.experience ?? [];
    const languages = preview.languages ?? [];
    const certifications = preview.certifications ?? [];
    const availability = preview.availability ?? [];
    const showAvatar = Boolean(preview.avatar_url) && !avatarFailed;

    return (
        <div className="flex h-full flex-col bg-white">
            <div className="flex shrink-0 items-center gap-4 border-b border-[#d1f6ff] bg-[#d1f6ff] p-5">
                {showAvatar ? (
                    <img
                        src={preview.avatar_url ?? undefined}
                        alt={preview.name}
                        onError={() => setAvatarFailed(true)}
                        className="size-[52px] shrink-0 rounded-full border border-white object-cover shadow-sm"
                    />
                ) : (
                    <div className="flex size-[52px] shrink-0 items-center justify-center rounded-full bg-[#0057c8] text-base font-extrabold text-white">
                        {getInitials(preview.name) || '—'}
                    </div>
                )}
                <div className="min-w-0 flex-1">
                    <SheetTitle className="text-base font-extrabold text-[#050315]">
                        {preview.name}
                    </SheetTitle>
                    <SheetDescription className="pt-0.5 text-[12.8px] leading-[19.2px] text-[#3977a6]">
                        {preview.title}
                    </SheetDescription>
                    <span className="mt-1 inline-flex rounded-full bg-[#fdf4ff] px-2.5 py-0.5 text-[11.52px] font-bold text-[#0057c8]">
                        {preview.status}
                    </span>
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
                <Section title={t('admin.candidate.contact')}>
                    <div className="flex flex-col gap-[4.8px]">
                        <ContactRow icon={Mail} value={preview.email} />
                        <ContactRow icon={Phone} value={preview.phone} />
                        <ContactRow icon={MapPin} value={preview.location} />
                    </div>
                </Section>

                {isApplicant ? (
                    <>
                        <Section title={t('admin.candidate.professional')}>
                            <DetailGrid
                                items={[
                                    [
                                        t('admin.candidate.current_title'),
                                        preview.current_title,
                                    ],
                                    [
                                        t('admin.candidate.experience'),
                                        preview.experience_years,
                                    ],
                                    [
                                        t('admin.candidate.industry'),
                                        preview.industry,
                                    ],
                                    [
                                        t('admin.candidate.expected_salary'),
                                        preview.expected_salary,
                                    ],
                                ]}
                            />
                            {availability.length > 0 ? (
                                <div className="flex flex-wrap gap-1.5 pt-2">
                                    {availability.map((item) => (
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

                        {preview.bio ? (
                            <Section title={t('admin.candidate.about')}>
                                <p className="text-[13.6px] leading-5 text-[#050315]">
                                    {preview.bio}
                                </p>
                            </Section>
                        ) : null}

                        {(preview.linkedin_url || preview.github_url) && (
                            <Section title={t('admin.candidate.links')}>
                                <div className="flex flex-col gap-1.5">
                                    {preview.linkedin_url ? (
                                        <LinkRow
                                            href={preview.linkedin_url}
                                            label={t('admin.candidate.linkedin')}
                                        />
                                    ) : null}
                                    {preview.github_url ? (
                                        <LinkRow
                                            href={preview.github_url}
                                            label={t('admin.candidate.github')}
                                        />
                                    ) : null}
                                </div>
                            </Section>
                        )}
                    </>
                ) : null}

                <Section title={t('admin.candidate.skills')}>
                    <div className="flex flex-wrap gap-[6.4px]">
                        {preview.skills.length === 0 ? (
                            <EmptyText>
                                {t('admin.candidate.no_skills')}
                            </EmptyText>
                        ) : (
                            preview.skills.map((skill) => (
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

                {isApplicant ? (
                    <>
                        <EntriesSection
                            title={t('admin.candidate.experience')}
                            entries={experience}
                        />
                        <EntriesSection
                            title={t('admin.candidate.education')}
                            entries={education}
                        />

                        <Section title={t('admin.candidate.languages')}>
                            {languages.length === 0 ? (
                                <EmptyText>
                                    {t('admin.candidate.no_languages')}
                                </EmptyText>
                            ) : (
                                <div className="space-y-2">
                                    {languages.map((language) => (
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

                        <Section title={t('admin.candidate.certifications')}>
                            {certifications.length === 0 ? (
                                <EmptyText>
                                    {t('admin.candidate.no_certifications')}
                                </EmptyText>
                            ) : (
                                <div className="space-y-2">
                                    {certifications.map((item) => (
                                        <div key={item.name}>
                                            <p className="text-[13.6px] font-semibold text-[#050315]">
                                                {item.name}
                                            </p>
                                            <p className="text-[12px] text-[#3977a6]">
                                                {[item.issuer, item.date]
                                                    .filter(Boolean)
                                                    .join(' · ') || '—'}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </Section>

                        {preview.cover_letter ? (
                            <Section title={t('admin.candidate.cover_letter')}>
                                <p className="whitespace-pre-wrap text-[13.6px] leading-5 text-[#050315]">
                                    {preview.cover_letter}
                                </p>
                            </Section>
                        ) : null}
                    </>
                ) : null}

                <Section title={t('admin.candidate.resume')}>
                    {preview.resume_name ? (
                        <p className="pb-2 text-[12.8px] text-[#3977a6]">
                            {preview.resume_name}
                        </p>
                    ) : null}
                    {resumeEnabled ? (
                        <a
                            href={preview.resume_url ?? '#'}
                            download
                            className="inline-flex h-[38px] items-center justify-center gap-2 rounded-[8px] border border-[#0057c8] bg-[#0057c8] px-3.5 text-[13.6px] font-semibold text-white hover:bg-[#0046a3]"
                        >
                            <Download
                                className="size-3.5"
                                strokeWidth={2}
                            />
                            {t('admin.candidate.download_resume')}
                        </a>
                    ) : (
                        <button
                            type="button"
                            disabled
                            className="inline-flex h-[38px] items-center justify-center gap-2 rounded-[8px] border border-[#0057c8] bg-[#0057c8] px-3.5 text-[13.6px] font-semibold text-white opacity-50"
                        >
                            <Download
                                className="size-3.5"
                                strokeWidth={2}
                            />
                            {t('admin.candidate.download_resume')}
                        </button>
                    )}
                </Section>

                <Section title={t('admin.candidate.status_timeline')}>
                    <ol className="flex flex-col">
                        {preview.timeline.map((step, index) => (
                            <TimelineStep
                                key={step.label}
                                step={step}
                                isLast={
                                    index === preview.timeline.length - 1
                                }
                            />
                        ))}
                    </ol>
                </Section>
            </div>
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
            <EmptyText>{t('admin.candidate.no_professional')}</EmptyText>
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
    entries: ProfileEntry[];
}) {
    const { t } = useLocale();

    return (
        <Section title={title}>
            {entries.length === 0 ? (
                <EmptyText>
                    {t('admin.candidate.no_entries', { section: title })}
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
    step: CandidatePreviewTimelineStep;
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
