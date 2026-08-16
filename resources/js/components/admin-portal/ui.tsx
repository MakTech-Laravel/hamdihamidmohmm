import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

import { router } from '@inertiajs/react';

import { cn } from '@/lib/utils';

export function AdminPageHeader({
    title,
    subtitle,
    actions,
}: {
    title: string;
    subtitle?: string;
    actions?: ReactNode;
}) {
    return (
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
                <h1 className="text-[28px] font-extrabold tracking-tight text-[#050315]">
                    {title}
                </h1>
                {subtitle ? (
                    <p className="mt-1 text-sm text-[#3977a6]">{subtitle}</p>
                ) : null}
            </div>
            {actions ? (
                <div className="flex flex-wrap items-center gap-2">{actions}</div>
            ) : null}
        </div>
    );
}

export function AdminStatCard({
    label,
    value,
    valueClassName,
    icon: Icon,
    iconClassName,
    accentClassName,
}: {
    label: string;
    value: string;
    valueClassName?: string;
    icon?: LucideIcon;
    iconClassName?: string;
    accentClassName?: string;
}) {
    return (
        <div
            className={cn(
                'rounded-xl border border-[#e2e8f0] bg-white p-4 shadow-[0px_1px_3px_rgba(0,0,0,0.06)]',
                accentClassName,
            )}
        >
            <div className="flex items-start justify-between gap-3">
                <div>
                    <p
                        className={cn(
                            'text-2xl font-extrabold text-[#0057c8]',
                            valueClassName,
                        )}
                    >
                        {value}
                    </p>
                    <p className="mt-1 text-xs font-medium text-[#64748b]">
                        {label}
                    </p>
                </div>
                {Icon ? (
                    <div
                        className={cn(
                            'flex size-9 items-center justify-center rounded-lg bg-[#eef2ff] text-[#0057c8]',
                            iconClassName,
                        )}
                    >
                        <Icon className="size-4" strokeWidth={1.75} />
                    </div>
                ) : null}
            </div>
        </div>
    );
}

export function AdminStatusBadge({
    label,
    tone = 'neutral',
}: {
    label: string;
    tone?:
    | 'success'
    | 'warning'
    | 'danger'
    | 'info'
    | 'neutral'
    | 'purple'
    | 'orange';
}) {
    const tones: Record<string, string> = {
        success: 'bg-[#d1fae5] text-[#065f46]',
        warning: 'bg-[#fef3c7] text-[#92400e]',
        danger: 'bg-[#fee2e2] text-[#991b1b]',
        info: 'bg-[#dbeafe] text-[#1d4ed8]',
        neutral: 'bg-[#f1f5f9] text-[#475569]',
        purple: 'bg-[#ede9fe] text-[#6d28d9]',
        orange: 'bg-[#ffedd5] text-[#c2410c]',
    };

    return (
        <span
            className={cn(
                'inline-flex rounded-full px-2.5 py-1 text-xs font-semibold whitespace-nowrap',
                tones[tone],
            )}
        >
            {label}
        </span>
    );
}

export function AdminPrimaryButton({
    children,
    className,
    type = 'button',
    onClick,
}: {
    children: ReactNode;
    className?: string;
    type?: 'button' | 'submit';
    onClick?: () => void;
}) {
    return (
        <button
            type={type}
            onClick={onClick}
            className={cn(
                'inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#0057c8] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#0046a3]',
                className,
            )}
        >
            {children}
        </button>
    );
}

export function AdminSecondaryButton({
    children,
    className,
    type = 'button',
    onClick,
}: {
    children: ReactNode;
    className?: string;
    type?: 'button' | 'submit';
    onClick?: () => void;
}) {
    return (
        <button
            type={type}
            onClick={onClick}
            className={cn(
                'inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-[#e2e8f0] bg-[#f1f5f9] px-4 py-2.5 text-sm font-semibold text-[#475569] hover:bg-white',
                className,
            )}
        >
            {children}
        </button>
    );
}

export function AdminFilterChip({
    label,
    active = false,
    onClick,
}: {
    label: string;
    active?: boolean;
    onClick?: () => void;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={cn(
                'cursor-pointer rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors',
                active
                    ? 'bg-[#0057c8] text-white'
                    : 'border border-[#e2e8f0] bg-white text-[#64748b] hover:bg-[#f8fafc]',
            )}
        >
            {label}
        </button>
    );
}

export function AdminPanel({
    children,
    className,
}: {
    children: ReactNode;
    className?: string;
}) {
    return (
        <div
            className={cn(
                'rounded-xl border border-[#e2e8f0] bg-white p-5 shadow-[0px_1px_3px_rgba(0,0,0,0.06)]',
                className,
            )}
        >
            {children}
        </div>
    );
}

export function AdminTableShell({
    headers,
    children,
}: {
    headers: string[];
    children: ReactNode;
}) {
    return (
        <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
                <thead className="border-b border-[#d1f6ff]">
                    <tr>
                        {headers.map((header) => (
                            <th
                                key={header}
                                className="px-4 py-2.5 text-[11px] font-semibold tracking-[0.55px] text-[#3977a6] uppercase"
                            >
                                {header}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>{children}</tbody>
            </table>
        </div>
    );
}

export function AdminPagination({
    showingLabel = 'Showing 7 of 7',
    links,
}: {
    showingLabel?: string;
    links?: Array<{ url: string | null; label: string; active: boolean }>;
}) {
    return (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-[#94a3b8]">{showingLabel}</p>
            <div className="flex flex-wrap gap-1.5">
                {(links ?? ['1', '2', '3', '…', '28'].map((page) => ({
                    url: page === '1' ? '#' : null,
                    label: page,
                    active: page === '1',
                }))).map((link, index) => (
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
                            (!link.url || link.label.includes('…')) && 'opacity-40',
                        )}
                        dangerouslySetInnerHTML={{ __html: link.label }}
                    />
                ))}
            </div>
        </div>
    );
}
