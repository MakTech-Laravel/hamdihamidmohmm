import { Head } from '@inertiajs/react';
import {
    Copy,
    CreditCard,
    Crown,
    Package,
    Pencil,
    Plus,
    Star,
    Users,
} from 'lucide-react';

import {
    AdminPageHeader,
    AdminPanel,
    AdminPrimaryButton,
    AdminSecondaryButton,
    AdminStatCard,
    AdminStatusBadge,
} from '@/components/admin-portal/ui';
import AdminPortalLayout from '@/layouts/admin-portal-layout';

const packageStats = [
    { label: 'Total Packages', value: '6', tone: 'text-[#0057c8]' },
    { label: 'Active Subscribers', value: '484', tone: 'text-[#e57124]' },
    { label: 'Monthly Sales', value: 'AED 89K', tone: 'text-[#0057c8]' },
    { label: 'Most Popular', value: 'Starter', tone: 'text-[#3977a6]' },
];

const packages = [
    {
        name: 'Starter',
        price: 'AED 299',
        period: '/month',
        status: 'Active',
        statusTone: 'success' as const,
        jobCredits: 10,
        featuredCredits: 2,
        subscribers: 184,
        revenue: 'AED 55K',
    },
    {
        name: 'Professional',
        price: 'AED 799',
        period: '/month',
        status: 'Active',
        statusTone: 'success' as const,
        jobCredits: 30,
        featuredCredits: 8,
        subscribers: 142,
        revenue: 'AED 113K',
    },
    {
        name: 'Enterprise',
        price: 'AED 1,999',
        period: '/month',
        status: 'Active',
        statusTone: 'success' as const,
        jobCredits: 100,
        featuredCredits: 25,
        subscribers: 87,
        revenue: 'AED 174K',
    },
    {
        name: 'Trial',
        price: 'Free',
        period: '/7 days',
        status: 'Active',
        statusTone: 'info' as const,
        jobCredits: 3,
        featuredCredits: 0,
        subscribers: 58,
        revenue: 'AED 0',
    },
    {
        name: 'Legacy Basic',
        price: 'AED 199',
        period: '/month',
        status: 'Archived',
        statusTone: 'neutral' as const,
        jobCredits: 5,
        featuredCredits: 1,
        subscribers: 13,
        revenue: 'AED 2.6K',
    },
];

export default function PackagesPricing() {
    return (
        <AdminPortalLayout>
            <Head title="Packages & Pricing" />

            <div className="space-y-6 p-6">
                <AdminPageHeader
                    title="Packages & Pricing"
                    subtitle="Control employer subscription plans and platform monetization."
                    actions={
                        <AdminPrimaryButton>
                            <Plus className="size-4" />
                            Create Package
                        </AdminPrimaryButton>
                    }
                />

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    {packageStats.map((stat, index) => (
                        <AdminStatCard
                            key={stat.label}
                            label={stat.label}
                            value={stat.value}
                            valueClassName={stat.tone}
                            icon={
                                [Package, Users, CreditCard, Star][index]
                            }
                        />
                    ))}
                </div>

                <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                    {packages.map((pkg) => (
                        <AdminPanel
                            key={pkg.name}
                            className="flex flex-col gap-4"
                        >
                            <div className="flex items-start justify-between">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <Crown className="size-5 text-[#e57124]" />
                                        <h3 className="text-lg font-extrabold text-[#050315]">
                                            {pkg.name}
                                        </h3>
                                    </div>
                                    <p className="mt-1">
                                        <span className="text-2xl font-extrabold text-[#0057c8]">
                                            {pkg.price}
                                        </span>
                                        <span className="text-sm text-[#64748b]">
                                            {pkg.period}
                                        </span>
                                    </p>
                                </div>
                                <AdminStatusBadge
                                    label={pkg.status}
                                    tone={pkg.statusTone}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3 text-sm">
                                <div className="rounded-lg bg-[#f8faff] p-3">
                                    <p className="text-xs text-[#64748b]">
                                        Job Credits
                                    </p>
                                    <p className="font-bold text-[#050315]">
                                        {pkg.jobCredits}
                                    </p>
                                </div>
                                <div className="rounded-lg bg-[#f8faff] p-3">
                                    <p className="text-xs text-[#64748b]">
                                        Featured Credits
                                    </p>
                                    <p className="font-bold text-[#050315]">
                                        {pkg.featuredCredits}
                                    </p>
                                </div>
                                <div className="rounded-lg bg-[#f8faff] p-3">
                                    <p className="text-xs text-[#64748b]">
                                        Subscribers
                                    </p>
                                    <p className="font-bold text-[#050315]">
                                        {pkg.subscribers}
                                    </p>
                                </div>
                                <div className="rounded-lg bg-[#f8faff] p-3">
                                    <p className="text-xs text-[#64748b]">
                                        Revenue
                                    </p>
                                    <p className="font-bold text-[#050315]">
                                        {pkg.revenue}
                                    </p>
                                </div>
                            </div>

                            <div className="mt-auto flex gap-2">
                                <AdminSecondaryButton className="flex-1">
                                    <Pencil className="size-4" />
                                    Edit
                                </AdminSecondaryButton>
                                <AdminSecondaryButton className="flex-1">
                                    <Copy className="size-4" />
                                    Clone
                                </AdminSecondaryButton>
                            </div>
                        </AdminPanel>
                    ))}
                </div>
            </div>
        </AdminPortalLayout>
    );
}
