import { Download, Mail, MapPin, Phone, X } from 'lucide-react';

import { getInitials } from '@/components/job-seeker/demo-data';
import {
    Sheet,
    SheetClose,
    SheetContent,
    SheetDescription,
    SheetTitle,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

export type CandidatePreviewTimelineStep = {
    label: string;
    date: string | null;
    state: 'done' | 'current' | 'pending';
};

export type CandidatePreview = {
    name: string;
    title: string;
    status: string;
    email: string;
    phone: string;
    location: string;
    skills: string[];
    resume_url: string | null;
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
                        No preview available.
                    </div>
                )}
            </SheetContent>
        </Sheet>
    );
}

function DrawerBody({ preview }: { preview: CandidatePreview }) {
    const resumeEnabled = preview.resume_url !== null;

    return (
        <div className="flex h-full flex-col bg-white">
            <div className="flex shrink-0 items-center gap-4 border-b border-[#d1f6ff] bg-[#d1f6ff] p-5">
                <div className="flex size-[52px] shrink-0 items-center justify-center rounded-full bg-[#0057c8] text-base font-extrabold text-white">
                    {getInitials(preview.name) || '—'}
                </div>
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
                        aria-label="Close"
                        className="flex size-8 shrink-0 items-center justify-center text-[20px] text-[#3977a6] hover:text-[#050315]"
                    >
                        <X className="size-5" strokeWidth={1.75} />
                    </button>
                </SheetClose>
            </div>

            <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto p-5">
                <section>
                    <h3 className="text-[12.8px] font-bold tracking-[0.512px] text-[#3977a6] uppercase">
                        Contact
                    </h3>
                    <div className="flex flex-col gap-[4.8px] pt-2">
                        <ContactRow icon={Mail} value={preview.email} />
                        <ContactRow icon={Phone} value={preview.phone} />
                        <ContactRow icon={MapPin} value={preview.location} />
                    </div>
                </section>

                <section>
                    <h3 className="text-[12.8px] font-bold tracking-[0.512px] text-[#3977a6] uppercase">
                        Skills
                    </h3>
                    <div className="flex flex-wrap gap-[6.4px] pt-2">
                        {preview.skills.length === 0 ? (
                            <p className="text-[13.6px] text-[#3977a6]">
                                No skills listed.
                            </p>
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
                </section>

                <section>
                    <h3 className="pb-2 text-[12.8px] font-bold tracking-[0.512px] text-[#3977a6] uppercase">
                        Resume
                    </h3>
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
                            Download Resume
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
                            Download Resume
                        </button>
                    )}
                </section>

                <section>
                    <h3 className="text-[12.8px] font-bold tracking-[0.512px] text-[#3977a6] uppercase">
                        Status Timeline
                    </h3>
                    <ol className="flex flex-col pt-3">
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
                </section>
            </div>
        </div>
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
    const isPending = step.state === 'pending';

    return (
        <li className="flex gap-3">
            <div className="flex flex-col items-center">
                <span
                    className={cn(
                        'size-[14px] shrink-0 rounded-[7px] border-2',
                        isDone && 'border-[#0057c8] bg-[#0057c8]',
                        isCurrent && 'border-[#e57124] bg-[#e57124]',
                        isPending && 'border-[#e8d5e8] bg-[#e8d5e8]',
                    )}
                />
                {isLast ? null : (
                    <span
                        className={cn(
                            'h-6 w-0.5',
                            isDone ? 'bg-[#0057c8]' : 'bg-[#e8d5e8]',
                        )}
                    />
                )}
            </div>
            <div className={cn('min-w-0', isLast ? '' : 'pb-2')}>
                <p
                    className={cn(
                        'text-[12.8px] leading-[19.2px]',
                        isPending &&
                        'font-semibold text-[#9ca3af]',
                        isCurrent && 'font-bold text-[#050315]',
                        isDone && 'font-semibold text-[#050315]',
                    )}
                >
                    {step.label}
                </p>
                {step.date ? (
                    <p className="text-[11.52px] leading-[17.28px] text-[#3977a6]">
                        {step.date}
                    </p>
                ) : null}
            </div>
        </li>
    );
}
