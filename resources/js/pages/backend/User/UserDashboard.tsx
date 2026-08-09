import { Head } from '@inertiajs/react';
import UserLayout from '@/layouts/user-layout';

export default function UserDashboard() {
    return (
        <UserLayout>
            <Head title="Dashboard" />
            <div className="flex items-center justify-center py-24">
                <h1 className="text-3xl font-semibold">User Dashboard</h1>
            </div>
        </UserLayout>
    );
}
