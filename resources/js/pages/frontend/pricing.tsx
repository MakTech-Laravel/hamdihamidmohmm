import { Head, Link } from '@inertiajs/react';
import { useMemo, useState } from 'react';

import PricingPackageCards, {
    translatePricingValue,
    type PricingPackage,
} from '@/components/frontend/pricing-package-cards';
import { useLocale } from '@/hooks/use-locale';
import FrontendLayout from '@/layouts/frontend-layout';
import { home, register } from '@/routes';

type Props = {
    packages?: PricingPackage[];
};

export default function Pricing({ packages = [] }: Props) {
    const { t } = useLocale();
    const [openFaq, setOpenFaq] = useState<number | null>(0);

    const comparisonPackages = useMemo(
        () =>
            packages.filter(
                (item) =>
                    item.is_featured ||
                    item.features.some((feature) => !feature.included),
            ).slice(0, 2),
        [packages],
    );

    const comparisonRows = useMemo(() => {
        if (comparisonPackages.length < 2) {
            return [];
        }

        const [left, right] = comparisonPackages;
        const keys = [
            ...new Set(
                [...left.features, ...right.features].map(
                    (feature) => feature.key,
                ),
            ),
        ];

        return keys.map((key) => ({
            feature: t(key),
            left:
                left.features.find((feature) => feature.key === key)
                    ?.included === true,
            right:
                right.features.find((feature) => feature.key === key)
                    ?.included === true,
        }));
    }, [comparisonPackages, t]);

    const faqs = useMemo(
        () => [
            {
                question: t('pricing.faq.q1'),
                answer: t('pricing.faq.a1'),
            },
            {
                question: t('pricing.faq.q2'),
                answer: t('pricing.faq.a2'),
            },
            {
                question: t('pricing.faq.q3'),
                answer: t('pricing.faq.a3'),
            },
            {
                question: t('pricing.faq.q4'),
                answer: t('pricing.faq.a4'),
            },
        ],
        [t],
    );

    return (
        <FrontendLayout>
            <Head title={`${t('pricing.title')} - RR Job Portal`} />

            <section className="bg-[#d1f6ff] px-4 py-10 sm:px-6 lg:px-8">
                <div className="mx-auto max-w-[1280px] text-center">
                    <nav className="flex flex-wrap items-center justify-center gap-2 text-sm">
                        <Link
                            href={home()}
                            className="text-[#050315] transition hover:text-[#0057c8]"
                        >
                            {t('nav.home')}
                        </Link>
                        <img
                            src="/images/pricing/breadcrumb-chevron.svg"
                            alt=""
                            className="size-4 rtl:rotate-180"
                            width={16}
                            height={16}
                        />
                        <span className="text-[#3977a6]">{t('nav.pricing')}</span>
                    </nav>

                    <h1 className="mt-5 text-4xl font-extrabold leading-tight tracking-[-0.3px] text-[#050315] sm:text-[48px] sm:leading-[48px]">
                        {t('pricing.title')}
                    </h1>
                    <p className="mx-auto mt-4 max-w-xl text-base leading-6 text-[rgba(5,3,21,0.8)]">
                        {t('pricing.subtitle')}
                    </p>
                </div>
            </section>

            <section className="bg-white px-4 py-16 sm:px-6 lg:px-8">
                <div className="mx-auto max-w-[1280px]">
                    <PricingPackageCards packages={packages} />

                    {comparisonRows.length > 0 && comparisonPackages.length === 2 && (
                    <div className="mt-16">
                        <h2 className="text-center text-3xl font-bold tracking-[-0.2px] text-[#050315]">
                            {t('pricing.comparison_title')}
                        </h2>

                        <div className="mt-8 overflow-x-auto rounded-2xl border border-[#d1f6ff] bg-white shadow-[0px_1px_3px_0px_rgba(0,0,0,0.06)]">
                            <table className="w-full min-w-[720px] border-collapse text-sm">
                                <thead>
                                    <tr className="border-b border-[#f1f5f9]">
                                        <th className="p-4 text-start font-semibold text-[#6a7282]">
                                            {t('pricing.features')}
                                        </th>
                                        <th className="p-4 text-center font-semibold text-[#0057c8]">
                                            {translatePricingValue(
                                                t,
                                                comparisonPackages[0].name,
                                                `pricing.packages.${comparisonPackages[0].slug}.name`,
                                            )}
                                        </th>
                                        <th className="bg-[#fff7ed] p-4 text-center font-semibold text-[#e57124]">
                                            {translatePricingValue(
                                                t,
                                                comparisonPackages[1].name,
                                                `pricing.packages.${comparisonPackages[1].slug}.name`,
                                            )}
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {comparisonRows.map((row) => (
                                        <tr
                                            key={row.feature}
                                            className="border-b border-[#f8faff] last:border-b-0"
                                        >
                                            <td className="p-4 text-start text-[#4a5565]">
                                                {row.feature}
                                            </td>
                                            {[row.left, row.right].map(
                                                (included, columnIndex) => (
                                                    <td
                                                        key={`${row.feature}-${columnIndex}`}
                                                        className={
                                                            columnIndex === 1
                                                                ? 'bg-[#fffbf7] p-4'
                                                                : 'p-4'
                                                        }
                                                    >
                                                        <div className="flex justify-center">
                                                            <span
                                                                className={`inline-flex size-6 items-center justify-center rounded-full ${
                                                                    included
                                                                        ? 'bg-[#dcfce7]'
                                                                        : 'bg-[#f1f5f9]'
                                                                }`}
                                                            >
                                                                <img
                                                                    src={
                                                                        included
                                                                            ? '/images/pricing/check-table.svg'
                                                                            : '/images/pricing/x-table.svg'
                                                                    }
                                                                    alt=""
                                                                    className={
                                                                        included
                                                                            ? 'size-3.5'
                                                                            : 'size-3'
                                                                    }
                                                                    width={
                                                                        included
                                                                            ? 14
                                                                            : 12
                                                                    }
                                                                    height={
                                                                        included
                                                                            ? 14
                                                                            : 12
                                                                    }
                                                                />
                                                            </span>
                                                        </div>
                                                    </td>
                                                ),
                                            )}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    )}

                    <div id="faq" className="mt-16 scroll-mt-28">
                        <h2 className="text-center text-3xl font-bold tracking-[-0.2px] text-[#050315]">
                            {t('pricing.faq_title')}
                        </h2>

                        <div className="mt-8 space-y-3">
                            {faqs.map((faq, index) => {
                                const isOpen = openFaq === index;

                                return (
                                    <div
                                        key={faq.question}
                                        className="overflow-hidden rounded-2xl border border-[#e2e8f0] bg-white shadow-[0px_1px_3px_0px_rgba(0,0,0,0.04)]"
                                    >
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setOpenFaq(isOpen ? null : index)
                                            }
                                            className="flex w-full items-center justify-between gap-4 p-5 text-start"
                                            aria-expanded={isOpen}
                                        >
                                            <span className="text-sm font-medium tracking-[-0.16px] text-[#050315]">
                                                {faq.question}
                                            </span>
                                            <img
                                                src="/images/pricing/chevron-down.svg"
                                                alt=""
                                                className={`size-5 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                                                width={20}
                                                height={20}
                                            />
                                        </button>
                                        {isOpen && (
                                            <div className="border-t border-[#f1f5f9] px-5 pb-5 pt-3">
                                                <p className="text-sm leading-6 text-[#6a7282]">
                                                    {faq.answer}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div className="mt-16 rounded-3xl bg-[#3977a6] p-10 text-center">
                        <h2 className="text-3xl font-extrabold text-white">
                            {t('pricing.cta_title')}
                        </h2>
                        <p className="mx-auto mt-3 max-w-2xl text-base text-[#f8faff]">
                            {t('pricing.cta_subtitle')}
                        </p>
                        <Link
                            href={register()}
                            className="mt-8 inline-flex items-center justify-center rounded-xl border border-white/30 px-8 py-3.5 text-sm font-bold text-white transition hover:bg-white/10"
                        >
                            {t('pricing.cta_button')}
                        </Link>
                    </div>
                </div>
            </section>
        </FrontendLayout>
    );
}
