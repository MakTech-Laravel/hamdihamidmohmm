import { router, usePage } from '@inertiajs/react';
import { useCallback, useEffect } from 'react';

import type { SharedData } from '@/types';

type TranslateReplacements = Record<string, string | number>;

export function useLocale() {
    const { locale, dir, translations, availableLocales } =
        usePage<SharedData>().props;

    useEffect(() => {
        document.documentElement.lang = locale;
        document.documentElement.dir = dir;
        document.documentElement.classList.toggle('rtl', dir === 'rtl');
        document.documentElement.classList.toggle('ltr', dir === 'ltr');
    }, [locale, dir]);

    const t = useCallback(
        (key: string, replacements: TranslateReplacements = {}): string => {
            let value = translations[key] ?? key;

            Object.entries(replacements).forEach(([name, replacement]) => {
                value = value.replaceAll(`:${name}`, String(replacement));
            });

            return value;
        },
        [translations],
    );

    const setLocale = useCallback((nextLocale: string) => {
        router.post(
            '/locale',
            { locale: nextLocale },
            {
                preserveScroll: true,
                preserveState: false,
                replace: true,
            },
        );
    }, []);

    return {
        locale,
        dir,
        isRtl: dir === 'rtl',
        availableLocales,
        t,
        setLocale,
    };
}
