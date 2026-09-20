import { Head, Link, router, usePage } from '@inertiajs/react';
import { useState } from 'react';

import {
    approve,
    index,
    reject,
} from '@/actions/App/Http/Controllers/Backend/Admin/JobManagementController';
import {
    AdminPageHeader,
    AdminPanel,
    AdminPrimaryButton,
    AdminSecondaryButton,
    AdminStatusBadge,
} from '@/components/admin-portal/ui';
import { AboutCompanyCard } from '@/components/employer/about-company-card';
import { Button } from '@/components/ui/button';
import { RichTextContent } from '@/components/ui/rich-text-editor';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useLocale } from '@/hooks/use-locale';
import AdminPortalLayout from '@/layouts/admin-portal-layout';
import type { SharedData } from '@/types';

type Job = {
    id: number;
    title: string;
    subtitle?: string | null;
    employer: string;
    employer_email?: string | null;
    category: string;
    location: string;
    applications: number;
    views: number;
    status: string;
    created: string | null;
    description: string | null;
    requirements: string | null;
    skills: string[];
    experience_level: string | null;
    employment_type: string | null;
    salary_range: string | null;
    rejection_reason: string | null;
    expires_at: string | null;
    can_review: boolean;
    logo_url?: string | null;
    company_logo_url?: string | null;
    company_about?: string | null;
    company_industry?: string | null;
    company_website?: string | null;
};

