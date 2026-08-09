import { Head } from '@inertiajs/react';
import AdminLayout from '@/layouts/admin-layout';

export default function AdminDashboard() {
    return (
        <AdminLayout>
            <Head title="Dashboard" />
            <div className="flex items-center justify-center py-24">
                <h1 className="text-3xl font-semibold">Admin Dashboard</h1>
            </div>
        </AdminLayout>
    );
}
