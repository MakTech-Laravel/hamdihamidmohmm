import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { useLocale } from '@/hooks/use-locale';

export function AdminRecentActivity() {
    const { t } = useLocale();

    return (
        <Card>
            <CardHeader>
                <CardTitle>{t('admin.activity.title')}</CardTitle>
                <CardDescription>
                    {t('admin.activity.description')}
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                        {t('admin.activity.empty')}
                    </p>
                </div>
            </CardContent>
        </Card>
    );
}
