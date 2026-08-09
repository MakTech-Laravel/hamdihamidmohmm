import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function AdminRecentActivity() {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest system events and user actions</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">No recent activity to display.</p>
                </div>
            </CardContent>
        </Card>
    );
}
