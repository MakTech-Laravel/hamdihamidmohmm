import { FormEvent } from 'react';

import { NativeSelect } from '@/components/ui/native-select';
import { cn } from '@/lib/utils';

type LocationOption = {
    value: string;
    label: string;
};

type JobSearchFormProps = {
    keyword: string;
    location: string;
    locationOptions: LocationOption[];
    keywordPlaceholder: string;
    locationAriaLabel: string;
    submitLabel: string;
    onKeywordChange: (value: string) => void;
    onLocationChange: (value: string) => void;
    onSubmit: (event: FormEvent) => void;
    className?: string;
    showSubmitIcon?: boolean;
};

export function JobSearchForm({
    keyword,
    location,
    locationOptions,
    keywordPlaceholder,
    locationAriaLabel,
    submitLabel,
    onKeywordChange,
    onLocationChange,
    onSubmit,
    className,
    showSubmitIcon = false,
}: JobSearchFormProps) {
    return (
        <form
            onSubmit={onSubmit}
            className={cn(
                'rounded-2xl border border-white/80 bg-white/95 p-2.5 shadow-[0px_16px_32px_rgba(5,3,21,0.08)] backdrop-blur sm:p-3',
                className,
            )}
        >
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-2.5">
                <label className="relative flex min-w-0 flex-1 items-center">
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
                        className="h-11 w-full rounded-xl border border-[#e2e8f0] bg-[#f8faff] pe-3 ps-9 text-sm text-[#374151] outline-none transition placeholder:text-[rgba(55,65,81,0.5)] hover:border-[#cbd5e1] focus:border-[#0057c8] focus:bg-white focus:ring-[3px] focus:ring-[#0057c8]/15"
                    />
                </label>

                <div className="flex h-11 shrink-0 items-center gap-2.5 rounded-xl border border-[#e2e8f0] bg-[#f8faff] px-3 transition hover:border-[#cbd5e1] focus-within:border-[#0057c8] focus-within:bg-white focus-within:ring-[3px] focus-within:ring-[#0057c8]/15 sm:w-[180px] lg:w-[200px]">
                    <img
                        src="/images/jobs/map-pin.svg"
                        alt=""
                        className="size-4 shrink-0"
                        width={16}
                        height={16}
                    />
                    <NativeSelect
                        variant="ghost"
                        value={location}
                        onChange={(event) =>
                            onLocationChange(event.target.value)
                        }
                        aria-label={locationAriaLabel}
                        className="text-sm"
                    >
                        {locationOptions.map((option) => (
                            <option
                                key={option.value || 'all'}
                                value={option.value}
                            >
                                {option.label}
                            </option>
                        ))}
                    </NativeSelect>
                </div>

                <button
                    type="submit"
                    className="inline-flex h-11 w-full shrink-0 items-center justify-center gap-2 rounded-xl bg-[#0057c8] px-5 text-sm font-semibold text-white shadow-[0px_8px_16px_rgba(0,87,200,0.22)] transition hover:brightness-110 active:scale-[0.99] sm:w-auto sm:min-w-[108px]"
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
