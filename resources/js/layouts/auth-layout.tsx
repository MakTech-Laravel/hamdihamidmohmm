import { Head, Link } from '@inertiajs/react';
import * as React from 'react';

import { login, register } from '@/routes';

interface AuthLayoutProps {
    children: React.ReactNode;
    title: string;
    description: string;
    context?: 'login' | 'register';
    showHeader?: boolean;
    showFooter?: boolean;
}

export default function AuthLayout({
    children,
    title,
    description,
    context = 'login',
}: AuthLayoutProps) {
    const heroTitle = title || 'Secure workforce access';
    const heroDescription =
        description || 'Manage shifts, authorize requests, and sync your people from anywhere in the world.';

    const isRegisterView = context === 'register';
    const ctaHref = isRegisterView ? login() : register();
    const ctaLabel = isRegisterView ? 'Return to login' : 'Create account';
    const ctaPrompt = isRegisterView ? 'Already onboard?' : 'Need a seat?';


    const highlights = [
        {
            title: 'When I Work sync',
            description: 'Shift approvals, coverage rules, and payroll roles stay mirrored in real time.',
        },
        {
            title: 'Coverage intelligence',
            description: 'Cross-location dashboards surface open needs before they become overtime emergencies.',
        },
        {
            title: 'Scheduling autopilot',
            description: 'Managers publish templates; teams confirm on mobile and Horizon handles the API sync.',
        },
    ];

    return (
        <div className="relative min-h-screen overflow-hidden bg-[#030712] text-white">
            <div className="pointer-events-none absolute inset-0">
                <div className="absolute -left-32 top-12 h-80 w-80 rounded-full bg-(--accent-blue)/25 blur-[180px] animate-float" />
                <div className="absolute -right-24 bottom-0 h-125 w-125 rounded-full bg-(--accent-purple)/25 blur-[220px] animate-float delay-200" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,var(--primary-700)/35,transparent_60%)]" />
                <div
                    className="absolute inset-0 opacity-40"
                    style={{
                        backgroundImage:
                            'radial-gradient(circle at 20% 20%, rgba(255,255,255,0.12), transparent 45%), linear-gradient(120deg, rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(300deg, rgba(255,255,255,0.04) 1px, transparent 1px)',
                        backgroundSize: '160px 160px, 140px 140px, 140px 140px',
                    }}
                />
            </div>

            <div className="relative z-10 flex min-h-screen items-center justify-center px-2 py-12 lg:px-10">
                <main className="relative w-full max-w-6xl overflow-hidden rounded-[48px] border border-white/10 bg-white/5 shadow-[0_30px_120px_rgba(2,6,23,0.75)] backdrop-blur-2xl">
                    <Head title={title} />

                    <div className="absolute inset-x-10 top-0 h-px bg-linear-to-r from-(--accent-blue) via-white/70 to-(--accent-purple) opacity-70" />

                    <div className="grid gap-10 px-2 py-2 lg:grid-cols-[1.05fr_0.95fr] lg:px-14 lg:py-16">
                        <section className="flex flex-col gap-10 rounded-4xl border border-white/10 bg-white/5 p-3 shadow-inner shadow-white/5 backdrop-blur-2xl animate-fadeInLeft">
                            <header className="space-y-6">
                                <div className="flex flex-wrap items-center gap-3 text-xs font-semibold uppercase tracking-[0.35em] text-white/70">
                                    <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[0.65rem]">
                                        Horizon SSO
                                    </span>
                                    Always-on access
                                </div>
                                <div className="space-y-3 text-balance">
                                    <h1 className="text-3xl font-semibold leading-tight md:text-4xl">{heroTitle}</h1>
                                    <p className="text-lg text-white/80">{heroDescription}</p>
                                </div>
                            </header>


                            <div className="space-y-4">
                                {highlights.map((highlight) => (
                                    <div
                                        key={highlight.title}
                                        className="group rounded-2xl border border-white/10 bg-white/5 p-5 transition duration-300 hover:border-white/40"
                                    >
                                        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/60">
                                            {highlight.title}
                                        </p>
                                        <p className="mt-2 text-base text-white/85">{highlight.description}</p>
                                    </div>
                                ))}
                            </div>

                            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-sm text-white/80">
                                <p className="text-xs uppercase tracking-[0.35em]">{ctaPrompt}</p>
                                <Link
                                    href={ctaHref}
                                    className="rounded-full bg-white px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.3em] text-primary-700"
                                >
                                    {ctaLabel}
                                </Link>
                            </div>
                        </section>

                        <section className="relative animate-fadeInUp">
                            <div className="rounded-4xl bg-white text-foreground shadow-(--shadow-card)">
                                <div className="p-2">{children}</div>
                            </div>

                            <div className="pointer-events-none absolute -top-7 right-0 hidden rounded-2xl border border-white/10 bg-primary-500/50 px-5 py-4 text-sm font-semibold text-white shadow-2xl backdrop-blur lg:block animate-fadeInDown delay-200">
                                Real-time collaboration · Team presence active
                            </div>
                        </section>
                    </div>
                </main>
            </div>
        </div>
    );
}