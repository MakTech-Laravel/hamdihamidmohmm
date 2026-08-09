import { Form, Head, usePage } from '@inertiajs/react';

import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PasswordInput } from '@/components/ui/password-input';
import { Spinner } from '@/components/ui/spinner';
import AuthLayout from '@/layouts/auth-layout';
import { register } from '@/routes';
import { store } from '@/routes/login';
import { request } from '@/routes/password';
import { SharedData } from '@/types';

export default function Login() {
    const { features } = usePage<SharedData>().props;

    return (
        <AuthLayout
            title="Welcome back"
            description="Enter your credentials to access your account"
            context="login"
        >
            <Head title="Log in" />

            <div className="w-full space-y-3 md:space-y-6 lg:space-y-10 px-2 py-4 lg:py-10">
                <div className="rounded-3xl border border-primary-50/40 bg-primary-50/20 px-4 py-3 text-sm text-primary-600 sm:px-5 sm:py-4 animate-in fade-in slide-in-from-top-2 duration-300">
                    <p className="text-xs uppercase tracking-[0.35em] text-primary-600">Trusted access</p>
                    <p className="mt-1 text-base font-medium text-primary-600">
                        Sign in with your Horizon credentials or approved hardware key.
                    </p>
                </div>

                <Form
                    {...store.form()}
                    resetOnSuccess={['password']}
                    className="space-y-3 px-1 sm:space-y-6 sm:px-0"
                >
                    {({ processing, errors }) => (
                        <>
                            <div className="space-y-3 sm:space-y-6">
                                <div className="rounded-3xl border border-primary-50/40 bg-primary-50/20 p-4 text-foreground shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-300 sm:p-5">
                                    <Label
                                        htmlFor="email"
                                        className="text-xs font-semibold uppercase tracking-[0.35em] text-primary-500"
                                    >
                                        Email address
                                    </Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        name="email"
                                        required
                                        autoFocus
                                        placeholder="name@company.com"
                                        className="mt-2 h-11 rounded-2xl border border-muted/60 bg-white text-sm text-primary-500 placeholder:text-primary-500/60 focus:border-primary-400 focus-visible:ring-2 focus-visible:ring-primary-200 sm:h-12 sm:text-base"
                                    />
                                    <InputError message={errors.email} />
                                </div>

                                <div className="rounded-3xl border border-primary-50/40 bg-primary-50/20 p-4 text-foreground shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-300 sm:p-5">
                                    <div className="mb-2 flex items-center justify-between">
                                        <Label
                                            htmlFor="password"
                                            className="text-xs font-semibold uppercase tracking-[0.35em] text-primary-500"
                                        >
                                            Password
                                        </Label>
                                        {features.canResetPassword && (
                                            <TextLink
                                                href={request()}
                                                className="text-xs font-semibold text-primary-600"
                                            >
                                                Forgot?
                                            </TextLink>
                                        )}
                                    </div>
                                    <PasswordInput
                                        id="password"
                                        name="password"
                                        required
                                        placeholder="••••••••"
                                        className="h-11 rounded-2xl border border-muted/60 bg-white text-sm text-primary-500 placeholder:text-primary-500/60 focus:border-primary-400 focus-visible:ring-2 focus-visible:ring-primary-200 sm:h-12 sm:text-base"
                                    />
                                    <InputError message={errors.password} />
                                </div>
                            </div>

                            <div className="space-y-3 sm:space-y-4">
                                <div className="flex flex-wrap items-center gap-3 rounded-3xl border border-primary-50/40 bg-primary-50/20 px-3 py-3 text-xs text-primary-500/80 animate-in fade-in slide-in-from-bottom-2 duration-300 sm:px-4">
                                    <span className="inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-white/15 text-lg">
                                        🔐
                                    </span>
                                    End-to-end encrypted · Adaptive multi-factor · SOC2 compliant
                                </div>

                                <Button
                                    type="submit"
                                    className="group relative w-full overflow-hidden rounded-3xl bg-gradient-to-r from-primary-500 via-primary-400 to-primary-600 py-4 text-sm font-semibold tracking-wide text-white shadow-lg transition hover:brightness-110 sm:py-5 sm:text-base"
                                    disabled={processing}
                                >
                                    <span className="relative flex items-center justify-center gap-2">
                                        {processing ? (
                                            <Spinner className="h-4 w-4" />
                                        ) : (
                                            <>
                                                <span>Log in securely</span>
                                                <svg
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    fill="none"
                                                    viewBox="0 0 24 24"
                                                    strokeWidth={1.5}
                                                    stroke="currentColor"
                                                    className="h-5 w-5 transition group-hover:translate-x-1"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        d="M13.5 4.5 21 12l-7.5 7.5M21 12H3"
                                                    />
                                                </svg>
                                            </>
                                        )}
                                    </span>
                                </Button>
                            </div>
                        </>
                    )}
                </Form>

                <div className="text-center text-xs uppercase tracking-[0.3em] text-primary-500">
                    Ready to join us?{' '}
                    <TextLink href={register()} className="font-semibold text-primary-500 border-none hover:text-primary-200">
                        Create your account
                    </TextLink>
                </div>
            </div>
        </AuthLayout>
    );
}