export default function JobShow({ job }: { job: Job }) {
    const { flash } = usePage<SharedData>().props;
    const { t } = useLocale();
    const [rejectOpen, setRejectOpen] = useState(false);
    const [rejectionReason, setRejectionReason] = useState('');

    const complianceItems = [
        {
            label: t('admin.jobs.compliance.description'),
            ok: filled(job.description),
        },
        {
            label: t('admin.jobs.compliance.requirements'),
            ok: filled(job.requirements),
        },
        {
            label: t('admin.jobs.compliance.skills'),
            ok: job.skills.length > 0,
        },
        {
            label: t('admin.jobs.compliance.dates'),
            ok: filled(job.created) || filled(job.expires_at),
        },
        {
            label: t('admin.jobs.compliance.employer_contact'),
            ok: filled(job.employer_email),
        },
    ];

    return (
        <AdminPortalLayout>
            <Head title={job.title} />

            <div className="space-y-6 p-6">
                <AdminPageHeader
                    title={job.title}
                    subtitle={[job.subtitle, job.employer, job.location]
                        .filter(Boolean)
                        .join(' · ')}
                    actions={
                        <div className="flex flex-wrap gap-2">
                            <Link href={index.url()}>
                                <AdminSecondaryButton>
                                    {t('common.back')}
                                </AdminSecondaryButton>
                            </Link>
                            {job.can_review && (
                                <>
                                    <AdminPrimaryButton
                                        onClick={() =>
                                            router.post(approve.url(job.id))
                                        }
                                    >
                                        {t('common.approve')}
                                    </AdminPrimaryButton>
                                    <Button
                                        type="button"
                                        className="bg-[#b91c1c] text-white hover:bg-[#991b1b]"
                                        onClick={() => setRejectOpen(true)}
                                    >
                                        {t('common.reject')}
                                    </Button>
                                </>
                            )}
                        </div>
                    }
                />

                {job.logo_url ? (
                    <AdminPanel>
                        <h2 className="text-base font-bold text-[#050315]">
                            {t('admin.jobs.fields.job_logo')}
                        </h2>
                        <img
                            src={job.logo_url}
                            alt={job.title}
                            className="mt-3 size-[88px] rounded-xl border border-[#e2e8f0] bg-[#f8faff] object-contain p-1.5"
                        />
                    </AdminPanel>
                ) : null}
                {flash.success && (
                    <div className="rounded-xl border border-[#bbf7d0] bg-[#f0fdf4] px-4 py-3 text-sm text-[#15803d]">
                        {typeof flash.success === 'string'
                            ? flash.success
                            : t('common.saved')}
                    </div>
                )}

                <div className="grid gap-4 lg:grid-cols-3">
                    <div className="space-y-4 lg:col-span-2">
                        <AdminPanel>
                            <h2 className="text-base font-bold text-[#050315]">
                                {t('common.description')}
                            </h2>
                            {job.description ? (
                                <div className="mt-3">
                                    <RichTextContent html={job.description} />
                                </div>
                            ) : (
                                <p className="mt-3 text-sm leading-6 text-[#475569]">
                                    {t('admin.jobs.no_description')}
                                </p>
                            )}
                        </AdminPanel>

                        <AdminPanel>
                            <h2 className="text-base font-bold text-[#050315]">
                                {t('admin.jobs.fields.requirements')}
                            </h2>
                            <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-[#475569]">
                                {job.requirements ||
                                    t('admin.jobs.no_requirements')}
                            </p>
                        </AdminPanel>

                        <AdminPanel>
                            <h2 className="text-base font-bold text-[#050315]">
                                {t('admin.jobs.fields.skills')}
                            </h2>
                            {job.skills.length > 0 ? (
                                <div className="mt-3 flex flex-wrap gap-2">
                                    {job.skills.map((skill) => (
                                        <span
                                            key={skill}
                                            className="inline-flex rounded-full bg-[#dbeafe] px-2.5 py-1 text-xs font-semibold text-[#1e40af]"
                                        >
                                            {skill}
                                        </span>
                                    ))}
                                </div>
                            ) : (
                                <p className="mt-3 text-sm text-[#94a3b8]">
                                    {t('admin.jobs.no_skills')}
                                </p>
                            )}
                        </AdminPanel>

                        <AboutCompanyCard
                            title={t('job_detail.about_company')}
                            companyName={job.employer}
                            industry={job.company_industry}
                            about={job.company_about}
                            website={job.company_website}
                            logoUrl={job.company_logo_url}
                            initials={job.employer.slice(0, 2).toUpperCase()}
                            visitWebsiteLabel={t('job_detail.visit_website')}
                        />
                    </div>

                    <div className="space-y-4">
                        <AdminPanel className="space-y-3">
                            <AdminStatusBadge label={job.status} tone="info" />
                            <p className="text-sm text-[#64748b]">
                                {t('admin.jobs.fields.employer')}:{' '}
                                {job.employer}
                            </p>
                            <p className="text-sm text-[#64748b]">
                                {t('admin.jobs.fields.email')}:{' '}
                                {job.employer_email || '—'}
                            </p>
                            <p className="text-sm text-[#64748b]">
                                {t('admin.jobs.fields.industry')}:{' '}
                                {job.company_industry || '—'}
                            </p>
                            <p className="text-sm text-[#64748b]">
                                {t('admin.jobs.fields.website')}:{' '}
                                {job.company_website || '—'}
                            </p>
                            <p className="text-sm text-[#64748b]">
                                {t('admin.jobs.fields.category')}:{' '}
                                {job.category}
                            </p>
                            <p className="text-sm text-[#64748b]">
                                {t('admin.jobs.fields.type')}:{' '}
                                {job.employment_type || '—'}
                            </p>
                            <p className="text-sm text-[#64748b]">
                                {t('admin.jobs.fields.experience')}:{' '}
                                {job.experience_level || '—'}
                            </p>
                            <p className="text-sm text-[#64748b]">
                                {t('admin.jobs.fields.salary')}:{' '}
                                {job.salary_range || '—'}
                            </p>
                            <p className="text-sm text-[#64748b]">
                                {t('admin.jobs.fields.posted')}:{' '}
                                {job.created || '—'}
                            </p>
                            <p className="text-sm text-[#64748b]">
                                {t('admin.jobs.fields.expires')}:{' '}
                                {job.expires_at || '—'}
                            </p>
                            <p className="text-sm text-[#64748b]">
                                {t('admin.jobs.fields.applications')}:{' '}
                                {job.applications}
                            </p>
                            <p className="text-sm text-[#64748b]">
                                {t('admin.jobs.fields.views')}: {job.views}
                            </p>
                            {job.rejection_reason && (
                                <p className="text-sm text-[#b91c1c]">
                                    {t('admin.jobs.fields.rejection')}:{' '}
                                    {job.rejection_reason}
                                </p>
                            )}
                        </AdminPanel>

                        <AdminPanel>
                            <h2 className="text-base font-bold text-[#050315]">
                                {t('admin.jobs.compliance.title')}
                            </h2>
                            <p className="mt-1 text-xs text-[#64748b]">
                                {t('admin.jobs.compliance.hint')}
                            </p>
                            <ul className="mt-3 space-y-2">
                                {complianceItems.map((item) => (
                                    <li
                                        key={item.label}
                                        className="flex items-center justify-between gap-3 text-sm"
                                    >
                                        <span className="text-[#475569]">
                                            {item.label}
                                        </span>
                                        <span
                                            className={
                                                item.ok
                                                    ? 'font-semibold text-[#15803d]'
                                                    : 'font-semibold text-[#b91c1c]'
                                            }
                                        >
                                            {item.ok
                                                ? t('admin.jobs.compliance.ok')
                                                : t(
                                                    'admin.jobs.compliance.missing',
                                                )}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        </AdminPanel>
                    </div>
                </div>
            </div>

            <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{t('admin.jobs.reject_title')}</DialogTitle>
                        <DialogDescription>
                            {t('admin.jobs.reject_prompt')}
                        </DialogDescription>
                    </DialogHeader>
                    <Label htmlFor="job_reject_reason">
                        {t('common.reason')}
                    </Label>
                    <Textarea
                        id="job_reject_reason"
                        value={rejectionReason}
                        onChange={(event) =>
                            setRejectionReason(event.target.value)
                        }
                    />
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setRejectOpen(false)}
                        >
                            {t('common.cancel')}
                        </Button>
                        <Button
                            type="button"
                            disabled={rejectionReason.trim() === ''}
                            className="bg-[#b91c1c] text-white hover:bg-[#991b1b]"
                            onClick={() =>
                                router.post(
                                    reject.url(job.id),
                                    {
                                        rejection_reason:
                                            rejectionReason.trim(),
                                    },
                                    { onSuccess: () => setRejectOpen(false) },
                                )
                            }
                        >
                            {t('common.reject')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AdminPortalLayout>
    );
}

function filled(value: string | null | undefined): boolean {
    return typeof value === 'string' && value.trim() !== '';
}
