import { CalendarDays, Download, Mail, MapPin, Phone, Send, X } from 'lucide-react';
import { useEffect, useState } from 'react';

import { getInitials } from '@/components/employer/demo-data';
import {
    Sheet,
    SheetClose,
    SheetContent,
    SheetDescription,
    SheetTitle,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

export type ApplicationPreviewTimelineStep = {
    label: string;
    date: string | null;
    state: 'done' | 'current' | 'pending' | string;
};

export type ApplicationPreview = {
    id: number;
    name: string;
    title: string;
    status: string;
    status_value: string;
    email: string;
    phone: string;
    location: string;
    skills: string[];
    resume_url: string | null;
    timeline: ApplicationPreviewTimelineStep[];
};

type StatusOption = {
    value: string;
    label: string;
};

export function ApplicationPreviewDrawer({
    open,
    onOpenChange,
    preview,
    statuses,
    onUpdateStatus,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    preview: ApplicationPreview | null;
    statuses: StatusOption[];
    onUpdateStatus: (applicationId: number, status: string) => void;
}) {
    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent
                side="right"
                showCloseButton={false}
                overlayClassName="bg-[rgba(5,3,21,0.4)]"
                className="w-[400px] gap-0 border-0 p-0 shadow-[-4px_0px_24px_0px_rgba(5,3,21,0.15)] sm:max-w-[400px]"
            >
                {preview ? (
                    <DrawerBody
                        preview={preview}
                        statuses={statuses}
                        onUpdateStatus={onUpdateStatus}
                    />
                ) : (
                    <div className="p-5 text-sm text-[#3977a6]">
                        No preview available.
                    </div>
                )}
            </SheetContent>
        </Sheet>
    );
}

function DrawerBody({
    preview,
    statuses,
    onUpdateStatus,
}: {
    preview: ApplicationPreview;
    statuses: StatusOption[];
    onUpdateStatus: (applicationId: number, status: string) => void;
}) {
    const [selectedStatus, setSelectedStatus] = useState(preview.status_value);
    const resumeEnabled = preview.resume_url !== null;
    const mailto = preview.email !== '—' ? `mailto:${preview.email}` : null;

    useEffect(() => {
        setSelectedStatus(preview.status_value);
    }, [preview.id, preview.status_value]);

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
                    <span className="mt-1 inline-flex rounded-full bg-[#fdf4ff] px-2.5 py-0.5 text-[11.52px] font-bold text-[#7e22ce]">
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
                            <Download className="size-3.5" strokeWidth={2} />
                            Download Resume
                        </a>
                    ) : (
                        <button
                            type="button"
                            disabled
                            className="inline-flex h-[38px] items-center justify-center gap-2 rounded-[8px] border border-[#0057c8] bg-[#0057c8] px-3.5 text-[13.6px] font-semibold text-white opacity-50"
                        >
                            <Download className="size-3.5" strokeWidth={2} />
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
                                key={`${step.label}-${index}`}
                                step={step}
                                isLast={index === preview.timeline.length - 1}
                            />
                        ))}
                    </ol>
                </section>

                <section>
                    <h3 className="pb-2 text-[12.8px] font-bold tracking-[0.512px] text-[#3977a6] uppercase">
                        Change Status
                    </h3>
                    <div className="flex items-center gap-2">
                        <select
                            value={selectedStatus}
                            onChange={(event) =>
                                setSelectedStatus(event.target.value)
                            }
                            className="h-[38px] min-w-0 flex-1 cursor-pointer rounded-[8px] border border-[#e8d5e8] bg-white px-3 text-[13.6px] text-[#050315] outline-none focus:border-[#0057c8]"
                        >
                            {statuses.map((item) => (
                                <option key={item.value} value={item.value}>
                                    {item.label}
                                </option>
                            ))}
                        </select>
                        <button
                            type="button"
                            className="inline-flex h-[38px] shrink-0 cursor-pointer items-center justify-center rounded-[8px] bg-[#e57124] px-4 text-[13.6px] font-semibold text-white hover:bg-[#cf6218]"
                            onClick={() =>
                                onUpdateStatus(preview.id, selectedStatus)
                            }
                        >
                            Update
                        </button>
                    </div>
                </section>
            </div>

            <div className="flex shrink-0 gap-2 border-t border-[#e8d5e8] p-5">
                <button
                    type="button"
                    className="inline-flex h-10 min-w-0 flex-1 cursor-pointer items-center justify-center gap-2 rounded-[8px] border border-[#0057c8] bg-white px-3 text-[13px] font-semibold text-[#0057c8] hover:bg-[#f8faff]"
                    onClick={() =>
                        onUpdateStatus(preview.id, 'interview')
                    }
                >
                    <CalendarDays className="size-3.5" strokeWidth={2} />
                    Schedule Interview
                </button>
                {mailto ? (
                    <a
                        href={mailto}
                        className="inline-flex h-10 min-w-0 flex-1 items-center justify-center gap-2 rounded-[8px] bg-[#e57124] px-3 text-[13px] font-semibold text-white hover:bg-[#cf6218]"
                    >
                        <Send className="size-3.5" strokeWidth={2} />
                        Send Message
                    </a>
                ) : (
                    <button
                        type="button"
                        disabled
                        className="inline-flex h-10 min-w-0 flex-1 items-center justify-center gap-2 rounded-[8px] bg-[#e57124] px-3 text-[13px] font-semibold text-white opacity-50"
                    >
                        <Send className="size-3.5" strokeWidth={2} />
                        Send Message
                    </button>
                )}
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
    step: ApplicationPreviewTimelineStep;
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
                        isPending && 'font-semibold text-[#9ca3af]',
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
