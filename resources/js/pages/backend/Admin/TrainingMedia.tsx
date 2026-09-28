import { Head, router, useForm, usePage } from '@inertiajs/react';
import { FileText, Trash2, Upload } from 'lucide-react';
import { type FormEvent, useRef } from 'react';

import {
    AdminPageHeader,
    AdminPanel,
    AdminPrimaryButton,
    AdminSecondaryButton,
} from '@/components/admin-portal/ui';
import InputError from '@/components/input-error';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useLocale } from '@/hooks/use-locale';
import AdminPortalLayout from '@/layouts/admin-portal-layout';
import type { SharedData } from '@/types';

type TrainingMediaItem = {
    id: string;
    name: string;
    file_name: string;
    url: string;
    mime: string | null;
    size: number | null;
};

type Props = {
    videos?: TrainingMediaItem[];
    heroVideoUrl: string | null;
    documents: TrainingMediaItem[];
    maxVideos?: number;
};

function formatBytes(bytes: number | null): string {
    if (!bytes || bytes <= 0) {
        return '—';
    }

    if (bytes < 1024) {
        return `${bytes} B`;
    }

    if (bytes < 1024 * 1024) {
        return `${(bytes / 1024).toFixed(1)} KB`;
    }

    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function TrainingMedia({
    videos = [],
    heroVideoUrl,
    documents,
    maxVideos = 12,
}: Props) {
    const { flash } = usePage<SharedData>().props;
    const { t } = useLocale();
    const videoInputRef = useRef<HTMLInputElement>(null);
    const documentInputRef = useRef<HTMLInputElement>(null);
    const slides =
        videos.length > 0
            ? videos
            : heroVideoUrl
              ? [
                    {
                        id: 'hero',
                        name: t('admin.training.hero_video'),
                        file_name: '',
                        url: heroVideoUrl,
                        mime: null,
                        size: null,
                    },
                ]
              : [];
    const remainingSlots = Math.max(0, maxVideos - slides.length);
    const videoForm = useForm<{ videos: File[]; name: string }>({
        videos: [],
        name: '',
    });
    const documentForm = useForm<{ document: File | null; name: string }>({
        document: null,
        name: '',
    });

    const onVideoSubmit = (event: FormEvent): void => {
        event.preventDefault();
        videoForm.post('/admin/training/video', {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                videoForm.reset();
                if (videoInputRef.current) {
                    videoInputRef.current.value = '';
                }
            },
        });
    };

    const onDocumentSubmit = (event: FormEvent): void => {
        event.preventDefault();
        documentForm.post('/admin/training/documents', {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                documentForm.reset();
                if (documentInputRef.current) {
                    documentInputRef.current.value = '';
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

                    {slides.length > 0 ? (
                        <ul className="space-y-4">
                            {slides.map((video, index) => (
                                <li
                                    key={video.id}
                                    className="overflow-hidden rounded-2xl border border-[#e2e8f0] bg-white"
                                >
                                    <div className="bg-[#0f172a]">
                                        <video
                                            src={video.url}
                                            controls
                                            className="aspect-video w-full bg-black"
                                        />
                                    </div>
                                    <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                                        <div className="min-w-0">
                                            <p className="truncate text-sm font-semibold text-[#050315]">
                                                {index + 1}. {video.name}
                                            </p>
                                            <p className="mt-0.5 truncate text-xs text-[#94a3b8]">
                                                {video.file_name
                                                    ? `${video.file_name} · `
                                                    : ''}
                                                {formatBytes(video.size)}
                                            </p>
                                        </div>
                                        <AdminSecondaryButton
                                            type="button"
                                            onClick={() => {
                                                if (
                                                    !confirm(
                                                        t(
                                                            'admin.training.remove_confirm',
                                                        ),
                                                    )
                                                ) {
                                                    return;
                                                }

                                                if (video.id === 'hero') {
                                                    router.delete(
                                                        '/admin/training/video',
                                                        {
                                                            preserveScroll: true,
                                                        },
                                                    );

                                                    return;
                                                }

                                                router.delete(
                                                    `/admin/training/videos/${video.id}`,
                                                    { preserveScroll: true },
                                                );
                                            }}
                                        >
                                            <Trash2 className="size-4" />
                                            {t('admin.training.remove')}
                                        </AdminSecondaryButton>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <div className="flex aspect-video items-center justify-center rounded-2xl border border-dashed border-[#cbd5e1] bg-[#f8faff] text-sm font-medium text-[#94a3b8]">
                            {t('admin.training.no_video')}
                        </div>
                    )}

                    <form onSubmit={onVideoSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="training-video-name">
                                {t('admin.training.video_name')}
                            </Label>
                            <Input
                                id="training-video-name"
                                value={videoForm.data.name}
                                onChange={(event) =>
                                    videoForm.setData(
                                        'name',
                                        event.target.value,
                                    )
                                }
                                placeholder={t(
                                    'admin.training.video_name_placeholder',
                                )}
                                disabled={videoForm.data.videos.length !== 1}
                            />
                            <p className="text-xs text-[#94a3b8]">
                                {t('admin.training.video_name_help')}
                            </p>
                            <InputError message={videoForm.errors.name} />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="training-video">
                                {t('admin.training.upload_label')}
                            </Label>
                            <input
                                id="training-video"
                                ref={videoInputRef}
                                type="file"
                                multiple
                                accept="video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov"
                                className="block w-full text-sm text-[#64748b] file:me-3 file:rounded-lg file:border-0 file:bg-[#eff6ff] file:px-4 file:py-2 file:text-sm file:font-semibold file:text-[#0057c8]"
                                onChange={(event) => {
                                    const files = Array.from(
                                        event.target.files ?? [],
                                    );
                                    videoForm.setData('videos', files);
                                }}
                            />
                            <p className="text-xs text-[#94a3b8]">
                                {t('admin.training.upload_hint', {
                                    remaining: remainingSlots,
                                    max: maxVideos,
                                })}
                            </p>
                            <InputError message={videoForm.errors.video} />
                            <InputError message={videoForm.errors.videos} />
                        </div>

                        <AdminPrimaryButton
                            type="submit"
                            disabled={
                                videoForm.processing ||
                                videoForm.data.videos.length === 0 ||
                                remainingSlots === 0
                            }
                        >
                            <Upload className="size-4" />
                            {videoForm.processing
                                ? t('admin.training.uploading')
                                : t('admin.training.upload')}
                        </AdminPrimaryButton>
                    </form>
                </AdminPanel>

                <AdminPanel className="space-y-6 p-6">
                    <div>
                        <h2 className="text-base font-bold text-[#050315]">
                            {t('admin.training.documents')}
                        </h2>
                        <p className="mt-1 text-sm text-[#64748b]">
                            {t('admin.training.documents_help')}
                        </p>
                    </div>

                    {documents.length > 0 ? (
                        <ul className="divide-y divide-[#e2e8f0] overflow-hidden rounded-2xl border border-[#e2e8f0]">
                            {documents.map((document) => (
                                <li
                                    key={document.id}
                                    className="flex flex-wrap items-center justify-between gap-3 bg-white px-4 py-3"
                                >
                                    <div className="flex min-w-0 items-start gap-3">
                                        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#eff6ff] text-[#0057c8]">
                                            <FileText className="size-5" />
                                        </div>
                                        <div className="min-w-0">
                                            <a
                                                href={document.url}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="block truncate text-sm font-semibold text-[#0057c8] hover:underline"
                                            >
                                                {document.name}
                                            </a>
                                            <p className="mt-0.5 truncate text-xs text-[#94a3b8]">
                                                {document.file_name} ·{' '}
                                                {formatBytes(document.size)}
                                            </p>
                                        </div>
                                    </div>
                                    <AdminSecondaryButton
                                        type="button"
                                        onClick={() => {
                                            if (
                                                !confirm(
                                                    t(
                                                        'admin.training.document_remove_confirm',
                                                    ),
                                                )
                                            ) {
                                                return;
                                            }

                                            router.delete(
                                                `/admin/training/documents/${document.id}`,
                                                { preserveScroll: true },
                                            );
                                        }}
                                    >
                                        <Trash2 className="size-4" />
                                        {t('admin.training.document_remove')}
                                    </AdminSecondaryButton>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <div className="rounded-2xl border border-dashed border-[#cbd5e1] bg-[#f8faff] px-4 py-8 text-center text-sm font-medium text-[#94a3b8]">
                            {t('admin.training.no_documents')}
                        </div>
                    )}

                    <form onSubmit={onDocumentSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="training-document-name">
                                {t('admin.training.document_name')}
                            </Label>
                            <Input
                                id="training-document-name"
                                value={documentForm.data.name}
                                onChange={(event) =>
                                    documentForm.setData(
                                        'name',
                                        event.target.value,
                                    )
                                }
                                placeholder={t(
                                    'admin.training.document_name_placeholder',
                                )}
                            />
                            <InputError message={documentForm.errors.name} />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="training-document">
                                {t('admin.training.document_upload_label')}
                            </Label>
                            <input
                                id="training-document"
                                ref={documentInputRef}
                                type="file"
                                accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                                className="block w-full text-sm text-[#64748b] file:me-3 file:rounded-lg file:border-0 file:bg-[#eff6ff] file:px-4 file:py-2 file:text-sm file:font-semibold file:text-[#0057c8]"
                                onChange={(event) => {
                                    documentForm.setData(
                                        'document',
                                        event.target.files?.[0] ?? null,
                                    );
                                }}
                            />
                            <p className="text-xs text-[#94a3b8]">
                                {t('admin.training.document_upload_hint')}
                            </p>
                            <InputError
                                message={documentForm.errors.document}
                            />
                        </div>

                        <AdminPrimaryButton
                            type="submit"
                            disabled={
                                documentForm.processing ||
                                !documentForm.data.document
                            }
                        >
                            <Upload className="size-4" />
                            {documentForm.processing
                                ? t('admin.training.document_uploading')
                                : t('admin.training.document_upload')}
                        </AdminPrimaryButton>
                    </form>
                </AdminPanel>
            </div>
        </AdminPortalLayout>
    );
}
