import { Form, Head } from '@inertiajs/react';

import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PasswordInput } from '@/components/ui/password-input';
import { Spinner } from '@/components/ui/spinner';
import AuthLayout from '@/layouts/auth-layout';
import { store } from '@/routes/register';

export default function Register() {
    return (
        <AuthLayout
            title="Create an account"
            description="Join thousands of teams shipping faster today."
            context="register"
        >
            <Head title="Register" />

            <div className="w-full space-y-3 px-2 sm:px-0">
                <div className="rounded-3xl border border-primary-50/40 bg-primary-50/20 px-4 py-3 text-sm text-primary-600 sm:px-5 sm:py-4 animate-in fade-in slide-in-from-top-2 duration-300">
                    <p className="text-xs uppercase tracking-[0.35em] text-primary-600">New horizons</p>
                    <p className="mt-1 text-base font-medium text-primary-600">
                        Create your Horizon workspace and invite your crew in minutes.
                    </p>
                </div>

                <Form
                    {...store.form()}
                    resetOnSuccess={['password', 'password_confirmation']}
                    disableWhileProcessing
                    className="space-y-3 px-1 sm:space-y-6 sm:px-0"
                >
                    {({ processing, errors }) => (
                        <>
                            <div className="space-y-3">
                                {/* Card: Name */}
                                <div className="rounded-3xl border border-primary-50/40 bg-primary-50/20 p-4 sm:p-5 text-foreground shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-300">
                                    <Label
                                        htmlFor="name"
                                        className="text-[11px] font-semibold uppercase tracking-[0.35em] text-primary-500 sm:text-xs"
                                    >
                                        Full name
                                    </Label>
                                    <Input
                                        id="name"
                                        name="name"
                                        type="text"
                                        required
                                        autoFocus
                                        placeholder="Avery Jensen"
                                        className="mt-2 h-11 sm:h-12 rounded-2xl border border-muted/60 bg-white text-sm sm:text-base text-primary-500 placeholder:text-primary-500/60 focus:border-primary-400 focus-visible:ring-2 focus-visible:ring-primary-200"
                                    />
                                    <InputError message={errors.name} />
                                </div>

                                {/* Card: Email */}
                                <div className="rounded-3xl border border-primary-50/40 bg-primary-50/20 p-4 sm:p-5 text-foreground shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-300">
                                    <Label
                                        htmlFor="email"
                                        className="text-xs font-semibold uppercase tracking-[0.35em] text-primary-500"
                                    >
                                        Email address
                                    </Label>
                                    <Input
                                        id="email"
                                        name="email"
                                        type="email"
                                        required
                                        placeholder="team@horizon.io"
                                        className="mt-2 h-11 sm:h-12 rounded-2xl border border-muted/60  bg-white text-sm sm:text-base text-primary-500 placeholder:text-primary-500/60 focus:border-primary-400 focus-visible:ring-2 focus-visible:ring-primary-200"
                                    />
                                    <InputError message={errors.email} />
                                </div>

                                {/* Card: Password */}
                                <div className="rounded-3xl border border-primary-50/40 bg-primary-50/20 p-4 sm:p-5 text-foreground shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-300">
                                    <Label
                                        htmlFor="password"
                                        className="text-xs font-semibold uppercase tracking-[0.35em] text-primary-500"
                                    >
                                        Password
                                    </Label>
                                    <PasswordInput
                                        id="password"
                                        name="password"
                                        required
                                        placeholder="Create a passphrase"
                                        className="mt-2 h-11 sm:h-12 rounded-2xl border border-muted/60 bg-white text-sm sm:text-base text-primary-500 placeholder:text-primary-500/60 focus:border-primary-400 focus-visible:ring-2 focus-visible:ring-primary-200"
                                    />
                                </div>

                                {/* Card: Confirm Password */}
                                <div className="rounded-3xl border border-primary-50/40 bg-primary-50/20 p-4 sm:p-5 text-foreground shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-300">
                                    <Label
                                        htmlFor="password_confirmation"
                                        className="text-xs font-semibold uppercase tracking-[0.35em] text-primary-500"
                                    >
                                        Confirm password
                                    </Label>
                                    <PasswordInput
                                        id="password_confirmation"
                                        name="password_confirmation"
                                        required
                                        placeholder="Re-enter password"
                                        className="mt-2 h-11 sm:h-12 rounded-2xl border border-muted/60 bg-white text-sm sm:text-base text-primary-500 placeholder:text-primary-500/60 focus:border-primary-400 focus-visible:ring-2 focus-visible:ring-primary-200"
                                    />
                                </div>

                                <InputError message={errors.password} />
                            </div>

                            <div className="space-y-3 sm:space-y-4">
                                <div className="flex flex-wrap items-center gap-3 rounded-3xl border border-primary-50/40 bg-primary-50/20 px-3 py-3 sm:px-4 text-xs text-primary-500/80 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                    <span className="inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-white/15 text-lg">
                                        🚀
                                    </span>
                                    Collaborative workspaces · SOC2 aligned · Adaptive security layers
                                </div>

                                <Button
                                    type="submit"
                                    className="group relative w-full overflow-hidden rounded-3xl bg-gradient-to-r from-primary-500 via-primary-400 to-primary-600 py-4 sm:py-5 text-sm sm:text-base font-semibold tracking-wide text-white shadow-lg transition hover:brightness-110"
                                    disabled={processing}
                                >
                                    <span className="relative flex items-center justify-center gap-2">
                                        {processing ? (
                                            <Spinner className="h-4 w-4" />
                                        ) : (
                                            <>
                                                <span>Launch workspace</span>
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
            </div>
        </AuthLayout>
    );
}
