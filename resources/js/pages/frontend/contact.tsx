import { Form, Head, Link, usePage } from '@inertiajs/react';
import { useState } from 'react';

import InputError from '@/components/input-error';
import { useLocale } from '@/hooks/use-locale';
import FrontendLayout from '@/layouts/frontend-layout';
import { home } from '@/routes';
import { store } from '@/routes/contact';
import type { SharedData } from '@/types';

const MESSAGE_MAX = 500;

const fieldClassName =
    'h-[46px] w-full rounded-xl border border-[#e2e8f0] bg-[#f9fafb] px-4 text-sm text-[#050315] outline-none transition placeholder:text-[rgba(55,65,81,0.5)] focus:border-[#0057c8]';

const labelClassName =
    'text-sm font-semibold tracking-[-0.16px] text-[#050315]';

export default function Contact() {
    const { t } = useLocale();
    const { flash } = usePage<SharedData>().props;
    const [messageLength, setMessageLength] = useState(0);

    return (
        <FrontendLayout>
            <Head title={`${t('contact.title')} - RR Job Portal`} />

            <section className="bg-[#d1f6ff] px-8 py-16">
                <div className="mx-auto flex max-w-[1280px] flex-col items-center text-center">
                    <nav className="flex flex-wrap items-center justify-center gap-2 text-sm">
                        <Link
                            href={home()}
                            className="text-[#050315] transition hover:text-[#0057c8]"
                        >
                            {t('nav.home')}
                        </Link>
                        <img
                            src="/images/contact/breadcrumb-chevron.svg"
                            alt=""
                            className="size-4 rtl:rotate-180"
                            width={16}
                            height={16}
                        />
                        <span className="text-[#3977a6]">{t('nav.contact')}</span>
                    </nav>

                    <h1 className="mt-5 text-4xl font-extrabold leading-tight text-[#050315] sm:text-[48px] sm:leading-[48px]">
                        {t('contact.title')}
                    </h1>
                    <p className="mt-4 max-w-[576px] text-base leading-6 text-[rgba(5,3,21,0.6)]">
                        {t('contact.subtitle')}
                    </p>
                </div>
            </section>

            <section className="bg-[#f8faff] px-8 py-16">
                <div className="mx-auto w-full max-w-[672px]">
                    <div className="rounded-2xl border border-[#d1f6ff] bg-white p-8 shadow-[0px_1px_1.5px_rgba(0,0,0,0.06)]">
                        <h2 className="text-xl font-bold leading-6 text-[#050315]">
                            {t('contact.form_title')}
                        </h2>

                        {flash?.success && (
                            <div className="mt-6 rounded-xl bg-[#eff6ff] px-4 py-3 text-sm text-[#0057c8]">
                                {t('contact.success')}
                            </div>
                        )}

                        <Form
                            {...store.form()}
                            className="mt-6 space-y-5"
                            preserveScroll
                            resetOnSuccess
                            onSuccess={() => setMessageLength(0)}
                        >
                            {({ errors, processing }) => (
                                <>
                                    <div className="space-y-1.5">
                                        <label htmlFor="name" className={labelClassName}>
                                            {t('contact.name')}
                                        </label>
                                        <input
                                            id="name"
                                            name="name"
                                            type="text"
                                            required
                                            placeholder={t('contact.name_placeholder')}
                                            className={fieldClassName}
                                        />
                                        <InputError message={errors.name} />
                                    </div>

                                    <div className="space-y-1.5">
                                        <label htmlFor="email" className={labelClassName}>
                                            {t('contact.email')}
                                        </label>
                                        <input
                                            id="email"
                                            name="email"
                                            type="email"
                                            required
                                            placeholder={t('contact.email_placeholder')}
                                            className={fieldClassName}
                                        />
                                        <InputError message={errors.email} />
                                    </div>

                                    <div className="space-y-1.5">
                                        <label htmlFor="phone" className={labelClassName}>
                                            {t('contact.phone')}
                                        </label>
                                        <input
                                            id="phone"
                                            name="phone"
                                            type="tel"
                                            placeholder={t('contact.phone_placeholder')}
                                            className={fieldClassName}
                                        />
                                        <InputError message={errors.phone} />
                                    </div>

                                    <div className="space-y-1.5">
                                        <label htmlFor="message" className={labelClassName}>
                                            {t('contact.message')}
                                        </label>
                                        <textarea
                                            id="message"
                                            name="message"
                                            required
                                            maxLength={MESSAGE_MAX}
                                            rows={5}
                                            placeholder={t('contact.message_placeholder')}
                                            onChange={(event) =>
                                                setMessageLength(event.target.value.length)
                                            }
                                            className="h-[126px] w-full resize-none rounded-xl border border-[#e2e8f0] bg-[#f9fafb] px-4 py-3 text-sm leading-5 text-[#050315] outline-none transition placeholder:text-[rgba(55,65,81,0.5)] focus:border-[#0057c8]"
                                        />
                                        <p className="pt-1 text-xs leading-4 text-[#99a1af]">
                                            {messageLength}/{MESSAGE_MAX}
                                        </p>
                                        <InputError message={errors.message} />
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={processing}
                                        className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#0057c8] text-base font-medium tracking-[-0.18px] text-white transition hover:brightness-110 disabled:opacity-70"
                                    >
                                        <img
                                            src="/images/contact/send.svg"
                                            alt=""
                                            className="size-4"
                                            width={16}
                                            height={16}
                                        />
                                        {processing
                                            ? t('contact.sending')
                                            : t('contact.submit')}
                                    </button>
                                </>
                            )}
                        </Form>
                    </div>
                </div>
            </section>
        </FrontendLayout>
    );
}
