import { Head } from '@inertiajs/react';
import {
    Building2,
    Check,
    Clock,
    FileText,
    ShieldCheck,
    X,
} from 'lucide-react';

import {
    AdminPageHeader,
    AdminPanel,
    AdminPrimaryButton,
    AdminSecondaryButton,
    AdminStatCard,
    AdminStatusBadge,
} from '@/components/admin-portal/ui';
import AdminPortalLayout from '@/layouts/admin-portal-layout';
import { cn } from '@/lib/utils';

const verificationStats = [
    {
        label: 'Pending Review',
        value: '23',
        tone: 'text-[#f59e0b]',
    },
    { label: 'Approved MTD', value: '184', tone: 'text-[#e57124]' },
    { label: 'Rejected MTD', value: '31', tone: 'text-[#ef4444]' },
    { label: 'Avg Review Time', value: '18h', tone: 'text-[#0057c8]' },
];

const verificationCards = [
    {
        id: 'VER-001',
        company: 'Gulf Construction Co.',
        contact: 'Sara Al-Mansoori',
        email: 'sara@gulfconst.ae',
        docs: ['Trade License', 'Emirates ID', 'Company Profile'],
        status: 'Pending',
        priority: 'High',
        date: '2024-03-11',
    },
    {
        id: 'VER-002',
        company: 'Bright Health Clinics',
        contact: 'Nadia Rahim',
        email: 'nadia@brighthealth.ae',
        docs: ['Trade License', 'Health Authority Permit'],
        status: 'Pending',
        priority: 'Medium',
        date: '2024-03-10',
    },
    {
        id: 'VER-003',
        company: 'Emirates Tech Solutions',
        contact: 'Omar Hassan',
        email: 'omar@emiratestech.ae',
        docs: ['Trade License', 'VAT Certificate', 'Bank Statement'],
        status: 'Approved',
        priority: 'Low',
        date: '2024-03-08',
    },
    {
        id: 'VER-004',
        company: 'Nova Retail LLC',
        contact: 'Lina Farouk',
        email: 'lina@novaretail.ae',
        docs: ['Trade License', 'Emirates ID'],
        status: 'Rejected',
        priority: 'High',
        date: '2024-03-07',
    },
    {
        id: 'VER-005',
        company: 'Skyline Hospitality',
        contact: 'Ahmed Zayed',
        email: 'ahmed@skylinehospitality.ae',
        docs: ['Trade License', 'Tourism License', 'Company Profile'],
        status: 'Pending',
        priority: 'Low',
        date: '2024-03-06',
    },
];

function statusTone(
    status: string,
): 'success' | 'warning' | 'danger' {
    if (status === 'Approved') {
        return 'success';
    }
    if (status === 'Pending') {
        return 'warning';
    }
    return 'danger';
}

function priorityTone(
    priority: string,
): 'danger' | 'warning' | 'neutral' {
    if (priority === 'High') {
        return 'danger';
    }
    if (priority === 'Medium') {
        return 'warning';
    }
    return 'neutral';
}

export default function VerificationCenter() {
    return (
        <AdminPortalLayout>
            <Head title="Verification Center" />

            <div className="space-y-6 p-6">
                <AdminPageHeader
                    title="Verification Center"
                    subtitle="Review employer documents and manage verification decisions."
                />

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    {verificationStats.map((stat, index) => (
                        <AdminStatCard
                            key={stat.label}
                            label={stat.label}
                            value={stat.value}
                            valueClassName={stat.tone}
                            icon={
                                [Clock, ShieldCheck, X, FileText][index]
                            }
                        />
                    ))}
                </div>

                <div className="space-y-4">
                    {verificationCards.map((card) => (
                        <AdminPanel key={card.id}>
                            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                                <div className="flex items-start gap-4">
                                    <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-[#eef2ff] text-[#0057c8]">
                                        <Building2 className="size-6" />
                                    </div>
                                    <div>
                                        <div className="flex flex-wrap items-center gap-2">
                                            <h3 className="text-base font-extrabold text-[#050315]">
                                                {card.company}
                                            </h3>
                                            <AdminStatusBadge
                                                label={card.status}
                                                tone={statusTone(card.status)}
                                            />
                                            <AdminStatusBadge
                                                label={`${card.priority} Priority`}
                                                tone={priorityTone(
                                                    card.priority,
                                                )}
                                            />
                                        </div>
                                        <p className="mt-1 text-sm text-[#64748b]">
                                            {card.contact} · {card.email}
                                        </p>
                                        <div className="mt-2 flex flex-wrap gap-1.5">
                                            {card.docs.map((doc) => (
                                                <span
                                                    key={doc}
                                                    className="inline-flex items-center gap-1 rounded-lg border border-[#e2e8f0] bg-[#f8faff] px-2 py-1 text-xs font-medium text-[#3977a6]"
                                                >
                                                    <FileText className="size-3" />
                                                    {doc}
                                                </span>
                                            ))}
                                        </div>
                                        <p className="mt-2 text-xs text-[#94a3b8]">
                                            Submitted {card.date}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex flex-wrap items-center gap-2">
                                    <AdminSecondaryButton>
                                        <FileText className="size-4" />
                                        Review Docs
                                    </AdminSecondaryButton>
                                    {card.status === 'Pending' && (
                                        <>
                                            <AdminPrimaryButton
                                                className={cn(
                                                    'bg-[#065f46] hover:bg-[#047857]',
                                                )}
                                            >
                                                <Check className="size-4" />
                                                Approve
                                            </AdminPrimaryButton>
                                            <button
                                                type="button"
                                                className={cn(
                                                    'inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5',
                                                    'bg-[#fee2e2] text-sm font-semibold text-[#991b1b] hover:bg-[#fecaca]',
                                                )}
                                            >
                                                <X className="size-4" />
                                                Reject
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        </AdminPanel>
                    ))}
                </div>
            </div>
        </AdminPortalLayout>
    );
}
