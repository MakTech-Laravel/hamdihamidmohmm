import { Link } from '@inertiajs/react';

import { useLocale } from '@/hooks/use-locale';
import { role as registerRole } from '@/routes/register';

export type PricingFeature = {
    key: string;
    included: boolean;
};

export type PricingPackage = {
    id: number;
    slug: string;
    name: string;
    description: string | null;
    price: number;
    currency: string;
    is_featured: boolean;
    features: PricingFeature[];
};

export function translatePricingValue(
    t: (key: string) => string,
    value: string,
    slugKey?: string,
): string {
    if (slugKey) {
        const fromSlug = t(slugKey);

        if (fromSlug !== slugKey) {
            return fromSlug;
        }
    }

    return t(value);
}

export default function PricingPackageCards({
    packages,
}: {
    packages: PricingPackage[];
}) {
    const { t } = useLocale();

    if (packages.length === 0) {
        return (
            <p className="text-center text-sm text-[#6a7282]">
                {t('pricing.empty')}
            </p>
        );
    }

    return (
        <div className="grid gap-6 lg:grid-cols-3">
            {packages.map((item) => {
                const isFeatured = item.is_featured;
                const isEnterpriseStyle =
                    !isFeatured &&
                    !item.features.some((feature) => !feature.included);
                const name = translatePricingValue(
                    t,
                    item.name,
                    `pricing.packages.${item.slug}.name`,
                );
                const description = item.description
                    ? translatePricingValue(
                          t,
                          item.description,
                          `pricing.packages.${item.slug}.description`,
                      )
                    : null;
                const currencyLabel =
                    item.currency === 'SGD'
                        ? t('pricing.currency')
                        : item.currency;

                return (
                    <article
                        key={item.id}
                        className={
                            isFeatured
                                ? 'relative flex flex-col rounded-2xl border border-transparent bg-[#0057c8] p-7 shadow-[0px_16px_20px_rgba(30,58,138,0.3)]'
                                : isEnterpriseStyle
                                  ? 'flex flex-col rounded-2xl border border-[#e8d5e8] bg-white p-7'
                                  : 'flex flex-col rounded-2xl border border-[#e2e8f0] bg-white p-7 shadow-[0px_1px_1.5px_rgba(0,0,0,0.06)]'
                        }
                    >
                        {isFeatured && (
                            <span className="absolute -top-3 end-6 rounded-full bg-[#e57124] px-3 py-1 text-xs font-bold text-white shadow-sm">
                                {t('pricing.most_popular')}
                            </span>
                        )}

                        <h2
                            className={
                                isFeatured
                                    ? 'text-xl font-extrabold leading-7 text-white'
                                    : isEnterpriseStyle
                                      ? 'text-[16.8px] font-bold leading-[25.2px] text-[#050315]'
                                      : 'text-xl font-extrabold leading-7 text-[#0f172a]'
                            }
                        >
                            {name}
                        </h2>
                        {description && (
                            <p
                                className={
                                    isFeatured
                                        ? 'mt-1 text-sm text-[#bfdbfe]'
                                        : 'mt-1 text-sm text-[#64748b]'
                                }
                            >
                                {description}
                            </p>
                        )}

                        <div className="mt-5 flex items-end gap-2">
                            <span
                                dir="ltr"
                                className={
                                    isFeatured
                                        ? 'text-5xl font-extrabold leading-none text-white'
                                        : 'text-5xl font-extrabold leading-none text-[#1e3a8a]'
                                }
                            >
                                {item.price}
                            </span>
                            <span
                                className={
                                    isFeatured
                                        ? 'pb-1 text-sm text-[#bfdbfe]'
                                        : 'pb-1 text-sm text-[#64748b]'
                                }
                            >
                                {currencyLabel}
                            </span>
                        </div>

                        <ul className="mt-6 flex-1 space-y-3">
                            {item.features.map((feature) => (
                                <li
                                    key={`${item.id}-${feature.key}`}
                                    className={
                                        isFeatured
                                            ? 'flex items-center gap-2.5 text-sm text-white'
                                            : isEnterpriseStyle
                                              ? 'flex items-center gap-2.5 text-base tracking-[-0.18px] text-[#050315]'
                                              : `flex items-center gap-2.5 text-sm text-[#374151] ${feature.included ? '' : 'opacity-40'}`
                                    }
                                >
                                    {isFeatured ? (
                                        <span className="inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-white/20">
                                            <img
                                                src="/images/pricing/check-light.svg"
                                                alt=""
                                                className="size-3"
                                                width={12}
                                                height={12}
                                            />
                                        </span>
                                    ) : isEnterpriseStyle ? (
                                        <span className="inline-flex size-5 shrink-0 items-center justify-center">
                                            <img
                                                src="/images/pricing/check-green.svg"
                                                alt=""
                                                className="size-3"
                                                width={12}
                                                height={12}
                                            />
                                        </span>
                                    ) : (
                                        <span
                                            className={`inline-flex size-5 shrink-0 items-center justify-center rounded-full ${
                                                feature.included
                                                    ? 'bg-[#dcfce7]'
                                                    : 'bg-[#f1f5f9]'
                                            }`}
                                        >
                                            <img
                                                src={
                                                    feature.included
                                                        ? '/images/pricing/check-green.svg'
                                                        : '/images/pricing/x-muted.svg'
                                                }
                                                alt=""
                                                className="size-3"
                                                width={12}
                                                height={12}
                                            />
                                        </span>
                                    )}
                                    {t(feature.key)}
                                </li>
                            ))}
                        </ul>

                        <Link
                            href={registerRole.url('employer')}
                            className={
                                isFeatured
                                    ? 'mt-7 inline-flex h-12 items-center justify-center rounded-xl bg-white text-base font-medium tracking-[-0.18px] text-[#0057c8] transition hover:bg-[#f8faff]'
                                    : 'mt-7 inline-flex h-12 items-center justify-center rounded-xl bg-[#0057c8] text-base font-medium tracking-[-0.18px] text-white transition hover:brightness-110'
                            }
                        >
                            {t('pricing.buy_now')}
                        </Link>
                    </article>
                );
            })}
        </div>
    );
}
