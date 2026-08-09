import { Head, Link } from '@inertiajs/react';
import type { ReactNode } from 'react';

import { home } from '@/routes';

interface AuthLayoutProps {
    children: ReactNode;
    title?: string;
    description?: string;
    maxWidthClassName?: string;
}

export default function AuthLayout({
    children,
    title = 'RR Job Portal',
    maxWidthClassName = 'max-w-[420px]',
}: AuthLayoutProps) {
    return (
        <div className="relative min-h-svh overflow-hidden bg-[#f8faff] font-['Plus_Jakarta_Sans','Noto_Sans_Arabic',sans-serif] text-[#050315]">
            <div
                className="pointer-events-none absolute inset-0"
                style={{
                    backgroundImage:
                        'linear-gradient(154.81deg, rgb(248, 250, 255) 0%, rgb(239, 246, 255) 100%)',
                }}
            />

            <Head title={title} />

            <div className="relative z-10 flex min-h-svh items-center justify-center px-4 py-12">
                <div className={`w-full ${maxWidthClassName} animate-fadeInUp`}>
                    <div className="mb-8 flex justify-center">
                        <Link href={home()} className="block w-[178px]">
                            <img
                                src="/images/branding/rr-logo.png"
                                alt="Rena Reiam For Job"
                                className="h-[118px] w-[178px] object-contain"
                                width={178}
                                height={118}
                            />
                        </Link>
                    </div>

                    <div className="rounded-2xl border border-[#ffebf5] bg-white p-8 shadow-[0px_8px_16px_rgba(30,58,138,0.08)]">
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
}
