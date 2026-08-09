import { Form, Head, Link } from '@inertiajs/react';

import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PasswordInput } from '@/components/ui/password-input';
import { Spinner } from '@/components/ui/spinner';
import AuthLayout from '@/layouts/auth-layout';
import { login, register } from '@/routes';
import { store } from '@/routes/register';

type RegisterFormProps = {
    role: number;
    roleLabel: string;
    isEmployer: boolean;
};

export default function RegisterForm({
    role,
    roleLabel,
    isEmployer,
}: RegisterFormProps) {
    const accent = isEmployer ? '#e57124' : '#323981';
    const title = isEmployer
        ? 'Create Employer Account'
        : 'Create Job Seeker Account';
    const subtitle = isEmployer
        ? 'Start hiring the right talent today'
        : 'Find your next career opportunity';

    return (
        <AuthLayout title={title}>
            <Head title={title} />

            <div>
                <Link
                    href={register()}
                    className="text-sm font-semibold text-[#323981] hover:underline"
                >
                    ← Back
                </Link>
                <h1 className="mt-4 text-2xl font-extrabold leading-8 text-[#050315]">
                    {title}
                </h1>
                <p className="mt-1 text-sm leading-5 text-[#6a7282]">{subtitle}</p>
            </div>

            <Form
                {...store.form()}
                resetOnSuccess={['password', 'password_confirmation']}
                disableWhileProcessing
                className="mt-7 space-y-4"
            >
                {({ processing, errors }) => (
                    <>
                        <input type="hidden" name="role" value={role} />

                        {isEmployer ? (
                            <div className="space-y-1.5">
                                <Label
                                    htmlFor="company_name"
                                    className="text-sm font-semibold text-[#364153]"
                                >
                                    Company / Organization Name
                                </Label>
                                <Input
                                    id="company_name"
                                    name="company_name"
                                    type="text"
                                    required
                                    autoFocus
                                    placeholder="Enter company name"
                                    className="h-[46px] rounded-xl border-[#e2e8f0] bg-[#f9fafb] px-4 text-sm text-[#374151] placeholder:text-[rgba(55,65,81,0.5)] focus-visible:border-[#e57124] focus-visible:ring-[#e57124]/30"
                                />
                                <InputError message={errors.company_name} />
                            </div>
                        ) : (
                            <div className="space-y-1.5">
                                <Label
                                    htmlFor="name"
                                    className="text-sm font-semibold text-[#364153]"
                                >
                                    Full Name
                                </Label>
                                <Input
                                    id="name"
                                    name="name"
                                    type="text"
                                    required
                                    autoFocus
                                    placeholder="Enter your full name"
                                    className="h-[46px] rounded-xl border-[#e2e8f0] bg-[#f9fafb] px-4 text-sm text-[#374151] placeholder:text-[rgba(55,65,81,0.5)] focus-visible:border-[#323981] focus-visible:ring-[#323981]/30"
                                />
                                <InputError message={errors.name} />
                            </div>
                        )}

                        <div className="space-y-1.5">
                            <Label
                                htmlFor="email"
                                className="text-sm font-semibold text-[#364153]"
                            >
                                Email Address
                            </Label>
                            <Input
                                id="email"
                                name="email"
                                type="email"
                                required
                                autoComplete="username"
                                placeholder="Enter your email address"
                                className="h-[46px] rounded-xl border-[#e2e8f0] bg-[#f9fafb] px-4 text-sm text-[#374151] placeholder:text-[rgba(55,65,81,0.5)] focus-visible:border-[#323981] focus-visible:ring-[#323981]/30"
                            />
                            <InputError message={errors.email} />
                        </div>

                        <div className="space-y-1.5">
                            <Label
                                htmlFor="password"
                                className="text-sm font-semibold text-[#364153]"
                            >
                                Password
                            </Label>
                            <PasswordInput
                                id="password"
                                name="password"
                                required
                                autoComplete="new-password"
                                placeholder="Create a strong password"
                                className="h-[46px] rounded-xl border-[#e2e8f0] bg-[#f9fafb] px-4 text-sm text-[#374151] placeholder:text-[rgba(55,65,81,0.5)] focus-visible:border-[#323981] focus-visible:ring-[#323981]/30"
                            />
                            <InputError message={errors.password} />
                        </div>

                        <div className="space-y-1.5">
                            <Label
                                htmlFor="password_confirmation"
                                className="text-sm font-semibold text-[#364153]"
                            >
                                Confirm Password
                            </Label>
                            <PasswordInput
                                id="password_confirmation"
                                name="password_confirmation"
                                required
                                autoComplete="new-password"
                                placeholder="Re-enter your password"
                                className="h-[46px] rounded-xl border-[#e2e8f0] bg-[#f9fafb] px-4 text-sm text-[#374151] placeholder:text-[rgba(55,65,81,0.5)] focus-visible:border-[#323981] focus-visible:ring-[#323981]/30"
                            />
                            <InputError message={errors.password_confirmation} />
                        </div>

                        <label className="flex items-start gap-2.5 pt-1 text-sm leading-5 text-[#4a5565]">
                            <input
                                type="checkbox"
                                name="terms"
                                value="1"
                                required
                                className="mt-0.5 size-4 shrink-0 rounded-[2px] border-[#767676] text-[#323981] focus:ring-[#323981]"
                            />
                            <span>
                                I agree to the Terms &amp; Conditions and Privacy
                                Policy
                            </span>
                        </label>
                        <InputError message={errors.terms} />
                        <InputError message={errors.role} />

                        <button
                            type="submit"
                            disabled={processing}
                            className="flex h-12 w-full items-center justify-center rounded-xl text-sm font-bold text-white transition hover:brightness-110 disabled:opacity-70"
                            style={{
                                backgroundColor: accent,
                                boxShadow: isEmployer
                                    ? '0px 4px 6px rgba(249, 115, 22, 0.3)'
                                    : undefined,
                            }}
                        >
                            {processing ? (
                                <Spinner className="h-4 w-4" />
                            ) : (
                                'Create Account'
                            )}
                        </button>
                    </>
                )}
            </Form>

            <p className="mt-6 text-center text-sm text-[#6a7282]">
                Already have an account?{' '}
                <TextLink
                    href={login()}
                    className="font-bold no-underline hover:underline"
                    style={{ color: accent }}
                >
                    Login
                </TextLink>
            </p>

            <p className="sr-only">Registering as {roleLabel}</p>
        </AuthLayout>
    );
}
