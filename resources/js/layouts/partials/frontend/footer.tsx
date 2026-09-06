import { Link } from '@inertiajs/react';

import { LanguageSwitcher } from '@/components/language-switcher';
import BrandLogo from '@/components/brand-logo';
import { useLocale } from '@/hooks/use-locale';
import { about, contact, home, jobs, pricing, training } from '@/routes';

const socialLinks = [
    { label: 'LinkedIn', src: '/images/home/linkedin.svg', href: '#' },
    { label: 'X', src: '/images/home/x.svg', href: '#' },
    { label: 'Facebook', src: '/images/home/facebook.svg', href: '#' },
];

export function FrontendFooter() {
    const { t } = useLocale();

    const quickLinks = [
        { label: t('nav.home'), href: '/' },
        { label: t('footer.browse_jobs'), href: jobs.url() },
        { label: t('nav.pricing'), href: pricing.url() },
        { label: t('nav.training'), href: training.url() },
        { label: t('nav.about'), href: about.url() },
        { label: t('nav.contact'), href: contact.url() },
    ];

    const legalLinks = [
        { label: t('footer.terms'), href: '#terms' },
        { label: t('footer.privacy'), href: '#privacy' },
    ];

    return (
        <footer className="bg-[#d1f6ff] font-['Plus_Jakarta_Sans','Noto_Sans_Arabic',sans-serif] text-[#050315]">
            <div className="mx-auto max-w-[1344px] px-4 py-14 sm:px-6 lg:px-8">
                <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4 lg:gap-5">
                    <div>
                        <Link href={home()}>
                            <BrandLogo
                                className="h-[57px] w-[86px]"
                                width={86}
                                height={57}
                            />
                        </Link>
                        <p className="mt-4 max-w-[274px] text-sm leading-[22.75px] text-[#050315]">
                            {t('footer.tagline')}
                        </p>
                    </div>

                    <div>
                        <h3 className="text-base font-semibold tracking-[-0.18px]">
                            {t('footer.quick_links')}
                        </h3>
                        <ul className="mt-4 space-y-2.5">
                            {quickLinks.map((link) => (
                                <li key={link.href + link.label}>
                                    <Link
                                        href={link.href}
                                        className="text-sm text-[rgba(5,3,21,0.9)] transition hover:text-[#0057c8]"
                                    >
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div>
                        <h3 className="text-base font-semibold tracking-[-0.18px]">
                            {t('footer.legal')}
                        </h3>
                        <ul className="mt-4 space-y-2.5">
                            {legalLinks.map((link) => (
                                <li key={link.href}>
                                    <Link
                                        href={link.href}
                                        className="text-sm text-[rgba(5,3,21,0.9)] transition hover:text-[#0057c8]"
                                    >
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div>
                        <h3 className="text-base font-semibold tracking-[-0.18px]">
                            {t('lang.language')}
                        </h3>
                        <div className="mt-4">
                            <LanguageSwitcher variant="footer" />
                        </div>
                    </div>
                </div>

                <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-[#3977a6] pt-8 sm:flex-row">
                    <p className="text-sm text-[rgba(5,3,21,0.6)]">
                        {t('footer.copyright')}
                    </p>
                    <div className="flex items-center gap-4">
                        {socialLinks.map((social) => (
                            <a
                                key={social.label}
                                href={social.href}
                                aria-label={social.label}
                                className="inline-flex size-8 items-center justify-center rounded-lg transition hover:bg-white/40"
                            >
                                <img
                                    src={social.src}
                                    alt=""
                                    className="size-4"
                                    width={16}
                                    height={16}
                                />
                            </a>
                        ))}
                    </div>
                </div>
            </div>
        </footer>
    );
}
