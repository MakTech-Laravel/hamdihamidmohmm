import { Head, router } from '@inertiajs/react';
import { useMemo, useState } from 'react';

import EmployerLayout from '@/layouts/employer-layout';

type ApplicationRow = {
    id: number;
    name: string | null;
    email: string | null;
    job: string | null;
    status: string | null;
    status_value: string | null;
    date: string | null;
};

type Props = {
    applications: ApplicationRow[];
    filters: { status: string; search: string };
    stats: { total: number; new: number; interview: number; hired: number };
    statuses: Array<{ value: string; label: string }>;
};

export default function EmployerApplications({
    applications,
    filters,
    stats,
    statuses,
}: Props) {
    const [search, setSearch] = useState(filters.search ?? '');

    const filtered = useMemo(() => {
        const query = search.toLowerCase();

        return applications.filter(
            (row) =>
                query === '' ||
                (row.name ?? '').toLowerCase().includes(query) ||
                (row.email ?? '').toLowerCase().includes(query),
        );
    }, [applications, search]);

    return (
        <EmployerLayout title="Applications">
            <Head title="Applications" />

            <div className="space-y-5 p-6">
                <h1 className="text-2xl font-bold text-[#0057c8]">
                    Applications
                </h1>
                <div className="grid gap-4 sm:grid-cols-4">
                    {[
                        ['Total', stats.total],
                        ['New', stats.new],
                        ['Interviews', stats.interview],
                        ['Hired', stats.hired],
                    ].map(([label, value]) => (
                        <div
                            key={label}
                            className="rounded-2xl border bg-white p-4"
                        >
                            <p className="text-2xl font-bold text-[#e57124]">
                                {value}
                            </p>
                            <p className="text-sm text-[#6b7280]">{label}</p>
                        </div>
                    ))}
                </div>
                <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search candidates..."
                    className="w-full max-w-md rounded-xl border px-4 py-2.5 text-sm"
                />
                <div className="space-y-3">
                    {filtered.map((row) => (
                        <div
                            key={row.id}
                            className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border bg-white p-4"
                        >
                            <div>
                                <p className="font-semibold">{row.name}</p>
                                <p className="text-sm text-[#64748b]">
                                    {row.job} · {row.email}
                                </p>
                            </div>
                            <select
                                className="rounded-xl border px-3 py-2 text-sm"
                                value={row.status_value ?? ''}
                                onChange={(event) =>
                                    router.put(
                                        `/employer/applications/${row.id}`,
                                        { status: event.target.value },
                                    )
                                }
                            >
                                {statuses.map((status) => (
                                    <option
                                        key={status.value}
                                        value={status.value}
                                    >
                                        {status.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    ))}
                    {filtered.length === 0 && (
                        <p className="text-center text-sm text-[#99a1af]">
                            No applications yet.
                        </p>
                    )}
                </div>
            </div>
        </EmployerLayout>
    );
}
