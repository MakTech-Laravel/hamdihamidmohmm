import { Head, Link } from '@inertiajs/react';
import { useMemo, useState } from 'react';

import { useLocale } from '@/hooks/use-locale';
import FrontendLayout from '@/layouts/frontend-layout';
import { home, register } from '@/routes';
import { role as registerRole } from '@/routes/register';

type FeatureState = 'included' | 'excluded';

export default function Pricing() {
    const { t } = useLocale();
    const [openFaq, setOpenFaq] = useState<number | null>(0);

    const singleFeatures = useMemo(
        () => [
            { label: t('pricing.feature.one_job'), included: true },
            { label: t('pricing.feature.visibility_30'), included: true },
            { label: t('pricing.feature.receive_apps'), included: true },
            { label: t('pricing.feature.applicant_mgmt'), included: true },
            { label: t('pricing.feature.multiple_jobs'), included: false },
            { label: t('pricing.feature.advanced_mgmt'), included: false },
            { label: t('pricing.feature.dedicated_support'), included: false },
            { label: t('pricing.feature.priority_listing'), included: false },
        ],
        [t],
    );

    const businessFeatures = useMemo(
        () => [
            t('pricing.feature.one_job'),
            t('pricing.feature.visibility_30'),
            t('pricing.feature.receive_apps'),
            t('pricing.feature.applicant_mgmt'),
            t('pricing.feature.multiple_jobs'),
            t('pricing.feature.advanced_mgmt'),
            t('pricing.feature.dedicated_support'),
            t('pricing.feature.priority_listing'),
        ],
        [t],
    );

    const comparisonRows = useMemo(
        () =>
            [
                { feature: t('pricing.feature.one_job'), single: 'included', business: 'included' },
                {
                    feature: t('pricing.feature.visibility_30'),
                    single: 'included',
                    business: 'included',
                },
                {
                    feature: t('pricing.feature.receive_apps'),
                    single: 'included',
                    business: 'included',
                },
                {
                    feature: t('pricing.feature.applicant_mgmt'),
                    single: 'included',
                    business: 'included',
                },
                {
                    feature: t('pricing.feature.multiple_jobs'),
                    single: 'excluded',
                    business: 'included',
                },
                {
                    feature: t('pricing.feature.advanced_mgmt'),
                    single: 'excluded',
                    business: 'included',
                },
                {
                    feature: t('pricing.feature.dedicated_support'),
                    single: 'excluded',
                    business: 'included',
                },
                {
                    feature: t('pricing.feature.priority_listing'),
                    single: 'excluded',
                    business: 'included',
                },
                {
                    feature: t('pricing.feature.analytics'),
                    single: 'excluded',
                    business: 'included',
                },
                {
                    feature: t('pricing.feature.extended_visibility'),
                    single: 'excluded',
                    business: 'included',
                },
            ] satisfies Array<{
                feature: string;
                single: FeatureState;
                business: FeatureState;
            }>,
        [t],
    );

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

            <section className="bg-[#ffebf5] px-4 py-10 sm:px-6 lg:px-8">
                <div className="mx-auto max-w-[1280px] text-center">
                    <nav className="flex flex-wrap items-center justify-center gap-2 text-sm">
                        <Link
                            href={home()}
                            className="text-[#050315] transition hover:text-[#323981]"
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

            <section className="bg-[#f8faff] px-4 py-16 sm:px-6 lg:px-8">
                <div className="mx-auto max-w-[1024px]">
                    <div className="grid gap-6 md:grid-cols-2">
                        {/* Single Posting */}
                        <article className="flex flex-col rounded-2xl border border-[#e2e8f0] bg-white p-7 shadow-[0px_1px_1.5px_rgba(0,0,0,0.06)]">
                            <h2 className="text-xl font-extrabold leading-7 text-[#0f172a]">
                                {t('pricing.single.name')}
                            </h2>
                            <p className="mt-1 text-sm text-[#64748b]">
                                {t('pricing.single.description')}
                            </p>

                            <div className="mt-5 flex items-end gap-2">
                                <span
                                    dir="ltr"
                                    className="text-5xl font-extrabold leading-none text-[#1e3a8a]"
                                >
                                    299
                                </span>
                                <span className="pb-1 text-sm text-[#64748b]">
                                    {t('pricing.currency')}
                                </span>
                            </div>

                            <ul className="mt-6 flex-1 space-y-3">
                                {singleFeatures.map((feature) => (
                                    <li
                                        key={feature.label}
                                        className={`flex items-center gap-2.5 text-sm text-[#374151] ${feature.included ? '' : 'opacity-40'
                                            }`}
                                    >
                                        <span
                                            className={`inline-flex size-5 shrink-0 items-center justify-center rounded-full ${feature.included
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
                                        {feature.label}
                                    </li>
                                ))}
                            </ul>

                            <Link
                                href={registerRole.url('employer')}
                                className="mt-7 inline-flex h-12 items-center justify-center rounded-xl bg-[#323981] text-base font-medium tracking-[-0.18px] text-white transition hover:brightness-110"
                            >
                                {t('pricing.buy_now')}
                            </Link>
                        </article>

                        {/* Business Package */}
                        <article className="relative flex flex-col rounded-2xl border border-transparent bg-[#3977a6] p-7 shadow-[0px_16px_20px_rgba(30,58,138,0.3)]">
                            <span className="absolute -top-3 end-6 rounded-full bg-[#e57124] px-3 py-1 text-xs font-bold text-white shadow-sm">
                                {t('pricing.most_popular')}
                            </span>

                            <h2 className="text-xl font-extrabold leading-7 text-white">
                                {t('pricing.business.name')}
                            </h2>
                            <p className="mt-1 text-sm text-[#bfdbfe]">
                                {t('pricing.business.description')}
                            </p>

                            <div className="mt-5 flex items-end gap-2">
                                <span
                                    dir="ltr"
                                    className="text-5xl font-extrabold leading-none text-white"
                                >
                                    999
                                </span>
                                <span className="pb-1 text-sm text-[#bfdbfe]">
                                    {t('pricing.currency')}
                                </span>
                            </div>

                            <ul className="mt-6 flex-1 space-y-3">
                                {businessFeatures.map((feature) => (
                                    <li
                                        key={feature}
                                        className="flex items-center gap-2.5 text-sm text-white"
                                    >
                                        <span className="inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-white/20">
                                            <img
                                                src="/images/pricing/check-light.svg"
                                                alt=""
                                                className="size-3"
                                                width={12}
                                                height={12}
                                            />
                                        </span>
                                        {feature}
                                    </li>
                                ))}
                            </ul>

                            <Link
                                href={registerRole.url('employer')}
                                className="mt-7 inline-flex h-12 items-center justify-center rounded-xl bg-white text-base font-medium tracking-[-0.18px] text-[#1e3a8a] transition hover:bg-[#f8faff]"
                            >
                                {t('pricing.buy_now')}
                            </Link>
                        </article>
                    </div>

                    {/* Comparison */}
                    <div className="mt-16">
                        <h2 className="text-center text-3xl font-bold tracking-[-0.2px] text-[#050315]">
                            {t('pricing.comparison_title')}
                        </h2>

                        <div className="mt-8 overflow-x-auto rounded-2xl border border-[#ffebf5] bg-white shadow-[0px_1px_3px_0px_rgba(0,0,0,0.06)]">
                            <table className="w-full min-w-[720px] border-collapse text-sm">
                                <thead>
                                    <tr className="border-b border-[#f1f5f9]">
                                        <th className="p-4 text-start font-semibold text-[#6a7282]">
                                            {t('pricing.features')}
                                        </th>
                                        <th className="p-4 text-center font-semibold text-[#323981]">
                                            {t('pricing.single.name')}
                                        </th>
                                        <th className="bg-[#fff7ed] p-4 text-center font-semibold text-[#e57124]">
                                            {t('pricing.business.name')}
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
                                            <td className="p-4">
                                                <div className="flex justify-center">
                                                    <span
                                                        className={`inline-flex size-6 items-center justify-center rounded-full ${row.single === 'included'
                                                                ? 'bg-[#dcfce7]'
                                                                : 'bg-[#f1f5f9]'
                                                            }`}
                                                    >
                                                        <img
                                                            src={
                                                                row.single === 'included'
                                                                    ? '/images/pricing/check-table.svg'
                                                                    : '/images/pricing/x-table.svg'
                                                            }
                                                            alt=""
                                                            className={
                                                                row.single === 'included'
                                                                    ? 'size-3.5'
                                                                    : 'size-3'
                                                            }
                                                            width={
                                                                row.single === 'included' ? 14 : 12
                                                            }
                                                            height={
                                                                row.single === 'included' ? 14 : 12
                                                            }
                                                        />
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="bg-[#fffbf7] p-4">
                                                <div className="flex justify-center">
                                                    <span className="inline-flex size-6 items-center justify-center rounded-full bg-[#dcfce7]">
                                                        <img
                                                            src="/images/pricing/check-table.svg"
                                                            alt=""
                                                            className="size-3.5"
                                                            width={14}
                                                            height={14}
                                                        />
                                                    </span>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* FAQ */}
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
                                                className={`size-5 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''
                                                    }`}
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

                    {/* CTA */}
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
