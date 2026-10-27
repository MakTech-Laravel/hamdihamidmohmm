import { MoreHorizontal } from 'lucide-react';
import { type ReactNode } from 'react';

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useLocale } from '@/hooks/use-locale';
import { cn } from '@/lib/utils';

export function MobileListStack({
    children,
    className,
}: {
    children: ReactNode;
    className?: string;
}) {
    return (
        <div className={cn('space-y-3 md:hidden', className)}>{children}</div>
    );
}

export function MobileListCard({
    children,
    className,
}: {
    children: ReactNode;
    className?: string;
}) {
    return (
        <article
            className={cn(
                'rounded-2xl border border-[rgba(57,119,166,0.2)] bg-white p-3.5 shadow-[0_1px_2px_rgba(5,3,21,0.04)]',
                className,
            )}
        >
            {children}
        </article>
    );
}

export function MobileListCardHeader({
    title,
    subtitle,
    badge,
    leading,
    className,
}: {
    title: ReactNode;
    subtitle?: ReactNode;
    badge?: ReactNode;
    leading?: ReactNode;
    className?: string;
}) {
    return (
        <div className={cn('flex items-start gap-2.5', className)}>
            {leading ? <div className="shrink-0">{leading}</div> : null}
            <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                        <h3 className="truncate text-sm font-bold text-[#050315]">
                            {title}
                        </h3>
                        {subtitle ? (
                            <div className="mt-0.5 text-xs text-[#64748b]">
                                {subtitle}
                            </div>
                        ) : null}
                    </div>
                    {badge ? <div className="shrink-0">{badge}</div> : null}
                </div>
            </div>
        </div>
    );
}

export function MobileListCardMeta({
    items,
    className,
}: {
    items: Array<{ label: string; value: ReactNode }>;
    className?: string;
}) {
    const visible = items.filter(
        (item) =>
            item.value !== null &&
            item.value !== undefined &&
            item.value !== '' &&
            item.value !== '—',
    );

    if (visible.length === 0) {
        return null;
    }

    return (
        <dl
            className={cn(
                'mt-2.5 grid grid-cols-2 gap-x-3 gap-y-2 border-t border-[#eef2f7] pt-2.5',
                className,
            )}
        >
            {visible.map((item) => (
                <div key={item.label} className="min-w-0">
                    <dt className="text-[10px] font-semibold tracking-wide text-[#94a3b8] uppercase">
                        {item.label}
                    </dt>
                    <dd className="mt-0.5 truncate text-xs font-medium text-[#334155]">
                        {item.value}
                    </dd>
                </div>
            ))}
        </dl>
    );
}

export function MobileListCardActions({
    primary,
    moreItems,
    className,
}: {
    primary?: ReactNode;
    moreItems?: Array<{
        key: string;
        label: ReactNode;
        onSelect?: () => void;
        href?: string;
        destructive?: boolean;
        disabled?: boolean;
    }>;
    className?: string;
}) {
    const { t } = useLocale();
    const items = (moreItems ?? []).filter((item) => !item.disabled);

    return (
        <div
            className={cn(
                'mt-3 flex items-center gap-2 border-t border-[#eef2f7] pt-3',
                className,
            )}
        >
            {primary ? <div className="min-w-0 flex-1">{primary}</div> : null}
            {items.length > 0 ? (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button
                            type="button"
                            className="inline-flex size-9 shrink-0 items-center justify-center rounded-xl border border-[#e2e8f0] bg-white text-[#475569] hover:bg-[#f8faff]"
                            aria-label={t('common.more_actions')}
                        >
                            <MoreHorizontal className="size-4" />
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                        align="end"
                        className="min-w-[180px] rounded-xl border border-[#e2e8f0] bg-white p-1"
                    >
                        {items.map((item) =>
                            item.href ? (
                                <DropdownMenuItem key={item.key} asChild>
                                    <a
                                        href={item.href}
                                        className={cn(
                                            'cursor-pointer rounded-lg px-2 py-2 text-sm',
                                            item.destructive &&
                                                'text-[#b91c1c] focus:bg-[#fef2f2] focus:text-[#b91c1c]',
                                        )}
                                    >
                                        {item.label}
                                    </a>
                                </DropdownMenuItem>
                            ) : (
                                <DropdownMenuItem
                                    key={item.key}
                                    className={cn(
                                        'cursor-pointer rounded-lg px-2 py-2 text-sm',
                                        item.destructive &&
                                            'text-[#b91c1c] focus:bg-[#fef2f2] focus:text-[#b91c1c]',
                                    )}
                                    onSelect={() => item.onSelect?.()}
                                >
                                    {item.label}
                                </DropdownMenuItem>
                            ),
                        )}
                    </DropdownMenuContent>
                </DropdownMenu>
            ) : null}
        </div>
    );
}

export function MobileListEmpty({
    children,
    className,
}: {
    children: ReactNode;
    className?: string;
}) {
    return (
        <p
            className={cn(
                'rounded-2xl border border-dashed border-[#dbeafe] bg-white px-4 py-8 text-center text-sm text-[#94a3b8] md:hidden',
                className,
            )}
        >
            {children}
        </p>
    );
}
