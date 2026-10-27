import { type ReactNode } from 'react';

import { useLocale } from '@/hooks/use-locale';
import { cn } from '@/lib/utils';

export function PortalMobileNav({
    open,
    onClose,
    children,
}: {
    open: boolean;
    onClose: () => void;
    children: ReactNode;
}) {
    const { t } = useLocale();

    return (
        <>
            <div
                className={cn(
                    'fixed inset-y-0 start-0 z-50 will-change-transform transition-transform duration-300 ease-in-out md:hidden',
                    open
                        ? 'translate-x-0'
                        : 'pointer-events-none -translate-x-full rtl:translate-x-full',
                )}
                aria-hidden={!open}
            >
                {children}
            </div>

            <button
                type="button"
                className={cn(
                    'fixed inset-0 z-40 bg-slate-900/40 transition-opacity duration-300 ease-in-out md:hidden',
                    open
                        ? 'opacity-100'
                        : 'pointer-events-none opacity-0',
                )}
                aria-label={t('common.close_sidebar')}
                aria-hidden={!open}
                tabIndex={open ? 0 : -1}
                onClick={onClose}
            />
        </>
    );
}
