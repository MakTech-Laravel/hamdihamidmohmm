import { Head, router, useForm } from '@inertiajs/react';
import { Search } from 'lucide-react';
import { useMemo, useState } from 'react';

import EmployerLayout from '@/layouts/employer-layout';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

type JobRow = {
    id: number;
    title: string;
    location: string | null;
    type: string | null;
    status: string;
    status_value: string;
    applications: number;
    expires_at: string | null;
    created_at: string | null;
};

type Props = {
    jobs: JobRow[];
    stats: { total: number; active: number; pending: number; expired: number };
};

const emptyJob = {
    title: '',
    category: '',
    location: '',
    employment_type: 'Full-time',
    salary_range: '',
    description: '',
    expires_at: '',
};

export default function EmployerJobs({ jobs, stats }: Props) {
    const [search, setSearch] = useState('');
    const [creating, setCreating] = useState(false);
    const form = useForm(emptyJob);

    const filtered = useMemo(() => {
        const query = search.toLowerCase();

        return jobs.filter(
            (job) =>
                query === '' ||
                job.title.toLowerCase().includes(query) ||
                (job.location ?? '').toLowerCase().includes(query),
        );
    }, [jobs, search]);

    return (
        <EmployerLayout title="My Jobs">
            <Head title="My Jobs" />

            <div className="space-y-5 p-6">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-[#323981]">
                            My Jobs
                        </h1>
                        <p className="mt-1 text-sm text-[#475569]">
                            Manage your job postings and track applications
                        </p>
                    </div>
                    <button
                        type="button"
                        className="inline-flex items-center rounded-xl bg-[#0057c8] px-6 py-3 text-base font-medium text-white"
                        onClick={() => {
                            form.setData(emptyJob);
                            setCreating(true);
                        }}
                    >
                        + Post New Job
                    </button>
                </div>

                <div className="grid gap-4 sm:grid-cols-4">
                    {[
                        ['Total Jobs', stats.total, 'bg-[#eeeffe] text-[#323981]'],
                        ['Active', stats.active, 'bg-[#dcfce7] text-[#166534]'],
                        ['Pending', stats.pending, 'bg-[#fff7ed] text-[#c2410c]'],
                        ['Expired', stats.expired, 'bg-[#fef2f2] text-[#b91c1c]'],
                    ].map(([label, value, box]) => (
                        <div
                            key={label}
                            className={cn(
                                'rounded-2xl p-4 text-center font-bold',
                                box,
                            )}
                        >
                            <p className="text-2xl">{value}</p>
                            <p className="text-xs font-medium">{label}</p>
                        </div>
                    ))}
                </div>

                <div className="relative max-w-md">
                    <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[#94a3b8]" />
                    <input
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder="Search jobs..."
                        className="w-full rounded-xl border border-[#e2e8f0] py-2.5 pr-4 pl-10 text-sm"
                    />
                </div>

                <div className="space-y-3">
                    {filtered.map((job) => (
                        <div
                            key={job.id}
                            className="rounded-2xl border border-[#e8d5e8] bg-white p-5"
                        >
                            <div className="flex flex-wrap items-start justify-between gap-3">
                                <div>
                                    <h2 className="text-base font-bold">
                                        {job.title}
                                    </h2>
                                    <p className="text-sm text-[#64748b]">
                                        {job.location} · {job.type}
                                    </p>
                                    <p className="mt-1 text-xs text-[#99a1af]">
                                        {job.applications} applications ·{' '}
                                        {job.status}
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    className="text-sm font-semibold text-[#ef4444]"
                                    onClick={() =>
                                        router.delete(`/employer/jobs/${job.id}`)
                                    }
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    ))}
                    {filtered.length === 0 && (
                        <p className="rounded-2xl border border-dashed p-10 text-center text-sm text-[#99a1af]">
                            No jobs yet. Post a role to get started.
                        </p>
                    )}
                </div>
            </div>

            <Dialog open={creating} onOpenChange={setCreating}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Post a job</DialogTitle>
                    </DialogHeader>
                    <form
                        className="space-y-3"
                        onSubmit={(event) => {
                            event.preventDefault();
                            form.post('/employer/jobs', {
                                onSuccess: () => setCreating(false),
                            });
                        }}
                    >
                        <div>
                            <Label>Title</Label>
                            <Input
                                value={form.data.title}
                                onChange={(event) =>
                                    form.setData('title', event.target.value)
                                }
                            />
                        </div>
                        <div>
                            <Label>Location</Label>
                            <Input
                                value={form.data.location}
                                onChange={(event) =>
                                    form.setData('location', event.target.value)
                                }
                            />
                        </div>
                        <div>
                            <Label>Employment type</Label>
                            <Input
                                value={form.data.employment_type}
                                onChange={(event) =>
                                    form.setData(
                                        'employment_type',
                                        event.target.value,
                                    )
                                }
                            />
                        </div>
                        <div>
                            <Label>Salary range</Label>
                            <Input
                                value={form.data.salary_range}
                                onChange={(event) =>
                                    form.setData(
                                        'salary_range',
                                        event.target.value,
                                    )
                                }
                            />
                        </div>
                        <div>
                            <Label>Description</Label>
                            <Textarea
                                value={form.data.description}
                                onChange={(event) =>
                                    form.setData(
                                        'description',
                                        event.target.value,
                                    )
                                }
                            />
                        </div>
                        <DialogFooter>
                            <Button type="submit" disabled={form.processing}>
                                Submit for review
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </EmployerLayout>
    );
}
