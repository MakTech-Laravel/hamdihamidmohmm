import { Link, usePage } from '@inertiajs/react';
import { Mail, Phone } from 'lucide-react';

import { useLocale } from '@/hooks/use-locale';
import { discover, pricing } from '@/routes';
import type { SharedData } from '@/types';

const socialMeta = [
    { key: 'facebook_url', label: 'Facebook', src: '/images/home/facebook.svg' },
    { key: 'twitter_url', label: 'X', src: '/images/home/x.svg' },
    { key: 'linkedin_url', label: 'LinkedIn', src: '/images/home/linkedin.svg' },
    {
        key: 'instagram_url',
        label: 'Instagram',
        src: '/images/home/instagram.svg',
    },
] as const;

function normalizeSocialHref(value: unknown): string | null {
    if (typeof value !== 'string') {
        return null;
    }

    const trimmed = value.trim();

    if (trimmed === '' || trimmed === '#') {
        return null;
    }

    if (/^https?:\/\//i.test(trimmed)) {
        return trimmed;
    }

    return `https://${trimmed}`;
}

function telHref(phone: string): string {
    return `tel:${phone.replace(/[^\d+]/g, '')}`;
}

export function FrontendFooter() {
    const { t } = useLocale();
    const { platform_social, platform_contact } = usePage<SharedData>().props;

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

    const socialLinks = socialMeta
        .map((item) => ({
            ...item,
            href: normalizeSocialHref(platform_social?.[item.key]),
        }))
        .filter((item): item is typeof item & { href: string } => item.href !== null);

    const supportPhones = [
        platform_contact?.support_phone,
        platform_contact?.support_phone_secondary,
    ].filter((phone): phone is string => Boolean(phone));

    const supportEmail =
        platform_contact?.support_email || platform_contact?.contact_email || null;

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

                {(supportPhones.length > 0 || supportEmail) && (
                    <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2">
                        <span aria-hidden="true" className="text-[#d1f6ff]/50">
                            |
                        </span>
                        {supportPhones.map((phone) => (
                            <a
                                key={phone}
                                href={telHref(phone)}
                                className="inline-flex items-center gap-1.5 whitespace-nowrap text-[#d1f6ff] transition hover:text-white"
                            >
                                <Phone className="size-3.5 shrink-0" aria-hidden="true" />
                                <span>{phone}</span>
                            </a>
                        ))}
                        {supportEmail ? (
                            <a
                                href={`mailto:${supportEmail}`}
                                className="inline-flex items-center gap-1.5 whitespace-nowrap text-[#d1f6ff] transition hover:text-white"
                            >
                                <Mail className="size-3.5 shrink-0" aria-hidden="true" />
                                <span>{supportEmail}</span>
                            </a>
                        ) : null}
                    </div>
                )}

                {socialLinks.length > 0 ? (
                    <div className="flex items-center gap-3 ps-1">
                        {socialLinks.map((social) => (
                            <a
                                key={social.label}
                                href={social.href}
                                target="_blank"
                                rel="noreferrer"
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
                ) : null}
            </div>
        </footer>
    );
}
