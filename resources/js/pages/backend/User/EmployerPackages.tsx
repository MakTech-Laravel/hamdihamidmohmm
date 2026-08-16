import { Head } from '@inertiajs/react';

import EmployerLayout from '@/layouts/employer-layout';

type PackageRow = {
    id: number;
    slug: string;
    name: string;
    price: number;
    currency: string;
    billing_period: string;
    job_credits: number;
    featured_credits: number;
    current: boolean;
};

type Invoice = {
    id: number;
    reference: string;
    package: string;
    amount: number;
    status: string;
    date: string | null;
};

type Props = {
    current: string | null;
    current_label: string | null;
    packages: PackageRow[];
    invoices: Invoice[];
};

export default function EmployerPackages({
    current_label,
    packages,
    invoices,
}: Props) {
    return (
        <EmployerLayout title="Packages">
            <Head title="Packages" />

            <div className="space-y-6 p-6">
                <div>
                    <h1 className="text-2xl font-bold text-[#0057c8]">
                        Packages
                    </h1>
                    <p className="mt-1 text-sm text-[#64748b]">
                        Current plan: {current_label || 'None'}
                    </p>
                </div>
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    {packages.map((item) => (
                        <div
                            key={item.id}
                            className={`rounded-2xl border p-5 ${item.current ? 'border-[#0057c8] bg-[#eff6ff]' : 'bg-white'}`}
                        >
                            <h2 className="text-lg font-bold">{item.name}</h2>
                            <p className="mt-1 text-sm text-[#64748b]">
                                {item.currency} {item.price} /{' '}
                                {item.billing_period}
                            </p>
                            <p className="mt-3 text-sm">
                                {item.job_credits} job credits
                            </p>
                            <p className="text-sm">
                                {item.featured_credits} featured credits
                            </p>
                            {item.current && (
                                <p className="mt-3 text-xs font-bold text-[#0057c8]">
                                    Current plan
                                </p>
                            )}
                        </div>
                    ))}
                    {packages.length === 0 && (
                        <p className="text-sm text-[#99a1af]">
                            No packages available.
                        </p>
                    )}
                </div>
                <div className="rounded-2xl border bg-white p-5">
                    <h2 className="mb-4 text-base font-bold">Invoices</h2>
                    <div className="space-y-2">
                        {invoices.map((invoice) => (
                            <div
                                key={invoice.id}
                                className="flex flex-wrap justify-between gap-2 border-b py-2 text-sm last:border-0"
                            >
                                <span>{invoice.reference}</span>
                                <span>{invoice.package}</span>
                                <span>
                                    AED {invoice.amount.toLocaleString()}
                                </span>
                                <span>{invoice.status}</span>
                                <span>{invoice.date}</span>
                            </div>
                        ))}
                        {invoices.length === 0 && (
                            <p className="text-sm text-[#99a1af]">
                                No invoices yet.
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </EmployerLayout>
    );
}
