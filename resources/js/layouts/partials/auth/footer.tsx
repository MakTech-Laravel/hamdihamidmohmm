import { Link } from '@inertiajs/react';

import AppLogo from '@/components/app-logo';
import { useLocale } from '@/hooks/use-locale';

export function AuthFooter() {
    const { t } = useLocale();

    return (
        <footer className="border-t bg-muted/30">
            <div className="container mx-auto px-6 py-12 md:px-8">
                <div className="grid grid-cols-1 gap-12 xl:grid-cols-3">
                    <div className="flex flex-col gap-4">
                        <AppLogo />
                        <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
                            {t('auth.footer.tagline')}
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 xl:col-span-2">
                        <FooterSection
                            title={t('auth.footer.product')}
                            links={[
                                { label: t('auth.footer.features'), href: '#' },
                                { label: t('auth.footer.pricing'), href: '#' },
                                { label: t('auth.footer.changelog'), href: '#' },
                            ]}
                        />
                        <FooterSection
                            title={t('auth.footer.support')}
                            links={[
                                { label: t('auth.footer.docs'), href: '#' },
                                { label: t('auth.footer.help_center'), href: '#' },
                                { label: t('auth.footer.status'), href: '#' },
                            ]}
                        />
                        <FooterSection
                            title={t('auth.footer.legal')}
                            links={[
                                { label: t('auth.footer.privacy'), href: '#' },
                                { label: t('auth.footer.terms'), href: '#' },
                                { label: t('auth.footer.cookie_policy'), href: '#' },
                            ]}
                        />
                    </div>
                </div>

                <div className="mt-12 flex flex-col items-center justify-between gap-6 border-t pt-8 md:flex-row">
                    <p className="text-xs text-muted-foreground">
                        {t('auth.footer.copyright', { year: new Date().getFullYear() })}
                    </p>
                    <div className="flex items-center gap-6">
                        <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground/60">
                            v2.4.0-stable
                        </span>
                    </div>
                </div>
            </div>
        </footer>
    );
}

function FooterSection({
    title,
    links,
}: {
    title: string;
    links: { label: string; href: string }[];
}) {
    return (
        <div className="flex flex-col gap-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground">
                {title}
            </h3>
            <ul className="flex flex-col gap-2">
                {links.map((link) => (
                    <li key={link.label}>
                        <Link
                            href={link.href}
                            className="text-sm text-muted-foreground transition-colors hover:text-violet-500"
                        >
                            {link.label}
                        </Link>
                    </li>
                ))}
            </ul>
        </div>
    );
}
