import { Head, router, usePage } from '@inertiajs/react';
import { Building2, Check, ShieldCheck, X } from 'lucide-react';
import { useState } from 'react';

import {
    AdminPageHeader,
    AdminPanel,
    AdminStatCard,
} from '@/components/admin-portal/ui';
import { Button } from '@/components/ui/button';
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

type PendingEmployer = {
    id: number;
    company_name: string;
    contact: string;
    email: string;
    industry: string;
    created_at: string | null;
    can_review: boolean;
    has_document: boolean;
    document_name: string | null;
    document_url: string | null;
};

type Props = {
    pending: PendingEmployer[];
    stats: {
        pending: number;
        approved: number;
        rejected: number;
        total: number;
    };
};

export default function VerificationCenter({ pending, stats }: Props) {
    const { flash } = usePage<SharedData>().props;
    const { t } = useLocale();
    const [rejecting, setRejecting] = useState<PendingEmployer | null>(null);
    const [reason, setReason] = useState('');

    return (
        <AdminPortalLayout>
            <Head title={t('admin.verifications.title')} />

            <div className="space-y-6 p-6">
                <AdminPageHeader
                    title={t('admin.verifications.title')}
                    subtitle={t('admin.verifications.subtitle')}
                />

                {flash.success && (
                    <div className="rounded-xl border border-[#bbf7d0] bg-[#f0fdf4] px-4 py-3 text-sm text-[#15803d]">
                        {typeof flash.success === 'string'
                            ? flash.success
                            : t('common.saved')}
                    </div>
                )}

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <AdminStatCard
                        label={t('admin.verifications.stats.pending')}
                        value={String(stats.pending)}
                        valueClassName="text-[#f59e0b]"
                        icon={ShieldCheck}
                    />
                    <AdminStatCard
                        label={t('admin.verifications.stats.approved')}
                        value={String(stats.approved)}
                        valueClassName="text-[#10b981]"
                        icon={Building2}
                    />
                    <AdminStatCard
                        label={t('admin.verifications.stats.rejected')}
                        value={String(stats.rejected)}
                        valueClassName="text-[#ef4444]"
                        icon={Building2}
                    />
                    <AdminStatCard
                        label={t('admin.verifications.stats.total')}
                        value={String(stats.total)}
                        valueClassName="text-[#0057c8]"
                        icon={Building2}
                    />
                </div>

                <div className="grid gap-4">
                    {pending.map((item) => (
                        <AdminPanel
                            key={item.id}
                            className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"
                        >
                            <div>
                                <h2 className="text-base font-bold text-[#050315]">
                                    {item.company_name}
                                </h2>
                                <p className="text-sm text-[#64748b]">
                                    {item.contact} · {item.email}
                                </p>
                                <p className="text-xs text-[#99a1af]">
                                    {item.industry} · {item.created_at}
                                </p>
                                <div className="mt-2">
                                    {item.has_document && item.document_url ? (
                                        <a
                                            href={item.document_url}
                                            className="inline-flex items-center rounded-full bg-[#e6f0fb] px-2.5 py-1 text-xs font-semibold text-[#0057c8]"
                                        >
                                            {t('admin.verifications.document')}:{' '}
                                            {item.document_name ||
                                                t('common.download')}
                                        </a>
                                    ) : (
                                        <span className="inline-flex items-center rounded-full bg-[#f1f5f9] px-2.5 py-1 text-xs font-semibold text-[#64748b]">
                                            {t('admin.verifications.no_document')}
                                        </span>
                                    )}
                                </div>
                            </div>
                            {item.can_review && (
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        className="inline-flex items-center gap-1 rounded-xl bg-[#d1fae5] px-3 py-2 text-sm font-semibold text-[#065f46]"
                                        onClick={() =>
                                            router.post(
                                                `/admin/employers/${item.id}/approve`,
                                            )
                                        }
                                    >
                                        <Check className="size-4" />
                                        {t('common.approve')}
                                    </button>
                                    <button
                                        type="button"
                                        className="inline-flex items-center gap-1 rounded-xl bg-[#fee2e2] px-3 py-2 text-sm font-semibold text-[#991b1b]"
                                        onClick={() => {
                                            setReason('');
                                            setRejecting(item);
                                        }}
                                    >
                                        <X className="size-4" />
                                        {t('common.reject')}
                                    </button>
                                </div>
                            )}
                        </AdminPanel>
                    ))}
                    {pending.length === 0 && (
                        <p className="text-center text-sm text-[#99a1af]">
                            {t('admin.verifications.empty')}
                        </p>
                    )}
                </div>
            </div>

            <Dialog
                open={rejecting !== null}
                onOpenChange={(open) => {
                    if (!open) {
                        setRejecting(null);
                    }
                }}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{t('admin.verifications.reject_title')}</DialogTitle>
                        <DialogDescription>
                            {t('admin.verifications.reject_prompt')}
                        </DialogDescription>
                    </DialogHeader>
                    <Label htmlFor="verify_reject">{t('common.reason')}</Label>
                    <Textarea
                        id="verify_reject"
                        value={reason}
                        onChange={(event) => setReason(event.target.value)}
                    />
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setRejecting(null)}
                        >
                            {t('common.cancel')}
                        </Button>
                        <Button
                            type="button"
                            disabled={reason.trim() === ''}
                            className="bg-[#b91c1c] text-white hover:bg-[#991b1b]"
                            onClick={() => {
                                if (rejecting === null) {
                                    return;
                                }

                                router.post(
                                    `/admin/employers/${rejecting.id}/reject`,
                                    { rejection_reason: reason.trim() },
                                    { onSuccess: () => setRejecting(null) },
                                );
                            }}
                        >
                            {t('common.reject')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AdminPortalLayout>
    );
}
