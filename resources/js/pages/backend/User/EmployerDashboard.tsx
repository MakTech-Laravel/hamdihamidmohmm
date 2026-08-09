import { Head, usePage } from '@inertiajs/react';

import UserLayout from '@/layouts/user-layout';
import type { SharedData } from '@/types';

export default function EmployerDashboard() {
    const { auth } = usePage<SharedData>().props;

    return (
        <UserLayout>
            <Head title="Employer Dashboard" />
            <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#e57124]">
                    Employer
                </p>
                <h1 className="mt-2 text-3xl font-extrabold text-[#050315]">
                    Welcome, {auth.user.company_name || auth.user.name}
                </h1>
                <p className="mt-3 max-w-2xl text-base text-[#6a7282]">
                    Post vacancies, review applicants, and manage hiring from your
                    employer dashboard.
                </p>

                <div className="mt-10 grid gap-4 sm:grid-cols-3">
                    {['Post a job', 'Review applications', 'Manage company'].map(
                        (item) => (
                            <div
                                key={item}
                                className="rounded-2xl border border-[#e2e8f0] bg-white p-5 shadow-[0px_1px_3px_rgba(0,0,0,0.06)]"
                            >
                                <p className="text-sm font-bold text-[#050315]">
                                    {item}
                                </p>
                                <p className="mt-2 text-sm text-[#6a7282]">
                                    Coming soon in your RR Job Portal workspace.
                                </p>
                            </div>
                        ),
                    )}
                </div>
            </div>
        </UserLayout>
    );
}
