import { Head, router, useForm, usePage } from '@inertiajs/react';
import { Trash2, Upload } from 'lucide-react';
import { type FormEvent, useRef } from 'react';

import {
    AdminPageHeader,
    AdminPanel,
    AdminPrimaryButton,
    AdminSecondaryButton,
} from '@/components/admin-portal/ui';
import InputError from '@/components/input-error';
import { Label } from '@/components/ui/label';
import { useLocale } from '@/hooks/use-locale';
import AdminPortalLayout from '@/layouts/admin-portal-layout';
import type { SharedData } from '@/types';

type Props = {
    heroVideoUrl: string | null;
};

export default function TrainingMedia({ heroVideoUrl }: Props) {
    const { flash } = usePage<SharedData>().props;
    const { t } = useLocale();
    const inputRef = useRef<HTMLInputElement>(null);
    const form = useForm<{ video: File | null }>({
        video: null,
    });

    const onSubmit = (event: FormEvent): void => {
        event.preventDefault();
        form.post('/admin/training/video', {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                form.reset();
                if (inputRef.current) {
                    inputRef.current.value = '';
                }
            },
        });
    };

    return (
        <AdminPortalLayout>
            <Head title={t('admin.training.title')} />

            <div className="space-y-6 p-6">
                <AdminPageHeader
                    title={t('admin.training.title')}
                    subtitle={t('admin.training.subtitle')}
                />

                {flash.success && (
                    <div className="rounded-xl border border-[#bbf7d0] bg-[#f0fdf4] px-4 py-3 text-sm text-[#15803d]">
                        {typeof flash.success === 'string'
                            ? flash.success
                            : t('common.saved')}
                    </div>
                )}

                <AdminPanel className="space-y-6 p-6">
                    <div>
                        <h2 className="text-base font-bold text-[#050315]">
                            {t('admin.training.hero_video')}
                        </h2>
                        <p className="mt-1 text-sm text-[#64748b]">
                            {t('admin.training.hero_video_help')}
                        </p>
                    </div>

                    {heroVideoUrl ? (
                        <div className="overflow-hidden rounded-2xl border border-[#e2e8f0] bg-[#0f172a]">
                            <video
                                key={heroVideoUrl}
                                src={heroVideoUrl}
                                controls
                                className="aspect-video w-full bg-black"
                            />
                        </div>
                    ) : (
                        <div className="flex aspect-video items-center justify-center rounded-2xl border border-dashed border-[#cbd5e1] bg-[#f8faff] text-sm font-medium text-[#94a3b8]">
                            {t('admin.training.no_video')}
                        </div>
                    )}

                    <form onSubmit={onSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="training-video">
                                {t('admin.training.upload_label')}
                            </Label>
                            <input
                                id="training-video"
                                ref={inputRef}
                                type="file"
                                accept="video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov"
                                className="block w-full text-sm text-[#64748b] file:me-3 file:rounded-lg file:border-0 file:bg-[#eff6ff] file:px-4 file:py-2 file:text-sm file:font-semibold file:text-[#0057c8]"
                                onChange={(event) => {
                                    form.setData(
                                        'video',
                                        event.target.files?.[0] ?? null,
                                    );
                                }}
                            />
                            <p className="text-xs text-[#94a3b8]">
                                {t('admin.training.upload_hint')}
                            </p>
                            <InputError message={form.errors.video} />
                        </div>

                        <div className="flex flex-wrap gap-3">
                            <AdminPrimaryButton
                                type="submit"
                                disabled={form.processing || !form.data.video}
                            >
                                <Upload className="size-4" />
                                {form.processing
                                    ? t('admin.training.uploading')
                                    : t('admin.training.upload')}
                            </AdminPrimaryButton>

                            {heroVideoUrl ? (
                                <AdminSecondaryButton
                                    type="button"
                                    onClick={() => {
                                        if (
                                            !confirm(
                                                t('admin.training.remove_confirm'),
                                            )
                                        ) {
                                            return;
                                        }

                                        router.delete('/admin/training/video', {
                                            preserveScroll: true,
                                        });
                                    }}
                                >
                                    <Trash2 className="size-4" />
                                    {t('admin.training.remove')}
                                </AdminSecondaryButton>
                            ) : null}
                        </div>
                    </form>
                </AdminPanel>
            </div>
        </AdminPortalLayout>
    );
}
