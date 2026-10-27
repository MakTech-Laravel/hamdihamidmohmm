import { useCallback, useEffect, useState } from 'react';

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { useLocale } from '@/hooks/use-locale';

type PanelMember = {
    id: number;
    name: string;
    email: string;
};

type PanelPayload = {
    assigned: PanelMember[];
    eligible: PanelMember[];
};

type Props = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    jobId: number | null;
    jobTitle?: string | null;
};

const xsrfToken = (): string | null => {
    const raw = document.cookie
        .split('; ')
        .find((row) => row.startsWith('XSRF-TOKEN='))
        ?.split('=')
        .slice(1)
        .join('=');

    return raw ? decodeURIComponent(raw) : null;
};

const jsonHeaders = (): HeadersInit => {
    const token = xsrfToken();

    return {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        ...(token ? { 'X-XSRF-TOKEN': token } : {}),
    };
};

export function JobPanelDialog({
    open,
    onOpenChange,
    jobId,
    jobTitle,
}: Props) {
    const { t } = useLocale();
    const [assigned, setAssigned] = useState<PanelMember[]>([]);
    const [eligible, setEligible] = useState<PanelMember[]>([]);
    const [selectedUserId, setSelectedUserId] = useState('');
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const loadPanel = useCallback(async (): Promise<void> => {
        if (!jobId) {
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const response = await fetch(`/employer/jobs/${jobId}/panel`, {
                headers: { Accept: 'application/json' },
            });

            if (!response.ok) {
                throw new Error('load_failed');
            }

            const payload = (await response.json()) as PanelPayload;
            setAssigned(payload.assigned ?? []);
            setEligible(payload.eligible ?? []);
            setSelectedUserId('');
        } catch {
            setError(t('employer.jobs.panel.load_error'));
            setAssigned([]);
            setEligible([]);
        } finally {
            setLoading(false);
        }
    }, [jobId, t]);

    useEffect(() => {
        if (!open || !jobId) {
            return;
        }

        void loadPanel();
    }, [open, jobId, loadPanel]);

    const addMember = async (): Promise<void> => {
        if (!jobId || selectedUserId === '') {
            return;
        }

        setSaving(true);
        setError(null);

        try {
            const response = await fetch(`/employer/jobs/${jobId}/panel`, {
                method: 'POST',
                headers: jsonHeaders(),
                body: JSON.stringify({ user_id: Number(selectedUserId) }),
            });

            if (!response.ok) {
                const payload = (await response.json().catch(() => null)) as {
                    message?: string;
                    errors?: Record<string, string[]>;
                } | null;
                const firstError = payload?.errors
                    ? Object.values(payload.errors)[0]?.[0]
                    : null;
                throw new Error(
                    firstError ||
                        payload?.message ||
                        t('employer.jobs.panel.add_error'),
                );
            }

            await loadPanel();
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : t('employer.jobs.panel.add_error'),
            );
        } finally {
            setSaving(false);
        }
    };

    const removeMember = async (userId: number): Promise<void> => {
        if (!jobId) {
            return;
        }

        setSaving(true);
        setError(null);

        try {
            const response = await fetch(
                `/employer/jobs/${jobId}/panel/${userId}`,
                {
                    method: 'DELETE',
                    headers: jsonHeaders(),
                },
            );

            if (!response.ok) {
                throw new Error(t('employer.jobs.panel.remove_error'));
            }

            await loadPanel();
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : t('employer.jobs.panel.remove_error'),
            );
        } finally {
            setSaving(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>{t('employer.jobs.panel.title')}</DialogTitle>
                    <DialogDescription>
                        {jobTitle
                            ? t('employer.jobs.panel.subtitle_named', {
                                  title: jobTitle,
                              })
                            : t('employer.jobs.panel.subtitle')}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    {error && (
                        <p className="rounded-lg bg-[#fef2f2] px-3 py-2 text-sm text-[#b91c1c]">
                            {error}
                        </p>
                    )}

                    <div className="flex items-end gap-2">
                        <label className="block min-w-0 flex-1 text-sm">
                            <span className="mb-1 block font-medium text-[#050315]">
                                {t('employer.jobs.panel.member')}
                            </span>
                            <select
                                value={selectedUserId}
                                onChange={(event) =>
                                    setSelectedUserId(event.target.value)
                                }
                                disabled={loading || saving || eligible.length === 0}
                                className="h-10 w-full rounded-xl border border-[#dbe4ef] bg-white px-3 text-sm outline-none focus:border-[#0057c8]"
                            >
                                <option value="">
                                    {eligible.length === 0
                                        ? t('employer.jobs.panel.no_eligible')
                                        : t('employer.jobs.panel.choose_member')}
                                </option>
                                {eligible.map((member) => (
                                    <option key={member.id} value={member.id}>
                                        {member.name} ({member.email})
                                    </option>
                                ))}
                            </select>
                        </label>
                        <button
                            type="button"
                            disabled={
                                loading ||
                                saving ||
                                selectedUserId === '' ||
                                eligible.length === 0
                            }
                            onClick={() => void addMember()}
                            className="inline-flex h-10 shrink-0 items-center justify-center rounded-xl bg-[#0057c8] px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {t('employer.jobs.panel.add')}
                        </button>
                    </div>

                    <div>
                        <p className="mb-2 text-sm font-medium text-[#050315]">
                            {t('employer.jobs.panel.assigned')}
                        </p>
                        {loading ? (
                            <p className="text-sm text-[#64748b]">
                                {t('common.loading')}
                            </p>
                        ) : assigned.length === 0 ? (
                            <p className="rounded-xl border border-dashed border-[#dbe4ef] px-3 py-4 text-center text-sm text-[#64748b]">
                                {t('employer.jobs.panel.empty')}
                            </p>
                        ) : (
                            <ul className="divide-y divide-[#e2e8f0] overflow-hidden rounded-xl border border-[#e2e8f0]">
                                {assigned.map((member) => (
                                    <li
                                        key={member.id}
                                        className="flex items-center justify-between gap-3 px-3 py-2.5"
                                    >
                                        <div className="min-w-0">
                                            <p className="truncate text-sm font-medium text-[#0f172a]">
                                                {member.name}
                                            </p>
                                            <p className="truncate text-xs text-[#64748b]">
                                                {member.email}
                                            </p>
                                        </div>
                                        <button
                                            type="button"
                                            disabled={saving}
                                            onClick={() =>
                                                void removeMember(member.id)
                                            }
                                            className="shrink-0 rounded-lg bg-[#fef2f2] px-2.5 py-1.5 text-xs font-semibold text-[#b91c1c] disabled:opacity-50"
                                        >
                                            {t('common.remove')}
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
