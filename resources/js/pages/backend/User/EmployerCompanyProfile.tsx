import { Head, useForm, usePage } from '@inertiajs/react';

import EmployerLayout from '@/layouts/employer-layout';
import type { SharedData } from '@/types';

type Profile = {
    company_name: string | null;
    contact_name: string | null;
    industry: string | null;
    website: string | null;
    about: string | null;
    address: string | null;
    phone: string | null;
    email: string | null;
    verification: string | null;
    package: string | null;
};

export default function EmployerCompanyProfile({
    profile,
}: {
    profile: Profile;
}) {
    const { flash } = usePage<SharedData>().props;
    const form = useForm({
        company_name: profile.company_name ?? '',
        contact_name: profile.contact_name ?? '',
        industry: profile.industry ?? '',
        website: profile.website ?? '',
        about: profile.about ?? '',
        address: profile.address ?? '',
        phone: profile.phone ?? '',
        email: profile.email ?? '',
    });

    return (
        <EmployerLayout title="Company Profile">
            <Head title="Company Profile" />

            <div className="space-y-6 p-6">
                <div>
                    <h1 className="text-2xl font-bold text-[#323981]">
                        Company Profile
                    </h1>
                    <p className="text-sm text-[#64748b]">
                        {profile.verification} · {profile.package}
                    </p>
                </div>
                {flash.success && (
                    <div className="rounded-xl border border-[#bbf7d0] bg-[#f0fdf4] px-4 py-3 text-sm text-[#15803d]">
                        {typeof flash.success === 'string'
                            ? flash.success
                            : 'Saved successfully.'}
                    </div>
                )}
                <form
                    className="grid max-w-3xl gap-4 rounded-2xl border bg-white p-6"
                    onSubmit={(event) => {
                        event.preventDefault();
                        form.put('/employer/profile');
                    }}
                >
                    {(
                        [
                            ['company_name', 'Company name'],
                            ['contact_name', 'Contact name'],
                            ['industry', 'Industry'],
                            ['website', 'Website'],
                            ['address', 'Address'],
                            ['phone', 'Phone'],
                            ['email', 'Email'],
                        ] as const
                    ).map(([key, label]) => (
                        <label key={key} className="text-sm font-medium">
                            {label}
                            <input
                                className="mt-1 w-full rounded-xl border px-3 py-2"
                                value={form.data[key]}
                                onChange={(event) =>
                                    form.setData(key, event.target.value)
                                }
                            />
                        </label>
                    ))}
                    <label className="text-sm font-medium">
                        About
                        <textarea
                            className="mt-1 w-full rounded-xl border px-3 py-2"
                            value={form.data.about}
                            onChange={(event) =>
                                form.setData('about', event.target.value)
                            }
                        />
                    </label>
                    <button
                        type="submit"
                        className="rounded-xl bg-[#0057c8] px-5 py-2.5 text-sm font-semibold text-white"
                        disabled={form.processing}
                    >
                        Save profile
                    </button>
                </form>
            </div>
        </EmployerLayout>
    );
}
