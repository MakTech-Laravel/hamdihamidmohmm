import { ChevronLeft, ChevronRight, PlayCircle } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { useLocale } from '@/hooks/use-locale';
import { cn } from '@/lib/utils';

export type TrainingVideoSlide = {
    id: string;
    name: string;
    file_name: string;
    url: string;
    mime: string | null;
    size: number | null;
};

type TrainingVideoSliderProps = {
    videos: TrainingVideoSlide[];
};

export function TrainingVideoSlider({ videos }: TrainingVideoSliderProps) {
    const { t } = useLocale();
    const [index, setIndex] = useState(0);
    const videoRef = useRef<HTMLVideoElement>(null);
    const total = videos.length;
    const current = videos[index] ?? null;
    const hasMultiple = total > 1;

    useEffect(() => {
        if (index > total - 1) {
            setIndex(0);
        }
    }, [index, total]);

    useEffect(() => {
        const player = videoRef.current;

        if (player === null) {
            return;
        }

        player.pause();
        player.currentTime = 0;
    }, [index, current?.url]);

    const goTo = (next: number): void => {
        if (total === 0) {
            return;
        }

        setIndex((next + total) % total);
    };

    if (current === null) {
        return (
            <div className="flex aspect-video flex-col items-center justify-center gap-3 bg-gradient-to-br from-[#1e3a8a] to-[#0f172a] px-6 text-center">
                <PlayCircle className="size-12 text-white/70" />
                <p className="text-sm font-medium text-white/80">
                    {t('training.video_placeholder')}
                </p>
            </div>
        );
    }

    return (
        <div className="overflow-hidden rounded-2xl border border-[#dbeafe] bg-[#0f172a] shadow-[0px_12px_32px_rgba(30,58,138,0.12)]">
            <div className="relative">
                <video
                    key={current.id}
                    ref={videoRef}
                    src={current.url}
                    controls
                    playsInline
                    preload="metadata"
                    className="aspect-video w-full bg-black"
                >
                    {t('training.video_unsupported')}
                </video>

                {hasMultiple ? (
                    <>
                        <button
                            type="button"
                            onClick={() => goTo(index - 1)}
                            className="absolute top-1/2 left-3 flex size-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/55 text-white backdrop-blur-sm transition hover:bg-black/75"
                            aria-label={t('training.video_previous')}
                        >
                            <ChevronLeft className="size-5 rtl:rotate-180" />
                        </button>
                        <button
                            type="button"
                            onClick={() => goTo(index + 1)}
                            className="absolute top-1/2 right-3 flex size-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/55 text-white backdrop-blur-sm transition hover:bg-black/75"
                            aria-label={t('training.video_next')}
                        >
                            <ChevronRight className="size-5 rtl:rotate-180" />
                        </button>
                    </>
                ) : null}
            </div>

            <div className="flex flex-col gap-3 border-t border-white/10 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-white">
                        {current.name || t('training.video_untitled')}
                    </p>
                    {hasMultiple ? (
                        <p className="mt-0.5 text-xs text-white/60">
                            {t('training.video_counter', {
                                current: index + 1,
                                total,
                            })}
                        </p>
                    ) : null}
                </div>

                {hasMultiple ? (
                    <div className="flex flex-wrap items-center gap-2">
                        {videos.map((video, videoIndex) => (
                            <button
                                key={video.id}
                                type="button"
                                onClick={() => setIndex(videoIndex)}
                                className={cn(
                                    'h-2.5 rounded-full transition',
                                    videoIndex === index
                                        ? 'w-7 bg-white'
                                        : 'w-2.5 bg-white/35 hover:bg-white/60',
                                )}
                                aria-label={t('training.video_go_to', {
                                    number: videoIndex + 1,
                                })}
                                aria-current={
                                    videoIndex === index ? 'true' : undefined
                                }
                            />
                        ))}
                    </div>
                ) : null}
            </div>

            {hasMultiple ? (
                <div className="flex gap-2 overflow-x-auto border-t border-white/10 bg-black/40 p-3">
                    {videos.map((video, videoIndex) => (
                        <button
                            key={`${video.id}-thumb`}
                            type="button"
                            onClick={() => setIndex(videoIndex)}
                            className={cn(
                                'relative w-28 shrink-0 overflow-hidden rounded-lg border text-left transition',
                                videoIndex === index
                                    ? 'border-white ring-2 ring-white/40'
                                    : 'border-white/15 hover:border-white/40',
                            )}
                        >
                            <video
                                src={video.url}
                                muted
                                preload="metadata"
                                className="aspect-video w-full bg-black object-cover"
                            />
                            <span className="absolute inset-x-0 bottom-0 truncate bg-black/65 px-1.5 py-1 text-[10px] font-medium text-white">
                                {video.name || t('training.video_untitled')}
                            </span>
                        </button>
                    ))}
                </div>
            ) : null}
        </div>
    );
}
