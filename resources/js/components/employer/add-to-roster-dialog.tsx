import { useForm } from '@inertiajs/react';
import { useEffect, useState, type FormEvent } from 'react';

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { useLocale } from '@/hooks/use-locale';

type Props = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    applicationId: number | null;
    categories: string[];
    candidateName?: string | null;
};

export function AddToRosterDialog({
    open,
    onOpenChange,
    applicationId,
    categories,
    candidateName,
}: Props) {
    const { t } = useLocale();
    const [useCustomCategory, setUseCustomCategory] = useState(
        categories.length === 0,
    );
    const form = useForm({
        application_id: applicationId ?? 0,
        category: categories[0] ?? '',
        comments: '',
    });

    useEffect(() => {
        if (!open) {
            return;
        }

        form.setData({
            application_id: applicationId ?? 0,
            category: categories[0] ?? '',
            comments: '',
        });
        setUseCustomCategory(categories.length === 0);
        form.clearErrors();
        // eslint-disable-next-line react-hooks/exhaustive-deps -- reset only when dialog opens
    }, [open, applicationId]);

    const submit = (event: FormEvent): void => {
        event.preventDefault();

        if (!applicationId) {
            return;
        }

        form.transform((data) => ({
            ...data,
            application_id: applicationId,
            category: data.category.trim(),
            comments: data.comments.trim() || null,
        }));

        form.post('/employer/roster', {
            preserveScroll: true,
            onSuccess: () => {
                onOpenChange(false);
                form.reset();
            },
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>{t('employer.roster.add_title')}</DialogTitle>
                    <DialogDescription>
                        {candidateName
                            ? t('employer.roster.add_subtitle_named', {
                                  name: candidateName,
                              })
                            : t('employer.roster.add_subtitle')}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={submit} className="space-y-4">
                    <label className="block text-sm">
                        <span className="mb-1 block font-medium text-[#050315]">
                            {t('employer.roster.field.category')}
                        </span>
                        {categories.length > 0 && !useCustomCategory ? (
                            <div className="flex flex-col gap-2">
                                <select
                                    value={form.data.category}
                                    onChange={(event) =>
                                        form.setData(
                                            'category',
                                            event.target.value,
                                        )
                                    }
                                    className="h-11 w-full rounded-xl border border-[#dbeafe] px-3"
                                >
                                    {categories.map((category) => (
                                        <option key={category} value={category}>
                                            {category}
                                        </option>
                                    ))}
                                </select>
                                <button
                                    type="button"
                                    className="self-start text-xs font-semibold text-[#0057c8]"
                                    onClick={() => {
                                        setUseCustomCategory(true);
                                        form.setData('category', '');
                                    }}
                                >
                                    {t('employer.roster.create_category')}
                                </button>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-2">
                                <input
                                    type="text"
                                    value={form.data.category}
                                    onChange={(event) =>
                                        form.setData(
                                            'category',
                                            event.target.value,
                                        )
                                    }
                                    placeholder={t(
                                        'employer.roster.category_placeholder',
                                    )}
                                    className="h-11 w-full rounded-xl border border-[#dbeafe] px-3"
                                    maxLength={100}
                                />
                                {categories.length > 0 ? (
                                    <button
                                        type="button"
                                        className="self-start text-xs font-semibold text-[#0057c8]"
                                        onClick={() => {
                                            setUseCustomCategory(false);
                                            form.setData(
                                                'category',
                                                categories[0] ?? '',
                                            );
                                        }}
                                    >
                                        {t('employer.roster.choose_existing')}
                                    </button>
                                ) : null}
                            </div>
                        )}
                        {form.errors.category ? (
                            <span className="mt-1 block text-xs text-[#b91c1c]">
                                {form.errors.category}
                            </span>
                        ) : null}
                    </label>

                    <label className="block text-sm">
                        <span className="mb-1 block font-medium text-[#050315]">
                            {t('employer.roster.field.comments')}
                        </span>
                        <textarea
                            value={form.data.comments}
                            onChange={(event) =>
                                form.setData('comments', event.target.value)
                            }
                            rows={4}
                            placeholder={t(
                                'employer.roster.comments_placeholder',
                            )}
                            className="w-full rounded-xl border border-[#dbeafe] px-3 py-2"
                            maxLength={2000}
                        />
                        {form.errors.comments ? (
                            <span className="mt-1 block text-xs text-[#b91c1c]">
                                {form.errors.comments}
                            </span>
                        ) : null}
                        {form.errors.application_id ? (
                            <span className="mt-1 block text-xs text-[#b91c1c]">
                                {form.errors.application_id}
                            </span>
                        ) : null}
                    </label>

                    <DialogFooter>
                        <button
                            type="button"
                            onClick={() => onOpenChange(false)}
                            className="inline-flex h-10 items-center rounded-xl border border-[#dbeafe] px-4 text-sm font-medium text-[#475569]"
                        >
                            {t('common.cancel')}
                        </button>
                        <button
                            type="submit"
                            disabled={
                                form.processing ||
                                !form.data.category.trim() ||
                                !applicationId
                            }
                            className="inline-flex h-10 items-center rounded-xl bg-[#0057c8] px-4 text-sm font-semibold text-white disabled:opacity-60"
                        >
                            {t('employer.roster.submit')}
                        </button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
