import { Head } from '@inertiajs/react';

import { useLocale } from '@/hooks/use-locale';
import UserLayout from '@/layouts/user-layout';

export default function UserDashboard() {
    const { t } = useLocale();

    return (
        <UserLayout>
            <Head title={t('common.dashboard')} />
            <div className="flex items-center justify-center py-24">
                <h1 className="text-3xl font-semibold">{t('app.user_dashboard')}</h1>
            </div>
        </UserLayout>
    );
}
