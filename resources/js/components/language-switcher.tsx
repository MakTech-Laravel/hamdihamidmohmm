import { useLocale } from '@/hooks/use-locale';
import { cn } from '@/lib/utils';

type LanguageSwitcherProps = {
    variant?: 'header' | 'footer';
    className?: string;
};

export function LanguageSwitcher({
    variant = 'header',
    className,
}: LanguageSwitcherProps) {
    const { locale, availableLocales, setLocale, t } = useLocale();

    if (variant === 'header') {
        const nextLocale = locale === 'ar' ? 'en' : 'ar';
        const label =
            nextLocale === 'ar'
                ? t('lang.switch_to_arabic')
                : t('lang.switch_to_english');

        return (
            <button
                type="button"
                onClick={() => setLocale(nextLocale)}
                className={cn(
                    'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-[#d1f6ff] transition hover:bg-white/10',
                    className,
                )}
                aria-label={label}
            >
                <img
                    src="/images/home/lang.svg"
                    alt=""
                    className="size-4"
                    width={16}
                    height={16}
                />
                <span dir={nextLocale === 'ar' ? 'rtl' : 'ltr'}>{label}</span>
            </button>
        );
    }

    return (
        <div className={cn('flex flex-col gap-2', className)}>
            {availableLocales.map((option) => {
                const isActive = option.code === locale;

                return (
                    <button
                        key={option.code}
                        type="button"
                        onClick={() => setLocale(option.code)}
                        className={cn(
                            'inline-flex w-fit items-center gap-2 rounded-lg px-3 py-2 text-sm transition',
                            isActive
                                ? 'bg-[#3977a6] text-[#d1f6ff]'
                                : 'text-[rgba(5,3,21,0.9)] hover:bg-white/50',
                        )}
                        aria-pressed={isActive}
                    >
                        <span dir={option.dir}>{option.label}</span>
                    </button>
                );
            })}
        </div>
    );
}
