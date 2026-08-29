import { Users, UserCheck, Shield, Settings } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useLocale } from '@/hooks/use-locale';

interface AdminStatsCardsProps {
    totalUsers: number;
}

export function AdminStatsCards({ totalUsers }: AdminStatsCardsProps) {
    const { t } = useLocale();

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                        {t('admin.stats.total_users')}
                    </CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{totalUsers}</div>
                    <p className="mt-1 text-xs text-muted-foreground">
                        {t('admin.stats.registered_users')}
                    </p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                        {t('admin.stats.active_users')}
                    </CardTitle>
                    <UserCheck className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">
                        {Math.round(totalUsers * 0.8)}
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                        {t('admin.stats.active_users_hint')}
                    </p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                        {t('admin.stats.admin_users')}
                    </CardTitle>
                    <Shield className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">2</div>
                    <p className="mt-1 text-xs text-muted-foreground">
                        {t('admin.stats.admin_users_hint')}
                    </p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                        {t('admin.stats.system_status')}
                    </CardTitle>
                    <Settings className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-green-500">
                        {t('common.active')}
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                        {t('admin.stats.system_status_hint')}
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
