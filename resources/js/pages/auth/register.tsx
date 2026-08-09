import { Head, Link } from '@inertiajs/react';
import { ArrowRight, Building2, UserRound } from 'lucide-react';

import { LanguageSwitcher } from '@/components/language-switcher';
import TextLink from '@/components/text-link';
import { useLocale } from '@/hooks/use-locale';
import AuthLayout from '@/layouts/auth-layout';
import { login } from '@/routes';
import { role as registerRole } from '@/routes/register';

export default function Register() {
    const { t } = useLocale();

    return (
        <AuthLayout title={t('auth.create_account')} maxWidthClassName="max-w-[560px]">
            <Head title={t('auth.register')} />

            <div className="mb-4 flex justify-end">
                <div className="rounded-lg bg-[#323981]">
                    <LanguageSwitcher variant="header" />
                </div>
            </div>

            <h1 className="text-center text-2xl font-extrabold leading-8 text-[#050315]">
                {t('auth.create_account')}
            </h1>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
                <Link
                    href={registerRole.url('job-seeker')}
                    className="group flex flex-col rounded-2xl border border-[#e2e8f0] bg-white p-6 shadow-[0px_1px_3px_0px_rgba(0,0,0,0.06)] transition hover:-translate-y-0.5 hover:border-[#323981]/40 hover:shadow-md"
                >
                    <div className="flex size-14 items-center justify-center rounded-2xl bg-[#eff6ff] text-[#323981]">
                        <UserRound className="size-7" strokeWidth={1.75} />
                    </div>
                    <h2 className="mt-4 text-base font-extrabold text-[#050315]">
                        {t('auth.job_seeker')}
                    </h2>
                    <p className="mt-2 flex-1 text-sm leading-[22.75px] text-[#6a7282]">
                        {t('auth.job_seeker_description')}
                    </p>
                    <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-bold text-[#323981]">
                        {t('auth.register_as_job_seeker')}
                        <ArrowRight className="size-4 transition group-hover:translate-x-0.5 rtl:rotate-180 rtl:group-hover:-translate-x-0.5" />
                    </span>
                </Link>

                <Link
                    href={registerRole.url('employer')}
                    className="group flex flex-col rounded-2xl border border-[#e2e8f0] bg-white p-6 shadow-[0px_1px_3px_0px_rgba(0,0,0,0.06)] transition hover:-translate-y-0.5 hover:border-[#e57124]/40 hover:shadow-md"
                >
                    <div className="flex size-14 items-center justify-center rounded-2xl bg-[#fff7ed] text-[#e57124]">
                        <Building2 className="size-7" strokeWidth={1.75} />
                    </div>
                    <h2 className="mt-4 text-base font-extrabold text-[#050315]">
                        {t('auth.employer')}
                    </h2>
                    <p className="mt-2 flex-1 text-sm leading-[22.75px] text-[#6a7282]">
                        {t('auth.employer_description')}
                    </p>
                    <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-bold text-[#e57124]">
                        {t('auth.register_as_employer')}
                        <ArrowRight className="size-4 transition group-hover:translate-x-0.5 rtl:rotate-180 rtl:group-hover:-translate-x-0.5" />
                    </span>
                </Link>
            </div>

            <p className="mt-6 text-center text-sm text-[#6a7282]">
                {t('auth.already_have_account')}{' '}
                <TextLink
                    href={login()}
                    className="font-bold text-[#323981] no-underline hover:underline"
                >
                    {t('auth.login')}
                </TextLink>
            </p>
        </AuthLayout>
    );
}
