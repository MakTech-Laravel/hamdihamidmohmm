import { Head, useForm, usePage } from '@inertiajs/react';

import JobSeekerLayout from '@/layouts/job-seeker-layout';
import type { SharedData } from '@/types';

type Profile = {
    name: string | null;
    email: string | null;
    phone: string | null;
    location: string | null;
    headline: string | null;
    bio: string | null;
    skills: string[];
    education: string[];
    experience: string[];
    languages: string[];
    certifications: string[];
    resume_status: string | null;
    completion: number;
};

export default function JobSeekerProfile({ profile }: { profile: Profile }) {
    const { flash } = usePage<SharedData>().props;
    const form = useForm({
        name: profile.name ?? '',
        phone: profile.phone ?? '',
        location: profile.location ?? '',
        headline: profile.headline ?? '',
        bio: profile.bio ?? '',
        skills: (profile.skills ?? []).join(', '),
        education: (profile.education ?? []).join('\n'),
        experience: (profile.experience ?? []).join('\n'),
        languages: (profile.languages ?? []).join(', '),
        certifications: (profile.certifications ?? []).join(', '),
    });

    const toList = (value: string): string[] =>
        value
            .split(/[\n,]/)
            .map((item) => item.trim())
            .filter(Boolean);

    return (
        <JobSeekerLayout title="My Profile">
            <Head title="My Profile" />

            <div className="space-y-6 p-6">
                <div>
                    <h1 className="text-2xl font-extrabold text-[#1e3a8a]">
                        My Profile
                    </h1>
                    <p className="text-sm text-[#64748b]">
                        {profile.completion}% complete · {profile.resume_status}
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
                        form.transform((data) => ({
                            ...data,
                            skills: toList(data.skills),
                            education: toList(data.education),
                            experience: toList(data.experience),
                            languages: toList(data.languages),
                            certifications: toList(data.certifications),
                        }));
                        form.put('/job-seeker/profile');
                    }}
                >
                    {(
                        [
                            ['name', 'Name'],
                            ['phone', 'Phone'],
                            ['location', 'Location'],
                            ['headline', 'Headline'],
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
                        Bio
                        <textarea
                            className="mt-1 w-full rounded-xl border px-3 py-2"
                            value={form.data.bio}
                            onChange={(event) =>
                                form.setData('bio', event.target.value)
                            }
                        />
                    </label>
                    <label className="text-sm font-medium">
                        Skills (comma separated)
                        <input
                            className="mt-1 w-full rounded-xl border px-3 py-2"
                            value={form.data.skills}
                            onChange={(event) =>
                                form.setData('skills', event.target.value)
                            }
                        />
                    </label>
                    <label className="text-sm font-medium">
                        Education (one per line)
                        <textarea
                            className="mt-1 w-full rounded-xl border px-3 py-2"
                            value={form.data.education}
                            onChange={(event) =>
                                form.setData('education', event.target.value)
                            }
                        />
                    </label>
                    <label className="text-sm font-medium">
                        Experience (one per line)
                        <textarea
                            className="mt-1 w-full rounded-xl border px-3 py-2"
                            value={form.data.experience}
                            onChange={(event) =>
                                form.setData('experience', event.target.value)
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
        </JobSeekerLayout>
    );
}
