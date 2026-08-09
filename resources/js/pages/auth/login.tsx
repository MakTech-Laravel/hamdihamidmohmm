import { Form, Head, usePage } from '@inertiajs/react';

import InputError from '@/components/input-error';
import { LanguageSwitcher } from '@/components/language-switcher';
import TextLink from '@/components/text-link';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PasswordInput } from '@/components/ui/password-input';
import { Spinner } from '@/components/ui/spinner';
import { useLocale } from '@/hooks/use-locale';
import AuthLayout from '@/layouts/auth-layout';
import { register } from '@/routes';
import { store } from '@/routes/login';
import { request } from '@/routes/password';
import type { SharedData } from '@/types';

export default function Login({
    canResetPassword,
    status,
}: {
    canResetPassword?: boolean;
    status?: string;
}) {
    const { features } = usePage<SharedData>().props;
    const { t } = useLocale();
    const showReset = canResetPassword ?? features.canResetPassword;

    return (
        <AuthLayout title={t('auth.login')}>
            <Head title={t('auth.login')} />

            <div className="mb-4 flex justify-end">
                <div className="rounded-lg bg-[#323981]">
                    <LanguageSwitcher variant="header" />
                </div>
            </div>

            <div>
                <h1 className="text-2xl font-extrabold leading-8 text-[#050315]">
                    {t('auth.welcome_back')}
                </h1>
                <p className="mt-1 text-sm leading-5 text-[#6a7282]">
                    {t('auth.login_subtitle')}
                </p>
            </div>

            {status && (
                <div className="mt-4 rounded-xl bg-[#eff6ff] px-4 py-3 text-sm text-[#323981]">
                    {status}
                </div>
            )}

            <Form
                {...store.form()}
                resetOnSuccess={['password']}
                className="mt-7 space-y-4"
            >
                {({ processing, errors }) => (
                    <>
                        <div className="space-y-1.5">
                            <Label
                                htmlFor="email"
                                className="text-sm font-semibold text-[#364153]"
                            >
                                {t('auth.email')}
                            </Label>
                            <Input
                                id="email"
                                type="email"
                                name="email"
                                required
                                autoFocus
                                autoComplete="username"
                                placeholder={t('auth.email_placeholder')}
                                className="h-[46px] rounded-xl border-[#e2e8f0] bg-[#f9fafb] px-4 text-sm text-[#374151] placeholder:text-[rgba(55,65,81,0.5)] focus-visible:border-[#323981] focus-visible:ring-[#323981]/30"
                            />
                            <InputError message={errors.email} />
                        </div>

                        <div className="space-y-1.5">
                            <Label
                                htmlFor="password"
                                className="text-sm font-semibold text-[#364153]"
                            >
                                {t('auth.password')}
                            </Label>
                            <PasswordInput
                                id="password"
                                name="password"
                                required
                                autoComplete="current-password"
                                placeholder={t('auth.password_placeholder')}
                                className="h-[46px] rounded-xl border-[#e2e8f0] bg-[#f9fafb] px-4 text-sm text-[#374151] placeholder:text-[rgba(55,65,81,0.5)] focus-visible:border-[#323981] focus-visible:ring-[#323981]/30"
                            />
                            <InputError message={errors.password} />
                        </div>

                        <div className="flex items-center justify-between gap-3 pt-1">
                            <label className="flex items-center gap-2 text-sm text-[#4a5565]">
                                <input
                                    type="checkbox"
                                    name="remember"
                                    className="size-4 rounded-[2px] border-[#767676] text-[#323981] focus:ring-[#323981]"
                                />
                                {t('auth.remember_me')}
                            </label>

                            {showReset && (
                                <TextLink
                                    href={request()}
                                    className="text-sm font-semibold text-[#323981] no-underline hover:underline"
                                >
                                    {t('auth.forgot_password')}
                                </TextLink>
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={processing}
                            className="flex h-12 w-full items-center justify-center rounded-xl bg-[#323981] text-base font-medium tracking-[-0.18px] text-white transition hover:brightness-110 disabled:opacity-70"
                        >
                            {processing ? <Spinner className="h-4 w-4" /> : t('auth.login')}
                        </button>
                    </>
                )}
            </Form>

            <p className="mt-6 text-center text-sm text-[#6a7282]">
                {t('auth.no_account')}{' '}
                <TextLink
                    href={register()}
                    className="font-bold text-[#323981] no-underline hover:underline"
                >
                    {t('auth.register')}
                </TextLink>
            </p>
        </AuthLayout>
    );
}
