import { Head, Link, router, usePage } from '@inertiajs/react';

import {
    AdminPageHeader,
    AdminPanel,
    AdminPrimaryButton,
    AdminSecondaryButton,
    AdminStatusBadge,
} from '@/components/admin-portal/ui';
import { Button } from '@/components/ui/button';
import AdminPortalLayout from '@/layouts/admin-portal-layout';
import type { SharedData } from '@/types';

type JobSeeker = {
    id: number;
    name: string;
    email: string;
    phone: string;
    location: string;
    applications: number;
    resume: string;
    status: string;
    can_suspend: boolean;
    can_reactivate: boolean;
    created_at: string | null;
    updated_at: string | null;
};

type ActivityItem = {
    id: number;
    action_label: string;
    description: string;
    actor_name: string | null;
    created_at: string | null;
};

type Props = {
    jobSeeker: JobSeeker;
    activities: ActivityItem[];
};

function tone(
    value: string,
): 'success' | 'warning' | 'danger' | 'neutral' {
    if (value === 'Active') {
        return 'success';
    }
    if (value === 'Inactive' || value === 'Warning') {
        return 'warning';
    }
    if (value === 'Suspended') {
        return 'danger';
    }
    return 'neutral';
}

export default function JobSeekerShow({ jobSeeker, activities }: Props) {
    const { flash } = usePage<SharedData>().props;

    const facts = [
        ['Name', jobSeeker.name],
        ['Email', jobSeeker.email],
        ['Phone', jobSeeker.phone],
        ['Location', jobSeeker.location],
        ['Applications', String(jobSeeker.applications)],
        ['Resume', jobSeeker.resume],
        ['Registered', jobSeeker.created_at ?? '—'],
        ['Last updated', jobSeeker.updated_at ?? '—'],
    ];

    return (
        <AdminPortalLayout>
            <Head title={`${jobSeeker.name} · Job Seeker`} />

            <div className="space-y-6 p-6">
                <AdminPageHeader
                    title={jobSeeker.name}
                    subtitle="View job seeker details and account activity."
                    actions={
                        <div className="flex flex-wrap gap-2">
                            <Link href="/admin/job-seekers">
                                <AdminSecondaryButton>
                                    ← All Job Seekers
                                </AdminSecondaryButton>
                            </Link>
                            <Link
                                href={`/admin/job-seekers/${jobSeeker.id}/edit`}
                            >
                                <AdminPrimaryButton>Edit</AdminPrimaryButton>
                            </Link>
                        </div>
                    }
                />

                {flash.success && (
                    <div className="rounded-xl border border-[#bbf7d0] bg-[#f0fdf4] px-4 py-3 text-sm text-[#15803d]">
                        {typeof flash.success === 'string'
                            ? flash.success
                            : 'Saved successfully.'}
                    </div>
                )}

                <div className="flex flex-wrap gap-2">
                    <AdminStatusBadge
                        label={jobSeeker.status}
                        tone={tone(jobSeeker.status)}
                    />
                    <AdminStatusBadge
                        label={`Resume: ${jobSeeker.resume}`}
                        tone={tone(jobSeeker.resume)}
                    />
                </div>

                <div className="flex flex-wrap gap-2">
                    {jobSeeker.can_reactivate ? (
                        <Button
                            type="button"
                            className="rounded-xl bg-[#059669] text-white hover:bg-[#047857]"
                            onClick={() =>
                                router.post(
                                    `/admin/job-seekers/${jobSeeker.id}/reactivate`,
                                )
                            }
                        >
                            Reactivate
                        </Button>
                    ) : (
                        <Button
                            type="button"
                            className="rounded-xl bg-[#b91c1c] text-white hover:bg-[#991b1b]"
                            onClick={() =>
                                router.post(
                                    `/admin/job-seekers/${jobSeeker.id}/suspend`,
                                )
                            }
                        >
                            Suspend
                        </Button>
                    )}
                </div>

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {facts.map(([label, value]) => (
                        <div
                            key={label}
                            className="rounded-2xl border border-[#e2e8f0] bg-white p-4 shadow-[0px_1px_3px_rgba(0,0,0,0.06)]"
                        >
                            <p className="text-xs font-medium text-[#6a7282]">
                                {label}
                            </p>
                            <p className="mt-1 text-sm font-semibold text-[#101828]">
                                {value}
                            </p>
                        </div>
                    ))}
                </div>

                <AdminPanel>
                    <h2 className="mb-4 text-base font-bold text-[#101828]">
                        Activity
                    </h2>
                    {activities.length === 0 ? (
                        <p className="text-sm text-[#99a1af]">
                            No tracked activity yet.
                        </p>
                    ) : (
                        <ol className="space-y-4">
                            {activities.map((item) => (
                                <li
                                    key={item.id}
                                    className="border-l-2 border-[#dbeafe] pl-3"
                                >
                                    <p className="text-sm font-semibold text-[#101828]">
                                        {item.action_label}
                                    </p>
                                    <p className="text-xs text-[#64748b]">
                                        {item.description}
                                    </p>
                                    <p className="mt-1 text-[11px] text-[#99a1af]">
                                        {item.actor_name ?? 'System'} ·{' '}
                                        {item.created_at}
                                    </p>
                                </li>
                            ))}
                        </ol>
                    )}
                </AdminPanel>
            </div>
        </AdminPortalLayout>
    );
}
