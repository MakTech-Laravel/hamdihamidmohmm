import { Link } from '@inertiajs/react';
import { Settings, UserIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';


export function UserQuickActions() {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Frequently used features and settings</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Link href="/profile">
                        <Button variant="outline" className="w-full justify-start">
                            <UserIcon className="mr-2 h-4 w-4" />
                            Profile Settings
                        </Button>
                    </Link>
                    <Link href="/settings">
                        <Button variant="outline" className="w-full justify-start">
                            <Settings className="mr-2 h-4 w-4" />
                            Account Settings
                        </Button>
                    </Link>
                </div>
            </CardContent>
        </Card>
    );
}
