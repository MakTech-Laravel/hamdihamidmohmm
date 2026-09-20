import { Link } from '@inertiajs/react';

import { useLocale } from '@/hooks/use-locale';
import { discover, pricing } from '@/routes';

const socialLinks = [
    { label: 'Facebook', src: '/images/home/facebook.svg', href: '#' },
    { label: 'X', src: '/images/home/x.svg', href: '#' },
    { label: 'LinkedIn', src: '/images/home/linkedin.svg', href: '#' },
    { label: 'Instagram', src: '/images/home/instagram.svg', href: '#' },
];

export function FrontendFooter() {
    const { t } = useLocale();

    const links = [
        { label: t('footer.terms'), href: '#terms' },
        { label: t('footer.stay_up_to_date'), href: `${discover.url()}#newsletter` },
        { label: t('footer.privacy'), href: '#privacy' },
        {
            label: t('footer.subscribe_newsletter'),
            href: `${discover.url()}#newsletter`,
        },
        { label: t('nav.faq'), href: `${pricing.url()}#faq` },
    ];

    return (
        <footer className="border-t border-[#0057c8] bg-[#1e3a8a] font-['Plus_Jakarta_Sans','Noto_Sans_Arabic',sans-serif] text-[#d1f6ff]">
            <div className="mx-auto flex max-w-[1344px] flex-wrap items-center justify-center gap-x-3 gap-y-3 px-4 py-3.5 text-sm sm:px-6 lg:gap-x-4 lg:px-8">
                <p className="whitespace-nowrap text-[#d1f6ff]">
                    {t('footer.copyright')}
                </p>

                <nav
                    aria-label={t('footer.legal')}
                    className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2 lg:gap-x-4"
                >
                    {links.map((link) => (
                        <span
                            key={link.label}
                            className="inline-flex items-center gap-x-3 lg:gap-x-4"
                        >
                            <span aria-hidden="true" className="text-[#d1f6ff]/50">
                                |
                            </span>
                            <Link
                                href={link.href}
                                className="whitespace-nowrap text-[#d1f6ff] transition hover:text-white"
                            >
                                {link.label}
                            </Link>
                        </span>
                    ))}
                </nav>

                <div className="flex items-center gap-3 ps-1">
                    {socialLinks.map((social) => (
                        <a
                            key={social.label}
                            href={social.href}
                            aria-label={social.label}
                            className="inline-flex size-5 items-center justify-center transition hover:opacity-80"
                        >
                            <img
                                src={social.src}
                                alt=""
                                className="size-4 brightness-0 invert"
                                width={16}
                                height={16}
                            />
                        </a>
                    ))}
                </div>
            </div>
        </footer>
    );
}
