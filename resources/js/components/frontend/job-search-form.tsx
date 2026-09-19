import { FormEvent } from 'react';

import {
    LocationCombobox,
    type LocationOption,
} from '@/components/frontend/location-combobox';
import { cn } from '@/lib/utils';

type JobSearchFormProps = {
    keyword: string;
    location: string;
    locationOptions: LocationOption[];
    keywordPlaceholder: string;
    locationAriaLabel: string;
    locationSearchPlaceholder?: string;
    locationUseCustomLabel?: (query: string) => string;
    locationEmptyLabel?: string;
    submitLabel: string;
    onKeywordChange: (value: string) => void;
    onLocationChange: (value: string) => void;
    onSubmit: (event: FormEvent) => void;
    className?: string;
    showSubmitIcon?: boolean;
    compact?: boolean;
};

export function JobSearchForm({
    keyword,
    location,
    locationOptions,
    keywordPlaceholder,
    locationAriaLabel,
    locationSearchPlaceholder,
    locationUseCustomLabel,
    locationEmptyLabel,
    submitLabel,
    onKeywordChange,
    onLocationChange,
    onSubmit,
    className,
    showSubmitIcon = false,
    compact = false,
}: JobSearchFormProps) {
    return (
        <form
            onSubmit={onSubmit}
            className={cn(
                'rounded-2xl border border-white/80 bg-white shadow-[0px_12px_28px_rgba(5,3,21,0.08)]',
                compact ? 'p-2' : 'p-2.5 sm:p-3',
                className,
            )}
        >
            <div
                className={cn(
                    'flex items-center gap-2',
                    compact
                        ? 'flex-col sm:flex-row'
                        : 'flex-col sm:flex-row sm:gap-2.5',
                )}
            >
                <label className="relative flex min-w-0 w-full flex-1 items-center">
                    <img
                        src="/images/jobs/search.svg"
                        alt=""
                        className="pointer-events-none absolute start-3 size-4"
                        width={16}
                        height={16}
                    />
                    <input
                        type="text"
                        value={keyword}
                        onChange={(event) =>
                            onKeywordChange(event.target.value)
                        }
                        placeholder={keywordPlaceholder}
                        className={cn(
                            'w-full rounded-xl border border-[#e2e8f0] bg-[#f8faff] pe-3 ps-9 text-sm text-[#374151] outline-none transition placeholder:text-[rgba(55,65,81,0.45)] hover:border-[#cbd5e1] focus:border-[#0057c8] focus:bg-white focus:ring-[3px] focus:ring-[#0057c8]/15',
                            compact ? 'h-10' : 'h-11',
                        )}
                    />
                </label>

                <LocationCombobox
                    value={location}
                    options={locationOptions}
                    onChange={onLocationChange}
                    ariaLabel={locationAriaLabel}
                    placeholder={locationAriaLabel}
                    searchPlaceholder={locationSearchPlaceholder}
                    useCustomLabel={locationUseCustomLabel}
                    emptyLabel={locationEmptyLabel}
                    compact={compact}
                    showPin
                    className={cn(
                        'w-full shrink-0',
                        compact
                            ? 'min-w-[11.5rem] sm:w-[12.5rem]'
                            : 'sm:w-[13.5rem] lg:w-[14.5rem]',
                    )}
                />

                <button
                    type="submit"
                    className={cn(
                        'inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[#0057c8] text-sm font-semibold text-white shadow-[0px_8px_16px_rgba(0,87,200,0.22)] transition hover:brightness-110 active:scale-[0.99]',
                        compact
                            ? 'h-10 w-full px-5 sm:w-auto'
                            : 'h-11 w-full px-5 sm:w-auto sm:min-w-[108px]',
                    )}
                >
                    {showSubmitIcon ? (
                        <img
                            src="/images/home/search-btn.svg"
                            alt=""
                            className="size-4"
                            width={16}
                            height={16}
                        />
                    ) : null}
                    {submitLabel}
                </button>
            </div>
        </form>
    );
}
