import { Head } from '@inertiajs/react';
import {
    Eye,
    FileText,
    Megaphone,
    Pencil,
    Plus,
    Shield,
} from 'lucide-react';

import {
    AdminPageHeader,
    AdminPanel,
    AdminPrimaryButton,
    AdminSecondaryButton,
    AdminStatusBadge,
} from '@/components/admin-portal/ui';
import AdminPortalLayout from '@/layouts/admin-portal-layout';

const contentSections = [
    {
        title: 'FAQ',
        icon: FileText,
        sections: 24,
        lastUpdated: '2024-03-01',
        status: 'Published',
    },
    {
        title: 'Privacy Policy',
        icon: Shield,
        sections: 8,
        lastUpdated: '2024-02-15',
        status: 'Published',
    },
    {
        title: 'Terms & Conditions',
        icon: FileText,
        sections: 12,
        lastUpdated: '2024-02-15',
        status: 'Published',
    },
    {
        title: 'Cookie Policy',
        icon: Shield,
        sections: 5,
        lastUpdated: '2024-01-20',
        status: 'Published',
    },
    {
        title: 'About Us',
        icon: FileText,
        sections: 6,
        lastUpdated: '2024-03-05',
        status: 'Published',
    },
    {
        title: 'New Announcement',
        icon: Megaphone,
        sections: 1,
        lastUpdated: '2024-03-10',
        status: 'Draft',
    },
];

export default function ContentManagement() {
    return (
        <AdminPortalLayout>
            <Head title="Content Management" />

            <div className="space-y-6 p-6">
                <AdminPageHeader
                    title="Content Management"
                    subtitle="Manage public website content without developer assistance."
                    actions={
                        <>
                            <AdminSecondaryButton>
                                <Megaphone className="size-4" />
                                New Announcement
                            </AdminSecondaryButton>
                            <AdminPrimaryButton>
                                <Plus className="size-4" />
                                Add Page
                            </AdminPrimaryButton>
                        </>
                    }
                />

                <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                    {contentSections.map((section) => {
                        const Icon = section.icon;

                        return (
                            <AdminPanel
                                key={section.title}
                                className="flex flex-col gap-4"
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="flex size-10 items-center justify-center rounded-xl bg-[#eef2ff] text-[#0057c8]">
                                            <Icon className="size-5" />
                                        </div>
                                        <div>
                                            <h3 className="font-extrabold text-[#050315]">
                                                {section.title}
                                            </h3>
                                            <p className="text-xs text-[#64748b]">
                                                {section.sections} sections
                                            </p>
                                        </div>
                                    </div>
                                    <AdminStatusBadge
                                        label={section.status}
                                        tone={
                                            section.status === 'Published'
                                                ? 'success'
                                                : 'warning'
                                        }
                                    />
                                </div>

                                <p className="text-xs text-[#94a3b8]">
                                    Last updated {section.lastUpdated}
                                </p>

                                <div className="mt-auto flex gap-2">
                                    <AdminSecondaryButton className="flex-1">
                                        <Pencil className="size-4" />
                                        Edit
                                    </AdminSecondaryButton>
                                    <AdminSecondaryButton className="flex-1">
                                        <Eye className="size-4" />
                                        Preview
                                    </AdminSecondaryButton>
                                    {section.status === 'Draft' && (
                                        <AdminPrimaryButton className="flex-1">
                                            Publish
                                        </AdminPrimaryButton>
                                    )}
                                </div>
                            </AdminPanel>
                        );
                    })}
                </div>
            </div>
        </AdminPortalLayout>
    );
}
