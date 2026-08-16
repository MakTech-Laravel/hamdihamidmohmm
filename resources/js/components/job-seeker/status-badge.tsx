import { cn } from '@/lib/utils';

import {
    STATUS_STYLES,
    type ApplicationStatus,
} from '@/components/job-seeker/demo-data';

export function StatusBadge({
    status,
    className,
}: {
    status: ApplicationStatus;
    className?: string;
}) {
    const style = STATUS_STYLES[status] ?? {
        badge: 'bg-[#f8faff]',
        dot: 'bg-[#94a3b8]',
        text: 'text-[#64748b]',
    };

    return (
        <span
            className={cn(
                'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold',
                style.badge,
                style.text,
                className,
            )}
        >
            <span className={cn('mr-1.5 size-1.5 rounded-full', style.dot)} />
            {status}
        </span>
    );
}
