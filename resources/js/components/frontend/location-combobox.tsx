import { Check, ChevronDown, MapPin, Search } from 'lucide-react';
import {
    useEffect,
    useLayoutEffect,
    useMemo,
    useRef,
    useState,
    type CSSProperties,
    type KeyboardEvent,
} from 'react';
import { createPortal } from 'react-dom';

import { cn } from '@/lib/utils';

export type LocationOption = {
    value: string;
    label: string;
};

type LocationComboboxProps = {
    value: string;
    options: LocationOption[];
    onChange: (value: string) => void;
    placeholder?: string;
    searchPlaceholder?: string;
    useCustomLabel?: (query: string) => string;
    emptyLabel?: string;
    ariaLabel?: string;
    className?: string;
    compact?: boolean;
    showPin?: boolean;
};

type MenuPosition = {
    top: number;
    left: number;
    width: number;
    maxHeight: number;
};

export function LocationCombobox({
    value,
    options,
    onChange,
    placeholder = 'All Locations',
    searchPlaceholder = 'Search locations...',
    useCustomLabel = (query) => `Use “${query}”`,
    emptyLabel = 'No matching location',
    ariaLabel,
    className,
    compact = false,
    showPin = false,
}: LocationComboboxProps) {
    const rootRef = useRef<HTMLDivElement>(null);
    const triggerRef = useRef<HTMLButtonElement>(null);
    const menuRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [menuPosition, setMenuPosition] = useState<MenuPosition | null>(null);

    const selected = useMemo(
        () => options.find((option) => option.value === value) ?? null,
        [options, value],
    );

    const displayLabel = selected?.label ?? (value || placeholder);
    const isCustom = value !== '' && selected === null;

    const filtered = useMemo(() => {
        const needle = query.trim().toLowerCase();

        if (!needle) {
            return options;
        }

        return options.filter((option) =>
            option.label.toLowerCase().includes(needle),
        );
    }, [options, query]);

    const canUseCustom = useMemo(() => {
        const needle = query.trim();

        if (!needle) {
            return false;
        }

        return !options.some(
            (option) => option.label.toLowerCase() === needle.toLowerCase(),
        );
    }, [options, query]);

    const updateMenuPosition = (): void => {
        const trigger = triggerRef.current;

        if (!trigger) {
            return;
        }

        const rect = trigger.getBoundingClientRect();
        const viewportPadding = 12;
        const gap = 6;
        const preferredHeight = 280;
        const spaceBelow = window.innerHeight - rect.bottom - viewportPadding;
        const spaceAbove = rect.top - viewportPadding;
        const openUpward =
            spaceBelow < 180 && spaceAbove > spaceBelow;
        const available = openUpward ? spaceAbove : spaceBelow;
        const maxHeight = Math.max(160, Math.min(preferredHeight, available - gap));
        const width = Math.max(rect.width, 220);

        setMenuPosition({
            top: openUpward
                ? Math.max(viewportPadding, rect.top - gap - maxHeight)
                : rect.bottom + gap,
            left: Math.min(
                Math.max(viewportPadding, rect.left),
                window.innerWidth - width - viewportPadding,
            ),
            width,
            maxHeight,
        });
    };

    useLayoutEffect(() => {
        if (!open) {
            setMenuPosition(null);
            return;
        }

        updateMenuPosition();
        window.setTimeout(() => inputRef.current?.focus(), 0);

        const onReposition = (): void => updateMenuPosition();

        window.addEventListener('resize', onReposition);
        window.addEventListener('scroll', onReposition, true);

        return () => {
            window.removeEventListener('resize', onReposition);
            window.removeEventListener('scroll', onReposition, true);
        };
    }, [open]);

    useEffect(() => {
        if (!open) {
            return;
        }

        const onPointerDown = (event: MouseEvent): void => {
            const target = event.target as Node;

            if (
                rootRef.current?.contains(target) ||
                menuRef.current?.contains(target)
            ) {
                return;
            }

            setOpen(false);
            setQuery('');
        };

        const onKeyDown = (event: globalThis.KeyboardEvent): void => {
            if (event.key === 'Escape') {
                setOpen(false);
                setQuery('');
            }
        };

        document.addEventListener('mousedown', onPointerDown);
        document.addEventListener('keydown', onKeyDown);

        return () => {
            document.removeEventListener('mousedown', onPointerDown);
            document.removeEventListener('keydown', onKeyDown);
        };
    }, [open]);

    const selectOption = (option: LocationOption): void => {
        onChange(option.value);
        setQuery('');
        setOpen(false);
    };

    const selectCustom = (raw: string): void => {
        const next = raw.trim();

        if (!next) {
            return;
        }

        const match = options.find(
            (option) => option.label.toLowerCase() === next.toLowerCase(),
        );

        onChange(match ? match.value : next);
        setQuery('');
        setOpen(false);
    };

    const onKeyDown = (event: KeyboardEvent<HTMLInputElement>): void => {
        if (event.key === 'Enter') {
            event.preventDefault();
            event.stopPropagation();

            if (canUseCustom) {
                selectCustom(query);
                return;
            }

            if (filtered[0]) {
                selectOption(filtered[0]);
            }
        }

        if (event.key === 'Escape') {
            setOpen(false);
            setQuery('');
        }
    };

    const menuStyle: CSSProperties | undefined = menuPosition
        ? {
              top: menuPosition.top,
              left: menuPosition.left,
              width: menuPosition.width,
              maxHeight: menuPosition.maxHeight,
          }
        : undefined;

    return (
        <div ref={rootRef} className={cn('relative', className)}>
            <button
                ref={triggerRef}
                type="button"
                aria-label={
                    ariaLabel ? `${ariaLabel}: ${displayLabel}` : displayLabel
                }
                aria-expanded={open}
                aria-haspopup="listbox"
                onClick={() => {
                    setOpen((current) => !current);
                }}
                className={cn(
                    'flex w-full items-center gap-2 rounded-xl border border-[#e2e8f0] bg-white px-3 text-start transition hover:border-[#cbd5e1] focus-visible:border-[#0057c8] focus-visible:ring-[3px] focus-visible:ring-[#0057c8]/15 focus-visible:outline-none',
                    compact
                        ? 'h-10 bg-[#f8faff] text-xs sm:text-sm'
                        : 'h-10 text-sm',
                    isCustom && 'border-[#0057c8]/40',
                )}
            >
                {showPin ? (
                    <MapPin className="size-4 shrink-0 text-[#64748b]" />
                ) : null}
                <span
                    className={cn(
                        'min-w-0 flex-1 truncate font-medium',
                        value ? 'text-[#050315]' : 'text-[#64748b]',
                    )}
                >
                    {displayLabel}
                </span>
                <ChevronDown
                    className={cn(
                        'size-4 shrink-0 text-[#64748b] transition',
                        open && 'rotate-180',
                    )}
                />
            </button>

            {open && menuPosition && typeof document !== 'undefined'
                ? createPortal(
                      <div
                          ref={menuRef}
                          style={menuStyle}
                          className="fixed z-[80] flex flex-col overflow-hidden rounded-2xl border border-[#dbe4ef] bg-white shadow-[0_18px_40px_rgba(5,3,21,0.18)]"
                          role="listbox"
                      >
                          <div className="shrink-0 border-b border-[#eef2f7] p-2">
                              <label className="relative flex items-center">
                                  <Search className="pointer-events-none absolute start-2.5 size-3.5 text-[#94a3b8]" />
                                  <input
                                      ref={inputRef}
                                      value={query}
                                      onChange={(event) =>
                                          setQuery(event.target.value)
                                      }
                                      onKeyDown={onKeyDown}
                                      placeholder={searchPlaceholder}
                                      className="h-9 w-full rounded-xl border border-[#e2e8f0] bg-[#f8faff] pe-3 ps-8 text-sm text-[#050315] outline-none placeholder:text-[#94a3b8] focus:border-[#0057c8] focus:bg-white"
                                  />
                              </label>
                          </div>

                          <div className="min-h-0 flex-1 overflow-y-auto p-1.5">
                              {filtered.map((option) => {
                                  const active = option.value === value;

                                  return (
                                      <button
                                          key={option.value || 'all'}
                                          type="button"
                                          role="option"
                                          aria-selected={active}
                                          onClick={() => selectOption(option)}
                                          className={cn(
                                              'flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2 text-start text-sm font-medium transition',
                                              active
                                                  ? 'bg-[#eef5ff] text-[#0057c8]'
                                                  : 'text-[#334155] hover:bg-[#eef5ff] hover:text-[#0057c8]',
                                          )}
                                      >
                                          <span className="truncate">
                                              {option.label}
                                          </span>
                                          {active ? (
                                              <Check className="size-4 shrink-0" />
                                          ) : null}
                                      </button>
                                  );
                              })}

                              {canUseCustom ? (
                                  <button
                                      type="button"
                                      onClick={() => selectCustom(query)}
                                      className="mt-1 flex w-full items-center rounded-xl border border-dashed border-[#bfdbfe] bg-[#f8fbff] px-3 py-2 text-start text-sm font-semibold text-[#0057c8] transition hover:bg-[#eef5ff]"
                                  >
                                      {useCustomLabel(query.trim())}
                                  </button>
                              ) : null}

                              {filtered.length === 0 && !canUseCustom ? (
                                  <p className="px-3 py-3 text-sm text-[#94a3b8]">
                                      {emptyLabel}
                                  </p>
                              ) : null}
                          </div>
                      </div>,
                      document.body,
                  )
                : null}
        </div>
    );
}
