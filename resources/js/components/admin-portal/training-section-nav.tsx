import { Link, usePage } from '@inertiajs/react';

import { useLocale } from '@/hooks/use-locale';
import { cn } from '@/lib/utils';

const items = [
    {
        key: 'admin.training.nav.media',
        href: '/admin/training',
        isActive: (path: string) => path === '/admin/training',
    },
    {
        key: 'admin.training.nav.courses',
        href: '/admin/training/courses',
        isActive: (path: string) => path.startsWith('/admin/training/courses'),
    },
    {
        key: 'admin.training.nav.registrations',
        href: '/admin/training/registrations',
        isActive: (path: string) => path.startsWith('/admin/training/registrations'),
    },
];

export function TrainingSectionNav() {
    const { t } = useLocale();
    const { url } = usePage();
    const path = url.split('?')[0] ?? '';

    return (
        <div className="flex flex-wrap gap-2">
            {items.map((item) => (
                <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                        'rounded-lg px-3 py-1.5 text-sm font-semibold',
                        item.isActive(path)
                            ? 'bg-[#0057c8] text-white'
                            : 'bg-[#eff6ff] text-[#0057c8] hover:bg-[#dbeafe]',
                    )}
                >
                    {t(item.key)}
                </Link>
            ))}
        </div>
    );
}
