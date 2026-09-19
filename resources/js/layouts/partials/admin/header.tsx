import { Link, router, usePage } from '@inertiajs/react';
import { LogOut, Menu } from 'lucide-react';

import AppLogo from '@/components/app-logo';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useInitials } from '@/hooks/use-initials';
import { useLocale } from '@/hooks/use-locale';
import { jobs } from '@/routes';
import { type SharedData } from '@/types';

export function AdminHeader() {
    const { auth } = usePage<SharedData>().props;
    const { t } = useLocale();
    const user = auth.user;
    const getInitials = useInitials();

    if (!user) {
        return null;
    }

    const handleLogout = () => {
        router.post(route('logout'));
    };

    const userInfo = (
        <>
            <Avatar className="h-10 w-10 overflow-hidden rounded-full">
                <AvatarFallback className="rounded-lg bg-primary text-lg font-semibold text-white font-montserrat">
                    {getInitials(user.name)}
                </AvatarFallback>
            </Avatar>
            <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate text-base font-semibold text-text-secondary font-montserrat">
                    {user.name}
                </span>
                <span className="truncate text-base text-text-primary">
                    {user.email}
                </span>
            </div>
        </>
    );

    const userMenu = (
        <>
            <DropdownMenuLabel className="p-0 font-normal">
                <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                    {userInfo}
                </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
                <LogOut className="mr-2 h-4 w-4" />
                {t('common.log_out')}
            </DropdownMenuItem>
        </>
    );

    return (
        <header className="bg-primary-50">
            <div className="container mx-auto flex items-center justify-between px-4 py-4 text-primary-500">
                <Link
                    href={jobs()}
                    className="flex items-center gap-2 text-primary-500"
                    aria-label={t('nav.jobs')}
                >
                    <AppLogo className="h-16 w-auto" />
                </Link>
                <div className="hidden items-center gap-4 md:flex">
                    {user.can_manage_admins && (
                        <Link
                            href={route('admin.admins.index')}
                            className="text-sm font-semibold text-primary-600 hover:underline"
                        >
                            {t('admin.nav.admins')}
                        </Link>
                    )}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                className="flex h-auto items-center gap-2 p-2 transition-transform hover:scale-105 hover:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
                            >
                                {userInfo}
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                            className="w-64 border-none p-2 shadow-sm"
                            align="end"
                            sideOffset={8}
                        >
                            {userMenu}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
                <div className="md:hidden">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                className="relative h-9 w-9 rounded-md ring-offset-background transition-all hover:ring-2 hover:ring-ring"
                            >
                                <Menu className="size-6" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                            className="w-64 border-none p-2 shadow-sm"
                            align="end"
                            sideOffset={8}
                        >
                            {user.can_manage_admins && (
                                <>
                                    <DropdownMenuItem asChild>
                                        <Link href={route('admin.admins.index')}>
                                            {t('admin.nav.admins')}
                                        </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                </>
                            )}
                            {userMenu}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        </header>
    );
}
