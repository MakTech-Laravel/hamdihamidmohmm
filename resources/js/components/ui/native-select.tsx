import * as React from 'react';

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

const EMPTY_VALUE = '__native_select_empty__';

type NativeSelectVariant = 'field' | 'filter' | 'ghost' | 'compact';

type NativeSelectProps = {
    variant?: NativeSelectVariant;
    wrapperClassName?: string;
    className?: string;
    value?: string;
    defaultValue?: string;
    disabled?: boolean;
    name?: string;
    id?: string;
    'aria-label'?: string;
    children?: React.ReactNode;
    onChange?: (event: { target: { value: string; name?: string } }) => void;
    onValueChange?: (value: string) => void;
};

type SelectOption = {
    value: string;
    label: React.ReactNode;
    disabled?: boolean;
};

const triggerVariants: Record<NativeSelectVariant, string> = {
    field: 'h-11 rounded-xl border-[#dbe4ef] bg-gradient-to-b from-white to-[#f7faff] px-3.5 shadow-[0_1px_2px_rgba(5,3,21,0.04)] hover:border-[#3977a6]/45',
    filter: 'h-10 rounded-xl border-[#dbe4ef] bg-white px-3.5 shadow-[0_1px_2px_rgba(5,3,21,0.04)] hover:border-[#3977a6]/45',
    ghost: 'h-auto min-h-0 rounded-none border-0 bg-transparent p-0 pe-6 shadow-none hover:border-transparent focus-visible:border-transparent focus-visible:ring-0 data-[state=open]:bg-transparent [&_svg]:opacity-70',
    compact:
        'h-9 rounded-lg border-[#dbe4ef] bg-white px-3 shadow-[0_1px_2px_rgba(5,3,21,0.04)] hover:border-[#3977a6]/45',
};

function encodeValue(value: string | undefined): string | undefined {
    if (value === undefined) {
        return undefined;
    }

    return value === '' ? EMPTY_VALUE : value;
}

function decodeValue(value: string): string {
    return value === EMPTY_VALUE ? '' : value;
}

function extractOptions(children: React.ReactNode): SelectOption[] {
    return React.Children.toArray(children).flatMap((child) => {
        if (
            !React.isValidElement<{
                value?: string | number;
                disabled?: boolean;
                children?: React.ReactNode;
            }>(child)
        ) {
            return [];
        }

        if (typeof child.type !== 'string' || child.type !== 'option') {
            return [];
        }

        const rawValue = child.props.value;
        const label = child.props.children;
        const value =
            rawValue === undefined || rawValue === null
                ? String(label ?? '')
                : rawValue === ''
                  ? EMPTY_VALUE
                  : String(rawValue);

        return [
            {
                value,
                label,
                disabled: Boolean(child.props.disabled),
            },
        ];
    });
}

function NativeSelect({
    className,
    wrapperClassName,
    variant = 'field',
    children,
    value,
    defaultValue = '',
    disabled,
    name,
    id,
    onChange,
    onValueChange,
    'aria-label': ariaLabel,
}: NativeSelectProps) {
    const options = React.useMemo(() => extractOptions(children), [children]);
    const isGhost = variant === 'ghost';
    const isControlled = value !== undefined;
    const [uncontrolledValue, setUncontrolledValue] = React.useState(defaultValue);
    const currentValue = isControlled ? value : uncontrolledValue;

    const handleValueChange = (next: string): void => {
        const decoded = decodeValue(next);

        if (!isControlled) {
            setUncontrolledValue(decoded);
        }

        onValueChange?.(decoded);
        onChange?.({ target: { value: decoded, name } });
    };

    return (
        <div
            data-slot="native-select"
            className={cn(
                'relative min-w-0',
                !isGhost && 'w-full',
                isGhost && 'flex min-w-0 flex-1 items-center',
                wrapperClassName,
            )}
        >
            {name ? <input type="hidden" name={name} value={currentValue} /> : null}
            <Select
                value={encodeValue(currentValue)}
                disabled={disabled}
                onValueChange={handleValueChange}
            >
                <SelectTrigger
                    id={id}
                    aria-label={ariaLabel}
                    data-slot="native-select-control"
                    className={cn(
                        'w-full text-sm font-medium text-[#050315]',
                        triggerVariants[variant],
                        className,
                    )}
                >
                    <SelectValue placeholder="Select..." />
                </SelectTrigger>
                <SelectContent
                    position="popper"
                    className="z-[80] max-h-72 overflow-hidden rounded-2xl border border-[#dbe4ef] bg-white shadow-[0_18px_40px_rgba(5,3,21,0.14)]"
                >
                    {options.map((option) => (
                        <SelectItem
                            key={option.value}
                            value={option.value}
                            disabled={option.disabled}
                            className="cursor-pointer rounded-xl py-2.5 ps-3 pe-9 text-sm font-medium text-[#334155] data-[highlighted]:bg-[#eef5ff] data-[highlighted]:text-[#0057c8] data-[state=checked]:bg-[#eef5ff] data-[state=checked]:font-semibold data-[state=checked]:text-[#0057c8]"
                        >
                            {option.label}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );
}

export { NativeSelect };
