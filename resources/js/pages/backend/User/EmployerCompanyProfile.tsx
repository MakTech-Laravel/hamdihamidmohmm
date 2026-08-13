import { Head, usePage } from '@inertiajs/react';
import { AlertTriangle, CheckCircle2, Pencil } from 'lucide-react';

import {
    COMPANY_PROFILE_SECTIONS,
    PROFILE_COMPLETION,
} from '@/components/employer/demo-data';
import EmployerLayout from '@/layouts/employer-layout';
import { cn } from '@/lib/utils';
import type { SharedData } from '@/types';

export default function EmployerCompanyProfile() {
    const { auth } = usePage<SharedData>().props;
    const companyName = auth.user.company_name || 'TechCorp Solutions';

    return (
        <EmployerLayout title="Company Profile">
            <Head title="Company Profile" />

            <div className="space-y-6 px-4 py-6 sm:px-6">
                <div>
                    <h1 className="text-[28px] font-extrabold tracking-tight text-[#050315]">
                        Company Profile
                    </h1>
                    <p className="mt-1 text-sm text-[#3977a6]">
                        Manage your company information and verification status
                    </p>
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
                    <div className="rounded-2xl border border-[#e8d5e8] bg-white p-6 shadow-[0px_2px_4px_rgba(5,3,21,0.06)]">
                        <h2 className="text-base font-bold text-[#050315]">
                            Profile Completion
                        </h2>
                        <div className="mt-4 flex items-center gap-6">
                            <div className="relative flex size-24 shrink-0 items-center justify-center">
                                <svg
                                    className="size-24 -rotate-90"
                                    viewBox="0 0 100 100"
                                >
                                    <circle
                                        cx="50"
                                        cy="50"
                                        r="42"
                                        fill="none"
                                        stroke="#f3f4f6"
                                        strokeWidth="10"
                                    />
                                    <circle
                                        cx="50"
                                        cy="50"
                                        r="42"
                                        fill="none"
                                        stroke="#0057c8"
                                        strokeWidth="10"
                                        strokeLinecap="round"
                                        strokeDasharray={`${PROFILE_COMPLETION.percent * 2.64} 264`}
                                    />
                                </svg>
                                <span className="absolute text-xl font-bold text-[#0057c8]">
                                    {PROFILE_COMPLETION.percent}%
                                </span>
                            </div>
                            <div>
                                <p className="font-semibold text-[#050315]">
                                    {PROFILE_COMPLETION.completed} of{' '}
                                    {PROFILE_COMPLETION.total} sections complete
                                </p>
                                <p className="mt-1 text-sm text-[#6b7280]">
                                    Missing:{' '}
                                    {PROFILE_COMPLETION.missing.join(' + ')}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-2xl border border-[#e8d5e8] bg-white p-6 shadow-[0px_2px_4px_rgba(5,3,21,0.06)]">
                        <h2 className="text-base font-bold text-[#050315]">
                            Verification Status
                        </h2>
                        <div className="mt-4 flex items-start gap-4">
                            <div className="flex size-12 items-center justify-center rounded-full bg-[#dcfce7]">
                                <CheckCircle2 className="size-6 text-[#166534]" />
                            </div>
                            <div>
                                <span className="inline-flex rounded-full bg-[#dcfce7] px-3 py-1 text-xs font-bold text-[#166534]">
                                    Verified
                                </span>
                                <p className="mt-2 text-sm text-[#6b7280]">
                                    Verified on {PROFILE_COMPLETION.verifiedOn}
                                </p>
                                <p className="mt-1 text-sm font-medium text-[#050315]">
                                    {companyName}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    {COMPANY_PROFILE_SECTIONS.map((section) => (
                        <div
                            key={section.id}
                            className="rounded-2xl border border-[#e8d5e8] bg-white p-6 shadow-[0px_2px_4px_rgba(5,3,21,0.06)]"
                        >
                            <div className="flex flex-wrap items-start justify-between gap-3">
                                <div className="flex items-center gap-2">
                                    <h3 className="text-base font-bold text-[#050315]">
                                        {section.title}
                                    </h3>
                                    {section.status === 'complete' ? (
                                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#166534]">
                                            <CheckCircle2 className="size-3.5" />
                                            Complete
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#e57124]">
                                            <AlertTriangle className="size-3.5" />
                                            Incomplete
                                        </span>
                                    )}
                                </div>
                                <button
                                    type="button"
                                    className="inline-flex items-center gap-1.5 rounded-lg border border-[#323981] px-3 py-1.5 text-xs font-semibold text-[#323981] transition-colors hover:bg-[#eeeffe]"
                                >
                                    <Pencil className="size-3.5" />
                                    Edit
                                </button>
                            </div>

                            <div className="mt-4">
                                {section.fields && (
                                    <dl className="grid gap-3 sm:grid-cols-2">
                                        {section.fields.map((field) => (
                                            <div key={field.label}>
                                                <dt className="text-xs text-[#6b7280]">
                                                    {field.label}
                                                </dt>
                                                <dd className="mt-0.5 text-sm font-medium text-[#050315]">
                                                    {field.value}
                                                </dd>
                                            </div>
                                        ))}
                                    </dl>
                                )}

                                {section.initials && (
                                    <div className="flex size-16 items-center justify-center rounded-xl bg-[#323981] text-xl font-bold text-white">
                                        {section.initials}
                                    </div>
                                )}

                                {section.content && (
                                    <p className="text-sm leading-relaxed text-[#050315]">
                                        {section.content}
                                    </p>
                                )}

                                {section.documentNote && (
                                    <p className="text-sm text-[#166534]">
                                        ✓ {section.documentNote}
                                    </p>
                                )}

                                {section.status === 'incomplete' &&
                                    section.emptyMessage && (
                                        <div
                                            className={cn(
                                                'rounded-xl p-4 text-sm',
                                                section.id === 'cover'
                                                    ? 'bg-linear-to-r from-[#323981]/10 to-[#3977a6]/10 text-[#6b7280]'
                                                    : 'border border-dashed border-[#e57124]/40 bg-[#fff9f5] text-[#e57124]',
                                            )}
                                        >
                                            {section.emptyMessage}
                                        </div>
                                    )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </EmployerLayout>
    );
}
