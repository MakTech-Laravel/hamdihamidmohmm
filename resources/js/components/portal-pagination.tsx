import { router } from '@inertiajs/react';

import { cn } from '@/lib/utils';

export type PortalPaginationLink = {
    url: string | null;
    label: string;
    active: boolean;
};

export type PortalPaginator<T> = {
    data: T[];
    links: PortalPaginationLink[];
    from: number | null;
    to: number | null;
    total: number;
    current_page: number;
    per_page: number;
    last_page?: number;
};

export function PortalPagination({
    showingLabel = 'Showing 7 of 7',
    links,
    align = 'between',
    className,
}: {
    showingLabel?: string;
    links?: PortalPaginationLink[];
    align?: 'between' | 'start';
    className?: string;
}) {
    return (
        <div
            className={cn(
                'mt-4 flex flex-wrap items-center gap-3',
                align === 'start' ? 'justify-start' : 'justify-between',
                className,
            )}
        >
            <p className="text-xs text-[#94a3b8]">{showingLabel}</p>
            <div className="flex flex-wrap gap-1.5">
                {(
                    links ??
                    ['1', '2', '3', '…', '28'].map((page) => ({
                        url: page === '1' ? '#' : null,
                        label: page,
                        active: page === '1',
                    }))
                ).map((link, index) => (
                    <button
                        key={`${link.label}-${index}`}
                        type="button"
                        disabled={!link.url || link.label.includes('…')}
                        onClick={() => {
                            if (link.url && link.url !== '#') {
                                router.get(link.url, {}, { preserveState: true });
                            }
                        }}
                        className={cn(
                            'flex min-w-8 cursor-pointer items-center justify-center rounded-md px-2 text-xs font-semibold',
                            link.active
                                ? 'bg-[#0057c8] text-white'
                                : 'border border-[#e2e8f0] bg-white text-[#64748b]',
                            (!link.url || link.label.includes('…')) &&
                                'opacity-40',
                        )}
                        dangerouslySetInnerHTML={{ __html: link.label }}
                    />
                ))}
            </div>
        </div>
    );
}
