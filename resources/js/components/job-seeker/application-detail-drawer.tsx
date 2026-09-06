import { Link } from '@inertiajs/react';
import { X } from 'lucide-react';

import { getInitials } from '@/components/job-seeker/demo-data';
import { StatusBadge } from '@/components/job-seeker/status-badge';
import type { ApplicationStatus } from '@/components/job-seeker/demo-data';
import {
    Sheet,
    SheetClose,
    SheetContent,
    SheetDescription,
    SheetTitle,
} from '@/components/ui/sheet';
import { useLocale } from '@/hooks/use-locale';
import { cn } from '@/lib/utils';

export type ApplicationDetail = {
    id: number;
    title: string | null;
    company: string | null;
    location: string | null;
    salary: string | null;
    type: string | null;
    status: string | null;
    applied_at: string | null;
    job_url: string | null;
    timeline: Array<{ label: string; date: string | null; state: string }>;
};

export function ApplicationDetailDrawer({
    open,
    onOpenChange,
    application,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    application: ApplicationDetail | null;
}) {
    const { t } = useLocale();

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent
                side="right"
                showCloseButton={false}
                overlayClassName="bg-[rgba(5,3,21,0.4)]"
                className="w-[400px] gap-0 border-0 p-0 shadow-[-4px_0px_24px_0px_rgba(5,3,21,0.15)] sm:max-w-[400px]"
            >
                {application ? (
                    <DrawerBody application={application} />
                ) : (
                    <div className="p-5 text-sm text-[#3977a6]">
                        {t('job_seeker.applications.no_selected')}
                    </div>
                )}
            </SheetContent>
        </Sheet>
    );
}

function DrawerBody({ application }: { application: ApplicationDetail }) {
    const { t } = useLocale();

    return (
        <div className="flex h-full flex-col bg-white">
            <div className="flex shrink-0 items-center gap-4 border-b border-[#d1f6ff] bg-[#d1f6ff] p-5">
                <div className="flex size-[52px] shrink-0 items-center justify-center rounded-[12px] bg-[#0057c8] text-sm font-extrabold text-white">
                    {getInitials(application.company || 'JP')}
                </div>
                <div className="min-w-0 flex-1">
                    <SheetTitle className="text-base font-extrabold text-[#050315]">
                        {application.title ||
                            t('job_seeker.applications.fallback_title')}
                    </SheetTitle>
                    <SheetDescription className="pt-0.5 text-[12.8px] leading-[19.2px] text-[#3977a6]">
                        {application.company || '—'}
                        {application.location
                            ? ` · ${application.location}`
                            : ''}
                    </SheetDescription>
                    {application.status ? (
                        <div className="pt-1">
                            <StatusBadge
                                status={
                                    application.status as ApplicationStatus
                                }
                            />
                        </div>
                    ) : null}
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
                <section className="space-y-2 text-sm text-[#374151]">
                    <p>
                        <span className="font-semibold text-[#050315]">
                            {t('job_seeker.applications.applied')}:{' '}
                        </span>
                        {application.applied_at || '—'}
                    </p>
                    <p>
                        <span className="font-semibold text-[#050315]">
                            {t('job_seeker.applications.salary')}:{' '}
                        </span>
                        {application.salary || '—'}
                    </p>
                    <p>
                        <span className="font-semibold text-[#050315]">
                            {t('job_seeker.applications.type')}:{' '}
                        </span>
                        {application.type || '—'}
                    </p>
                </section>

                <section>
                    <h3 className="text-[12.8px] font-bold tracking-[0.512px] text-[#3977a6] uppercase">
                        {t('job_seeker.applications.status_timeline')}
                    </h3>
                    <ol className="flex flex-col pt-3">
                        {application.timeline.map((step, index) => {
                            const isDone = step.state === 'done';
                            const isCurrent = step.state === 'current';
                            const isPending = step.state === 'pending';
                            const isLast =
                                index === application.timeline.length - 1;

                            return (
                                <li key={`${step.label}-${index}`} className="flex gap-3">
                                    <div className="flex flex-col items-center">
                                        <span
                                            className={cn(
                                                'size-[14px] shrink-0 rounded-[7px] border-2',
                                                isDone &&
                                                'border-[#0057c8] bg-[#0057c8]',
                                                isCurrent &&
                                                'border-[#e57124] bg-[#e57124]',
                                                isPending &&
                                                'border-[#e8d5e8] bg-[#e8d5e8]',
                                            )}
                                        />
                                        {!isLast && (
                                            <span
                                                className={cn(
                                                    'h-6 w-0.5',
                                                    isDone
                                                        ? 'bg-[#0057c8]'
                                                        : 'bg-[#e8d5e8]',
                                                )}
                                            />
                                        )}
                                    </div>
                                    <div
                                        className={cn(
                                            'min-w-0',
                                            isLast ? '' : 'pb-2',
                                        )}
                                    >
                                        <p
                                            className={cn(
                                                'text-[12.8px] leading-[19.2px]',
                                                isPending &&
                                                'font-semibold text-[#9ca3af]',
                                                isCurrent &&
                                                'font-bold text-[#050315]',
                                                isDone &&
                                                'font-semibold text-[#050315]',
                                            )}
                                        >
                                            {step.label}
                                        </p>
                                        {step.date ? (
                                            <p className="text-[11.52px] text-[#3977a6]">
                                                {step.date}
                                            </p>
                                        ) : null}
                                    </div>
                                </li>
                            );
                        })}
                    </ol>
                </section>
            </div>

            {application.job_url ? (
                <div className="shrink-0 border-t border-[#e8d5e8] p-5">
                    <Link
                        href={application.job_url}
                        className="inline-flex h-10 w-full items-center justify-center rounded-[8px] bg-[#0057c8] text-sm font-semibold text-white hover:bg-[#0046a3]"
                    >
                        {t('job_seeker.applications.view_job')}
                    </Link>
                </div>
            ) : null}
        </div>
    );
}
