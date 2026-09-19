import { Head, Link } from '@inertiajs/react';
import type { ReactNode } from 'react';

import BrandLogo from '@/components/brand-logo';
import { useLocale } from '@/hooks/use-locale';
import { jobs } from '@/routes';

interface AuthLayoutProps {
    children: ReactNode;
    title?: string;
    description?: string;
    context?: string;
    maxWidthClassName?: string;
}

export default function AuthLayout({
    children,
    title,
    maxWidthClassName = 'max-w-[420px]',
}: AuthLayoutProps) {
    const { t } = useLocale();
    const pageTitle = title ?? t('app.name');

    return (
        <div className="relative min-h-svh overflow-hidden bg-[#f8faff] font-['Plus_Jakarta_Sans','Noto_Sans_Arabic',sans-serif] text-[#050315]">
            <div
                className="pointer-events-none absolute inset-0"
                style={{
                    backgroundImage:
                        'linear-gradient(154.81deg, rgb(248, 250, 255) 0%, rgb(239, 246, 255) 100%)',
                }}
            />

            <Head title={pageTitle} />

            <div className="relative z-10 flex min-h-svh items-center justify-center px-4 py-12">
                <div className={`w-full ${maxWidthClassName} animate-fadeInUp`}>
                    <div className="mb-8 flex justify-center">
                        <Link href={jobs()} className="block w-[178px]">
                            <BrandLogo
                                className="h-[118px] w-[178px]"
                                width={178}
                                height={118}
                            />
                        </Link>
                    </div>

                    <div className="rounded-2xl border border-[#d1f6ff] bg-white p-8 shadow-[0px_8px_16px_rgba(30,58,138,0.08)]">
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
}
