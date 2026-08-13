import { Head } from '@inertiajs/react';
import { Search } from 'lucide-react';
import { useMemo, useState } from 'react';

import {
    JOB_STATUS_TONE,
    MY_JOBS,
    type JobStatus,
} from '@/components/employer/demo-data';
import EmployerLayout from '@/layouts/employer-layout';
import { cn } from '@/lib/utils';

type TabFilter = 'All' | JobStatus;

const TABS: TabFilter[] = ['All', 'Active', 'Draft', 'Expired', 'Closed'];

const JOB_STATS = [
    {
        label: 'Total Jobs',
        value: 5,
        box: 'bg-[#eeeffe] text-[#323981]',
    },
    {
        label: 'Active',
        value: 3,
        box: 'bg-[#dcfce7] text-[#166534]',
    },
    {
        label: 'Draft',
        value: 1,
        box: 'bg-[#f1f5f9] text-[#475569]',
    },
    {
        label: 'Expired',
        value: 1,
        box: 'bg-[#fef2f2] text-[#b91c1c]',
    },
] as const;

export default function EmployerJobs() {
    const [activeTab, setActiveTab] = useState<TabFilter>('All');
    const [search, setSearch] = useState('');

    const filteredJobs = useMemo(() => {
        return MY_JOBS.filter((job) => {
            const matchesTab =
                activeTab === 'All' || job.status === activeTab;
            const query = search.toLowerCase();
            const matchesSearch =
                !query ||
                job.title.toLowerCase().includes(query) ||
                job.category.toLowerCase().includes(query) ||
                job.location.toLowerCase().includes(query);

            return matchesTab && matchesSearch;
        });
    }, [activeTab, search]);

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
                        className="inline-flex items-center rounded-xl bg-[#0057c8] px-6 py-3 text-base font-medium text-white transition-opacity hover:opacity-90"
                    >
                        + Post New Job
                    </button>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    {JOB_STATS.map((stat) => (
                        <div
                            key={stat.label}
                            className="flex items-center gap-3.5 rounded-2xl border border-[#e8d5e8] bg-white px-5 py-4"
                        >
                            <div
                                className={cn(
                                    'flex size-11 shrink-0 items-center justify-center rounded-xl text-lg font-extrabold',
                                    stat.box,
                                )}
                            >
                                {stat.value}
                            </div>
                            <p className="text-sm font-semibold text-[#475569]">
                                {stat.label}
                            </p>
                        </div>
                    ))}
                </div>

                <div className="overflow-hidden rounded-2xl border border-[#e8d5e8] bg-white">
                    <div className="flex flex-wrap items-center gap-4 border-b border-[#e8d5e8] px-5 py-4">
                        <div className="relative w-full max-w-[334px]">
                            <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-[#94a3b8]" />
                            <input
                                type="search"
                                placeholder="Search jobs by title or category..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="h-[41px] w-full rounded-lg border border-[#e8d5e8] bg-white py-2 pr-4 pl-10 text-[15px] text-[#050315] placeholder:text-[rgba(5,3,21,0.5)] focus:border-[#0057c8] focus:outline-none"
                            />
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                            {TABS.map((tab) => (
                                <button
                                    key={tab}
                                    type="button"
                                    onClick={() => setActiveTab(tab)}
                                    className={cn(
                                        'rounded-full px-4 py-1.5 text-sm font-semibold transition-colors',
                                        activeTab === tab
                                            ? 'bg-[#0057c8] text-white'
                                            : 'bg-[#f1f5f9] text-[#3977a6] hover:bg-[#eeeffe]',
                                    )}
                                >
                                    {tab}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[1100px] text-left">
                            <thead>
                                <tr className="border-b border-[#ffebf5] bg-[#f8faff]">
                                    {[
                                        'Job',
                                        'Location / Type',
                                        'Salary',
                                        'Status',
                                        'Applications',
                                        'Views',
                                        'Actions',
                                    ].map((header) => (
                                        <th
                                            key={header}
                                            className="px-5 py-2.5 text-[13px] font-bold text-[#475569]"
                                        >
                                            {header}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {filteredJobs.map((job) => (
                                    <tr
                                        key={job.id}
                                        className="border-b border-[#ffebf5] last:border-0"
                                    >
                                        <td className="px-5 py-4 align-top">
                                            <p className="text-[15px] font-bold text-[#050315]">
                                                {job.title}
                                            </p>
                                            <span className="mt-1 inline-flex rounded-full bg-[#eeeffe] px-2.5 py-0.5 text-xs font-semibold text-[#323981]">
                                                {job.category}
                                            </span>
                                            <p className="mt-1.5 text-xs text-[#94a3b8]">
                                                Posted: {job.postedDate} ·
                                                Expires: {job.expiresDate}
                                            </p>
                                        </td>
                                        <td className="px-5 py-4 align-top">
                                            <p className="text-sm font-medium text-[#475569]">
                                                📍 {job.location}
                                            </p>
                                            <span className="mt-1 inline-flex rounded-full bg-[#fff7ed] px-2 py-0.5 text-xs font-semibold text-[#c2410c]">
                                                {job.type}
                                            </span>
                                        </td>
                                        <td className="px-5 py-4 align-top text-sm font-semibold text-[#323981]">
                                            {job.salary}
                                        </td>
                                        <td className="px-5 py-4 align-top">
                                            <span
                                                className={cn(
                                                    'inline-flex rounded-full px-3 py-0.5 text-[13px] font-bold',
                                                    JOB_STATUS_TONE[job.status],
                                                )}
                                            >
                                                {job.status}
                                            </span>
                                        </td>
                                        <td className="px-5 py-4 align-top">
                                            <div className="flex items-center gap-1.5">
                                                <span className="text-base font-bold text-[#050315]">
                                                    {job.applications}
                                                </span>
                                                {job.newApplications > 0 && (
                                                    <span className="rounded-full bg-[#e57124] px-2 py-0.5 text-[11px] font-bold text-white">
                                                        +{job.newApplications}{' '}
                                                        new
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-5 py-4 align-top text-[14.4px] font-medium text-[#475569]">
                                            👁 {job.views}
                                        </td>
                                        <td className="px-5 py-4 align-top">
                                            <div className="flex w-[200px] flex-wrap gap-2">
                                                <button
                                                    type="button"
                                                    className="rounded-lg bg-[#eeeffe] px-2.5 py-1.5 text-xs font-semibold text-[#323981]"
                                                >
                                                    View Applicants
                                                </button>
                                                <button
                                                    type="button"
                                                    className="rounded-lg bg-[#f1f5f9] px-2.5 py-1.5 text-xs font-semibold text-[#475569]"
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    type="button"
                                                    className="rounded-lg bg-[#f1f5f9] px-2.5 py-1.5 text-xs font-semibold text-[#475569]"
                                                >
                                                    Duplicate
                                                </button>
                                                {job.status === 'Draft' ? (
                                                    <button
                                                        type="button"
                                                        className="rounded-lg bg-[#dcfce7] px-2.5 py-1.5 text-xs font-semibold text-[#166534]"
                                                    >
                                                        Publish
                                                    </button>
                                                ) : job.status === 'Expired' ? (
                                                    <button
                                                        type="button"
                                                        className="rounded-lg bg-[#f1f5f9] px-2.5 py-1.5 text-xs font-semibold text-[#475569]"
                                                    >
                                                        Renew
                                                    </button>
                                                ) : (
                                                    <button
                                                        type="button"
                                                        className="rounded-lg bg-[#fef2f2] px-2.5 py-1.5 text-xs font-semibold text-[#b91c1c]"
                                                    >
                                                        Pause
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {filteredJobs.length === 0 && (
                            <p className="py-10 text-center text-sm text-[#6b7280]">
                                No jobs match your filters.
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </EmployerLayout>
    );
}
