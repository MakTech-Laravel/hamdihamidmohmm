import { Head } from '@inertiajs/react';
import { AlertTriangle, Check } from 'lucide-react';
import { useMemo, useState } from 'react';

import {
    APPLICATIONS,
    type ApplicationStatus,
} from '@/components/job-seeker/demo-data';
import { StatusBadge } from '@/components/job-seeker/status-badge';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';
import JobSeekerLayout from '@/layouts/job-seeker-layout';
import { cn } from '@/lib/utils';

const filters: Array<'All' | ApplicationStatus> = [
    'All',
    'Applied',
    'Under Review',
    'Shortlisted',
    'Interview',
    'Rejected',
];

const progressSteps = [
    'Applied',
    'Under Review',
    'Shortlisted',
    'Interview',
    'Offer',
];

export default function JobSeekerApplications() {
    const [filter, setFilter] = useState<(typeof filters)[number]>('All');
    const [selectedId, setSelectedId] = useState<number | null>(null);
    const [withdrawId, setWithdrawId] = useState<number | null>(null);
    const [applications, setApplications] = useState(APPLICATIONS);

    const filtered = useMemo(() => {
        if (filter === 'All') {
            return applications;
        }

        return applications.filter((item) => item.status === filter);
    }, [applications, filter]);

    const selected = applications.find((item) => item.id === selectedId) ?? null;
    const withdrawTarget =
        applications.find((item) => item.id === withdrawId) ?? null;

    const counts = {
        All: applications.length,
        Applied: applications.filter((item) => item.status === 'Applied').length,
        'Under Review': applications.filter(
            (item) => item.status === 'Under Review',
        ).length,
        Shortlisted: applications.filter(
            (item) => item.status === 'Shortlisted',
        ).length,
        Interview: applications.filter((item) => item.status === 'Interview')
            .length,
        Rejected: applications.filter((item) => item.status === 'Rejected')
            .length,
    };

    return (
        <JobSeekerLayout title="My Applications">
            <Head title="My Applications" />

            <div className="space-y-6 p-6">
                <div>
                    <h1 className="text-2xl font-extrabold text-[#1e3a8a]">
                        My Applications
                    </h1>
                    <p className="mt-1 text-sm text-[#6a7282]">
                        Track the status of all your job applications.
                    </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    {[
                        {
                            label: 'Total Applications',
                            value: applications.length,
                            className: 'text-[#1d4ed8]',
                        },
                        {
                            label: 'Active',
                            value: applications.filter(
                                (item) => item.status !== 'Rejected',
                            ).length,
                            className: 'text-[#c2410c]',
                        },
                        {
                            label: 'Interviews',
                            value: applications.filter(
                                (item) => item.status === 'Interview',
                            ).length,
                            className: 'text-[#15803d]',
                        },
                        {
                            label: 'Offers',
                            value: 0,
                            className: 'text-[#7e22ce]',
                        },
                    ].map((stat) => (
                        <div
                            key={stat.label}
                            className="rounded-2xl border border-[#e2e8f0] bg-white p-5 shadow-[0px_1px_3px_rgba(0,0,0,0.06)]"
                        >
                            <p
                                className={`text-3xl font-extrabold ${stat.className}`}
                            >
                                {stat.value}
                            </p>
                            <p className="mt-1 text-xs font-medium text-[#6a7282]">
                                {stat.label}
                            </p>
                        </div>
                    ))}
                </div>

                <div className="flex flex-wrap gap-2">
                    {filters.map((item) => (
                        <button
                            key={item}
                            type="button"
                            onClick={() => setFilter(item)}
                            className={cn(
                                'rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors',
                                filter === item
                                    ? 'bg-[#1e3a8a] text-white'
                                    : 'bg-white text-[#3977a6] ring-1 ring-[#e2e8f0] hover:bg-[#f8faff]',
                            )}
                        >
                            {item} ({counts[item]})
                        </button>
                    ))}
                </div>

                <div className="space-y-4">
                    {filtered.map((application) => (
                        <div
                            key={application.id}
                            className="rounded-2xl border border-[#e2e8f0] bg-white p-5 shadow-[0px_1px_3px_rgba(0,0,0,0.06)]"
                        >
                            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                                <div className="flex gap-3">
                                    <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#1e3a8a] to-[#2563eb] text-sm font-bold text-white">
                                        {application.initials}
                                    </div>
                                    <div>
                                        <div className="flex flex-wrap items-center gap-2">
                                            <h2 className="text-base font-bold text-[#101828]">
                                                {application.title}
                                            </h2>
                                            <StatusBadge
                                                status={application.status}
                                                className="lg:hidden"
                                            />
                                        </div>
                                        <p className="mt-1 text-sm text-[#6a7282]">
                                            {application.company} ·{' '}
                                            {application.location}
                                        </p>
                                        <p className="mt-1 text-xs text-[#99a1af]">
                                            Applied: {application.appliedAt} ·
                                            Salary: {application.salary}
                                        </p>
                                    </div>
                                </div>
                                <StatusBadge
                                    status={application.status}
                                    className="hidden lg:inline-flex"
                                />
                            </div>

                            <div className="mt-4">
                                <div className="mb-2 flex justify-between gap-1 text-[10px] font-medium text-[#99a1af]">
                                    {progressSteps.map((step) => (
                                        <span key={step} className="flex-1 text-center">
                                            {step}
                                        </span>
                                    ))}
                                </div>
                                <div className="flex gap-1">
                                    {progressSteps.map((step, index) => (
                                        <div
                                            key={step}
                                            className={cn(
                                                'h-1.5 flex-1 rounded-full',
                                                index < application.progress
                                                    ? 'bg-[#1e3a8a]'
                                                    : 'bg-[#e2e8f0]',
                                            )}
                                        />
                                    ))}
                                </div>
                            </div>

                            <div className="mt-4 flex flex-wrap gap-2">
                                <Button
                                    type="button"
                                    onClick={() =>
                                        setSelectedId(application.id)
                                    }
                                    className="rounded-xl bg-[#0057c8] text-white hover:bg-[#0046a3]"
                                >
                                    View Details
                                </Button>
                                {application.status !== 'Rejected' && (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() =>
                                            setWithdrawId(application.id)
                                        }
                                        className="rounded-xl border-[#e2e8f0] text-[#64748b]"
                                    >
                                        Withdraw
                                    </Button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <Sheet
                open={selected !== null}
                onOpenChange={(open) => {
                    if (!open) {
                        setSelectedId(null);
                    }
                }}
            >
                <SheetContent className="w-full overflow-y-auto sm:max-w-md">
                    {selected && (
                        <>
                            <SheetHeader>
                                <SheetTitle>View Details</SheetTitle>
                            </SheetHeader>
                            <div className="mt-6 space-y-6">
                                <div className="flex gap-3">
                                    <div className="flex size-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#1e3a8a] to-[#2563eb] text-sm font-bold text-white">
                                        {selected.initials}
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-[#101828]">
                                            {selected.title}
                                        </h3>
                                        <p className="text-sm text-[#6a7282]">
                                            {selected.company}
                                        </p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <Detail
                                        label="Applied"
                                        value={selected.appliedAt}
                                    />
                                    <Detail
                                        label="Salary"
                                        value={selected.salary}
                                    />
                                    <Detail label="Type" value={selected.type} />
                                    <Detail
                                        label="Location"
                                        value={selected.location}
                                    />
                                    <Detail
                                        label="Resume Used"
                                        value={selected.resume}
                                    />
                                    <div>
                                        <p className="text-xs text-[#99a1af]">
                                            Status
                                        </p>
                                        <div className="mt-1">
                                            <StatusBadge
                                                status={selected.status}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <h4 className="mb-4 text-sm font-bold text-[#101828]">
                                        Application Timeline
                                    </h4>
                                    <div className="space-y-4">
                                        {selected.timeline.map((step, index) => (
                                            <div
                                                key={step.label}
                                                className="flex gap-3"
                                            >
                                                <div className="flex flex-col items-center">
                                                    <span
                                                        className={cn(
                                                            'flex size-6 items-center justify-center rounded-full',
                                                            step.state === 'done' &&
                                                            'bg-[#0057c8] text-white',
                                                            step.state ===
                                                            'current' &&
                                                            'border-2 border-[#0057c8] bg-white',
                                                            step.state ===
                                                            'pending' &&
                                                            'border border-[#e2e8f0] bg-[#f8faff]',
                                                        )}
                                                    >
                                                        {step.state ===
                                                            'done' && (
                                                                <Check className="size-3.5" />
                                                            )}
                                                        {step.state ===
                                                            'current' && (
                                                                <span className="size-2 rounded-full bg-[#0057c8]" />
                                                            )}
                                                    </span>
                                                    {index <
                                                        selected.timeline
                                                            .length -
                                                        1 && (
                                                            <span className="mt-1 w-px flex-1 bg-[#e2e8f0]" />
                                                        )}
                                                </div>
                                                <div className="pb-4">
                                                    <p
                                                        className={cn(
                                                            'text-sm font-semibold',
                                                            step.state ===
                                                                'pending'
                                                                ? 'text-[#99a1af]'
                                                                : 'text-[#101828]',
                                                        )}
                                                    >
                                                        {step.label}
                                                    </p>
                                                    {step.date && (
                                                        <p className="text-xs text-[#99a1af]">
                                                            {step.date}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {selected.status !== 'Rejected' && (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => {
                                            setWithdrawId(selected.id);
                                        }}
                                        className="w-full rounded-xl border-[#fecaca] text-[#b91c1c] hover:bg-[#fef2f2]"
                                    >
                                        Withdraw
                                    </Button>
                                )}
                            </div>
                        </>
                    )}
                </SheetContent>
            </Sheet>

            <Dialog
                open={withdrawTarget !== null}
                onOpenChange={(open) => {
                    if (!open) {
                        setWithdrawId(null);
                    }
                }}
            >
                <DialogContent className="max-w-md rounded-2xl">
                    <DialogHeader className="items-center text-center">
                        <div className="mb-2 flex size-12 items-center justify-center rounded-full bg-[#fef3c7] text-[#d97706]">
                            <AlertTriangle className="size-6" />
                        </div>
                        <DialogTitle>Withdraw</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to withdraw this application
                            {withdrawTarget
                                ? ` for ${withdrawTarget.title}`
                                : ''}
                            ?
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2 sm:justify-center">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setWithdrawId(null)}
                            className="rounded-xl"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            onClick={() => {
                                if (withdrawId !== null) {
                                    setApplications((current) =>
                                        current.filter(
                                            (item) => item.id !== withdrawId,
                                        ),
                                    );
                                    if (selectedId === withdrawId) {
                                        setSelectedId(null);
                                    }
                                }
                                setWithdrawId(null);
                            }}
                            className="rounded-xl bg-[#ef4444] text-white hover:bg-[#dc2626]"
                        >
                            Yes, Withdraw
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </JobSeekerLayout>
    );
}

function Detail({ label, value }: { label: string; value: string }) {
    return (
        <div>
            <p className="text-xs text-[#99a1af]">{label}</p>
            <p className="mt-1 text-sm font-medium text-[#101828]">{value}</p>
        </div>
    );
}
