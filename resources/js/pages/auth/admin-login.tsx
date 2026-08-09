import { Head, useForm } from '@inertiajs/react';

import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PasswordInput } from '@/components/ui/password-input';
import { Spinner } from '@/components/ui/spinner';
import AuthLayout from '@/layouts/auth-layout';

export default function AdminLogin() {
    const { data, setData, post, processing, errors } = useForm({
        email: '',
        password: '',
        remember: false,
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('admin.login.store'));
    };

    return (
        <AuthLayout
            title="Admin Access"
            description="Enter your admin credentials to continue"
            context="login"
        >
            <Head title="Admin Login" />

            <div className="w-full space-y-3 md:space-y-6 lg:space-y-10 px-2 py-4 lg:py-10">
                <div className="rounded-3xl border border-primary-50/40 bg-primary-50/20 px-4 py-3 text-sm text-primary-600 sm:px-5 sm:py-4 animate-in fade-in slide-in-from-top-2 duration-300">
                    <p className="text-xs uppercase tracking-[0.35em] text-primary-600">Admin Portal</p>
                    <p className="mt-1 text-base font-medium text-primary-600">
                        Sign in with your administrator credentials.
                    </p>
                </div>

                <form onSubmit={submit} className="space-y-3 px-1 sm:space-y-6 sm:px-0">
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
                                value={data.email}
                                onChange={(e) => setData('email', e.target.value)}
                                required
                                autoFocus
                                placeholder="admin@company.com"
                                className="mt-2 h-11 rounded-2xl border border-muted/60 bg-white text-sm text-primary-500 placeholder:text-primary-500/60 focus:border-primary-400 focus-visible:ring-2 focus-visible:ring-primary-200 sm:h-12 sm:text-base"
                            />
                            <InputError message={errors.email} />
                        </div>

                        <div className="rounded-3xl border border-primary-50/40 bg-primary-50/20 p-4 text-foreground shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-300 sm:p-5">
                            <Label
                                htmlFor="password"
                                className="text-xs font-semibold uppercase tracking-[0.35em] text-primary-500"
                            >
                                Password
                            </Label>
                            <PasswordInput
                                id="password"
                                value={data.password}
                                onChange={(e) => setData('password', e.target.value)}
                                required
                                placeholder="••••••••"
                                className="mt-2 h-11 rounded-2xl border border-muted/60 bg-white text-sm text-primary-500 placeholder:text-primary-500/60 focus:border-primary-400 focus-visible:ring-2 focus-visible:ring-primary-200 sm:h-12 sm:text-base"
                            />
                            <InputError message={errors.password} />
                        </div>
                    </div>

                    <div className="space-y-3 sm:space-y-4">
                        <div className="flex flex-wrap items-center gap-3 rounded-3xl border border-primary-50/40 bg-primary-50/20 px-3 py-3 text-xs text-primary-500/80 animate-in fade-in slide-in-from-bottom-2 duration-300 sm:px-4">
                            <span className="inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-white/15 text-lg">
                                🛡️
                            </span>
                            Admin-only restricted access · Audit logged
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
                                        <span>Admin Login</span>
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
                </form>
            </div>
        </AuthLayout>
    );
}
