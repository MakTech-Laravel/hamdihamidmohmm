import { cn } from '@/lib/utils';

export function ToggleRow({
    title,
    description,
    checked,
    disabled,
    onChange,
}: {
    title: string;
    description: string;
    checked: boolean;
    disabled: boolean;
    onChange: (value: boolean) => void;
}) {
    return (
        <div className="flex items-start justify-between gap-4 rounded-xl border border-[#e2e8f0] p-4">
            <div>
                <p className="text-sm font-bold text-[#050315]">{title}</p>
                <p className="mt-1 text-xs text-[#64748b]">{description}</p>
            </div>
            <button
                type="button"
                role="switch"
                aria-checked={checked}
                aria-label={title}
                disabled={disabled}
                onClick={() => onChange(!checked)}
                className={cn(
                    'relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-60',
                    checked ? 'bg-[#0057c8]' : 'bg-[#cbd5e1]',
                )}
            >
                <span
                    className={cn(
                        'inline-block size-5 rounded-full bg-white shadow transition-transform',
                        checked
                            ? 'translate-x-5.5 rtl:-translate-x-5.5'
                            : 'translate-x-0.5 rtl:-translate-x-0.5',
                    )}
                />
            </button>
        </div>
    );
}
